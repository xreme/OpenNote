import React from "react";
import {
  Clock,
  Search,
  Maximize2,
  Minimize2,
  X,
  Locate,
} from "lucide-react";

export default function TranscriptSection({
  selectedVideo,
  transcriptExpanded,
  setTranscriptExpanded,
  showLocalSearch,
  setShowLocalSearch,
  localSearchQuery,
  setLocalSearchQuery,
  seekTo,
  syncTranscriptToVideo,
}) {
  return (
    <div className="transcript-section">
      <div className="transcript-header">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "20px" }}>Transcription</h3>
          <button
            onClick={() => syncTranscriptToVideo(selectedVideo.transcript)}
            className="icon-btn-toggle"
            title="Sync to Video Time"
          >
            <Locate size={18} />
          </button>
          <button
            onClick={() => {
              setShowLocalSearch(!showLocalSearch);
              if (showLocalSearch) setLocalSearchQuery("");
            }}
            className="icon-btn-toggle"
            title="Search in Video"
          >
            <Search size={18} />
          </button>
          <button
            onClick={() => setTranscriptExpanded(!transcriptExpanded)}
            className="icon-btn-toggle"
            title={transcriptExpanded ? "Minimize" : "Expand"}
          >
            {transcriptExpanded ? (
              <Minimize2 size={18} />
            ) : (
              <Maximize2 size={18} />
            )}
          </button>
        </div>
        <div className="badge">
          <Clock size={12} /> Auto-generated
        </div>
      </div>

      {showLocalSearch && (
        <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--card-border)", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <Search size={14} style={{ color: "var(--text-dim)" }} />
          <input
            autoFocus
            type="text"
            placeholder="Search in this video..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="search-input"
            style={{ flex: 1, padding: "4px 8px", fontSize: "14px" }}
          />
          <button onClick={() => { setShowLocalSearch(false); setLocalSearchQuery(""); }} className="icon-btn-toggle">
            <X size={14} />
          </button>
        </div>
      )}

      <div
        className={`transcript-scrollbox ${transcriptExpanded ? "expanded" : ""}`}
      >
        {selectedVideo.status === "completed" && selectedVideo.transcript ? (
          selectedVideo.transcript.map((segment, idx) => {
            if (
              localSearchQuery &&
              !segment.speech
                .toLowerCase()
                .includes(localSearchQuery.toLowerCase())
            ) {
              return null;
            }
            return (
              <div
                key={idx}
                id={`transcript-row-${idx}`}
                className="transcript-row"
              >
                <button
                  onClick={() => seekTo(segment.start)}
                  className="timestamp"
                >
                  [
                  {new Date(segment.start * 1000)
                    .toISOString()
                    .substring(14, 19)}
                  ]
                </button>
                <p className="transcript-text">{segment.speech}</p>
              </div>
            );
          })
        ) : selectedVideo.status === "completed" ? (
          <div
            style={{
              padding: "32px",
              textAlign: "center",
              border: "1px dashed var(--card-border)",
              borderRadius: "16px",
            }}
          >
            <p style={{ color: "var(--text-dim)" }}>
              Transcript data not available yet.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: "60px",
                  backgroundColor: "var(--card-border)",
                  opacity: 0.5,
                  borderRadius: "12px",
                  animation: "pulse 2s infinite",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
