const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const { getVideoStatus } = require("../repositories/videoRepository");
const { cosineSimilarity } = require("../utils/fileHelpers");
const { getSettings } = require("./settingsService");

const chat = async (query) => {
  const settings = getSettings();
  if (!settings.apiKey) throw Object.assign(new Error("OpenAI API Key is missing"), { status: 400 });

  const openai = new OpenAI({ apiKey: settings.apiKey });
  const videoStatus = getVideoStatus();

  const allChunks = [];
  Object.values(videoStatus.videos).forEach((video) => {
    if (video.status !== "completed" || !video.folderPath) return;
    const embeddingsPath = path.join(video.folderPath, "embeddings.json");
    if (!fs.existsSync(embeddingsPath)) return;
    try {
      const data = JSON.parse(fs.readFileSync(embeddingsPath, "utf8"));
      data.chunks.forEach((c) => {
        allChunks.push({ ...c, videoName: video.originalName });
      });
    } catch (e) {
      console.log(`Failed to load embeddings for ${video.id}: ${e.message}`);
    }
  });

  if (!allChunks.length) throw Object.assign(new Error("No indexed content found. Videos may still be processing or indexing."), { status: 400 });

  const queryEmbedResp = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });
  const queryEmbedding = queryEmbedResp.data[0].embedding;

  const scored = allChunks
    .map((c) => ({ ...c, score: cosineSimilarity(queryEmbedding, c.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const context = scored
    .map((c, i) => {
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
        content: "You are a helpful assistant that answers questions based on video transcript excerpts. Answer concisely and accurately based only on the provided context.",
      },
      { role: "user", content: `Context:\n${context}\n\nQuestion: ${query}` },
    ],
  });

  const answer = completion.choices[0].message.content;
  const citations = scored.map((c) => ({
    videoId: c.videoId,
    videoName: c.videoName,
    timestamp: c.start,
    text: c.text.length > 120 ? c.text.substring(0, 120) + "..." : c.text,
  }));

  return { answer, citations };
};

module.exports = { chat };
