import React, { useState } from "react";
import { Trash2, Edit2, X, Check } from "lucide-react";

export default function NoteItem({ note, selected, onSelect, onRename, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(note.filename.replace(".md", ""));

  const startEditing = () => {
    setEditName(note.filename.replace(".md", ""));
    setIsEditing(true);
  };

  const confirmRename = () => {
    onRename(note.filename, editName);
    setIsEditing(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  return (
    <div
      className={`note-item ${selected ? "active" : ""}`}
      onClick={() => onSelect(note)}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {isEditing ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <input
              autoFocus
              className="search-input"
              style={{
                padding: "2px 8px",
                fontSize: "12px",
                width: "100%",
              }}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmRename();
                if (e.key === "Escape") cancelEditing();
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                confirmRename();
              }}
              style={{
                color: "var(--success)",
                background: "none",
                border: "none",
              }}
            >
              <Check size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                cancelEditing();
              }}
              style={{
                color: "#ef4444",
                background: "none",
                border: "none",
              }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <span className="note-title">
              {note.filename.replace(".md", "")}
            </span>
            <span className="note-date">
              {new Date(note.createdAt).toLocaleDateString()}{" "}
              {new Date(note.createdAt).toLocaleTimeString()}
            </span>
          </>
        )}
      </div>
      {!isEditing && (
        <button
          className="rename-btn"
          onClick={(e) => {
            e.stopPropagation();
            startEditing();
          }}
          title="Rename"
        >
          <Edit2 size={14} />
        </button>
      )}
      <button
        className="delete-btn"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(note.filename);
        }}
        title="Delete"
        style={{
          backgroundColor: "#ef4444",
          color: "white",
          border: "none",
          borderRadius: "4px",
          padding: "4px 8px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <Trash2 size={14} /> Delete
      </button>
    </div>
  );
}
