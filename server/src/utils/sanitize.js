const INTERNAL_FIELDS = ["folderPath", "txtPath", "transcriptPath", "inputPath"];

const sanitizeVideo = (video) => {
  if (!video) return video;
  const safe = { ...video };
  INTERNAL_FIELDS.forEach((f) => delete safe[f]);
  return safe;
};

module.exports = { sanitizeVideo };
