import React from "react";
import NotesSidebar from "./NotesSidebar";
import NoteContent from "./NoteContent";
import ResizeHandle from "../shared/ResizeHandle";
import useResizable from "../../hooks/useResizable";

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
  const { width: notesWidth, isResizing: notesResizing, onMouseDown: onNotesMouseDown } =
    useResizable({ key: "notes-sidebar", defaultWidth: 280, minWidth: 180, maxWidth: 420 });

  return (
    <div className="notes-view">
      <NotesSidebar
        width={notesSidebarVisible ? notesWidth : 0}
        isResizing={notesResizing}
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
      {notesSidebarVisible && <ResizeHandle onMouseDown={onNotesMouseDown} active={notesResizing} />}
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
