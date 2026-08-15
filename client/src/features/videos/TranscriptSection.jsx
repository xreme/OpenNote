import React, { useEffect, useState } from "react";
import {
  Search,
  X,
  Locate,
  FileDown,
  Loader2,
  AlertTriangle,
} from "lucide-react";

const getYouTubeTimestampUrl = (sourceUrl, startSeconds) => {
  const m = sourceUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (!m) return null;
  return `https://www.youtube.com/watch?v=${m[1]}&t=${Math.floor(startSeconds)}s`;
};

const formatTs = (seconds) =>
  new Date(seconds * 1000).toISOString().substring(14, 19);

// Placeholder rows shown while Whisper is still working.
function TranscriptSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {[97, 92, 98, 90, 85].map((wide, i) => (
        <div key={i} style={{ display: "flex", gap: "14px", padding: "11px 14px" }}>
          <div className="skeleton-bar" style={{ width: "42px", flexShrink: 0, marginTop: "3px", animationDelay: `${i * 0.12}s` }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "7px" }}>
            <div className="skeleton-bar" style={{ width: `${wide}%`, animationDelay: `${i * 0.12}s` }} />
            <div className="skeleton-bar" style={{ width: `${wide - 30}%`, animationDelay: `${i * 0.12}s` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TranscriptSection({
  selectedVideo,
  videoRef,
  showLocalSearch,
  setShowLocalSearch,
  localSearchQuery,
  setLocalSearchQuery,
  seekTo,
  syncTranscriptToVideo,
  onExportTxt,
}) {
  const isExternal = selectedVideo.sourceUrl && !selectedVideo.outputPath;
  const isReady = selectedVideo.status === "completed";
  const isError = selectedVideo.status === "error";
  const [activeIndex, setActiveIndex] = useState(-1);

  // Track playback so the segment currently being spoken reads as the live one.
  useEffect(() => {
    const el = videoRef?.current;
    const segments = selectedVideo.transcript;
    if (!el || !segments?.length) return;

    const onTimeUpdate = () => {
      const t = el.currentTime;
      let idx = -1;
      for (let i = 0; i < segments.length; i++) {
        if (segments[i].start <= t) idx = i;
        else break;
      }
      setActiveIndex((prev) => (prev === idx ? prev : idx));
    };

    el.addEventListener("timeupdate", onTimeUpdate);
    return () => el.removeEventListener("timeupdate", onTimeUpdate);
  }, [videoRef, selectedVideo.id, selectedVideo.transcript]);

  return (
    <div className="transcript-section">
      <div className="transcript-header">
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <h3>Transcript</h3>
          {!isExternal && (
            <button
              onClick={() => syncTranscriptToVideo(selectedVideo.transcript)}
              className="icon-btn-toggle"
              title="Sync to video time"
            >
              <Locate size={16} />
            </button>
          )}
          <button
            onClick={() => {
              setShowLocalSearch(!showLocalSearch);
              if (showLocalSearch) setLocalSearchQuery("");
            }}
            className="icon-btn-toggle"
            title="Search in video"
          >
            <Search size={16} />
          </button>
        </div>

        {isReady && onExportTxt && (
          <button className="export-btn" onClick={onExportTxt} title="Download this transcript as .txt">
            <FileDown size={14} /> Download .txt
          </button>
        )}
        {!isReady && !isError && (
          <span className="badge" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
            <Loader2 size={13} className="spin" /> {selectedVideo.status}…
          </span>
        )}
      </div>

      {showLocalSearch && (
        <div className="transcript-search">
          <Search size={14} className="search-icon" />
          <input
            autoFocus
            type="text"
            placeholder="Search in this video…"
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="search-input"
          />
          <button
            onClick={() => { setShowLocalSearch(false); setLocalSearchQuery(""); }}
            className="icon-btn-toggle"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="transcript-scrollbox">
        {isReady && selectedVideo.transcript ? (
          selectedVideo.transcript.map((segment, idx) => {
            if (
              localSearchQuery &&
              !segment.speech.toLowerCase().includes(localSearchQuery.toLowerCase())
            ) {
              return null;
            }
            return (
              <div
                key={idx}
                id={`transcript-row-${idx}`}
                className={`transcript-row ${idx === activeIndex ? "active" : ""}`}
              >
                {isExternal ? (() => {
                  const ytUrl = getYouTubeTimestampUrl(selectedVideo.sourceUrl, segment.start);
                  return ytUrl ? (
                    <a href={ytUrl} target="_blank" rel="noopener noreferrer" className="timestamp">
                      {formatTs(segment.start)}
                    </a>
                  ) : (
                    <span className="timestamp">{formatTs(segment.start)}</span>
                  );
                })() : (
                  <button onClick={() => seekTo(segment.start)} className="timestamp">
                    {formatTs(segment.start)}
                  </button>
                )}
                <p className="transcript-text">{segment.speech}</p>
              </div>
            );
          })
        ) : isError ? (
          <div className="transcript-error">
            <div className="transcript-error-icon">
              <AlertTriangle size={26} />
            </div>
            <div className="transcript-error-title">Transcription failed</div>
            <p className="transcript-error-copy">
              Something went wrong while processing this source. Try adding it again, or remove it
              from the collection.
            </p>
          </div>
        ) : isReady ? (
          <div className="transcript-placeholder">
            <p style={{ color: "var(--text-dim)", margin: 0 }}>Transcript data not available yet.</p>
          </div>
        ) : (
          <>
            <div className="transcript-notice">
              <Loader2 size={16} className="spin" style={{ flexShrink: 0 }} />
              <span>
                Transcribing locally with Whisper — timestamped segments will appear here as soon as
                it finishes.
              </span>
            </div>
            <TranscriptSkeleton />
          </>
        )}
      </div>
    </div>
  );
}
