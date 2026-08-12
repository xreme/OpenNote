import React from "react";
import { Download, X, PanelLeftOpen, FileText } from "lucide-react";
import ArtifactContent from "../artifacts/ArtifactContent";
import SourceLinks from "./SourceLinks";
import { ARTIFACT_BADGE } from "../../constants/artifacts";

export default function NoteContent({
  selectedNote,
  videos,
  onSelectVideo,
  sidebarVisible,
  setSidebarVisible,
  onDownload,
  onClose,
}) {
  if (!selectedNote) {
    return (
      <div className="empty-state">
        {!sidebarVisible && (
          <div style={{ position: "absolute", top: 16, left: 16 }}>
            <button
              onClick={() => setSidebarVisible(true)}
              className="header-icon-btn"
              title="Show sidebar"
            >
              <PanelLeftOpen size={16} />
            </button>
          </div>
        )}
        <div className="empty-icon-box">
          <FileText size={28} />
        </div>
        <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-soft)", margin: 0 }}>
          Select a note to view
        </h2>
      </div>
    );
  }

  return (
    <div className="markdown-preview">
      <div className="note-header">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <h2>{selectedNote.filename.replace(".md", "")}</h2>
            {selectedNote.type && (
              <span className={`artifact-badge artifact-badge-${selectedNote.type}`}>
                {ARTIFACT_BADGE[selectedNote.type] || selectedNote.type}
              </span>
            )}
          </div>
          <SourceLinks
            note={selectedNote}
            videos={videos}
            onSelectVideo={onSelectVideo}
          />
        </div>
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
        <ArtifactContent
          content={selectedNote.content}
          type={selectedNote.type}
          markdownClassName="markdown-body"
        />
      </div>
    </div>
  );
}
