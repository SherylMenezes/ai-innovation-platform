import React, { useState, useEffect, useRef } from "react";
import "./AiIdeaDrawer.css";
import ChatThread from "./ChatThread";

function AiMentorDrawer({ currentStage, workspaceContext, userId, workspaceId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch history when drawer opens (Task 2)
  useEffect(() => {
    if (isOpen) {
      fetchMentorHistory();
    }
  }, [isOpen]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMentorHistory = async () => {
    try {
      const response = await fetch(`http://localhost:8001/api/ai/mentor/history?user_id=${userId || 1}&workspace_id=${workspaceId || 1}`);
      if (!response.ok) throw new Error("Failed to load history");
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Error fetching mentor history:", err);
    }
  };

  const handleSendMessage = async () => {
    if (!inputQuery.trim() || isLoading) return;

    const userQuery = inputQuery.trim();
    setInputQuery("");

    // 1. Add user message
    const newMessages = [...messages, { role: "user", content: userQuery }];
    setMessages(newMessages);

    // 2. Add empty assistant placeholder for streaming
    const aiMsgId = Date.now();
    setMessages(prev => [...prev, { id: aiMsgId, role: "assistant", content: "" }]);
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8001/api/ai/mentor/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_query: userQuery,
          current_stage: currentStage || "ideation",
          workspace_context: workspaceContext || {}
        })
      });

      if (!response.ok) throw new Error("Streaming failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        accumulatedText += decoder.decode(value, { stream: true });

        setMessages(prev =>
          prev.map(msg => (msg.id === aiMsgId ? { ...msg, content: accumulatedText } : msg))
        );
      }
    } catch (err) {
      console.error("Streaming error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="ai-drawer-fab"
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Mentor chat drawer"
      >
        💬 AI Mentor
      </button>

      {isOpen && <div className="ai-drawer-backdrop" onClick={() => setIsOpen(false)} />}

      <aside className={`ai-drawer${isOpen ? " ai-drawer-open" : ""}`}>
        <div className="ai-drawer-header">
          <h3>✦ Socratic AI Mentor</h3>
          <button
            type="button"
            className="ai-drawer-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close mentor drawer"
          >
            ×
          </button>
        </div>

        <div className="ai-mentor-chat-body" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <ChatThread messages={messages} />
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-mentor-input-area" style={{ padding: "1rem", borderTop: "1px solid #eee" }}>
          <textarea
            className="ai-drawer-textarea"
            rows={2}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask for feedback or guidance..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button
            type="button"
            className="ai-drawer-action-button"
            onClick={handleSendMessage}
            disabled={!inputQuery.trim() || isLoading}
            style={{ marginTop: "0.5rem" }}
          >
            {isLoading ? "Thinking..." : "Send Message"}
          </button>
        </div>
      </aside>
    </>
  );
}

export default AiMentorDrawer;