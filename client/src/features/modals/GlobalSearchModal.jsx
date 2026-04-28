import React from "react";
import { Search, X } from "lucide-react";

export default function GlobalSearchModal({
  show,
  onClose,
  searchQuery,
  setSearchQuery,
  searchResults,
  navigateToSearchResult,
}) {
  if (!show) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content search-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="search-modal-input-wrapper">
            <Search className="search-icon" size={20} />
            <input
              autoFocus
              placeholder="Search transcripts and notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="modal-search-input"
            />
          </div>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body search-results-body">
          {!searchQuery && (
            <p className="search-hint">
              Type to search across all your content...
            </p>
          )}

          {searchResults.videos.length > 0 && (
            <div className="search-section">
              <h4>Transcripts</h4>
              {searchResults.videos.map((res, i) => (
                <div
                  key={i}
                  className="search-result-item"
                  onClick={() => navigateToSearchResult("video", res)}
                >
                  <span className="result-title">
                    {res.videoName}{" "}
                    <span className="result-time">
                      [
                      {new Date(res.start * 1000)
                        .toISOString()
                        .substring(14, 19)}
                      ]
                    </span>
                  </span>
                  <p className="result-snippet">"{res.text}"</p>
                </div>
              ))}
            </div>
          )}

          {searchResults.notes.length > 0 && (
            <div className="search-section">
              <h4>Notes</h4>
              {searchResults.notes.map((res, i) => (
                <div
                  key={i}
                  className="search-result-item"
                  onClick={() => navigateToSearchResult("note", res)}
                >
                  <span className="result-title">
                    {res.filename.replace(".md", "")}
                  </span>
                  <p className="result-snippet">
                    {res.content.substring(0, 100)}...
                  </p>
                </div>
              ))}
            </div>
          )}

          {searchQuery &&
            searchResults.videos.length === 0 &&
            searchResults.notes.length === 0 && (
              <div className="empty-search">
                <p>No results found.</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
