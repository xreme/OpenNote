import React, { useState } from "react";
import { X, Plus, Pencil, Trash2 } from "lucide-react";

export default function SettingsModal({
  show,
  onClose,
  settings,
  setSettings,
  encoderPresets,
  onSave,
  darkMode,
  setDarkMode,
  collections,
  activeCollectionId,
  onSwitchCollection,
  onCreateCollection,
  onRenameCollection,
  onDeleteCollection,
  previewMode,
}) {
  const [newCollectionTitle, setNewCollectionTitle] = useState("");
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  if (!show) return null;

  const activeCollection = collections.find((c) => c.id === activeCollectionId);

  const handleCreate = async () => {
    const title = newCollectionTitle.trim();
    if (!title) return;
    await onCreateCollection(title);
    setNewCollectionTitle("");
  };

  const startRename = (col) => {
    setRenamingId(col.id);
    setRenameValue(col.title);
  };

  const commitRename = async () => {
    if (!renameValue.trim() || !renamingId) return;
    await onRenameCollection(renamingId, renameValue.trim());
    setRenamingId(null);
    setRenameValue("");
  };

  const handleDelete = async (col) => {
    if (!window.confirm(`Delete collection "${col.title}"? The videos will NOT be deleted from disk.`)) return;
    await onDeleteCollection(col.id);
  };

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
          {/* Collections */}
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ margin: "0 0 12px", fontSize: "14px" }}>Collections</h4>

            <div className="form-group">
              <label>Active Collection</label>
              <select
                value={activeCollectionId || ""}
                onChange={(e) => onSwitchCollection(e.target.value)}
              >
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.videoCount} video{c.videoCount !== 1 ? "s" : ""})
                  </option>
                ))}
              </select>
            </div>

            {!previewMode && (
              <>
                {/* Collection list with rename/delete */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                  {collections.map((col) => (
                    <div
                      key={col.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 8px",
                        background: col.id === activeCollectionId ? "var(--card-bg)" : "transparent",
                        border: "var(--border-width) solid var(--border-color)",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      {renamingId === col.id ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename();
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          style={{
                            flex: 1,
                            background: "var(--bg-color)",
                            border: "var(--border-width) solid var(--border-color)",
                            borderRadius: "var(--radius-sm)",
                            color: "var(--text-main)",
                            fontSize: "13px",
                            padding: "2px 6px",
                            fontFamily: "inherit",
                          }}
                        />
                      ) : (
                        <span style={{ flex: 1, fontSize: "13px", color: "var(--text-main)" }}>
                          {col.title}
                        </span>
                      )}
                      {renamingId === col.id ? (
                        <button
                          onClick={commitRename}
                          style={iconBtnStyle}
                          title="Save"
                        >
                          ✓
                        </button>
                      ) : (
                        <button onClick={() => startRename(col)} style={iconBtnStyle} title="Rename">
                          <Pencil size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(col)}
                        style={{ ...iconBtnStyle, color: "var(--text-dim)" }}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Create new collection */}
                <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                  <input
                    type="text"
                    placeholder="New collection name…"
                    value={newCollectionTitle}
                    onChange={(e) => setNewCollectionTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    style={{ flex: 1 }}
                  />
                  <button
                    onClick={handleCreate}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "6px 12px",
                      background: "var(--card-bg)",
                      border: "var(--border-width) solid var(--border-color)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-main)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: "13px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
              </>
            )}
          </div>

          <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: "16px" }}>
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
            {!previewMode && (
              <>
                <div className="form-group">
                  <label>OpenAI API Key</label>
                  <input
                    type="password"
                    value={settings.apiKey}
                    onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                    placeholder="sk-..."
                  />
                </div>
                <div className="form-group">
                  <label>Model</label>
                  <select
                    value={settings.model}
                    onChange={(e) => setSettings({ ...settings, model: e.target.value })}
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
                    onChange={(e) => setSettings({ ...settings, prompt: e.target.value })}
                    placeholder="Instructions for summarization..."
                    rows={4}
                  />
                </div>
                <div style={{ borderTop: "1px solid var(--card-border)", marginTop: "8px", paddingTop: "16px" }}>
                  <h4 style={{ margin: "0 0 12px", fontSize: "14px" }}>Desktop</h4>
                  <div className="form-group">
                    <label>Download &amp; Compress Online Videos</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <button
                        onClick={() => setSettings({ ...settings, downloadVideo: !settings.downloadVideo })}
                        style={{
                          padding: "6px 14px",
                          background: settings.downloadVideo ? "var(--accent)" : "var(--card-bg)",
                          border: "var(--border-width) solid var(--border-color)",
                          boxShadow: "var(--shadow-sm)",
                          borderRadius: "var(--radius-sm)",
                          color: settings.downloadVideo ? "#fff" : "var(--text-main)",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          fontSize: "13px",
                        }}
                      >
                        {settings.downloadVideo ? "Enabled" : "Disabled"}
                      </button>
                      <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                        {settings.downloadVideo
                          ? "Full video will be downloaded and compressed for local playback"
                          : "Only the transcript is saved — no video file stored"}
                      </span>
                    </div>
                    <p style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "6px" }}>
                      When enabled, URL-imported videos are fully downloaded and compressed using the encoder below. Requires more disk space and time.
                    </p>
                  </div>
                  <div className="form-group">
                    <label>Video Encoder</label>
                    <select
                      value={settings.encoder}
                      onChange={(e) => setSettings({ ...settings, encoder: e.target.value })}
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
              </>
            )}
          </div>
        </div>
        {!previewMode && (
          <div className="modal-footer">
            <button onClick={onSave} className="save-btn">
              Save Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const iconBtnStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "3px 5px",
  background: "transparent",
  border: "none",
  color: "var(--text-dim)",
  cursor: "pointer",
  borderRadius: "var(--radius-sm)",
};
