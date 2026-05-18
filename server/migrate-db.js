#!/usr/bin/env node
/**
 * Converts server/db.json into the new collections format.
 * Run from the project root: node server/migrate-db.js
 */

const fs = require("fs");
const path = require("path");

const SERVER_DIR = path.join(__dirname);
const DB_FILE = path.join(SERVER_DIR, "db.json");
const COLLECTIONS_DIR = path.join(SERVER_DIR, "collections");

if (!fs.existsSync(DB_FILE)) {
  console.log("No db.json found — nothing to migrate.");
  process.exit(0);
}

if (!fs.existsSync(COLLECTIONS_DIR)) {
  fs.mkdirSync(COLLECTIONS_DIR, { recursive: true });
}

// Find the next available "New collection N" filename
let num = 1;
while (fs.existsSync(path.join(COLLECTIONS_DIR, `new-collection-${num}.json`))) {
  num++;
}

const raw = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));

// Support both old flat format and current { videos, order } format
let videos = {};
let order = [];

if (raw.videos && raw.order) {
  videos = raw.videos;
  order = raw.order;
} else {
  // Legacy flat format: { [id]: videoInfo }
  videos = raw;
  order = Object.keys(raw).sort((a, b) => Number(b.split("-")[0]) - Number(a.split("-")[0]));
}

const title = `New collection ${num}`;
const collectionId = `new-collection-${num}`;
const now = new Date().toISOString();

const collection = {
  title,
  createdAt: now,
  modifiedAt: now,
  videos,
  order,
};

const outputPath = path.join(COLLECTIONS_DIR, `${collectionId}.json`);
fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));

console.log(`✓ Migrated db.json → collections/${collectionId}.json`);
console.log(`  Title: "${title}"`);
console.log(`  Videos: ${Object.keys(videos).length}`);
console.log("");
console.log("You can now delete server/db.json if desired.");
