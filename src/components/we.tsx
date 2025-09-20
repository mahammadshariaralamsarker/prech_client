import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

let socket;

export default function ChatPage2() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const receiverId = "68b02ed0ef72f1fb10b7bd56";
  const userId = "68a416c9fe3dff9e6c5f46e2";

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Connect socket
    socket = io("http://147.93.29.211:5032", {
      query: { user: userId },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log(`Connected as ${userId}, socket id: ${socket.id}`);
    });

    // Receive message
    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Error handling
    socket.on("error", (err) => {
      console.error("Socket error:", err);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message
  const handleSend = () => {
    if (!input.trim()) return;
    socket.emit("send_message", {
      senderId: userId,
      toUserId: receiverId,
      content: input,
    });
    setInput("");
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h1>Chat with {receiverId}</h1>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 5,
          padding: 10,
          height: 400,
          overflowY: "scroll",
          marginBottom: 10,
          backgroundColor: "#f9f9f9",
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              textAlign: msg.senderId === userId ? "right" : "left",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "5px 10px",
                borderRadius: 12,
                backgroundColor: msg.senderId === userId ? "#a0e1e0" : "#ddd",
              }}
            >
              <b>{msg.senderId}:</b> {msg.text}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: "flex" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: 8,
            borderRadius: 5,
            border: "1px solid #ccc",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <button
          onClick={handleSend}
          style={{
            marginLeft: 10,
            padding: "8px 16px",
            borderRadius: 5,
            backgroundColor: "#0070f3",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
