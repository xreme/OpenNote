import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, PanelLeftOpen, Sparkles, ChevronUp, ChevronDown } from "lucide-react";
import VideoPlayer from "./VideoPlayer";
import TranscriptSection from "./TranscriptSection";
import SummaryPanel from "./SummaryPanel";

const toCleanName = (originalName) =>
  originalName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9.]/gi, "_");

export default function VideoView({
  selectedVideo,
  videoRef,
  sidebarVisible,
  setSidebarVisible,
  transcriptExpanded,
  setTranscriptExpanded,
  showLocalSearch,
  setShowLocalSearch,
  localSearchQuery,
  setLocalSearchQuery,
  seekTo,
  syncTranscriptToVideo,
  onExportTxt,
  notes,
  generating,
  onGenerateSummary,
  previewMode,
}) {
  const [activeTab, setActiveTab] = useState("transcript");
  const [bottomExpanded, setBottomExpanded] = useState(false);
  const [summaryContent, setSummaryContent] = useState(null);

  useEffect(() => {
    setSummaryContent(null);
    if (!notes || !selectedVideo) return;
    const cleanName = toCleanName(selectedVideo.originalName);
    const match = notes.find((n) => n.filename.startsWith(cleanName));
    if (match) setSummaryContent(match.content);
  }, [selectedVideo?.id, notes]);

  const handleGenerate = () => {
    onGenerateSummary(selectedVideo.id, (content) => {
      setSummaryContent(content);
    });
  };

  return (
    <motion.div
      key={selectedVideo.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div className="content-header">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {!sidebarVisible && (
            <button
              onClick={() => setSidebarVisible(true)}
              className="icon-btn-toggle"
              title="Show Sidebar"
            >
              <PanelLeftOpen size={20} />
            </button>
          )}
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: "18px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "480px" }}
                title={selectedVideo.originalName}>
              {selectedVideo.originalName}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "1px" }}>
              ID: {selectedVideo.id}
            </p>
          </div>
        </div>

        {selectedVideo.status === "completed" && (
          <button className="export-btn" onClick={onExportTxt}>
            <Download size={16} /> Export TXT
          </button>
        )}
      </div>

      <div className="content-viewport" style={{ flex: 1, overflow: "hidden" }}>
        <div
          className="video-container"
          style={{
            maxHeight: bottomExpanded ? 0 : "800px",
            marginBottom: bottomExpanded ? 0 : "24px",
            overflow: "hidden",
            transition: "max-height 0.3s ease, margin-bottom 0.3s ease",
          }}
        >
          <div className="video-player-wrapper">
            <VideoPlayer selectedVideo={selectedVideo} videoRef={videoRef} />
          </div>
        </div>

        <div className="video-tab-bar">
          <button
            className={`video-tab ${activeTab === "transcript" ? "active" : ""}`}
            onClick={() => setActiveTab("transcript")}
          >
            Transcription
          </button>
          <button
            className={`video-tab ${activeTab === "summary" ? "active" : ""}`}
            onClick={() => setActiveTab("summary")}
          >
            <Sparkles size={13} /> Summary
          </button>
          <button
            className="video-tab"
            style={{ marginLeft: "auto" }}
            onClick={() => setBottomExpanded((v) => !v)}
            title={bottomExpanded ? "Show video" : "Expand panel"}
          >
            {bottomExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>

        {activeTab === "transcript" ? (
          <TranscriptSection
            selectedVideo={selectedVideo}
            transcriptExpanded={transcriptExpanded}
            setTranscriptExpanded={setTranscriptExpanded}
            showLocalSearch={showLocalSearch}
            setShowLocalSearch={setShowLocalSearch}
            localSearchQuery={localSearchQuery}
            setLocalSearchQuery={setLocalSearchQuery}
            seekTo={seekTo}
            syncTranscriptToVideo={syncTranscriptToVideo}
          />
        ) : (
          <SummaryPanel
            video={selectedVideo}
            summaryContent={summaryContent}
            generating={generating}
            onGenerate={handleGenerate}
            previewMode={previewMode}
          />
        )}
      </div>
    </motion.div>
  );
}
