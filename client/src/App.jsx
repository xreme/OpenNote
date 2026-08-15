import React, { useState, useEffect } from "react";

import { downloadNoteUrl } from "./services/notesService";

import useVideos from "./hooks/useVideos";
import useNotes from "./hooks/useNotes";
import useSettings from "./hooks/useSettings";
import useVideoPlayer from "./hooks/useVideoPlayer";
import useChat from "./hooks/useChat";
import useSearch from "./hooks/useSearch";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";
import useCollections from "./hooks/useCollections";
import useResizable from "./hooks/useResizable";
import usePreviewMode, { usePreviewModeLoaded } from "./hooks/usePreviewMode";
import ResizeHandle from "./features/shared/ResizeHandle";

import { Sidebar } from "./features/sidebar";
import { ChatPanel } from "./features/chat";
import { VideoView, EmptyVideoState } from "./features/videos";
import { NotesView } from "./features/notes";
import {
  SettingsModal,
  GlobalSearchModal,
  GenerateModal,
  ExportModal,
  AddContentModal,
  MobilePromptModal,
} from "./features/modals";
import PreviewBanner from "./features/shared/PreviewBanner";

function App() {
  const previewMode = usePreviewMode();
  const previewModeLoaded = usePreviewModeLoaded();
  const osQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const [darkMode, setDarkMode] = useState(() => osQuery.matches);

  useEffect(() => {
    const onChange = (e) => setDarkMode(e.matches);
    osQuery.addEventListener("change", onChange);
    return () => osQuery.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", darkMode ? "#1a1917" : "#f6f5ef");
  }, [darkMode]);

  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const { width: sidebarWidth, isResizing: sidebarResizing, onMouseDown: onSidebarMouseDown } =
    useResizable({ key: "sidebar", defaultWidth: 320, minWidth: 200, maxWidth: 480 });
  const { width: chatWidth, isResizing: chatResizing, onMouseDown: onChatMouseDown } =
    useResizable({ key: "chat", defaultWidth: 360, minWidth: 240, maxWidth: 520 });
  // The main pane follows whatever was picked last: choose a source and you get
  // the video view, choose a note and you get the note view. There is no toggle.
  const [lastSelected, setLastSelected] = useState("video");
  const [search, setSearch] = useState("");

  const [showSettings, setShowSettings] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const {
    collections,
    activeCollectionId,
    setActiveCollection,
    createCollection,
    renameCollection,
    deleteCollection,
  } = useCollections();

  const {
    videos,
    selectedId,
    setSelectedId,
    uploading,
    handleUpload,
    handleUrlUpload,
    deleteVideo,
    reorderVideo,
    saveRename,
    openFolder,
  } = useVideos(activeCollectionId);

  const {
    notes,
    selectedNote,
    setSelectedNote,
    generating,
    generateNotes,
    createNote,
    saveNote,
    renameNote,
    deleteNote,
  } = useNotes(activeCollectionId);

  const selectVideo = (id) => {
    setSelectedId(id);
    setLastSelected("video");
  };

  const selectNote = (note) => {
    setSelectedNote(note);
    setLastSelected("note");
  };

  // A note that has gone away (deleted, or a collection switch) falls back to videos.
  const viewMode = lastSelected === "note" && selectedNote ? "notes" : "videos";

  const { settings, setSettings, encoderPresets, saveSettings } = useSettings();

  const { videoRef, seekTo, syncTranscriptToVideo } = useVideoPlayer();

  const {
    chatMessages,
    chatInput,
    setChatInput,
    chatLoading,
    showChatPanel,
    setShowChatPanel,
    sendChatMessage,
    navigateToCitation,
  } = useChat({
    selectVideo,
    selectNote,
    seekTo,
    collectionId: activeCollectionId,
    notes,
  });

  const {
    showSearch,
    setShowSearch,
    searchQuery,
    setSearchQuery,
    searchResults,
    navigateToSearchResult,
  } = useSearch({
    videos,
    notes,
    selectVideo,
    selectNote,
    seekTo,
  });

  const {
    showLocalSearch,
    setShowLocalSearch,
    localSearchQuery,
    setLocalSearchQuery,
  } = useKeyboardShortcuts({
    showSearch,
    setShowSearch,
    viewMode,
    selectedId,
  });

  const selectedVideo = videos.find((v) => v.id === selectedId);
  const filteredVideos = videos.filter((v) =>
    v.originalName.toLowerCase().includes(search.toLowerCase()),
  );

  const downloadTxtLabel = () => {
    if (!selectedVideo) return;
    const text = selectedVideo.transcript.map((s) => s.speech).join(" ");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedVideo.originalName.split(".")[0]}_transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadNote = () => {
    if (!selectedNote) return;
    const link = document.createElement("a");
    link.href = downloadNoteUrl(selectedNote.filename, activeCollectionId);
    link.download = selectedNote.filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateNotes = (videoIds, artifactType, customPrompt) => {
    generateNotes(videoIds, {
      artifactType,
      customPrompt,
      onSuccess: (data) => {
        setShowGenerateModal(false);
        selectNote({
          filename: data.filename,
          content: data.content,
          type: data.type,
          createdAt: new Date().toISOString(),
        });
      },
    });
  };

  const handleGenerateSummary = (videoId, onContent, artifactType, customPrompt) => {
    generateNotes([videoId], {
      artifactType,
      customPrompt,
      onSuccess: (data) => {
        if (onContent) onContent(data);
      },
    });
  };

  const handleCreateNote = (videoId, onCreated) => {
    createNote(videoId, {
      onSuccess: (data) => {
        if (onCreated) onCreated(data);
      },
    });
  };

  const handleRenameNote = (filename, newFilename) => {
    renameNote(filename, newFilename, {
      onRenamed: (newFn) => {
        if (selectedNote?.filename === filename) {
          setSelectedNote({ ...selectedNote, filename: newFn });
        }
      },
    });
  };

  // Focus mode collapses both side panels so the content column stands alone,
  // and restores them on the way out.
  const toggleFocusMode = () => {
    setFocusMode((prev) => {
      const next = !prev;
      setSidebarVisible(!next);
      setShowChatPanel(!next);
      return next;
    });
  };

  // Below this, the content column stops being usable next to an open chat.
  const MAIN_MIN_WIDTH = 460;
  const snapChat =
    showChatPanel &&
    viewportWidth - (sidebarVisible ? sidebarWidth : 0) - chatWidth < MAIN_MIN_WIDTH;

  const handleSaveSettings = async () => {
    const ok = await saveSettings();
    if (ok) setShowSettings(false);
  };

  return (
    <div className="app-container">
      <Sidebar
        width={sidebarVisible ? sidebarWidth : 0}
        isResizing={sidebarResizing}
        videos={videos}
        filteredVideos={filteredVideos}
        uploading={uploading}
        search={search}
        setSearch={setSearch}
        selectedId={selectedId}
        onSelectVideo={selectVideo}
        sidebarVisible={sidebarVisible}
        setSidebarVisible={setSidebarVisible}
        viewMode={viewMode}
        showChatPanel={showChatPanel}
        setShowChatPanel={setShowChatPanel}
        handleUpload={handleUpload}
        deleteVideo={deleteVideo}
        reorderVideo={reorderVideo}
        saveRename={saveRename}
        openFolder={openFolder}
        setShowGenerateModal={setShowGenerateModal}
        setShowExportModal={setShowExportModal}
        setShowSearch={setShowSearch}
        setShowSettings={setShowSettings}
        setShowAddModal={setShowAddModal}
        collections={collections}
        activeCollectionId={activeCollectionId}
        onSwitchCollection={setActiveCollection}
        onCreateCollection={createCollection}
        previewMode={previewMode}
        notes={notes}
        selectedNote={selectedNote}
        onSelectNote={selectNote}
        onRenameNote={handleRenameNote}
        onDeleteNote={deleteNote}
      />
      {sidebarVisible && <ResizeHandle onMouseDown={onSidebarMouseDown} active={sidebarResizing} />}

      <div className={`main-content ${snapChat ? "snapped-out" : ""}`}>
        {viewMode === "videos" ? (
          <>
            {selectedVideo ? (
              <VideoView
                selectedVideo={selectedVideo}
                videoRef={videoRef}
                sidebarVisible={sidebarVisible}
                setSidebarVisible={setSidebarVisible}
                showLocalSearch={showLocalSearch}
                setShowLocalSearch={setShowLocalSearch}
                localSearchQuery={localSearchQuery}
                setLocalSearchQuery={setLocalSearchQuery}
                seekTo={seekTo}
                syncTranscriptToVideo={syncTranscriptToVideo}
                onExportTxt={downloadTxtLabel}
                showChatPanel={showChatPanel}
                setShowChatPanel={setShowChatPanel}
                focusMode={focusMode}
                onToggleFocus={toggleFocusMode}
                notes={notes}
                generating={generating}
                onGenerateSummary={handleGenerateSummary}
                onCreateNote={handleCreateNote}
                onSaveNote={saveNote}
                previewMode={previewMode}
              />
            ) : (
              <EmptyVideoState
                sidebarVisible={sidebarVisible}
                setSidebarVisible={setSidebarVisible}
              />
            )}
          </>
        ) : (
          <NotesView
            selectedNote={selectedNote}
            videos={videos}
            onSelectVideo={selectVideo}
            onClearNote={() => setSelectedNote(null)}
            sidebarVisible={sidebarVisible}
            setSidebarVisible={setSidebarVisible}
            onDownloadNote={downloadNote}
          />
        )}
      </div>

      {showChatPanel && !snapChat && (
        <ResizeHandle onMouseDown={onChatMouseDown} direction={-1} active={chatResizing} />
      )}
      <ChatPanel
        width={snapChat ? "auto" : showChatPanel ? chatWidth : 0}
        snapped={snapChat}
        isResizing={chatResizing}
        showChatPanel={showChatPanel}
        setShowChatPanel={setShowChatPanel}
        chatMessages={chatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        chatLoading={chatLoading}
        sendChatMessage={sendChatMessage}
        navigateToCitation={navigateToCitation}
      />

      <SettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        setSettings={setSettings}
        encoderPresets={encoderPresets}
        onSave={handleSaveSettings}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        collections={collections}
        activeCollectionId={activeCollectionId}
        onSwitchCollection={setActiveCollection}
        onCreateCollection={createCollection}
        onRenameCollection={renameCollection}
        onDeleteCollection={deleteCollection}
        previewMode={previewMode}
      />

      <GlobalSearchModal
        show={showSearch}
        onClose={() => setShowSearch(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        navigateToSearchResult={navigateToSearchResult}
      />

      <GenerateModal
        show={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        videos={videos}
        generating={generating}
        onGenerate={handleGenerateNotes}
      />

      <ExportModal
        show={showExportModal}
        onClose={() => setShowExportModal(false)}
        videos={videos}
      />

      <AddContentModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onUpload={handleUpload}
        onUrlUpload={handleUrlUpload}
        collectionId={activeCollectionId}
      />

      {previewMode && <PreviewBanner />}
      <MobilePromptModal blocked={!previewModeLoaded || previewMode} />
    </div>
  );
}

export default App;
