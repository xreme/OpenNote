import React, { useState, useEffect, useMemo } from "react";
import {
  PanelLeftOpen,
  Sparkles,
  ChevronUp,
  ChevronDown,
  HardDriveDownload,
  List,
  Maximize2,
  Minimize2,
  MessageSquare,
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

const STATUS = {
  completed: { label: "Ready", className: "status-done" },
  error: { label: "Error", className: "status-error" },
};

const statusOf = (video) =>
  STATUS[video.status] || {
    label: video.status.charAt(0).toUpperCase() + video.status.slice(1),
    className: "status-loading",
  };

export default function VideoView({
  selectedVideo,
  videoRef,
  sidebarVisible,
  setSidebarVisible,
  showLocalSearch,
  setShowLocalSearch,
  localSearchQuery,
  setLocalSearchQuery,
  seekTo,
  syncTranscriptToVideo,
  onExportTxt,
  showChatPanel,
  setShowChatPanel,
  focusMode,
  onToggleFocus,
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
  const status = statusOf(selectedVideo);

  const renderPanelBody = () => {
    if (activeTab === "new") {
      return (
        <div className="summary-state-center">
          <div className="summary-empty-icon">
            <Sparkles size={24} />
          </div>
          <p style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 6px" }}>I want to make…</p>
          <p style={{ fontSize: "13px", color: "var(--text-dimmer)", margin: "0 0 20px", textAlign: "center", lineHeight: 1.6 }}>
            {previewMode
              ? "Artifact generation is not available in preview mode."
              : "Generate an artifact from this transcript."}
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div className="content-header">
        {!sidebarVisible && (
          <button
            onClick={() => setSidebarVisible(true)}
            className="header-icon-btn"
            title="Show sidebar"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 className="content-title" title={selectedVideo.originalName}>
              {selectedVideo.originalName}
            </h2>
            <span className={`status-pill ${status.className}`}>{status.label}</span>
          </div>
          <p className="content-subtitle">ID: {selectedVideo.id}</p>
        </div>

        {selectedVideo.status === "completed" && selectedVideo.sourceUrl && !selectedVideo.outputPath && (
          <button
            className="export-btn"
            onClick={() => downloadVideoLocally(selectedVideo.id).catch(() => alert("Failed to start download"))}
            title="Download video locally using yt-dlp"
          >
            <HardDriveDownload size={15} /> Download video
          </button>
        )}

        {!showChatPanel && (
          <button
            className="header-icon-btn"
            onClick={() => setShowChatPanel?.((prev) => !prev)}
            title="Show chat"
          >
            <MessageSquare size={15} />
          </button>
        )}

        <button
          className={`header-icon-btn ${focusMode ? "active" : ""}`}
          onClick={onToggleFocus}
          title={focusMode ? "Exit focus mode" : "Focus mode"}
        >
          {focusMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
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
            <List size={14} /> Transcript
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
                <Icon size={14} /> {art.label}
              </button>
            );
          })}

          {!previewMode && (
            <button
              className={`video-tab video-tab-add ${activeTab === "new" ? "active" : ""}`}
              onClick={() => setActiveTab("new")}
              title="New artifact"
            >
              <Plus size={15} />
            </button>
          )}

          <button
            className="video-tab video-tab-expand"
            onClick={() => setBottomExpanded((v) => !v)}
            title={bottomExpanded ? "Show video" : "Focus artifacts"}
          >
            {bottomExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>

        {activeTab === "transcript" ? (
          <TranscriptSection
            selectedVideo={selectedVideo}
            videoRef={videoRef}
            showLocalSearch={showLocalSearch}
            setShowLocalSearch={setShowLocalSearch}
            localSearchQuery={localSearchQuery}
            setLocalSearchQuery={setLocalSearchQuery}
            seekTo={seekTo}
            syncTranscriptToVideo={syncTranscriptToVideo}
            onExportTxt={onExportTxt}
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
    </div>
  );
}
