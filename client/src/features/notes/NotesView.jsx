import React from "react";
import NotesSidebar from "./NotesSidebar";
import NoteContent from "./NoteContent";

export default function NotesView({
  notes,
  selectedNote,
  setSelectedNote,
  notesSidebarVisible,
  setNotesSidebarVisible,
  sidebarVisible,
  setSidebarVisible,
  onRenameNote,
  onDeleteNote,
  onDownloadNote,
}) {
  return (
    <div className="notes-view">
      <NotesSidebar
        notes={notes}
        selectedNote={selectedNote}
        notesSidebarVisible={notesSidebarVisible}
        setNotesSidebarVisible={setNotesSidebarVisible}
        sidebarVisible={sidebarVisible}
        setSidebarVisible={setSidebarVisible}
        onSelectNote={setSelectedNote}
        onRenameNote={onRenameNote}
        onDeleteNote={onDeleteNote}
      />
      <div className="note-content-area">
        <NoteContent
          selectedNote={selectedNote}
          notesSidebarVisible={notesSidebarVisible}
          setNotesSidebarVisible={setNotesSidebarVisible}
          sidebarVisible={sidebarVisible}
          setSidebarVisible={setSidebarVisible}
          onDownload={onDownloadNote}
          onClose={() => setSelectedNote(null)}
        />
      </div>
    </div>
  );
}
