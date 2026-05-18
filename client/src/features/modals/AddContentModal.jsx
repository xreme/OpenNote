import React, { useState, useRef } from "react";
import { X, Link, Upload, Plus, Loader2 } from "lucide-react";

export default function AddContentModal({
  show,
  onClose,
  onUpload,
  onUrlUpload,
  collectionId,
}) {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  if (!show) return null;

  const handleClose = () => {
    setUrl("");
    onClose();
  };

  const handleFileChange = (e) => {
    onUpload(e);
    handleClose();
  };

  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onUrlUpload(url.trim());
      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 440 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Add Content</h3>
          <button onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        <div
          className="modal-body"
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          <form
            onSubmit={handleLinkSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "8px" }}
          >
            <div className="add-section-label">
              <Link size={14} /> Paste a Link
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="add-url-input"
              />
              <button type="submit" className="save-btn" disabled={!url.trim() || submitting}>
                {submitting ? <Loader2 size={15} className="spin" /> : <Plus size={15} />}
                {submitting ? "Adding..." : "Add"}
              </button>
            </div>
          </form>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div className="add-section-label">
              <Upload size={14} /> Upload a File
            </div>
            <button
              className="add-choice-card"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={18} />
              <span>Choose a video from your device</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="video/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
