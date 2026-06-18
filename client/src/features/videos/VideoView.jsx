import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Download,
  PanelLeftOpen,
  Sparkles,
  ChevronUp,
  ChevronDown,
  HardDriveDownload,
  Plus,
  FileText,
  Layers,
  ListChecks,
  Pencil,
} from "lucide-react";
import { downloadVideoLocally } from "../../services/videoService";
import { ARTIFACT_BADGE } from "../../constants/artifacts";
import VideoPlayer from "./VideoPlayer";
import TranscriptSection from "./TranscriptSection";
import ArtifactContent from "../artifacts/ArtifactContent";
import ArtifactGenerator from "../artifacts/ArtifactGenerator";
import EditableNote from "../artifacts/EditableNote";

const toCleanName = (originalName) =>
  originalName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9.]/gi, "_");

const TYPE_ICON = {
  summary: Sparkles,
  notes: FileText,
  note: Pencil,
  flashcards: Layers,
  quizzes: ListChecks,
  custom: Sparkles,
};

const isPortraitSource = (video) => {
  if (!video.sourceUrl || video.outputPath) return false;
  return /tiktok\.com|instagram\.com/i.test(video.sourceUrl);
};

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
  onCreateNote,
  onSaveNote,
  previewMode,
}) {
  const [activeTab, setActiveTab] = useState("transcript");
  const [bottomExpanded, setBottomExpanded] = useState(false);

  // All artifacts generated for this video, oldest first, with distinct labels.
  const artifacts = useMemo(() => {
    if (!notes || !selectedVideo) return [];
    const cleanName = toCleanName(selectedVideo.originalName);
    const matches = notes
      .filter((n) => n.filename.startsWith(cleanName))
      .slice()
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const totals = {};
    matches.forEach((m) => {
      const base = ARTIFACT_BADGE[m.type] || "Artifact";
      totals[base] = (totals[base] || 0) + 1;
    });

    const seen = {};
    return matches.map((m) => {
      const base = ARTIFACT_BADGE[m.type] || "Artifact";
      seen[base] = (seen[base] || 0) + 1;
      const label = totals[base] > 1 ? `${base} ${seen[base]}` : base;
      return { ...m, label };
    });
  }, [notes, selectedVideo?.id]);

  // Reset to the transcript tab whenever the selected video changes.
  useEffect(() => {
    setActiveTab("transcript");
  }, [selectedVideo?.id]);

  const handleGenerate = (artifactType, customPrompt) => {
    // A blank note is created locally (no AI); everything else is AI-generated.
    if (artifactType === "note") {
      onCreateNote(selectedVideo.id, (data) => {
        if (data?.filename) setActiveTab(data.filename);
      });
      return;
    }
    onGenerateSummary(
      selectedVideo.id,
      (data) => {
        // Jump to the freshly created artifact's tab once notes refresh.
        if (data?.filename) setActiveTab(data.filename);
      },
      artifactType,
      customPrompt,
    );
  };

  const activeArtifact = artifacts.find((a) => a.filename === activeTab);

  const renderPanelBody = () => {
    if (activeTab === "new") {
      return (
        <div className="summary-state-center">
          <div className="summary-empty-icon">
            <Sparkles size={24} />
          </div>
          <p style={{ fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>Create a new artifact</p>
          <p style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "24px", textAlign: "center", lineHeight: 1.6 }}>
            {previewMode
              ? "Artifact generation is not available in preview mode."
              : "Generate an AI artifact from this video's transcript."}
          </p>
          {!previewMode && selectedVideo.status === "completed" && (
            <ArtifactGenerator
              generating={generating}
              onGenerate={handleGenerate}
              buttonLabel="Generate"
              className="centered"
              includeBlankNote
              buttonStyle={{ width: "100%", maxWidth: "280px" }}
            />
          )}
          {!previewMode && selectedVideo.status !== "completed" && (
            <p style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "10px", textAlign: "center" }}>
              Video must finish processing first.
            </p>
          )}
        </div>
      );
    }

    if (activeArtifact) {
      if (activeArtifact.type === "note") {
        return (
          <EditableNote
            key={activeArtifact.filename}
            note={activeArtifact}
            onSave={onSaveNote}
            readOnly={previewMode}
          />
        );
      }
      return <ArtifactContent content={activeArtifact.content} type={activeArtifact.type} />;
    }

    // activeTab points at a filename that hasn't loaded yet (e.g. just generated).
    return (
      <div className="summary-state-center">
        <p style={{ color: "var(--text-dim)", fontSize: "13px" }}>Loading…</p>
      </div>
    );
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

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {selectedVideo.status === "completed" && selectedVideo.sourceUrl && !selectedVideo.outputPath && (
            <button
              className="export-btn"
              onClick={() => downloadVideoLocally(selectedVideo.id).catch(() => alert("Failed to start download"))}
              title="Download video locally using yt-dlp"
            >
              <HardDriveDownload size={16} /> Download Video
            </button>
          )}
          {selectedVideo.status === "completed" && (
            <button className="export-btn" onClick={onExportTxt}>
              <Download size={16} /> Export TXT
            </button>
          )}
        </div>
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
          <div className={`video-player-wrapper ${isPortraitSource(selectedVideo) ? "portrait" : ""}`}>
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

          {artifacts.map((art) => {
            const Icon = TYPE_ICON[art.type] || Sparkles;
            return (
              <button
                key={art.filename}
                className={`video-tab ${activeTab === art.filename ? "active" : ""}`}
                onClick={() => setActiveTab(art.filename)}
                title={art.label}
              >
                <Icon size={13} /> {art.label}
              </button>
            );
          })}

          {!previewMode && (
            <button
              className={`video-tab video-tab-add ${activeTab === "new" ? "active" : ""}`}
              onClick={() => setActiveTab("new")}
              title="New artifact"
            >
              <Plus size={14} />
            </button>
          )}

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
          <div className="summary-panel">
            <div className="summary-panel-body">
              {generating && activeTab === "new" ? (
                <div className="summary-state-center">
                  <Sparkles size={24} style={{ color: "var(--primary)", marginBottom: "12px" }} className="spin" />
                  <p style={{ color: "var(--text-dim)", fontSize: "13px" }}>Generating…</p>
                </div>
              ) : (
                renderPanelBody()
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
