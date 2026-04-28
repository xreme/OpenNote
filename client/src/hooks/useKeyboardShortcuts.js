import { useState, useEffect } from "react";

export default function useKeyboardShortcuts({
  showSearch,
  setShowSearch,
  viewMode,
  selectedId,
}) {
  const [showLocalSearch, setShowLocalSearch] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f" && e.shiftKey) {
        e.preventDefault();
        setShowSearch(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "f" && !e.shiftKey) {
        e.preventDefault();
        if (viewMode === "videos" && selectedId) {
          setShowLocalSearch(true);
        }
      }

      if (showSearch && e.key === "Escape") {
        e.preventDefault();
        setShowSearch(false);
      }

      if (showLocalSearch && e.key === "Escape") {
        e.preventDefault();
        setShowLocalSearch(false);
        setLocalSearchQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showSearch, showLocalSearch, viewMode, selectedId, setShowSearch]);

  return {
    showLocalSearch,
    setShowLocalSearch,
    localSearchQuery,
    setLocalSearchQuery,
  };
}
