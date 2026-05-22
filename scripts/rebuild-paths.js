#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const PROJECT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(PROJECT_DIR, "data");
const PROCESSED_DIR = path.join(DATA_DIR, "processed");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const COLLECTIONS_DIR = path.join(PROJECT_DIR, "server", "collections");
const DB_FILE = path.join(PROJECT_DIR, "server", "db.json");

const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE = process.argv.includes("--verbose");

if (DRY_RUN) console.log("[DRY RUN] No files will be modified.\n");

let totalFixed = 0;
let totalSkipped = 0;
let warnings = [];

function rebuildVideoPaths(video, sourceLabel) {
  const id = video.id;
  if (!id) return false;

  let changed = false;

  if (video.folderPath) {
    const folderName = path.basename(video.folderPath);
    const correct = path.join(PROCESSED_DIR, folderName);
    if (video.folderPath !== correct) {
      if (VERBOSE) console.log(`  folderPath: ${video.folderPath} -> ${correct}`);
      video.folderPath = correct;
      changed = true;
    }
  }

  if (video.transcriptPath) {
    const fileName = path.basename(video.transcriptPath);
    const folderName = video.folderPath ? path.basename(video.folderPath) : null;
    if (folderName) {
      const correct = path.join(PROCESSED_DIR, folderName, fileName);
      if (video.transcriptPath !== correct) {
        if (VERBOSE) console.log(`  transcriptPath: ${video.transcriptPath} -> ${correct}`);
        video.transcriptPath = correct;
        changed = true;
      }
    }
  }

  if (video.txtPath) {
    const fileName = path.basename(video.txtPath);
    const folderName = video.folderPath ? path.basename(video.folderPath) : null;
    if (folderName) {
      const correct = path.join(PROCESSED_DIR, folderName, fileName);
      if (video.txtPath !== correct) {
        if (VERBOSE) console.log(`  txtPath: ${video.txtPath} -> ${correct}`);
        video.txtPath = correct;
        changed = true;
      }
    }
  }

  if (video.inputPath) {
    const fileName = path.basename(video.inputPath);
    const correct = path.join(UPLOADS_DIR, fileName);
    if (video.inputPath !== correct) {
      if (VERBOSE) console.log(`  inputPath: ${video.inputPath} -> ${correct}`);
      video.inputPath = correct;
      changed = true;
    }
  }

  if (changed) {
    const missing = [];
    if (video.folderPath && !fs.existsSync(video.folderPath)) missing.push("folderPath");
    if (video.transcriptPath && !fs.existsSync(video.transcriptPath)) missing.push("transcriptPath");
    if (video.txtPath && !fs.existsSync(video.txtPath)) missing.push("txtPath");
    if (video.inputPath && !fs.existsSync(video.inputPath)) missing.push("inputPath");
    if (missing.length > 0) {
      warnings.push(`  [${sourceLabel}] ${video.originalName || id}: missing files for ${missing.join(", ")}`);
    }
  }

  return changed;
}

function processCollections() {
  if (!fs.existsSync(COLLECTIONS_DIR)) {
    console.log("No collections directory found, skipping.");
    return;
  }

  const files = fs.readdirSync(COLLECTIONS_DIR).filter((f) => f.endsWith(".json"));
  console.log(`Found ${files.length} collection(s).\n`);

  for (const file of files) {
    const filePath = path.join(COLLECTIONS_DIR, file);
    let rawText = fs.readFileSync(filePath, "utf8");
    // Strip BOM if present
    if (rawText.charCodeAt(0) === 0xfeff) rawText = rawText.slice(1);

    let raw;
    try {
      raw = JSON.parse(rawText);
    } catch (e) {
      const preview = rawText.slice(0, 80).replace(/\n/g, "\\n");
      console.error(`[SKIP] ${file} — invalid JSON: ${e.message}`);
      console.error(`       First 80 chars: "${preview}"`);
      warnings.push(`  [${file}] Skipped — file is not valid JSON`);
      continue;
    }

    const collectionName = raw.title || file;
    let collectionChanged = false;
    let fixedInCollection = 0;

    for (const [vidId, video] of Object.entries(raw.videos || {})) {
      const wasFixed = rebuildVideoPaths(video, collectionName);
      if (wasFixed) {
        fixedInCollection++;
        collectionChanged = true;
      }
    }

    if (collectionChanged) {
      totalFixed += fixedInCollection;
      console.log(`[${collectionName}] ${fixedInCollection} video path(s) rebuilt.`);
      if (!DRY_RUN) {
        fs.writeFileSync(filePath, JSON.stringify(raw, null, 2));
      }
    } else {
      totalSkipped += Object.keys(raw.videos || {}).length;
      console.log(`[${collectionName}] All paths already correct.`);
    }
  }
}

function processDbJson() {
  if (!fs.existsSync(DB_FILE)) {
    console.log("\nNo db.json found, skipping.");
    return;
  }

  let rawText = fs.readFileSync(DB_FILE, "utf8");
  if (rawText.charCodeAt(0) === 0xfeff) rawText = rawText.slice(1);

  let raw;
  try {
    raw = JSON.parse(rawText);
  } catch (e) {
    console.error(`\n[SKIP] db.json — invalid JSON: ${e.message}`);
    warnings.push(`  [db.json] Skipped — file is not valid JSON`);
    return;
  }

  let fixedCount = 0;

  for (const [vidId, video] of Object.entries(raw.videos || {})) {
    if (rebuildVideoPaths(video, "db.json")) fixedCount++;
  }

  if (fixedCount > 0) {
    totalFixed += fixedCount;
    console.log(`\n[db.json] ${fixedCount} video path(s) rebuilt.`);
    if (!DRY_RUN) {
      fs.writeFileSync(DB_FILE, JSON.stringify(raw, null, 2));
    }
  } else {
    totalSkipped += Object.keys(raw.videos || {}).length;
    console.log("\n[db.json] All paths already correct.");
  }
}

console.log(`Project root: ${PROJECT_DIR}`);
console.log(`Data dir:     ${DATA_DIR}\n`);

processCollections();
processDbJson();

console.log(`\n--- Summary ---`);
console.log(`Fixed:   ${totalFixed} video(s)`);
console.log(`Skipped: ${totalSkipped} video(s) (already correct)`);

if (warnings.length > 0) {
  console.log(`\nWarnings (paths rebuilt but files not found on disk):`);
  warnings.forEach((w) => console.log(w));
}

if (DRY_RUN && totalFixed > 0) {
  console.log(`\nRe-run without --dry-run to apply changes.`);
}
