import React, { useRef, useState } from "react";
import {
  Upload,
  Loader2,
  Download,
  Search,
  Plus,
  PanelLeftClose,
  Settings,
  Github,
  Sparkles,
  MessageSquare,
  ChevronsUpDown,
  Check,
  Eye,
  Library,
  NotebookPen,
} from "lucide-react";
import VideoItem from "./VideoItem";
import NoteRow from "./NoteRow";
import { groupNotesByType } from "../../constants/artifacts";

export default function Sidebar({
  width,
  isResizing,
  videos,
  filteredVideos,
  uploading,
  search,
  setSearch,
  selectedId,
  onSelectVideo,
  sidebarVisible,
  setSidebarVisible,
  viewMode,
  showChatPanel,
  setShowChatPanel,
  handleUpload,
  deleteVideo,
  reorderVideo,
  saveRename,
  openFolder,
  setShowGenerateModal,
  setShowExportModal,
  setShowSearch,
  setShowSettings,
  setShowAddModal,
  collections,
  activeCollectionId,
  onSwitchCollection,
  onCreateCollection,
  previewMode,
  notes = [],
  selectedNote,
  onSelectNote,
  onRenameNote,
  onDeleteNote,
}) {
  // The dragged id lives in a ref as well as state: state drives the ghosting,
  // but the drop handler must read the id synchronously, since a re-render is
  // not guaranteed between dragstart and drop.
  const dragIdRef = useRef(null);
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [newCollection, setNewCollection] = useState(null);

  const isArtifactActive = (note) =>
    viewMode === "notes" && selectedNote?.filename === note.filename;

  // The search box covers both lists, so filter notes by the same query.
  const query = search.trim().toLowerCase();
  const visibleNotes = query
    ? notes.filter((n) => n.filename.toLowerCase().includes(query))
    : notes;

  // Artifacts are listed under the kind of thing they are.
  const artifactGroups = groupNotesByType(visibleNotes);

  // Reordering is positional, so it only makes sense against the full list.
  const canReorder = !query && !previewMode;

  const handleDragStart = (id) => (e) => {
    dragIdRef.current = id;
    setDragId(id);
    try {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", id);
    } catch { /* Safari rejects some dataTransfer writes; the drag still works */ }
  };

  const handleDragOver = (id) => (e) => {
    e.preventDefault();
    try { e.dataTransfer.dropEffect = "move"; } catch { /* see above */ }
    setOverId((prev) => (prev === id ? prev : id));
  };

  const handleDrop = (id) => (e) => {
    e.preventDefault();
    let dragged = dragIdRef.current;
    if (!dragged) {
      try { dragged = e.dataTransfer.getData("text/plain"); } catch { /* see above */ }
    }
    if (dragged && dragged !== id) reorderVideo(dragged, id);
    dragIdRef.current = null;
    setDragId(null);
    setOverId(null);
  };

  const handleDragEnd = () => {
    dragIdRef.current = null;
    setDragId(null);
    setOverId(null);
  };

  const submitNewCollection = async () => {
    const title = (newCollection || "").trim();
    if (!title) return setNewCollection(null);
    await onCreateCollection(title);
    setNewCollection(null);
  };

  const disabledInPreview = previewMode
    ? { opacity: 0.4, cursor: "not-allowed", pointerEvents: "auto" }
    : undefined;

  return (
    <div
      className={`sidebar ${!sidebarVisible ? "hidden" : ""}`}
      style={{ width, transition: isResizing ? "none" : undefined }}
    >
      <div className="sidebar-header">
        <div className="brand-mark">
          <NotebookPen size={18} />
        </div>
        <h1 className="logo">OpenNote</h1>
        {previewMode && (
          <span className="preview-chip">
            <Eye size={10} /> Preview
          </span>
        )}
        <button
          onClick={() => setSidebarVisible(false)}
          className="icon-btn-toggle"
          title="Collapse"
          style={{ marginLeft: "auto" }}
        >
          <PanelLeftClose size={17} />
        </button>
      </div>

      <div style={{ padding: "0 14px 12px" }}>
        <button
          className="sidebar-add-btn"
          onClick={() => !previewMode && setShowAddModal(true)}
          title={previewMode ? "Not available in preview mode" : "Add content"}
          disabled={previewMode}
          style={disabledInPreview}
        >
          <Plus size={17} /> Add content
        </button>
      </div>

      <div className="search-container">
        <div className="search-wrapper">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search content…"
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="sidebar-lists">
        <div className="sidebar-section sidebar-sources">
          <div className="sidebar-section-header">
            <span>Sources</span>
            <span className="sidebar-section-count">{videos.length}</span>
          </div>
          <div className="video-list">
            {!videos.length && !uploading && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-faint)" }}>
                <Upload style={{ opacity: 0.35, marginBottom: "10px" }} size={28} />
                <p style={{ fontSize: "13px", margin: 0 }}>No videos yet</p>
              </div>
            )}

            {uploading && (
              <div className="video-item" style={{ animation: "pulse 2s infinite" }}>
                <div className="video-icon-box">
                  <Loader2 size={15} className="spin" style={{ color: "var(--primary)" }} />
                </div>
                <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-dim)" }}>
                  Uploading…
                </span>
              </div>
            )}

            {filteredVideos.map((video) => (
              <VideoItem
                key={video.id}
                video={video}
                selected={viewMode === "videos" && selectedId === video.id}
                onSelect={onSelectVideo}
                onDelete={deleteVideo}
                onRename={saveRename}
                onOpenFolder={openFolder}
                draggable={canReorder}
                dragging={dragId === video.id}
                dropTarget={overId === video.id && !!dragId && dragId !== video.id}
                onDragStart={handleDragStart(video.id)}
                onDragOver={handleDragOver(video.id)}
                onDrop={handleDrop(video.id)}
                onDragEnd={handleDragEnd}
                previewMode={previewMode}
              />
            ))}
          </div>
        </div>

        <div className="sidebar-section sidebar-artifacts">
          <div className="sidebar-section-header">
            <span>Artifacts</span>
            <span className="sidebar-section-count">{visibleNotes.length}</span>
          </div>
          <div className="artifact-list">
            {visibleNotes.length === 0 ? (
              <p className="sidebar-empty-hint">
                {query ? "No matching artifacts" : "No artifacts yet"}
              </p>
            ) : (
              artifactGroups.map((group) => (
                <div className="artifact-group" key={group.type}>
                  <div className="artifact-group-header">
                    <span>{group.label}</span>
                    <span className="artifact-group-count">{group.notes.length}</span>
                  </div>
                  {group.notes.map((note) => (
                    <NoteRow
                      key={note.filename}
                      note={note}
                      active={isArtifactActive(note)}
                      onSelect={onSelectNote}
                      onRename={onRenameNote}
                      onDelete={onDeleteNote}
                      previewMode={previewMode}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="sidebar-actions">
        <button
          className="action-btn-primary"
          onClick={() => !previewMode && setShowGenerateModal(true)}
          title={previewMode ? "Not available in preview mode" : "Generate AI artifact"}
          disabled={previewMode}
          style={disabledInPreview}
        >
          <Sparkles size={15} /> Generate
        </button>
        <button
          className="action-btn-secondary"
          onClick={() => setShowExportModal(true)}
          title="Bulk export transcripts"
        >
          <Download size={16} />
        </button>
        <button
          className={`action-btn-secondary ${showChatPanel ? "active" : ""}`}
          onClick={() => setShowChatPanel((prev) => !prev)}
          title="Chat with transcripts"
        >
          <MessageSquare size={16} />
        </button>
      </div>

      <div className="sidebar-footer">
        {newCollection !== null ? (
          <div className="collection-switcher">
            <Library size={14} className="collection-select-lead" />
            <input
              autoFocus
              className="collection-new-input"
              placeholder="New collection name…"
              value={newCollection}
              onChange={(e) => setNewCollection(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitNewCollection();
                if (e.key === "Escape") setNewCollection(null);
              }}
              onBlur={() => !newCollection.trim() && setNewCollection(null)}
            />
          </div>
        ) : (
          collections && collections.length > 0 && (
            <div className="collection-switcher">
              <Library size={14} className="collection-select-lead" />
              <select
                className="collection-select"
                value={activeCollectionId || ""}
                onChange={(e) => onSwitchCollection(e.target.value)}
              >
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
              <ChevronsUpDown size={13} className="collection-select-icon" />
            </div>
          )
        )}

        {newCollection !== null ? (
          <button
            onClick={submitNewCollection}
            className="settings-btn confirm"
            title="Create collection"
            disabled={!newCollection.trim()}
          >
            <Check size={15} />
          </button>
        ) : (
          <button
            onClick={() => !previewMode && setNewCollection("")}
            className="settings-btn"
            title={previewMode ? "Not available in preview mode" : "New collection"}
            disabled={previewMode}
            style={disabledInPreview}
          >
            <Plus size={15} />
          </button>
        )}

        <button onClick={() => setShowSearch(true)} className="settings-btn" title="Search everything">
          <Search size={15} />
        </button>
        <a
          href="https://github.com/xreme/OpenNote"
          target="_blank"
          rel="noopener noreferrer"
          className="settings-btn"
          title="GitHub"
        >
          <Github size={15} />
        </a>
        <button onClick={() => setShowSettings(true)} className="settings-btn" title="Settings">
          <Settings size={15} />
        </button>
      </div>
    </div>
  );
}
