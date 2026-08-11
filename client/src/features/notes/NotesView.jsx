import React from "react";
import NoteContent from "./NoteContent";

// The sidebar's Notes section is the only notes list; this pane just renders
// whichever note is selected.
export default function NotesView({
  selectedNote,
  videos,
  onSelectVideo,
  sidebarVisible,
  setSidebarVisible,
  onDownloadNote,
  onClearNote,
}) {
  return (
    <div className="notes-view">
      <div className="note-content-area">
        <NoteContent
          selectedNote={selectedNote}
          videos={videos}
          onSelectVideo={onSelectVideo}
          sidebarVisible={sidebarVisible}
          setSidebarVisible={setSidebarVisible}
          onDownload={onDownloadNote}
          onClose={onClearNote}
        />
      </div>
    </div>
  );
}
