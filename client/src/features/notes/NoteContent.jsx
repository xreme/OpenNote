import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download, X, PanelLeftOpen, FileText } from "lucide-react";

export default function NoteContent({
  selectedNote,
  notesSidebarVisible,
  setNotesSidebarVisible,
  sidebarVisible,
  setSidebarVisible,
  onDownload,
  onClose,
}) {
  if (!selectedNote) {
    return (
      <div className="empty-state">
        {!notesSidebarVisible && (
          <div style={{ position: "absolute", top: 16, left: 16 }}>
            <button
              onClick={() => setNotesSidebarVisible(true)}
              className="icon-btn-toggle"
              title="Show Notes List"
            >
              <PanelLeftOpen size={20} />
            </button>
          </div>
        )}
        <FileText
          size={48}
          style={{
            color: "var(--text-dim)",
            opacity: 0.5,
            marginBottom: "16px",
          }}
        />
        <p>Select a note to view</p>
      </div>
    );
  }

  return (
    <div className="markdown-preview">
      <div className="note-header">
        <h2>{selectedNote.filename.replace(".md", "")}</h2>
        <div style={{ display: "flex", gap: "8px" }}>
          {!sidebarVisible && (
            <button
              onClick={() => setSidebarVisible(true)}
              className="icon-btn-toggle"
              title="Show Sidebar"
            >
              <PanelLeftOpen size={18} />
            </button>
          )}
          {!notesSidebarVisible && (
            <button
              onClick={() => setNotesSidebarVisible(true)}
              className="icon-btn-toggle"
              title="Show Notes List"
            >
              <PanelLeftOpen size={18} />
            </button>
          )}
          <button
            className="export-btn"
            onClick={onDownload}
            title="Download Markdown"
          >
            <Download size={16} />
          </button>
          <button className="icon-btn-toggle" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="markdown-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {selectedNote.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
