const path = require("path");

const getCleanName = (fileName) => {
  const base = path.parse(fileName).name;
  return base.replace(/[^a-z0-9.]/gi, "_");
};

const cosineSimilarity = (a, b) => {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

module.exports = { getCleanName, cosineSimilarity };
