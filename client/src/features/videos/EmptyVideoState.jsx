import React from "react";
import { Upload, PanelLeftOpen } from "lucide-react";

export default function EmptyVideoState({ sidebarVisible, setSidebarVisible }) {
  return (
    <div className="empty-state">
      <div style={{ position: "absolute", top: 16, left: 16 }}>
        {!sidebarVisible && (
          <button
            onClick={() => setSidebarVisible(true)}
            className="icon-btn-toggle"
            title="Show Sidebar"
          >
            <PanelLeftOpen size={20} />
          </button>
        )}
      </div>
      <div className="empty-icon-box">
        <Upload size={32} />
      </div>
      <h2 style={{ fontSize: "24px", marginBottom: "8px" }}>
        Select a video to view
      </h2>
      <p style={{ color: "var(--text-dim)", maxWidth: "300px" }}>
        Upload one or multiple videos from the sidebar to start the
        transcription process.
      </p>
    </div>
  );
}
