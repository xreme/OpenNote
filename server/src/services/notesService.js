const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const { NOTES_DIR } = require("../config");
const { getVideoStatus } = require("../repositories/videoRepository");
const { getCleanName } = require("../utils/fileHelpers");
const { getSettings } = require("./settingsService");

const listNotes = () => {
  if (!fs.existsSync(NOTES_DIR)) return [];
  return fs
    .readdirSync(NOTES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const content = fs.readFileSync(path.join(NOTES_DIR, f), "utf8");
      return {
        filename: f,
        content,
        createdAt: fs.statSync(path.join(NOTES_DIR, f)).birthtime,
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
};

const renameNote = (filename, newFilename) => {
  const oldPath = path.join(NOTES_DIR, filename);
  let newName = newFilename;
  if (!newName.endsWith(".md")) newName += ".md";
  const newPath = path.join(NOTES_DIR, newName);

  if (!fs.existsSync(oldPath)) throw Object.assign(new Error("Note not found"), { status: 404 });
  if (fs.existsSync(newPath)) throw Object.assign(new Error("File with that name already exists"), { status: 400 });

  fs.renameSync(oldPath, newPath);
  return newName;
};

const deleteNote = (filename) => {
  const filePath = path.join(NOTES_DIR, filename);
  if (!fs.existsSync(filePath)) throw Object.assign(new Error("Note not found"), { status: 404 });
  fs.unlinkSync(filePath);
};

const getNoteFilePath = (filename) => path.join(NOTES_DIR, filename);

const generateNotes = async (videoIds) => {
  const settings = getSettings();
  if (!settings.apiKey) throw Object.assign(new Error("OpenAI API Key is missing"), { status: 400 });

  const openai = new OpenAI({ apiKey: settings.apiKey });
  const model = settings.model || "gpt-4o-mini";
  const prompt =
    settings.prompt ||
    "Please summarize the following video transcripts into structured notes with headings and bullet points.";

  const videoStatus = getVideoStatus();
  let fullTranscript = "";
  videoIds.forEach((id) => {
    const video = videoStatus.videos[id];
    if (video && video.txtPath && fs.existsSync(video.txtPath)) {
      fullTranscript += `\n\n--- Video: ${video.originalName} ---\n\n`;
      fullTranscript += fs.readFileSync(video.txtPath, "utf8");
    }
  });

  if (!fullTranscript.trim()) throw Object.assign(new Error("No transcript content found for selected videos"), { status: 400 });

  const completion = await openai.chat.completions.create({
    model: model,
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that makes detailed notes based on video transcripts.",
      },
      { role: "user", content: `${prompt}\n\n${fullTranscript}` },
    ],
  });

  const notesContent = completion.choices[0].message.content;

  let baseFileName = "notes";
  if (videoIds.length > 0) {
    const names = videoIds.map((id) => {
      const v = videoStatus.videos[id];
      return v ? getCleanName(v.originalName) : "unknown";
    });

    if (names.length === 1) {
      baseFileName = names[0];
    } else if (names.length <= 3) {
      baseFileName = names.join("_");
    } else {
      baseFileName = `${names.slice(0, 3).join("_")}_and_${names.length - 3}_more`;
    }
  }

  let filename = `${baseFileName}.md`;
  let counter = 1;
  while (fs.existsSync(path.join(NOTES_DIR, filename))) {
    filename = `${baseFileName}_${counter}.md`;
    counter++;
  }

  fs.writeFileSync(path.join(NOTES_DIR, filename), notesContent);
  return { filename, content: notesContent };
};

module.exports = { listNotes, renameNote, deleteNote, getNoteFilePath, generateNotes };
