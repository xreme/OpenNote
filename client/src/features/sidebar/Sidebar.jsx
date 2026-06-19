import React from "react";
import {
  Upload,
  FileVideo,
  Loader2,
  Download,
  Search,
  Plus,
  PanelLeftClose,
  Settings,
  Github,
  FileText,
  Sparkles,
  MessageSquare,
  ChevronDown,
  Eye,
  Layers,
  ListChecks,
  Pencil,
} from "lucide-react";
import VideoItem from "./VideoItem";
import { ARTIFACT_BADGE } from "../../constants/artifacts";

// Icon shown next to each artifact in the sidebar, keyed by artifact type.
const TYPE_ICON = {
  summary: Sparkles,
  notes: FileText,
  note: Pencil,
  flashcards: Layers,
  quizzes: ListChecks,
  custom: Sparkles,
};

export default function Sidebar({
  width,
  isResizing,
  videos,
  filteredVideos,
  uploading,
  search,
  setSearch,
  selectedId,
  setSelectedId,
  sidebarVisible,
  setSidebarVisible,
  viewMode,
  setViewMode,
  showChatPanel,
  setShowChatPanel,
  handleUpload,
  deleteVideo,
  moveVideo,
  saveRename,
  openFolder,
  fetchNotes,
  setShowGenerateModal,
  setShowExportModal,
  setShowSearch,
  setShowSettings,
  setShowAddModal,
  collections,
  activeCollectionId,
  onSwitchCollection,
  previewMode,
  notes = [],
  selectedNote,
  setSelectedNote,
}) {
  const openArtifact = (note) => {
    setSelectedNote(note);
    setViewMode("notes");
  };

  const isArtifactActive = (note) =>
    viewMode === "notes" && selectedNote?.filename === note.filename;

  return (
    <div
      className={`sidebar ${!sidebarVisible ? "hidden" : ""}`}
      style={{ width, transition: isResizing ? "none" : undefined }}
    >
      <div className="sidebar-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setSidebarVisible(false)}
            className="icon-btn-toggle"
            title="Hide Sidebar"
          >
            <PanelLeftClose size={20} />
          </button>
          <h1 className="logo">OpenNote</h1>
          {previewMode && (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "2px 8px",
              borderRadius: "20px",
              fontSize: "9px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--primary)",
              background: "rgba(200,170,110,0.15)",
              border: "1px solid rgba(200,170,110,0.3)",
              whiteSpace: "nowrap",
            }}>
              <Eye size={10} /> Preview
            </span>
          )}
        </div>
        <button
          className="upload-btn-round"
          onClick={() => !previewMode && setShowAddModal(true)}
          title={previewMode ? "Not available in preview mode" : "Add Content"}
          disabled={previewMode}
          style={previewMode ? { opacity: 0.4, cursor: "not-allowed", pointerEvents: "auto" } : undefined}
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="search-container">
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search videos..."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="sidebar-lists">
        <div className="sidebar-section sidebar-sources">
          <div className="sidebar-section-header">
            <span><FileVideo size={12} /> Sources</span>
            <span className="sidebar-section-count">{videos.length}</span>
          </div>
          <div className="video-list">
            {!videos.length && !uploading && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  color: "var(--text-dim)",
                }}
              >
                <Upload style={{ opacity: 0.2, marginBottom: "8px" }} size={32} />
                <p style={{ fontSize: "14px" }}>No videos yet</p>
              </div>
            )}

            {uploading && (
              <div
                className="video-item"
                style={{ animation: "pulse 2s infinite" }}
              >
                <div className="video-info-wrapper">
                  <Loader2
                    size={16}
                    className="spin"
                    style={{ color: "var(--primary)" }}
                  />
                  <span style={{ fontSize: "14px", color: "var(--text-dim)" }}>
                    Uploading...
                  </span>
                </div>
              </div>
            )}

            {filteredVideos.map((video) => {
              const indexInAll = videos.indexOf(video);
              return (
                <VideoItem
                  key={video.id}
                  video={video}
                  selected={selectedId === video.id}
                  onSelect={setSelectedId}
                  onDelete={deleteVideo}
                  onRename={saveRename}
                  onOpenFolder={openFolder}
                  onMoveUp={() => moveVideo(indexInAll, -1)}
                  onMoveDown={() => moveVideo(indexInAll, 1)}
                  isFirst={indexInAll === 0}
                  isLast={indexInAll === videos.length - 1}
                  previewMode={previewMode}
                />
              );
            })}
          </div>
        </div>

        <div className="sidebar-section sidebar-artifacts">
          <div className="sidebar-section-header">
            <span><Sparkles size={12} /> Artifacts</span>
            <span className="sidebar-section-count">{notes.length}</span>
          </div>
          <div className="artifact-list">
            {notes.length === 0 ? (
              <p className="sidebar-empty-hint">No artifacts yet</p>
            ) : (
              notes.map((note) => {
                const Icon = TYPE_ICON[note.type] || Sparkles;
                const name = note.filename.replace(/\.md$/, "");
                return (
                  <button
                    key={note.filename}
                    className={`artifact-item ${isArtifactActive(note) ? "active" : ""}`}
                    onClick={() => openArtifact(note)}
                    title={name}
                  >
                    <Icon size={13} className="artifact-item-icon" />
                    <span className="artifact-item-name">{name}</span>
                    {note.type && note.type !== "notes" && (
                      <span className={`artifact-badge artifact-badge-${note.type}`}>
                        {ARTIFACT_BADGE[note.type] || note.type}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div
        className="sidebar-actions"
        style={{
          padding: "0 16px",
          marginBottom: "16px",
          display: "flex",
          gap: "8px",
        }}
      >
        <button
          className="action-btn-primary"
          onClick={() => !previewMode && setShowGenerateModal(true)}
          title={previewMode ? "Not available in preview mode" : "Generate AI Artifact"}
          disabled={previewMode}
          style={previewMode ? { opacity: 0.4, cursor: "not-allowed", pointerEvents: "auto" } : undefined}
        >
          <Sparkles size={16} /> Generate Artifact
        </button>
        <button
          className="action-btn-secondary"
          onClick={() => setShowExportModal(true)}
          title="Bulk Export Transcripts"
          style={{ padding: "0 12px" }}
        >
          <Download size={16} />
        </button>
        <button
          className={`action-btn-secondary ${showChatPanel ? "active" : ""}`}
          onClick={() => setShowChatPanel((prev) => !prev)}
          title="Chat with Transcripts"
        >
          <MessageSquare size={16} />
        </button>
        <button
          className={`action-btn-secondary ${viewMode === "notes" ? "active" : ""}`}
          onClick={() => {
            if (viewMode === "notes") {
              setViewMode("videos");
            } else {
              setViewMode("notes");
              fetchNotes();
            }
          }}
          title={viewMode === "notes" ? "Back to Videos" : "View Notes"}
        >
          {viewMode === "notes" ? (
            <FileVideo size={16} />
          ) : (
            <FileText size={16} />
          )}
        </button>
      </div>

      <div
        className="sidebar-footer"
        style={{
          marginTop: "auto",
          padding: "16px",
          borderTop: "1px solid var(--card-border)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {collections && collections.length > 0 && (
          <div className="collection-switcher">
            <select
              className="collection-select"
              value={activeCollectionId || ""}
              onChange={(e) => onSwitchCollection(e.target.value)}
            >
              {collections.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="collection-select-icon" />
          </div>
        )}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setShowSearch(true)}
            className="settings-btn"
            style={{ justifyContent: "center", flex: 1 }}
          >
            <Search size={16} /> Search
          </button>
          <a
            href="https://github.com/xreme/OpenNote"
            target="_blank"
            rel="noopener noreferrer"
            className="settings-btn"
            style={{ width: "auto", padding: "8px", textDecoration: "none" }}
            title="GitHub"
          >
            <Github size={16} />
          </a>
          <button
            onClick={() => setShowSettings(true)}
            className="settings-btn"
            style={{ width: "auto", padding: "8px" }}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
