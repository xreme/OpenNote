import React, { useState } from "react";
import { Eye, X, Check, MessageSquare, Search, FileText, FileVideo, XCircle, Smartphone } from "lucide-react";

const DISMISSED_KEY = "preview_banner_dismissed";

export default function PreviewBanner() {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISSED_KEY) === "true"
  );
  const mobilePaths = ['/mobile', '/library', '/chat', '/search'];
  const isSmallScreen = window.innerWidth < 900 && !mobilePaths.includes(window.location.pathname);

  if (dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={handleDismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card-bg)",
          border: "var(--border-width) solid var(--card-border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow)",
          padding: "28px 32px",
          width: "100%",
          maxWidth: "420px",
          fontFamily: "inherit",
          color: "var(--text-main)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <Eye size={20} style={{ color: "var(--primary)" }} />
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>
            Preview Mode
          </h2>
          <button
            onClick={handleDismiss}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-dim)",
              padding: "4px",
              display: "flex",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ margin: "0 0 20px", fontSize: "13px", color: "var(--text-dim)", lineHeight: 1.6 }}>
          You're viewing a read-only preview of this OpenNote instance.
        </p>

        {/* What you can do */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{
            fontSize: "11px", fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.08em", color: "var(--text-dim)", marginBottom: "10px",
          }}>
            Available
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <FeatureRow icon={<FileVideo size={14} />} text="Watch videos and view transcripts" />
            <FeatureRow icon={<FileText size={14} />} text="Read saved notes and summaries" />
            <FeatureRow icon={<Search size={14} />} text="Search across all content" />
            <FeatureRow icon={<MessageSquare size={14} />} text="Chat with transcripts (limited)" />
          </div>
        </div>

        {/* What you can't do */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{
            fontSize: "11px", fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.08em", color: "var(--text-dim)", marginBottom: "10px",
          }}>
            Not available
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <FeatureRow icon={<XCircle size={14} />} text="Upload videos or add links" disabled />
            <FeatureRow icon={<XCircle size={14} />} text="Generate new notes or summaries" disabled />
            <FeatureRow icon={<XCircle size={14} />} text="Edit, delete, or rename content" disabled />
            <FeatureRow icon={<XCircle size={14} />} text="Change settings or manage collections" disabled />
          </div>
        </div>

        {isSmallScreen && (
          <a
            href="/mobile"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "12px",
              marginBottom: "8px",
              background: "var(--accent)",
              border: "var(--border-width) solid var(--border-color)",
              boxShadow: "var(--shadow-sm)",
              borderRadius: "var(--radius-sm)",
              color: "#fff",
              fontFamily: "inherit",
              fontSize: "14px",
              fontWeight: 700,
              textDecoration: "none",
              boxSizing: "border-box",
            }}
          >
            <Smartphone size={16} /> Go to mobile site
          </a>
        )}
        <button
          onClick={handleDismiss}
          style={{
            width: "100%",
            padding: "12px",
            background: "var(--primary)",
            border: "var(--border-width) solid var(--border-color)",
            boxShadow: "var(--shadow-sm)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-main)",
            fontFamily: "inherit",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <Check size={16} /> Got it
        </button>
      </div>
    </div>
  );
}

function FeatureRow({ icon, text, disabled }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      fontSize: "13px",
      color: disabled ? "var(--text-dim)" : "var(--text-main)",
    }}>
      <span style={{ color: disabled ? "#d94f4f" : "var(--success)", display: "flex", flexShrink: 0 }}>
        {disabled ? icon : <Check size={14} />}
      </span>
      {text}
    </div>
  );
}
