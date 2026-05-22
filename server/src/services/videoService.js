const fs = require("fs");
const os = require("os");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { exec } = require("child_process");
const OpenAI = require("openai");

const { SETTINGS_FILE, ENCODER_PRESETS, TRANSCRIBE_SCRIPT, YTDLP_BIN, YTDLP_OPTS, UPLOADS_DIR } = require("../config");
const { findVideoById, updateStatus, getAllVideosAcrossCollections } = require("../repositories/videoRepository");
const { getSettings } = require("./settingsService");

const execWithRetry = (command, { retries = 3, delayMs = 5000 } = {}) =>
  new Promise((resolve, reject) => {
    const attempt = (remaining) => {
      exec(command, (err, stdout, stderr) => {
        if (!err) return resolve({ stdout, stderr });
        if (remaining <= 1) return reject(new Error(stderr?.trim() || err.message));
        console.warn(`Download failed, retrying (${remaining - 1} left)...`);
        setTimeout(() => attempt(remaining - 1), delayMs);
      });
    };
    attempt(retries);
  });

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

const parseSRTTimestamp = (ts) => {
  const [time, ms = "0"] = ts.trim().split(/[,.]/);
  const [hh, mm, ss] = time.split(":").map(Number);
  return hh * 3600 + mm * 60 + ss + Number(ms) / 1000;
};

const parseSRT = (content) => {
  const segments = [];
  const timePattern = /(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/;
  const blocks = content.split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const timeLine = lines.find((l) => timePattern.test(l));
    if (!timeLine) continue;
    const m = timeLine.match(timePattern);
    const start = parseSRTTimestamp(m[1]);
    const end = parseSRTTimestamp(m[2]);
    const textStart = lines.indexOf(timeLine) + 1;
    const speech = lines.slice(textStart).join(" ").replace(/<[^>]+>/g, "").trim();
    if (!speech) continue;
    segments.push({ start, end, speech });
  }
  return segments;
};

const processUrlVideo = async (id, url, transcriptPath, txtPath, outputPathFull, relativeOutputPath) => {
  updateStatus(id, "processing");

  const settings = fs.existsSync(SETTINGS_FILE) ? getSettings() : {};
  const shouldDownloadVideo = settings.downloadVideo === true;

  let segments = null;

  // Try platform captions first (fast, no audio download needed)
  const subDir = path.join(os.tmpdir(), `opennote-subs-${id}`);
  fs.mkdirSync(subDir, { recursive: true });
  try {
    await new Promise((resolve) => {
      exec(
        `"${YTDLP_BIN}" ${YTDLP_OPTS} --write-sub --write-auto-sub --sub-lang "en,en-US,en-GB" --skip-download --convert-subs srt -o "${path.join(subDir, "sub")}" --no-playlist "${url}"`,
        (err) => resolve(err),
      );
    });
    const srtFiles = fs.readdirSync(subDir).filter((f) => f.endsWith(".srt"));
    if (srtFiles.length > 0) {
      const srtContent = fs.readFileSync(path.join(subDir, srtFiles[0]), "utf8");
      const parsed = parseSRT(srtContent);
      if (parsed.length > 0) segments = parsed;
    }
  } catch (e) {
    console.error(`[${id}] Subtitle fetch error:`, e.message);
  } finally {
    try { fs.rmSync(subDir, { recursive: true, force: true }); } catch (_) {}
  }

  if (shouldDownloadVideo && outputPathFull && relativeOutputPath) {
    // Download full video, compress it, and use it for transcription if subtitles weren't available
    const rawVideoPath = path.join(UPLOADS_DIR, `${id}-raw.mp4`);
    updateStatus(id, "downloading");
    try {
      await execWithRetry(
        `"${YTDLP_BIN}" ${YTDLP_OPTS} -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[vcodec^=h264][ext=mp4]/best[vcodec^=avc][ext=mp4]/best[ext=mp4]/best" --merge-output-format mp4 --no-playlist -o "${rawVideoPath}" "${url}"`,
      );

      if (!segments) {
        updateStatus(id, "transcribing");
        segments = await new Promise((resolve, reject) => {
          exec(
            `python3 "${TRANSCRIBE_SCRIPT}" "${rawVideoPath}" base`,
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
      }

      updateStatus(id, "compressing", { progress: 0 });
      let encoderKey = "videotoolbox";
      try {
        const s = getSettings();
        if (s.encoder && ENCODER_PRESETS[s.encoder]) encoderKey = s.encoder;
      } catch (_) {}
      const encoderOpts = ENCODER_PRESETS[encoderKey].options;

      await new Promise((resolve, reject) => {
        ffmpeg(rawVideoPath)
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
          .save(outputPathFull);
      });
    } catch (e) {
      console.error(`[${id}] Video download/compress failed:`, e.message);
      if (!segments) {
        updateStatus(id, "error", { error: e.message });
        return;
      }
    } finally {
      try { if (fs.existsSync(rawVideoPath)) fs.unlinkSync(rawVideoPath); } catch (_) {}
    }
  } else if (!segments) {
    // Fall back to audio-only download + Whisper
    const audioPath = path.join(UPLOADS_DIR, `${id}-audio.mp3`);
    updateStatus(id, "transcribing");
    try {
      await execWithRetry(
        `"${YTDLP_BIN}" ${YTDLP_OPTS} -f "bestaudio/best[vcodec^=h264]/best[vcodec^=avc]/best" --extract-audio --audio-format mp3 --no-playlist -o "${audioPath}" "${url}"`,
      );

      segments = await new Promise((resolve, reject) => {
        exec(
          `python3 "${TRANSCRIBE_SCRIPT}" "${audioPath}" base`,
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
    } catch (e) {
      console.error(`[${id}] Audio transcription failed:`, e.message);
      updateStatus(id, "error", { error: e.message });
      return;
    } finally {
      try { if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath); } catch (_) {}
    }
  }

  fs.writeFileSync(transcriptPath, JSON.stringify(segments, null, 2));
  fs.writeFileSync(txtPath, segments.map((s) => s.speech).join(" "));

  const completionDetails = { transcript: segments, progress: 100 };
  if (shouldDownloadVideo && relativeOutputPath && fs.existsSync(outputPathFull)) {
    completionDetails.outputPath = relativeOutputPath;
  }

  updateStatus(id, "completed", completionDetails);
  indexVideo(id);
};

const indexAllPending = () => {
  const allVideos = getAllVideosAcrossCollections();
  Object.entries(allVideos).forEach(([id, video]) => {
    if (video.status === "completed" && video.folderPath) {
      const embeddingsPath = path.join(video.folderPath, "embeddings.json");
      if (!fs.existsSync(embeddingsPath)) {
        console.log(`[${id}] Triggering pending indexing after settings update...`);
        indexVideo(id);
      }
    }
  });
};

module.exports = { processVideo, processUrlVideo, indexVideo, indexAllPending };
