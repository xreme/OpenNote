import { useState, useEffect, useMemo } from "react";
import Fuse from "fuse.js";

export default function useSearch({
  videos,
  notes,
  setViewMode,
  setSelectedId,
  seekTo,
  setSelectedNote,
}) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ videos: [], notes: [] });

  const fuseInstances = useMemo(() => {
    const videoSegments = [];
    videos.forEach((v) => {
      if (v.transcript) {
        v.transcript.forEach((seg) => {
          videoSegments.push({
            videoId: v.id,
            videoName: v.originalName,
            start: seg.start,
            text: seg.speech,
          });
        });
      }
    });

    const videosFuse = new Fuse(videoSegments, {
      keys: ["text"],
      threshold: 0.3,
      includeScore: true,
    });

    const notesFuse = new Fuse(notes, {
      keys: [
        { name: "filename", weight: 0.7 },
        { name: "content", weight: 0.3 },
      ],
      threshold: 0.6,
      includeScore: true,
      minMatchCharLength: 1,
      ignoreLocation: true,
    });

    return { videosFuse, notesFuse };
  }, [videos, notes]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ videos: [], notes: [] });
      return;
    }

    const videoResults = fuseInstances.videosFuse
      .search(searchQuery)
      .map((r) => r.item)
      .slice(0, 50);
    const noteResults = fuseInstances.notesFuse
      .search(searchQuery)
      .map((r) => r.item)
      .slice(0, 10);

    setSearchResults({ videos: videoResults, notes: noteResults });
  }, [searchQuery, fuseInstances]);

  const navigateToSearchResult = (type, item) => {
    setShowSearch(false);
    if (type === "video") {
      setViewMode("videos");
      setSelectedId(item.videoId);
      setTimeout(() => {
        seekTo(item.start);
      }, 300);
    } else {
      setViewMode("notes");
      setSelectedNote(item);
    }
  };

  return {
    showSearch,
    setShowSearch,
    searchQuery,
    setSearchQuery,
    searchResults,
    navigateToSearchResult,
  };
}
