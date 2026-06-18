const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const { getVideoStatus } = require("../repositories/videoRepository");
const { cosineSimilarity } = require("../utils/fileHelpers");
const { getSettings } = require("./settingsService");
const { listNotes } = require("./notesService");

const EMBED_MODEL = "text-embedding-3-small";

// Retrieval tuning. Rather than a fixed top-N, include every chunk whose
// similarity clears a threshold (capped for token safety), with a small
// floor so the model always gets some context even on weak matches.
const DEFAULT_MATCH_THRESHOLD = 0.3;
const DEFAULT_MAX_CONTEXT_ITEMS = 40;
const MIN_CONTEXT_ITEMS = 5;
const CITATION_LIMIT = 12;

// Split free-form note text into reasonably sized chunks on sentence/paragraph
// boundaries so notes can be embedded and matched like transcript segments.
const chunkText = (text, maxLen = 800) => {
  const clean = (text || "").replace(/\r/g, "").trim();
  if (!clean) return [];
  const pieces = clean.split(/(?<=[.!?])\s+|\n{2,}/);
  const chunks = [];
  let current = "";
  for (const piece of pieces) {
    const candidate = current ? `${current} ${piece}` : piece;
    if (candidate.length > maxLen && current) {
      chunks.push(current.trim());
      current = piece;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
};

// Collect pre-computed transcript embeddings for every completed video.
const loadVideoChunks = (videoStatus) => {
  const chunks = [];
  Object.values(videoStatus.videos).forEach((video) => {
    if (video.status !== "completed" || !video.folderPath) return;
    const embeddingsPath = path.join(video.folderPath, "embeddings.json");
    if (!fs.existsSync(embeddingsPath)) return;
    try {
      const data = JSON.parse(fs.readFileSync(embeddingsPath, "utf8"));
      data.chunks.forEach((c) =>
        chunks.push({ ...c, source: "video", videoName: video.originalName }),
      );
    } catch (e) {
      console.log(`Failed to load embeddings for ${video.id}: ${e.message}`);
    }
  });
  return chunks;
};

// Notes are not pre-indexed (they're editable), so embed them on the fly.
const loadNoteChunks = async (openai, collectionId) => {
  let notes = [];
  try {
    notes = listNotes(collectionId);
  } catch (e) {
    console.log(`Failed to list notes for ${collectionId}: ${e.message}`);
    return [];
  }

  const pending = [];
  notes.forEach((note) => {
    chunkText(note.content).forEach((text) =>
      pending.push({ text, source: "note", noteName: note.filename }),
    );
  });

  if (!pending.length) return [];

  try {
    const resp = await openai.embeddings.create({
      model: EMBED_MODEL,
      input: pending.map((p) => p.text),
    });
    return pending.map((p, i) => ({ ...p, embedding: resp.data[i].embedding }));
  } catch (e) {
    console.log(`Failed to embed notes for ${collectionId}: ${e.message}`);
    return [];
  }
};

const chat = async (query, collectionId) => {
  const settings = getSettings();
  if (!settings.apiKey) throw Object.assign(new Error("OpenAI API Key is missing"), { status: 400 });
  if (!collectionId) throw Object.assign(new Error("collectionId is required"), { status: 400 });

  const openai = new OpenAI({ apiKey: settings.apiKey });
  const videoStatus = getVideoStatus(collectionId);

  const [noteChunks, queryEmbedResp] = await Promise.all([
    loadNoteChunks(openai, collectionId),
    openai.embeddings.create({ model: EMBED_MODEL, input: query }),
  ]);

  const allChunks = [...loadVideoChunks(videoStatus), ...noteChunks];

  if (!allChunks.length)
    throw Object.assign(
      new Error("No indexed content found. Videos may still be processing or indexing."),
      { status: 400 },
    );

  const queryEmbedding = queryEmbedResp.data[0].embedding;

  const threshold =
    typeof settings.contextMatchThreshold === "number"
      ? settings.contextMatchThreshold
      : DEFAULT_MATCH_THRESHOLD;
  const maxItems = settings.maxContextChunks || DEFAULT_MAX_CONTEXT_ITEMS;

  const ranked = allChunks
    .map((c) => ({ ...c, score: cosineSimilarity(queryEmbedding, c.embedding) }))
    .sort((a, b) => b.score - a.score);

  // Everything above the threshold is a genuine match (capped for token safety).
  const matches = ranked.filter((c) => c.score >= threshold).slice(0, maxItems);

  // Feed the model the matches, falling back to the strongest few when nothing
  // clears the bar so it's never left without context. Weak fallback items are
  // used for context but NOT surfaced as sources.
  const selected = matches.length >= MIN_CONTEXT_ITEMS ? matches : ranked.slice(0, MIN_CONTEXT_ITEMS);

  const context = selected
    .map((c, i) => {
      if (c.source === "note") {
        return `[${i + 1}] Note: "${c.noteName.replace(/\.md$/, "")}"\n${c.text}`;
      }
      const ts = new Date(c.start * 1000).toISOString().substr(14, 5);
      return `[${i + 1}] Video: "${c.videoName}" at ${ts}\n${c.text}`;
    })
    .join("\n\n");

  const model = settings.model || "gpt-4o-mini";
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that answers questions based on excerpts from the user's video transcripts and their notes. Answer concisely and accurately based only on the provided context.",
      },
      { role: "user", content: `Context:\n${context}\n\nQuestion: ${query}` },
    ],
  });

  const answer = completion.choices[0].message.content;

  // Only surface high-confidence matches as sources — never the weak fallbacks.
  const trim = (t) => (t.length > 120 ? `${t.substring(0, 120)}...` : t);
  const citations = matches.slice(0, CITATION_LIMIT).map((c) =>
    c.source === "note"
      ? { source: "note", noteName: c.noteName, text: trim(c.text) }
      : {
          source: "video",
          videoId: c.videoId,
          videoName: c.videoName,
          timestamp: c.start,
          text: trim(c.text),
        },
  );

  return { answer, citations };
};

module.exports = { chat };
