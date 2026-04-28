import React, { useState } from "react";
import { X, Loader2, Sparkles } from "lucide-react";

export default function GenerateModal({
  show,
  onClose,
  videos,
  generating,
  onGenerate,
}) {
  const [selectedVideosForGen, setSelectedVideosForGen] = useState([]);

  const toggleVideoSelection = (id) => {
    setSelectedVideosForGen((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  if (!show) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Generate Notes</h3>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: "16px", color: "var(--text-dim)" }}>
            Select transcripts to include in the summary:
          </p>
          <div className="video-selection-list">
            {videos
              .filter((v) => v.status === "completed")
              .map((v) => (
                <label key={v.id} className="video-checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedVideosForGen.includes(v.id)}
                    onChange={() => toggleVideoSelection(v.id)}
                  />
                  <span>{v.originalName}</span>
                </label>
              ))}
          </div>
        </div>
        <div className="modal-footer">
          <button
            onClick={() => onGenerate(selectedVideosForGen)}
            className="save-btn"
            disabled={!selectedVideosForGen.length || generating}
          >
            {generating ? (
              <Loader2 className="spin" size={16} />
            ) : (
              <Sparkles size={16} />
            )}
            {generating ? " Generating..." : " Generate Summary"}
          </button>
        </div>
      </div>
    </div>
  );
}
