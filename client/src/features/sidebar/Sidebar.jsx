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
  FileText,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import VideoItem from "./VideoItem";

export default function Sidebar({
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
}) {
  return (
    <div className={`sidebar ${!sidebarVisible ? "hidden" : ""}`}>
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
        </div>
        <label className="upload-btn-round">
          <Plus size={20} />
          <input
            type="file"
            multiple
            className="hidden"
            style={{ display: "none" }}
            onChange={handleUpload}
            accept="video/*"
          />
        </label>
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
            />
          );
        })}
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
          onClick={() => setShowGenerateModal(true)}
          title="Generate AI Notes"
        >
          <Sparkles size={16} /> Generate Notes
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
          gap: "8px",
        }}
      >
        <button
          onClick={() => setShowSearch(true)}
          className="settings-btn"
          style={{ justifyContent: "center", flex: 1 }}
        >
          <Search size={16} /> Search
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="settings-btn"
          style={{ width: "auto", padding: "8px" }}
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
}
