// Artifacts are stored as `<cleaned video name>.md`, and a note generated from
// several sources joins their cleaned names with "_". That filename is the only
// link back to the sources, so the matching rule lives here.
export const toCleanName = (originalName = "") =>
  originalName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9.]/gi, "_");

export const noteBelongsToVideo = (note, video) =>
  !!note?.filename && note.filename.startsWith(toCleanName(video?.originalName));

// Every source that appears in a note's filename, longest name first so that a
// short name nested inside a longer one cannot claim the match on its own.
// Note: the server truncates to "<a>_<b>_<c>_and_N_more" past three sources, so
// anything beyond the third is not recoverable from the filename.
export const relatedVideosForNote = (note, videos = []) => {
  if (!note?.filename) return [];
  const stem = note.filename.replace(/\.md$/, "");
  return [...videos]
    .map((video) => ({ video, clean: toCleanName(video.originalName) }))
    .filter(({ clean }) => clean && stem.includes(clean))
    .sort((a, b) => b.clean.length - a.clean.length)
    .map(({ video }) => video);
};

// True when the filename admits to more sources than it names.
export const hasTruncatedSources = (note) =>
  /_and_\d+_more(_\d+)?$/.test((note?.filename || "").replace(/\.md$/, ""));
