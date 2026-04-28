import React from "react";
import { motion } from "framer-motion";
import { Download, PanelLeftOpen } from "lucide-react";
import VideoPlayer from "./VideoPlayer";
import TranscriptSection from "./TranscriptSection";

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
}) {
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {!sidebarVisible && (
            <button
              onClick={() => setSidebarVisible(true)}
              className="icon-btn-toggle"
              title="Show Sidebar"
            >
              <PanelLeftOpen size={20} />
            </button>
          )}
          <div>
            <h2 style={{ margin: 0, fontSize: "18px" }}>
              {selectedVideo.originalName}
            </h2>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "10px",
                color: "var(--text-dim)",
                letterSpacing: "1px",
              }}
            >
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

      <div className="content-viewport">
        <div className="video-container">
          <div className="video-player-wrapper">
            <VideoPlayer selectedVideo={selectedVideo} videoRef={videoRef} />
          </div>
        </div>

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
      </div>
    </motion.div>
  );
}
