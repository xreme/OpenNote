import { useState } from "react";
import {
  MessagesSquare,
  Sparkles,
  Loader2,
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
  Link as LinkIcon,
  Play,
  FileText,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const formatTimestamp = (seconds) =>
  new Date(seconds * 1000).toISOString().substring(14, 19);

export default function ChatPanel({
  width,
  snapped,
  isResizing,
  showChatPanel,
  setShowChatPanel,
  chatMessages,
  chatInput,
  setChatInput,
  chatLoading,
  sendChatMessage,
  navigateToCitation,
}) {
  const [expandedSources, setExpandedSources] = useState({});

  const toggleSources = (i) =>
    setExpandedSources((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <div
      className={`chat-panel ${!showChatPanel ? "hidden" : ""} ${snapped ? "snapped" : ""}`}
      style={{ width, transition: isResizing ? "none" : undefined }}
    >
      <div className="chat-panel-header">
        <button
          className={`chat-hide-btn ${snapped ? "as-back" : ""}`}
          onClick={() => setShowChatPanel?.((prev) => !prev)}
          title={snapped ? "Back to content" : "Hide chat"}
        >
          {snapped ? <ArrowLeft size={17} /> : <MessagesSquare size={16} />}
        </button>
        <h3 className="chat-panel-title">Chat</h3>
        <span className="chat-panel-scope">RAG · this collection</span>
      </div>

      {/* Messages area */}
      <div className="chat-messages">
        {chatMessages.length === 0 && (
          <div className="chat-empty">
            <Sparkles size={30} />
            <p>Ask a question about your video transcripts.</p>
          </div>
        )}

        {chatMessages.map((msg, i) =>
          msg.role === "user" ? (
            <div key={i} className="chat-bubble-user">
              {msg.text}
            </div>
          ) : (
            <div key={i} className="chat-assistant">
              <div className="chat-bubble-assistant">
                <div className="chat-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                </div>

                {msg.citations && msg.citations.length > 0 && (
                  <>
                    <button className="chat-sources-toggle" onClick={() => toggleSources(i)}>
                      <LinkIcon size={13} />
                      {msg.citations.length} source{msg.citations.length !== 1 ? "s" : ""}
                    </button>

                    {expandedSources[i] && (
                      <div className="chat-source-list">
                        {msg.citations.map((c, ci) => (
                          <button
                            key={ci}
                            className="chat-source-card"
                            onClick={() => navigateToCitation(c)}
                            title={c.text}
                          >
                            <span className="chat-source-icon">
                              {c.source === "note" ? <FileText size={13} /> : <Play size={13} />}
                            </span>
                            <span className="chat-source-body">
                              <span className="chat-source-label">
                                {c.source === "note"
                                  ? c.noteName.replace(/\.md$/, "")
                                  : c.videoName.replace(/\.[^.]+$/, "")}
                              </span>
                              {c.source !== "note" && (
                                <span className="chat-source-ts">{formatTimestamp(c.timestamp)}</span>
                              )}
                            </span>
                            <ArrowUpRight size={13} className="chat-source-arrow" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ),
        )}

        {chatLoading && (
          <div className="chat-thinking">
            <Loader2 size={15} className="spin" /> Thinking…
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="chat-input-dock">
        <div className="chat-input-shell">
          <textarea
            value={chatInput}
            onChange={(e) => {
              setChatInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
              }
            }}
            placeholder="Ask anything…"
            rows={1}
          />
          <button
            className="chat-send-btn"
            onClick={sendChatMessage}
            disabled={!chatInput.trim() || chatLoading}
            title="Send"
          >
            {chatLoading ? <Loader2 size={17} className="spin" /> : <ArrowUp size={17} />}
          </button>
        </div>
      </div>
    </div>
  );
}
