import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function ChatThread({ messages }) {
  return (
    <div className="flex flex-col space-y-3 p-4 overflow-y-auto h-full">
      {messages.length === 0 && (
        <p className="ai-drawer-hint">Ask your mentor a question to get guidance on your current phase!</p>
      )}

      {messages.map((msg, index) => (
        <div 
          key={msg.id || index} 
          className={`chat-bubble ${msg.role}`} 
          style={{ 
            marginBottom: "1rem",
            maxWidth: "85%",
            padding: "0.75rem",
            borderRadius: "0.5rem",
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            backgroundColor: msg.role === "user" ? "#2563eb" : "#f3f4f6",
            color: msg.role === "user" ? "#ffffff" : "#111827"
          }}
        >
          <strong style={{ display: "block", marginBottom: "0.25rem" }}>
            {msg.role === "user" ? "You" : "Mentor"}:
          </strong>
          {msg.role === "assistant" ? (
            <ReactMarkdown>{msg.content || msg.text}</ReactMarkdown>
          ) : (
            <p style={{ margin: 0 }}>{msg.content || msg.text}</p>
          )}
        </div>
      ))}
    </div>
  );
}