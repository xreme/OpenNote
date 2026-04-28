import React from "react";
import { PanelLeftClose, PanelLeftOpen, FileText } from "lucide-react";
import NoteItem from "./NoteItem";

export default function NotesSidebar({
  notes,
  selectedNote,
  notesSidebarVisible,
  setNotesSidebarVisible,
  sidebarVisible,
  setSidebarVisible,
  onSelectNote,
  onRenameNote,
  onDeleteNote,
}) {
  return (
    <div className={`notes-sidebar ${!notesSidebarVisible ? "hidden" : ""}`}>
      <div
        style={{
          padding: "24px 16px 16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <button
          onClick={() => setNotesSidebarVisible(false)}
          className="icon-btn-toggle"
          title="Hide Notes List"
        >
          <PanelLeftClose size={20} />
        </button>
        {!sidebarVisible && (
          <button
            onClick={() => setSidebarVisible(true)}
            className="icon-btn-toggle"
            title="Show Sidebar"
          >
            <PanelLeftOpen size={20} />
          </button>
        )}
        <h3
          style={{
            margin: 0,
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FileText size={18} /> Saved Notes
        </h3>
      </div>
      <div className="notes-list">
        {notes.map((note) => (
          <NoteItem
            key={note.filename}
            note={note}
            selected={selectedNote?.filename === note.filename}
            onSelect={onSelectNote}
            onRename={onRenameNote}
            onDelete={onDeleteNote}
          />
        ))}
      </div>
    </div>
  );
}
