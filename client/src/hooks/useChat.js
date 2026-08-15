import { useState } from "react";
import { sendChatQuery } from "../services/chatService";

export default function useChat({ selectVideo, selectNote, seekTo, collectionId, notes }) {
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const query = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: query }]);
    setChatLoading(true);
    try {
      const resp = await sendChatQuery(query, collectionId);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: resp.data.answer,
          citations: resp.data.citations,
        },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: err.response?.data?.error || "Something went wrong.",
          citations: [],
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const navigateToCitation = (citation) => {
    if (citation.source === "note") {
      const note = (notes || []).find((n) => n.filename === citation.noteName);
      if (note) selectNote(note);
      return;
    }
    selectVideo(citation.videoId);
    setTimeout(() => seekTo(citation.timestamp), 300);
  };

  return {
    chatMessages,
    chatInput,
    setChatInput,
    chatLoading,
    showChatPanel,
    setShowChatPanel,
    sendChatMessage,
    navigateToCitation,
  };
}
