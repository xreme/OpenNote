const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { exec } = require("child_process");
const OpenAI = require("openai");

const { SETTINGS_FILE, ENCODER_PRESETS, TRANSCRIBE_SCRIPT } = require("../config");
const { findVideoById, updateStatus } = require("../repositories/videoRepository");
const { getSettings } = require("./settingsService");

const indexVideo = async (id) => {
  try {
    const found = findVideoById(id);
    if (!found) return;
    const { video } = found;
    if (!video.transcriptPath || !fs.existsSync(video.transcriptPath)) return;
    if (!fs.existsSync(SETTINGS_FILE)) return;
    const settings = getSettings();
    if (!settings.apiKey) return;

    const openai = new OpenAI({ apiKey: settings.apiKey });
    const segments = JSON.parse(fs.readFileSync(video.transcriptPath, "utf8"));

    const chunks = [];
    for (let i = 0; i < segments.length; i += 5) {
      const group = segments.slice(i, i + 5);
      chunks.push({
        text: group.map((s) => s.speech).join(" "),
        start: group[0].start,
        videoId: id,
      });
    }

    if (!chunks.length) return;

    const resp = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunks.map((c) => c.text),
    });

    const chunkWithEmbedding = chunks.map((c, i) => ({
      ...c,
      embedding: resp.data[i].embedding,
    }));

    const embeddingsPath = path.join(video.folderPath, "embeddings.json");
    fs.writeFileSync(embeddingsPath, JSON.stringify({ chunks: chunkWithEmbedding }));
    console.log(`[${id}] Indexed ${chunkWithEmbedding.length} chunks`);
  } catch (err) {
    console.log(`[${id}] Indexing failed: ${err.message}`);
  }
};

const processVideo = async (id, inputPath, outputPath, transcriptPath, txtPath) => {
  try {
    updateStatus(id, "compressing", { progress: 0 });

    let encoderKey = "videotoolbox";
    if (fs.existsSync(SETTINGS_FILE)) {
      try {
        const s = getSettings();
        if (s.encoder && ENCODER_PRESETS[s.encoder]) encoderKey = s.encoder;
      } catch (_) {}
    }
    const encoderOpts = ENCODER_PRESETS[encoderKey].options;

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([...encoderOpts, "-acodec aac", "-b:a 128k", "-movflags +faststart"])
        .on("progress", (p) => {
          const percent = p.percent ? Math.round(p.percent) : 0;
          updateStatus(id, "compressing", { progress: percent });
        })
        .on("end", resolve)
        .on("error", (err) => {
          console.error(`[${id}] FFmpeg Error:`, err);
          reject(err);
        })
        .save(outputPath);
    });

    updateStatus(id, "transcribing", { progress: 0 });

    // Node↔Python interface: exec(`python3 transcribe.py <outputPath> base`)
    // stdout: JSON array of { speech, start } segments
    // stderr: error message on failure
    const segments = await new Promise((resolve, reject) => {
      exec(
        `python3 "${TRANSCRIBE_SCRIPT}" "${outputPath}" base`,
        (error, stdout, stderr) => {
          try {
            const result = JSON.parse(stdout);
            if (result.error) return reject(new Error(result.error));
            resolve(result);
          } catch (e) {
            const msg = stderr?.trim() || error?.message || "Transcription failed";
            console.error(`[${id}] Python Error:`, msg);
            reject(new Error(msg));
          }
        },
      );
    });

    fs.writeFileSync(transcriptPath, JSON.stringify(segments, null, 2));
    fs.writeFileSync(txtPath, segments.map((s) => s.speech).join(" "));

    updateStatus(id, "completed", { transcript: segments, progress: 100 });
    indexVideo(id);

    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
  } catch (error) {
    console.error(`[${id}] Processing Failed:`, error);
    updateStatus(id, "error", { error: error.message });
  }
};

module.exports = { processVideo, indexVideo };
