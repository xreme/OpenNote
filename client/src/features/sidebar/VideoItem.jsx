import React, { useState } from "react";
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
} from "lucide-react";

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
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(video.originalName);

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
          {video.status === "completed" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenFolder(video.folderPath);
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-dim)",
                cursor: "pointer",
                padding: "4px",
              }}
              title="Open in Folder"
            >
              <Folder size={14} />
            </button>
          )}
          {!isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                startEditing();
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-dim)",
                cursor: "pointer",
                padding: "4px",
              }}
              title="Rename"
            >
              <Edit2 size={14} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(video.id);
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-dim)",
              cursor: "pointer",
              padding: "4px",
            }}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="reorder-btns">
        <button
          className="reorder-btn"
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp();
          }}
          disabled={isFirst}
          title="Move Up"
        >
          <ArrowUp size={12} />
        </button>
        <button
          className="reorder-btn"
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
          disabled={isLast}
          title="Move Down"
        >
          <ArrowDown size={12} />
        </button>
      </div>
    </div>
  );
}
