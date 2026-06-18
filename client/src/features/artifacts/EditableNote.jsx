import React, { useState, useEffect, useRef, useCallback } from "react";
import { Check, Loader2 } from "lucide-react";

// A blank, user-typed note with debounced autosave.
export default function EditableNote({ note, onSave, readOnly }) {
  const [text, setText] = useState(note.content || "");
  const [status, setStatus] = useState("saved"); // saved | dirty | saving
  const timer = useRef(null);

  // Re-seed local state when switching to a different note.
  useEffect(() => {
    setText(note.content || "");
    setStatus("saved");
  }, [note.filename]);

  const flush = useCallback(
    async (value) => {
      setStatus("saving");
      await onSave(note.filename, value);
      // Only mark saved if no newer keystroke is pending.
      setStatus((s) => (s === "saving" ? "saved" : s));
    },
    [note.filename, onSave],
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);
    setStatus("dirty");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => flush(value), 700);
  };

  const handleBlur = () => {
    clearTimeout(timer.current);
    if (status !== "saved") flush(text);
  };

  return (
    <div className="editable-note">
      <div className="editable-note-status">
        {status === "saving" ? (
          <>
            <Loader2 size={12} className="spin" /> Saving…
          </>
        ) : status === "dirty" ? (
          "Unsaved changes"
        ) : (
          <>
            <Check size={12} /> Saved
          </>
        )}
      </div>
      <textarea
        className="editable-note-area"
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        readOnly={readOnly}
        placeholder="Type your notes here… (Markdown supported)"
        autoFocus
      />
    </div>
  );
}
