import React from "react";
import { Loader2 } from "lucide-react";
import { API_BASE } from "../../constants/api";

export default function VideoPlayer({ selectedVideo, videoRef }) {
  if (selectedVideo.status === "completed") {
    return (
      <video
        ref={videoRef}
        src={`${API_BASE}${selectedVideo.outputPath}`}
        controls
        preload="auto"
        playsInline
        webkit-playsinline="true"
      />
    );
  }

  return (
    <div className="processing-overlay">
      <Loader2
        className="spin"
        style={{
          color: "var(--primary)",
          marginBottom: "16px",
        }}
        size={48}
      />
      <p
        style={{
          fontWeight: 500,
          color: "var(--text-dim)",
          textTransform: "capitalize",
        }}
      >
        {selectedVideo.status}...
      </p>
      {selectedVideo.status === "compressing" && (
        <>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{
                width: `${selectedVideo.progress || 0}%`,
              }}
            />
          </div>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-dim)",
              marginTop: "8px",
            }}
          >
            {selectedVideo.progress || 0}% Complete
          </p>
        </>
      )}
    </div>
  );
}
