import { MessageSquare, Loader2, ArrowUp, FileVideo } from "lucide-react";

export default function ChatPanel({
  showChatPanel,
  chatMessages,
  chatInput,
  setChatInput,
  chatLoading,
  sendChatMessage,
  navigateToCitation,
}) {
  return (
    <div className={`chat-panel ${!showChatPanel ? "hidden" : ""}`}>
      <div className="chat-panel-header">
        <h3 style={{ margin: 0, fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
          <MessageSquare size={16} /> Chat
        </h3>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", padding: "16px" }}>
        {chatMessages.length === 0 && (
          <div style={{ color: "var(--text-dim)", textAlign: "center", marginTop: "60px", fontSize: "13px" }}>
            <MessageSquare size={28} style={{ opacity: 0.3, marginBottom: "10px" }} />
            <p>Ask a question about your video transcripts.</p>
          </div>
        )}
        {chatMessages.map((msg, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", gap: "6px" }}>
            <div style={{
              maxWidth: "90%",
              padding: "10px 14px",
              borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              backgroundColor: msg.role === "user" ? "var(--primary)" : "var(--card-bg)",
              border: msg.role === "assistant" ? "1px solid var(--card-border)" : "none",
              fontSize: "13px",
              lineHeight: "1.6",
            }}>
              {msg.text}
            </div>
            {msg.citations && msg.citations.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", maxWidth: "90%" }}>
                {msg.citations.map((c, ci) => (
                  <button
                    key={ci}
                    onClick={() => navigateToCitation(c)}
                    style={{
                      background: "none",
                      border: "1px solid var(--card-border)",
                      borderRadius: "6px",
                      padding: "3px 8px",
                      fontSize: "11px",
                      color: "var(--text-dim)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    title={c.text}
                  >
                    <FileVideo size={11} />
                    {c.videoName} [{new Date(c.timestamp * 1000).toISOString().substring(14, 19)}]
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {chatLoading && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-dim)", fontSize: "13px" }}>
            <Loader2 size={14} className="spin" /> Thinking...
          </div>
        )}
      </div>

      {/* Input area */}
      <div style={{ padding: "12px" }}>
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          border: "1px solid var(--card-border)",
          borderRadius: "14px",
          background: "var(--card-bg)",
          padding: "8px 8px 8px 14px",
          gap: "8px",
        }}>
          <textarea
            value={chatInput}
            onChange={(e) => {
              setChatInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
            placeholder="Ask something about your videos..."
            rows={1}
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              color: "var(--text-main)",
              fontSize: "13px",
              resize: "none",
              fontFamily: "inherit",
              outline: "none",
              lineHeight: "1.5",
              maxHeight: "120px",
              overflowY: "auto",
              padding: "2px 0",
            }}
          />
          <button
            onClick={sendChatMessage}
            disabled={!chatInput.trim() || chatLoading}
            style={{
              flexShrink: 0,
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              border: "none",
              background: "var(--primary)",
              color: "var(--bg-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              opacity: (!chatInput.trim() || chatLoading) ? 0.4 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {chatLoading ? <Loader2 size={14} className="spin" /> : <ArrowUp size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
