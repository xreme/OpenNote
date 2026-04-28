import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";

import { API_BASE } from "./constants/api";

import useVideos from "./hooks/useVideos";
import useNotes from "./hooks/useNotes";
import useSettings from "./hooks/useSettings";
import useVideoPlayer from "./hooks/useVideoPlayer";
import useChat from "./hooks/useChat";
import useSearch from "./hooks/useSearch";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";

import { Sidebar } from "./features/sidebar";
import { ChatPanel } from "./features/chat";
import { VideoView, EmptyVideoState } from "./features/videos";
import { NotesView } from "./features/notes";
import {
  SettingsModal,
  GlobalSearchModal,
  GenerateModal,
  ExportModal,
} from "./features/modals";

function App() {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [notesSidebarVisible, setNotesSidebarVisible] = useState(true);
  const [viewMode, setViewMode] = useState("videos");
  const [search, setSearch] = useState("");
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const {
    videos,
    selectedId,
    setSelectedId,
    uploading,
    handleUpload,
    deleteVideo,
    moveVideo,
    saveRename,
    openFolder,
  } = useVideos();

  const {
    notes,
    selectedNote,
    setSelectedNote,
    generating,
    fetchNotes,
    generateNotes,
    renameNote,
    deleteNote,
  } = useNotes();

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
  } = useChat({ setViewMode, setSelectedId, seekTo });

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
    setViewMode,
    setSelectedId,
    seekTo,
    setSelectedNote,
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
    link.href = `${API_BASE}/notes/${encodeURIComponent(selectedNote.filename)}/download`;
    link.download = selectedNote.filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateNotes = (videoIds) => {
    generateNotes(videoIds, {
      onSuccess: (data) => {
        setShowGenerateModal(false);
        setViewMode("notes");
        setSelectedNote({
          filename: data.filename,
          content: data.content,
          createdAt: new Date().toISOString(),
        });
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

  const handleSaveSettings = async () => {
    const ok = await saveSettings();
    if (ok) setShowSettings(false);
  };

  return (
    <div className="app-container">
      <Sidebar
        videos={videos}
        filteredVideos={filteredVideos}
        uploading={uploading}
        search={search}
        setSearch={setSearch}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        sidebarVisible={sidebarVisible}
        setSidebarVisible={setSidebarVisible}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showChatPanel={showChatPanel}
        setShowChatPanel={setShowChatPanel}
        handleUpload={handleUpload}
        deleteVideo={deleteVideo}
        moveVideo={moveVideo}
        saveRename={saveRename}
        openFolder={openFolder}
        fetchNotes={fetchNotes}
        setShowGenerateModal={setShowGenerateModal}
        setShowExportModal={setShowExportModal}
        setShowSearch={setShowSearch}
        setShowSettings={setShowSettings}
      />

      <ChatPanel
        showChatPanel={showChatPanel}
        chatMessages={chatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        chatLoading={chatLoading}
        sendChatMessage={sendChatMessage}
        navigateToCitation={navigateToCitation}
      />

      <div className="main-content">
        {viewMode === "videos" ? (
          <AnimatePresence mode="wait">
            {selectedVideo ? (
              <VideoView
                selectedVideo={selectedVideo}
                videoRef={videoRef}
                sidebarVisible={sidebarVisible}
                setSidebarVisible={setSidebarVisible}
                transcriptExpanded={transcriptExpanded}
                setTranscriptExpanded={setTranscriptExpanded}
                showLocalSearch={showLocalSearch}
                setShowLocalSearch={setShowLocalSearch}
                localSearchQuery={localSearchQuery}
                setLocalSearchQuery={setLocalSearchQuery}
                seekTo={seekTo}
                syncTranscriptToVideo={syncTranscriptToVideo}
                onExportTxt={downloadTxtLabel}
              />
            ) : (
              <EmptyVideoState
                sidebarVisible={sidebarVisible}
                setSidebarVisible={setSidebarVisible}
              />
            )}
          </AnimatePresence>
        ) : (
          <NotesView
            notes={notes}
            selectedNote={selectedNote}
            setSelectedNote={setSelectedNote}
            notesSidebarVisible={notesSidebarVisible}
            setNotesSidebarVisible={setNotesSidebarVisible}
            sidebarVisible={sidebarVisible}
            setSidebarVisible={setSidebarVisible}
            onRenameNote={handleRenameNote}
            onDeleteNote={deleteNote}
            onDownloadNote={downloadNote}
          />
        )}
      </div>

      <SettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        setSettings={setSettings}
        encoderPresets={encoderPresets}
        onSave={handleSaveSettings}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
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
    </div>
  );
}

export default App;
