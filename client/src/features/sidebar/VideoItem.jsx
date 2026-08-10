import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  FileVideo,
  Folder,
  CheckCircle2,
  Loader2,
  MonitorPlay,
  Smartphone,
  Trash2,
  Edit2,
  X,
  Check,
  AlertTriangle,
  GripVertical,
  Eye,
  Link2,
  Upload,
} from "lucide-react";

// Source rows carry the icon of where the video came from.
const sourceIcon = (video) => {
  const url = video.sourceUrl || "";
  if (/youtube\.com|youtu\.be/i.test(url)) return <MonitorPlay size={15} />;
  if (/tiktok\.com|instagram\.com/i.test(url)) return <Smartphone size={15} />;
  return <FileVideo size={15} />;
};

// The server stores no duration, so the end of the transcript stands in for it.
const transcriptLength = (video) => {
  const segments = video.transcript;
  if (!segments || !segments.length) return "";
  const last = segments[segments.length - 1];
  const seconds = Math.round(last.end ?? last.start ?? 0);
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const STATUS = {
  completed: { label: "Ready", className: "status-done" },
  error: { label: "Error", className: "status-error" },
};

function SourceInfoModal({ video, onClose }) {
  const timestamp = parseInt(video.id, 10);
  const addedDate = isNaN(timestamp)
    ? "—"
    : new Date(timestamp).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  const isLink = !!video.sourceUrl;
  const displayName = video.originalName.replace(/\.[^.]+$/, "");

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "400px" }}
      >
        <div style={{ padding: "24px 26px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "18px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-faint)", marginBottom: "5px" }}>
                Source info
              </div>
              <div style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {displayName}
              </div>
            </div>
            <button
              onClick={onClose}
              className="icon-btn-toggle"
              style={{ flexShrink: 0 }}
              title="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px", color: "var(--text-body)" }}>
            <InfoRow label="Date added" value={addedDate} />
            <div>
              <div className="info-row-label">Source type</div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                {isLink
                  ? <><Link2 size={13} style={{ color: "var(--primary)" }} /> Added via link</>
                  : <><Upload size={13} style={{ color: "var(--primary)" }} /> File upload</>}
              </span>
            </div>
            {isLink && (
              <div>
                <div className="info-row-label">Original link</div>
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
      </div>
    </div>,
    document.body
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div className="info-row-label">{label}</div>
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
  draggable,
  dragging,
  dropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
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

  const status = STATUS[video.status] || {
    label: video.status.charAt(0).toUpperCase() + video.status.slice(1),
    className: "status-loading",
  };
  const isSpinning = !STATUS[video.status];
  const meta = transcriptLength(video);

  return (
    <div
      onClick={() => onSelect(video.id)}
      className={[
        "video-item",
        selected ? "selected" : "",
        dragging ? "dragging" : "",
        dropTarget ? "drop-target" : "",
      ].filter(Boolean).join(" ")}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <span
        className="drag-handle"
        title={draggable ? "Drag to reorder" : "Clear the search to reorder"}
      >
        <GripVertical size={14} />
      </span>

      <div className="video-item-content">
        <div className="video-icon-box">{sourceIcon(video)}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          {isEditing ? (
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <input
                autoFocus
                className="search-input"
                style={{ background: "var(--card-bg)", borderRadius: "8px", padding: "4px 8px", fontSize: "12px" }}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmRename();
                  if (e.key === "Escape") cancelEditing();
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => { e.stopPropagation(); confirmRename(); }}
                style={{ color: "var(--success)", background: "none", border: "none", cursor: "pointer", display: "flex" }}
              >
                <Check size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); cancelEditing(); }}
                style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer", display: "flex" }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <p className="video-name" title={video.originalName}>{video.originalName}</p>
          )}
          <div className="video-status">
            <span className={`status-pill ${status.className}`}>
              {isSpinning && <Loader2 size={10} className="spin" />}
              {video.status === "completed" && <CheckCircle2 size={10} />}
              {video.status === "error" && <AlertTriangle size={10} />}
              {status.label}
            </span>
            {meta && <span className="video-meta">{meta}</span>}
          </div>
        </div>
      </div>

      <div className="video-row-actions">
        <button
          onClick={(e) => { e.stopPropagation(); setShowInfo(true); }}
          title="Source info"
        >
          <Eye size={14} />
        </button>
        {video.status === "completed" && (
          <button
            onClick={(e) => { e.stopPropagation(); if (!previewMode) onOpenFolder(video.folderPath); }}
            disabled={previewMode}
            style={previewMode ? { opacity: 0.35, cursor: "not-allowed" } : undefined}
            title={previewMode ? "Not available in preview mode" : "Open in folder"}
          >
            <Folder size={14} />
          </button>
        )}
        {!isEditing && (
          <button
            onClick={(e) => { e.stopPropagation(); if (!previewMode) startEditing(); }}
            disabled={previewMode}
            style={previewMode ? { opacity: 0.35, cursor: "not-allowed" } : undefined}
            title={previewMode ? "Not available in preview mode" : "Rename"}
          >
            <Edit2 size={14} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); if (!previewMode) onDelete(video.id); }}
          disabled={previewMode}
          style={previewMode ? { opacity: 0.35, cursor: "not-allowed" } : undefined}
          title={previewMode ? "Not available in preview mode" : "Delete"}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {showInfo && <SourceInfoModal video={video} onClose={() => setShowInfo(false)} />}
    </div>
  );
}
