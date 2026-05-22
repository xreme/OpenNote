import React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function SummaryPanel({ video, summaryContent, generating, onGenerate, previewMode }) {
  return (
    <div className="summary-panel">
      <div className="summary-panel-body">
        {generating ? (
          <div className="summary-state-center">
            <Loader2 size={32} className="spin" style={{ color: "var(--primary)", marginBottom: "12px" }} />
            <p style={{ color: "var(--text-dim)", fontSize: "13px" }}>Generating summary...</p>
          </div>
        ) : summaryContent ? (
          <div className="summary-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryContent}</ReactMarkdown>
          </div>
        ) : (
          <div className="summary-state-center">
            <div className="summary-empty-icon">
              <Sparkles size={24} />
            </div>
            <p style={{ fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>No summary yet</p>
            <>
              <p style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "24px", textAlign: "center", lineHeight: 1.6 }}>
                {previewMode
                  ? "Summary generation is not available in preview mode."
                  : "Generate an AI summary of this video's transcript."}
              </p>
              <button
                className="save-btn"
                onClick={() => !previewMode && onGenerate()}
                disabled={previewMode || video.status !== "completed"}
                style={{
                  width: "100%",
                  maxWidth: "280px",
                  opacity: previewMode ? 0.4 : 1,
                  cursor: previewMode ? "not-allowed" : undefined,
                }}
                title={previewMode ? "Not available in preview mode" : undefined}
              >
                <Sparkles size={15} /> Generate Summary
              </button>
              {!previewMode && video.status !== "completed" && (
                <p style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "10px", textAlign: "center" }}>
                  Video must finish processing first.
                </p>
              )}
            </>
          </div>
        )}
      </div>
    </div>
  );
}
