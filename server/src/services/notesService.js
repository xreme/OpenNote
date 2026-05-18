const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const { NOTES_DIR } = require("../config");
const { findVideoById } = require("../repositories/videoRepository");
const { getCleanName } = require("../utils/fileHelpers");
const { getSettings } = require("./settingsService");

const collectionNotesDir = (collectionId) => path.join(NOTES_DIR, collectionId);

const ensureCollectionDir = (collectionId) => {
  const dir = collectionNotesDir(collectionId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const safeFilename = (filename) => path.basename(filename);

const listNotes = (collectionId) => {
  const dir = collectionNotesDir(collectionId);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const filePath = path.join(dir, f);
      return {
        filename: f,
        content: fs.readFileSync(filePath, "utf8"),
        createdAt: fs.statSync(filePath).birthtime,
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
};

const renameNote = (collectionId, filename, newFilename) => {
  const dir = collectionNotesDir(collectionId);
  const oldPath = path.join(dir, safeFilename(filename));
  let newName = safeFilename(newFilename);
  if (!newName.endsWith(".md")) newName += ".md";
  const newPath = path.join(dir, newName);

  if (!fs.existsSync(oldPath)) throw Object.assign(new Error("Note not found"), { status: 404 });
  if (fs.existsSync(newPath)) throw Object.assign(new Error("File with that name already exists"), { status: 400 });

  fs.renameSync(oldPath, newPath);
  return newName;
};

const deleteNote = (collectionId, filename) => {
  const filePath = path.join(collectionNotesDir(collectionId), safeFilename(filename));
  if (!fs.existsSync(filePath)) throw Object.assign(new Error("Note not found"), { status: 404 });
  fs.unlinkSync(filePath);
};

const getNoteFilePath = (collectionId, filename) =>
  path.join(collectionNotesDir(collectionId), safeFilename(filename));

const generateNotes = async (collectionId, videoIds) => {
  const settings = getSettings();
  if (!settings.apiKey) throw Object.assign(new Error("OpenAI API Key is missing"), { status: 400 });

  const openai = new OpenAI({ apiKey: settings.apiKey });
  const model = settings.model || "gpt-4o-mini";
  const prompt =
    settings.prompt ||
    "Please summarize the following video transcripts into structured notes with headings and bullet points.";

  let fullTranscript = "";
  videoIds.forEach((id) => {
    const found = findVideoById(id);
    if (!found) return;
    const { video } = found;
    if (video.txtPath && fs.existsSync(video.txtPath)) {
      fullTranscript += `\n\n--- Video: ${video.originalName} ---\n\n`;
      fullTranscript += fs.readFileSync(video.txtPath, "utf8");
    }
  });

  if (!fullTranscript.trim())
    throw Object.assign(new Error("No transcript content found for selected videos"), { status: 400 });

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: "You are a helpful assistant that makes detailed notes based on video transcripts." },
      { role: "user", content: `${prompt}\n\n${fullTranscript}` },
    ],
  });

  const notesContent = completion.choices[0].message.content;

  const names = videoIds.map((id) => {
    const found = findVideoById(id);
    return found ? getCleanName(found.video.originalName) : "unknown";
  });

  let baseFileName =
    names.length === 1
      ? names[0]
      : names.length <= 3
      ? names.join("_")
      : `${names.slice(0, 3).join("_")}_and_${names.length - 3}_more`;

  const dir = ensureCollectionDir(collectionId);
  let filename = `${baseFileName}.md`;
  let counter = 1;
  while (fs.existsSync(path.join(dir, filename))) {
    filename = `${baseFileName}_${counter}.md`;
    counter++;
  }

  fs.writeFileSync(path.join(dir, filename), notesContent);
  return { filename, content: notesContent };
};

module.exports = { listNotes, renameNote, deleteNote, getNoteFilePath, generateNotes };
