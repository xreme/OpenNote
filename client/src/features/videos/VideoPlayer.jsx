import React, { useEffect, useState } from "react";
import { Loader2, ExternalLink } from "lucide-react";
import { API_BASE } from "../../constants/api";

const getEmbedInfo = (sourceUrl) => {
  const ytMatch = sourceUrl.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/,
  );
  if (ytMatch) return { url: `https://www.youtube.com/embed/${ytMatch[1]}` };

  const vimeoMatch = sourceUrl.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { url: `https://player.vimeo.com/video/${vimeoMatch[1]}` };

  if (/tiktok\.com/i.test(sourceUrl)) return { url: sourceUrl, type: "tiktok" };

  const igMatch = sourceUrl.match(/instagram\.com\/(reel|p)\/([A-Za-z0-9_-]+)/);
  if (igMatch) return { url: `https://www.instagram.com/${igMatch[1]}/${igMatch[2]}/embed/`, type: "instagram" };

  return null;
};

function TikTokPreview({ sourceUrl }) {
  const [meta, setMeta] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(sourceUrl)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.thumbnail_url) {
          setMeta({ thumbnail: data.thumbnail_url, title: data.title, author: data.author_name });
        }
        if (!cancelled) setLoaded(true);
      })
      .catch(() => !cancelled && setLoaded(true));
    return () => { cancelled = true; };
  }, [sourceUrl]);

  if (!loaded) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <Loader2 className="spin" style={{ color: "var(--primary)" }} size={32} />
      </div>
    );
  }

  return (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: "block", position: "relative", width: "100%", height: "100%" }}
    >
      {meta?.thumbnail ? (
        <>
          <img
            src={meta.thumbnail}
            alt={meta.title || ""}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "12px",
              background: "linear-gradient(transparent 60%, rgba(0,0,0,0.6))",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 0, height: 0, borderTop: "12px solid transparent", borderBottom: "12px solid transparent", borderLeft: "20px solid #000", marginLeft: "4px" }} />
            </div>
          </div>
          <div style={{ position: "absolute", bottom: "12px", left: 0, right: 0, textAlign: "center" }}>
            {meta.author && (
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "13px", margin: "0 0 4px" }}>
                @{meta.author}
              </p>
            )}
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px", margin: 0 }}>
              Watch on TikTok
            </p>
          </div>
        </>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: "12px" }}>
          <ExternalLink size={24} style={{ color: "var(--text-dim)" }} />
          <p style={{ color: "var(--text-dim)", fontSize: "14px", margin: 0 }}>Watch on TikTok</p>
        </div>
      )}
    </a>
  );
}

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
    const embedInfo = getEmbedInfo(selectedVideo.sourceUrl);
    if (embedInfo?.type === "tiktok") {
      return <TikTokPreview sourceUrl={selectedVideo.sourceUrl} />;
    }
    if (embedInfo) {
      return (
        <iframe
          src={embedInfo.url}
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
