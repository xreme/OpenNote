import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  FileVideo,
  Folder,
  CheckCircle2,
  Loader2,
  Trash2,
  Edit2,
  X,
  Check,
  ArrowUp,
  ArrowDown,
  Eye,
  Link2,
  Upload,
} from "lucide-react";

function SourceInfoModal({ video, onClose }) {
  const timestamp = parseInt(video.id, 10);
  const addedDate = isNaN(timestamp)
    ? "—"
    : new Date(timestamp).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  const isLink = !!video.sourceUrl;
  const displayName = video.originalName.replace(/\.[^.]+$/, "");

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card-bg)",
          border: "var(--border-width) solid var(--card-border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow)",
          padding: "20px 24px",
          width: "360px",
          maxWidth: "90vw",
          fontFamily: "inherit",
          color: "var(--text-main)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "18px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-dim)", marginBottom: "4px" }}>
              Source Info
            </div>
            <div style={{ fontSize: "14px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {displayName}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", padding: "2px", display: "flex", flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px" }}>
          <InfoRow label="Date added" value={addedDate} />
          <div>
            <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dim)", marginBottom: "5px" }}>
              Source type
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              {isLink
                ? <><Link2 size={13} style={{ color: "var(--primary)" }} /> Added via link</>
                : <><Upload size={13} style={{ color: "var(--primary)" }} /> File upload</>}
            </span>
          </div>
          {isLink && (
            <div>
              <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dim)", marginBottom: "5px" }}>
                Original link
              </div>
              <a
                href={video.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--primary)", wordBreak: "break-all", lineHeight: "1.5", textDecoration: "underline", fontSize: "12px" }}
              >
                {video.sourceUrl}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dim)", marginBottom: "5px" }}>
        {label}
      </div>
      <div>{value}</div>
    </div>
  );
}

export default function VideoItem({
  video,
  selected,
  onSelect,
  onDelete,
  onRename,
  onOpenFolder,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  previewMode,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(video.originalName);
  const [showInfo, setShowInfo] = useState(false);

  const startEditing = () => {
    setEditName(video.originalName);
    setIsEditing(true);
  };

  const confirmRename = () => {
    onRename(video.id, editName);
    setIsEditing(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  return (
    <div
      onClick={() => onSelect(video.id)}
      className={`video-item ${selected ? "selected" : ""}`}
    >
      <div className="video-item-content">
        <div className="video-info-wrapper" style={{ flex: 1 }}>
          <div className="video-icon-box">
            <FileVideo size={18} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
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
                  style={{ padding: "2px 8px", fontSize: "12px" }}
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
              <p className="video-name">{video.originalName}</p>
            )}
            <div className="video-status">
              {video.status === "completed" ? (
                <span className="status-done">
                  <CheckCircle2 size={10} /> DONE
                </span>
              ) : (
                <span className="status-loading">
                  <Loader2 size={10} className="spin" />{" "}
                  {video.status.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "2px", marginLeft: "8px" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowInfo(true);
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-dim)",
              cursor: "pointer",
              padding: "4px",
            }}
            title="Source info"
          >
            <Eye size={14} />
          </button>
          {video.status === "completed" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!previewMode) onOpenFolder(video.folderPath);
              }}
              disabled={previewMode}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-dim)",
                cursor: previewMode ? "not-allowed" : "pointer",
                padding: "4px",
                opacity: previewMode ? 0.35 : 1,
              }}
              title={previewMode ? "Not available in preview mode" : "Open in Folder"}
            >
              <Folder size={14} />
            </button>
          )}
          {!isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!previewMode) startEditing();
              }}
              disabled={previewMode}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-dim)",
                cursor: previewMode ? "not-allowed" : "pointer",
                padding: "4px",
                opacity: previewMode ? 0.35 : 1,
              }}
              title={previewMode ? "Not available in preview mode" : "Rename"}
            >
              <Edit2 size={14} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!previewMode) onDelete(video.id);
            }}
            disabled={previewMode}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-dim)",
              cursor: previewMode ? "not-allowed" : "pointer",
              padding: "4px",
              opacity: previewMode ? 0.35 : 1,
            }}
            title={previewMode ? "Not available in preview mode" : "Delete"}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {showInfo && <SourceInfoModal video={video} onClose={() => setShowInfo(false)} />}

      <div className="reorder-btns" style={previewMode ? { opacity: 0.35, pointerEvents: "none" } : undefined}>
        <button
          className="reorder-btn"
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp();
          }}
          disabled={isFirst || previewMode}
          title={previewMode ? "Not available in preview mode" : "Move Up"}
        >
          <ArrowUp size={12} />
        </button>
        <button
          className="reorder-btn"
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
          disabled={isLast || previewMode}
          title={previewMode ? "Not available in preview mode" : "Move Down"}
        >
          <ArrowDown size={12} />
        </button>
      </div>
    </div>
  );
}
