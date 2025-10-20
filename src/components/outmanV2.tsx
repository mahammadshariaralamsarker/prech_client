"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export default function OutmanziziV2() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState<{ text: string; from: string }[]>([]);
  const userId = "user1"; // এখানে তুমি dynamic ভাবে userId দিতে পারবে

  // Connect Socket
  useEffect(() => {
    const newSocket = io("http://localhost:3000/chat", {
      query: { userId },
      transports: ["websocket"], // recommended for NestJS gateway
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("✅ Connected to WebSocket:", newSocket.id);
    });

    newSocket.on("new_message", (msg) => {
      console.log("💬 Received:", msg);
      setChatLog((prev) => [...prev, { text: msg.text, from: msg.from }]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  // Send message to server
  const sendMessage = () => {
    if (!socket || !message) return;
    socket.emit("send_message", { text: message, from: userId });
    setChatLog((prev) => [...prev, { text: message, from: "You" }]);
    setMessage("");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        maxWidth: "400px",
        margin: "50px auto",
        fontFamily: "sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center" }}>💬 Next.js Chat</h2>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "10px",
          height: "300px",
          overflowY: "auto",
          marginBottom: "10px",
        }}
      >
        {chatLog.map((msg, i) => (
          <div
            key={i}
            style={{
              margin: "5px 0",
              textAlign: msg.from === "You" ? "right" : "left",
            }}
          >
            <b>{msg.from}:</b> {msg.text}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          style={{
            flex: 1,
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: "8px 12px",
            background: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
