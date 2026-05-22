const fs = require("fs");
const path = require("path");
const { COLLECTIONS_DIR, PROCESSED_DIR } = require("../config");

const collections = {};

// If a video's folderPath no longer exists but a matching folder is present in the
// current PROCESSED_DIR (e.g. after the project was moved), rewrite all path fields.
const normalizeVideoPaths = (video) => {
  if (!video.folderPath || fs.existsSync(video.folderPath)) return null;
  const folderName = path.basename(video.folderPath);
  const newFolderPath = path.join(PROCESSED_DIR, folderName);
  if (!fs.existsSync(newFolderPath)) return null;
  const updated = { ...video, folderPath: newFolderPath };
  if (video.transcriptPath) updated.transcriptPath = path.join(newFolderPath, path.basename(video.transcriptPath));
  if (video.txtPath) updated.txtPath = path.join(newFolderPath, path.basename(video.txtPath));
  return updated;
};

const slugify = (title) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "collection";

const collectionPath = (id) => path.join(COLLECTIONS_DIR, `${id}.json`);

const ensureDir = () => {
  if (!fs.existsSync(COLLECTIONS_DIR)) fs.mkdirSync(COLLECTIONS_DIR, { recursive: true });
};

const saveCollection = (id) => {
  if (!collections[id]) return;
  collections[id].modifiedAt = new Date().toISOString();
  fs.writeFileSync(collectionPath(id), JSON.stringify(collections[id], null, 2));
};

const loadAllCollections = () => {
  ensureDir();
  const files = fs.readdirSync(COLLECTIONS_DIR).filter((f) => f.endsWith(".json"));
  const needsSave = new Set();

  files.forEach((file) => {
    const id = path.basename(file, ".json");
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(COLLECTIONS_DIR, file), "utf8"));
      const videos = {};
      let pathsFixed = false;
      for (const [vidId, vid] of Object.entries(raw.videos || {})) {
        const normalized = normalizeVideoPaths(vid);
        if (normalized) {
          videos[vidId] = normalized;
          pathsFixed = true;
          console.log(`[${vidId}] Normalized stale path in collection ${id}`);
        } else {
          videos[vidId] = vid;
        }
      }
      collections[id] = {
        title: raw.title || id,
        createdAt: raw.createdAt || new Date().toISOString(),
        modifiedAt: raw.modifiedAt || new Date().toISOString(),
        videos,
        order: raw.order || [],
      };
      if (pathsFixed) needsSave.add(id);
    } catch (e) {
      console.error(`Failed to load collection ${id}:`, e);
    }
  });

  if (Object.keys(collections).length === 0) {
    createCollection("Default Collection");
  }

  needsSave.forEach((id) => saveCollection(id));
};

const listCollections = () =>
  Object.entries(collections).map(([id, col]) => ({
    id,
    title: col.title,
    createdAt: col.createdAt,
    modifiedAt: col.modifiedAt,
    videoCount: Object.keys(col.videos || {}).length,
  }));

const getCollection = (id) => collections[id] || null;

const createCollection = (title) => {
  const base = slugify(title);
  let id = base;
  let n = 2;
  while (collections[id]) id = `${base}-${n++}`;

  const now = new Date().toISOString();
  collections[id] = { title, createdAt: now, modifiedAt: now, videos: {}, order: [] };
  saveCollection(id);
  return { id, ...collections[id] };
};

const deleteCollection = (id) => {
  if (!collections[id]) return false;
  const fp = collectionPath(id);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
  delete collections[id];
  return true;
};

const renameCollection = (id, newTitle) => {
  if (!collections[id]) return null;
  const newBase = slugify(newTitle);
  let newId = newBase;
  let n = 2;
  while (collections[newId] && newId !== id) newId = `${newBase}-${n++}`;

  const updated = { ...collections[id], title: newTitle };

  if (newId !== id) {
    const oldFp = collectionPath(id);
    if (fs.existsSync(oldFp)) fs.unlinkSync(oldFp);
    delete collections[id];
    collections[newId] = updated;
  } else {
    collections[id].title = newTitle;
  }

  saveCollection(newId);
  return { id: newId, ...collections[newId] };
};

const getVideoStatus = (collectionId) => {
  const col = collections[collectionId];
  return col ? { videos: col.videos, order: col.order } : { videos: {}, order: [] };
};

const findVideoById = (videoId) => {
  for (const [collectionId, col] of Object.entries(collections)) {
    if (col.videos[videoId]) return { video: col.videos[videoId], collectionId };
  }
  return null;
};

const getAllVideosAcrossCollections = () => {
  const result = {};
  Object.values(collections).forEach((col) => Object.assign(result, col.videos));
  return result;
};

const getUniqueVideoName = (collectionId, originalName) => {
  const col = collections[collectionId];
  if (!col) return originalName;

  const existing = new Set(Object.values(col.videos).map((v) => v.originalName));
  if (!existing.has(originalName)) return originalName;

  const dotIdx = originalName.lastIndexOf(".");
  const base = dotIdx !== -1 ? originalName.slice(0, dotIdx) : originalName;
  const ext = dotIdx !== -1 ? originalName.slice(dotIdx) : "";

  let n = 1;
  let candidate;
  do { candidate = `${base} (${n++})${ext}`; } while (existing.has(candidate));
  return candidate;
};

const addVideoToCollection = (collectionId, videoInfo) => {
  const col = collections[collectionId];
  if (!col) return false;
  col.videos[videoInfo.id] = videoInfo;
  col.order.unshift(videoInfo.id);
  saveCollection(collectionId);
  return true;
};

const updateStatus = (videoId, status, details = {}) => {
  const found = findVideoById(videoId);
  if (!found) {
    console.log(`[${videoId}] Status: ${status} (video not found)`);
    return;
  }
  const { collectionId } = found;
  const col = collections[collectionId];
  col.videos[videoId] = { ...col.videos[videoId], status, ...details };
  saveCollection(collectionId);
  console.log(`[${videoId}] Status: ${status}${details.progress != null ? ` (${details.progress}%)` : ""}`);
};

module.exports = {
  loadAllCollections,
  saveCollection,
  listCollections,
  getCollection,
  createCollection,
  deleteCollection,
  renameCollection,
  getVideoStatus,
  findVideoById,
  getAllVideosAcrossCollections,
  addVideoToCollection,
  updateStatus,
  getUniqueVideoName,
};
