import React, { useState } from "react";
import {
  FileText,
  Layers,
  ListChecks,
  Pencil,
  Sparkles,
  Edit2,
  Trash2,
  X,
  Check,
} from "lucide-react";

const TYPE_ICON = {
  summary: Sparkles,
  notes: FileText,
  note: Pencil,
  flashcards: Layers,
  quizzes: ListChecks,
  custom: Sparkles,
};

export default function NoteRow({ note, active, onSelect, onRename, onDelete, previewMode }) {
  const name = note.filename.replace(/\.md$/, "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const Icon = TYPE_ICON[note.type] || Sparkles;

  const startEditing = (e) => {
    e.stopPropagation();
    setDraft(name);
    setEditing(true);
  };

  const confirm = () => {
    const next = draft.trim();
    if (next && next !== name) onRename(note.filename, next);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="artifact-item editing">
        <span className="artifact-item-icon"><Icon size={15} /></span>
        <input
          autoFocus
          className="search-input"
          style={{ background: "var(--card-bg)", borderRadius: "8px", padding: "4px 8px", fontSize: "12px" }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") confirm();
            if (e.key === "Escape") setEditing(false);
          }}
          onClick={(e) => e.stopPropagation()}
        />
        <button
          className="note-row-action"
          onClick={(e) => { e.stopPropagation(); confirm(); }}
          style={{ color: "var(--success)" }}
          title="Save"
        >
          <Check size={14} />
        </button>
        <button
          className="note-row-action"
          onClick={(e) => { e.stopPropagation(); setEditing(false); }}
          title="Cancel"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`artifact-item ${active ? "active" : ""}`}
      onClick={() => onSelect(note)}
      title={name}
    >
      <span className="artifact-item-icon"><Icon size={15} /></span>
      <span className="artifact-item-name">{name}</span>
      <span className="note-row-actions">
        <button
          className="note-row-action"
          onClick={startEditing}
          disabled={previewMode}
          title={previewMode ? "Not available in preview mode" : "Rename"}
        >
          <Edit2 size={13} />
        </button>
        <button
          className="note-row-action danger"
          onClick={(e) => { e.stopPropagation(); if (!previewMode) onDelete(note.filename); }}
          disabled={previewMode}
          title={previewMode ? "Not available in preview mode" : "Delete"}
        >
          <Trash2 size={13} />
        </button>
      </span>
    </div>
  );
}
