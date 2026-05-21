import React from "react";
import { Loader2, ExternalLink } from "lucide-react";
import { API_BASE } from "../../constants/api";

const getEmbedUrl = (sourceUrl) => {
  const ytMatch = sourceUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  const vimeoMatch = sourceUrl.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return null;
};

export default function VideoPlayer({ selectedVideo, videoRef }) {
  if (selectedVideo.status !== "completed") {
    return (
      <div className="processing-overlay">
        <Loader2
          className="spin"
          style={{ color: "var(--primary)", marginBottom: "16px" }}
          size={48}
        />
        <p style={{ fontWeight: 500, color: "var(--text-dim)", textTransform: "capitalize" }}>
          {selectedVideo.status}...
        </p>
        {selectedVideo.status === "compressing" && (
          <>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${selectedVideo.progress || 0}%` }}
              />
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "8px" }}>
              {selectedVideo.progress || 0}% Complete
            </p>
          </>
        )}
      </div>
    );
  }

  if (selectedVideo.sourceUrl && !selectedVideo.outputPath) {
    const embedUrl = getEmbedUrl(selectedVideo.sourceUrl);
    if (embedUrl) {
      return (
        <iframe
          src={embedUrl}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ width: "100%", height: "100%", border: "none", borderRadius: "12px" }}
          title={selectedVideo.originalName}
        />
      );
    }
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <p style={{ color: "var(--text-dim)", fontSize: "14px" }}>
          Embedded playback not available
        </p>
        <a
          href={selectedVideo.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="export-btn"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <ExternalLink size={16} /> Open Video
        </a>
      </div>
    );
  }

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
