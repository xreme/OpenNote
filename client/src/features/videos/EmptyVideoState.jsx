import React from "react";
import { Clapperboard, PanelLeftOpen } from "lucide-react";

export default function EmptyVideoState({ sidebarVisible, setSidebarVisible }) {
  return (
    <div className="empty-state">
      <div style={{ position: "absolute", top: 16, left: 16 }}>
        {!sidebarVisible && (
          <button
            onClick={() => setSidebarVisible(true)}
            className="header-icon-btn"
            title="Show sidebar"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}
      </div>
      <div className="empty-icon-box">
        <Clapperboard size={28} />
      </div>
      <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-soft)", margin: 0 }}>
        Select a video to get started
      </h2>
    </div>
  );
}
