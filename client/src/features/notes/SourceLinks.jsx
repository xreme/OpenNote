import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Clapperboard, ArrowUpRight } from "lucide-react";
import { relatedVideosForNote, hasTruncatedSources } from "../../utils/videoNames";

// Which sources a note was generated from, and a way to jump to them.
export default function SourceLinks({ note, videos, onSelectVideo }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const related = relatedVideosForNote(note, videos);
  const truncated = hasTruncatedSources(note);

  useEffect(() => setOpen(false), [note?.filename]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!related.length) {
    return (
      <span className="source-links-empty">
        <Clapperboard size={13} /> No linked source
      </span>
    );
  }

  const label =
    related.length === 1
      ? related[0].originalName.replace(/\.[^.]+$/, "")
      : `${related.length} sources`;

  return (
    <div className="source-links" ref={ref}>
      <button
        className={`source-links-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        title="Sources this note was generated from"
      >
        <Clapperboard size={13} />
        <span className="source-links-label">{label}</span>
        <ChevronDown size={13} className="source-links-chevron" />
      </button>

      {open && (
        <div className="source-links-menu" role="menu">
          <div className="source-links-heading">Generated from</div>
          {related.map((video) => (
            <button
              key={video.id}
              className="source-links-item"
              onClick={() => { onSelectVideo(video.id); setOpen(false); }}
              role="menuitem"
            >
              <span className="source-links-item-name">
                {video.originalName.replace(/\.[^.]+$/, "")}
              </span>
              <ArrowUpRight size={13} />
            </button>
          ))}
          {truncated && (
            <div className="source-links-note">
              Additional sources were not recorded for this note.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
