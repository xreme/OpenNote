import React, { useState } from "react";
import { X, Download } from "lucide-react";

export default function ExportModal({ show, onClose, videos }) {
  const [selectedVideosForExport, setSelectedVideosForExport] = useState([]);
  const [exportFilename, setExportFilename] = useState(
    "combined_transcript.txt",
  );

  const toggleVideoExportSelection = (id) => {
    setSelectedVideosForExport((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  const exportCombinedTranscripts = () => {
    if (!selectedVideosForExport.length) return;

    const videosToExport = videos.filter((v) =>
      selectedVideosForExport.includes(v.id),
    );

    let combinedText = "";
    videosToExport.forEach((video) => {
      combinedText += `--- Transcript for: ${video.originalName} ---\n\n`;
      const textFragments = video.transcript
        ? video.transcript.map((s) => s.speech).join(" ")
        : "No transcript available.";
      combinedText += textFragments;
      combinedText += `\n\n`;
    });

    const blob = new Blob([combinedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    let finalFilename = exportFilename.trim() || "combined_transcript";
    if (!finalFilename.endsWith(".txt")) finalFilename += ".txt";
    a.download = finalFilename;
    a.click();
    URL.revokeObjectURL(url);

    onClose();
    setSelectedVideosForExport([]);
    setExportFilename("combined_transcript.txt");
  };

  if (!show) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Export Transcripts</h3>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "14px", fontWeight: 500 }}>Export Filename</label>
            <input
              type="text"
              value={exportFilename}
              onChange={(e) => setExportFilename(e.target.value)}
              placeholder="combined_transcript.txt"
              className="search-input"
              style={{ width: "100%", padding: "8px", marginTop: "8px", boxSizing: "border-box" }}
            />
          </div>
          <p style={{ marginBottom: "16px", color: "var(--text-dim)", fontSize: "14px" }}>
            Select transcripts to include in the export:
          </p>
          <div className="video-selection-list">
            {videos
              .filter((v) => v.status === "completed")
              .map((v) => (
                <label key={v.id} className="video-checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedVideosForExport.includes(v.id)}
                    onChange={() => toggleVideoExportSelection(v.id)}
                  />
                  <span>{v.originalName}</span>
                </label>
              ))}
            {videos.filter((v) => v.status === "completed").length === 0 && (
              <p style={{ color: "var(--text-dim)", fontStyle: "italic", fontSize: "14px" }}>No completed transcripts available to export.</p>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button
            onClick={exportCombinedTranscripts}
            className="save-btn"
            disabled={!selectedVideosForExport.length}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>
    </div>
  );
}
