const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const { NOTES_DIR } = require("../config");
const { findVideoById } = require("../repositories/videoRepository");
const { getCleanName } = require("../utils/fileHelpers");
const { getSettings } = require("./settingsService");

// Artifact types the AI can generate. Each defines the system role and the
// instruction prepended to the transcript. "custom" uses a user-supplied prompt.
const ARTIFACT_CONFIG = {
  summary: {
    system: "You are a helpful assistant that writes clear, concise summaries of video transcripts.",
    prompt:
      "Write a concise summary of the following video transcript(s). Capture the main ideas in a few short paragraphs. Use markdown formatting.",
  },
  notes: {
    system: "You are a helpful assistant that makes detailed notes based on video transcripts.",
    prompt:
      "Please summarize the following video transcripts into structured notes with headings and bullet points.",
  },
  flashcards: {
    system: "You are a study assistant that creates high-quality flashcards from video transcripts.",
    prompt:
      "Create study flashcards from the following transcript(s). Output ONLY the flashcards with no preamble or closing remarks. " +
      "Format each card EXACTLY like this:\n\nQ: <question>\nA: <answer>\n\n" +
      "Separate each card with a single blank line. Create between 8 and 15 cards covering the most important concepts.",
  },
  quizzes: {
    system: "You are a study assistant that creates multiple-choice quizzes from video transcripts.",
    prompt:
      "Create a multiple-choice quiz from the following transcript(s). Output ONLY the quiz with no preamble or closing remarks. " +
      "Format each question EXACTLY like this:\n\nQ: <question>\nA) <option>\nB) <option>\nC) <option>\nD) <option>\nAnswer: <letter of the correct option>\n\n" +
      "Separate each question with a single blank line. Create between 6 and 10 questions.",
  },
};

const ARTIFACT_TYPES = Object.keys(ARTIFACT_CONFIG).concat("custom");

const collectionNotesDir = (collectionId) => path.join(NOTES_DIR, collectionId);

// Notes are stored as markdown files with an optional YAML-ish front-matter
// header recording the artifact type. Files without a header default to "notes".
const parseArtifactFile = (raw) => {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { type: "notes", content: raw };

  const meta = {};
  match[1].split("\n").forEach((line) => {
    const idx = line.indexOf(":");
    if (idx > -1) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  });
  return { type: meta.type || "notes", content: raw.slice(match[0].length) };
};

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
      const { type, content } = parseArtifactFile(fs.readFileSync(filePath, "utf8"));
      return {
        filename: f,
        content,
        type,
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

const generateNotes = async (collectionId, videoIds, artifactType = "notes", customPrompt = "") => {
  const settings = getSettings();
  if (!settings.apiKey) throw Object.assign(new Error("OpenAI API Key is missing"), { status: 400 });

  const type = ARTIFACT_TYPES.includes(artifactType) ? artifactType : "notes";

  // Resolve the system role and instruction for the chosen artifact type.
  let systemRole;
  let prompt;
  if (type === "custom") {
    if (!customPrompt || !customPrompt.trim())
      throw Object.assign(new Error("A custom prompt is required for this artifact type"), { status: 400 });
    systemRole = "You are a helpful assistant that produces content based on video transcripts.";
    prompt = customPrompt.trim();
  } else {
    const config = ARTIFACT_CONFIG[type];
    systemRole = config.system;
    // Preserve the user's custom "notes" prompt from settings when generating notes.
    prompt = type === "notes" && settings.prompt ? settings.prompt : config.prompt;
  }

  const openai = new OpenAI({ apiKey: settings.apiKey });
  const model = settings.model || "gpt-4o-mini";

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
      { role: "system", content: systemRole },
      { role: "user", content: `${prompt}\n\n${fullTranscript}` },
    ],
  });

  const artifactContent = completion.choices[0].message.content;

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

  // Persist the artifact type in a front-matter header so the type survives reloads.
  const fileContents = `---\ntype: ${type}\n---\n\n${artifactContent}`;
  fs.writeFileSync(path.join(dir, filename), fileContents);
  return { filename, content: artifactContent, type };
};

// Create an empty, user-editable note tied to a video (so it groups with the
// video's artifact tabs). Stored with front-matter type "note".
const createBlankNote = (collectionId, videoId) => {
  const found = findVideoById(videoId);
  if (!found) throw Object.assign(new Error("Video not found"), { status: 404 });

  const baseFileName = getCleanName(found.video.originalName);
  const dir = ensureCollectionDir(collectionId);

  let filename = `${baseFileName}.md`;
  let counter = 1;
  while (fs.existsSync(path.join(dir, filename))) {
    filename = `${baseFileName}_${counter}.md`;
    counter++;
  }

  fs.writeFileSync(path.join(dir, filename), `---\ntype: note\n---\n\n`);
  return { filename, content: "", type: "note" };
};

// Overwrite a note's body, preserving its artifact type front-matter.
const saveNoteContent = (collectionId, filename, content) => {
  const filePath = path.join(collectionNotesDir(collectionId), safeFilename(filename));
  if (!fs.existsSync(filePath)) throw Object.assign(new Error("Note not found"), { status: 404 });

  const { type } = parseArtifactFile(fs.readFileSync(filePath, "utf8"));
  fs.writeFileSync(filePath, `---\ntype: ${type}\n---\n\n${content || ""}`);
  return { filename: safeFilename(filename), content: content || "", type };
};

module.exports = {
  listNotes,
  renameNote,
  deleteNote,
  getNoteFilePath,
  generateNotes,
  createBlankNote,
  saveNoteContent,
};
