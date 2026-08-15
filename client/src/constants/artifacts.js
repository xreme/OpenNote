// Artifact types offered in the "I want to make [dropdown]" generator.
// `label` is the natural-language phrase shown inside the sentence.
export const ARTIFACT_TYPES = [
  { value: "summary", label: "a summary" },
  { value: "notes", label: "notes" },
  { value: "note", label: "a blank note" },
  { value: "flashcards", label: "flashcards" },
  { value: "quizzes", label: "a quiz" },
  { value: "custom", label: "something else" },
];

// Short label used for badges / pills (e.g. in the notes list).
export const ARTIFACT_BADGE = {
  summary: "Summary",
  notes: "Notes",
  note: "Note",
  flashcards: "Flashcards",
  quizzes: "Quiz",
  custom: "Custom",
};

// Sidebar ordering for the artifact list: the same order the generator offers.
const TYPE_ORDER = ARTIFACT_TYPES.map((t) => t.value);

// Bucket artifacts under their kind, in TYPE_ORDER, with unknown kinds last.
export const groupNotesByType = (notes = []) => {
  const buckets = new Map();
  notes.forEach((note) => {
    const type = note.type || "notes";
    if (!buckets.has(type)) buckets.set(type, []);
    buckets.get(type).push(note);
  });

  return [...buckets.entries()]
    .sort(([a], [b]) => {
      const ia = TYPE_ORDER.indexOf(a);
      const ib = TYPE_ORDER.indexOf(b);
      return (ia < 0 ? TYPE_ORDER.length : ia) - (ib < 0 ? TYPE_ORDER.length : ib);
    })
    .map(([type, items]) => ({
      type,
      label: ARTIFACT_BADGE[type] || type,
      notes: items,
    }));
};
