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
