import React from "react";
import { X } from "lucide-react";

export default function SettingsModal({
  show,
  onClose,
  settings,
  setSettings,
  encoderPresets,
  onSave,
  darkMode,
  setDarkMode,
}) {
  if (!show) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Settings</h3>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Appearance</label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                onClick={() => setDarkMode(!darkMode)}
                style={{
                  padding: "6px 14px",
                  background: darkMode ? "var(--card-bg)" : "var(--bg-color)",
                  border: "var(--border-width) solid var(--border-color)",
                  boxShadow: "var(--shadow-sm)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-main)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "13px",
                }}
              >
                {darkMode ? "Dark Mode" : "Light Mode"}
              </button>
              <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                {darkMode ? "Switch to light" : "Switch to dark"}
              </span>
            </div>
          </div>
          <div className="form-group">
            <label>OpenAI API Key</label>
            <input
              type="password"
              value={settings.apiKey}
              onChange={(e) =>
                setSettings({ ...settings, apiKey: e.target.value })
              }
              placeholder="sk-..."
            />
          </div>
          <div className="form-group">
            <label>Model</label>
            <select
              value={settings.model}
              onChange={(e) =>
                setSettings({ ...settings, model: e.target.value })
              }
            >
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="o3-mini">o3-mini</option>
              <option value="o1-mini">o1-mini</option>
            </select>
          </div>
          <div className="form-group">
            <label>Custom Prompt</label>
            <textarea
              value={settings.prompt}
              onChange={(e) =>
                setSettings({ ...settings, prompt: e.target.value })
              }
              placeholder="Instructions for summarization..."
              rows={4}
            />
          </div>
          <div style={{ borderTop: "1px solid var(--card-border)", marginTop: "8px", paddingTop: "16px" }}>
            <h4 style={{ margin: "0 0 12px", fontSize: "14px" }}>Hardware Acceleration</h4>
            <div className="form-group">
              <label>Video Encoder</label>
              <select
                value={settings.encoder}
                onChange={(e) =>
                  setSettings({ ...settings, encoder: e.target.value })
                }
              >
                {encoderPresets.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
              <p style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "6px" }}>
                Choose the encoder that matches your hardware. Use Software (libx265) if unsure.
              </p>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onSave} className="save-btn">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
