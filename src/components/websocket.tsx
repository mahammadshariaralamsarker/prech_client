"use client";

import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";

interface Message {
  from?: string;
  to: string;
  text: string;
  isSentByCurrentUser?: boolean;
  files?: string;
  createdAt?: string;
}

export default function LiveSmsCheck() {
  const [toUser, setToUser] = useState("user2");
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [replyTo, setReplyTo] = useState("user1");
  const [socket, setSocket] = useState<Socket | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ✅ Socket connect
  useEffect(() => {
    const newSocket = io("ws://localhost:3000", { query: { user: toUser } });
    setSocket(newSocket);

    newSocket.on("connect", () => console.log(`✅ Connected as ${toUser}`));

    newSocket.on("disconnect", () => console.log("❌ Disconnected"));

    newSocket.on("new_message", (msg: any) => {
      if (!msg) return;
      console.log("📩 Live SMS received:", msg);
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [toUser]);

  // ✅ Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Send message (via API + socket)
  const sendReply = async () => {
    if (!replyText.trim()) return;

    const payload = {
      to: replyTo,
      text: replyText,
    };

    try {
      // 🔹 Call backend API
      const res = await fetch("http://localhost:3000/api/v1/sms/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGJmY2IzNGFkZDg5ZmM1YzcyMGNkN2YiLCJlbWFpbCI6InNlbGxlckBnbWFpbC5jb20iLCJyb2xlIjoiU2VsbGVyIiwiaWF0IjoxNzU4MDE5OTE5LCJleHAiOjE3NTgxMDYzMTl9.maETpYf9S75bcdgwtLmXxCOY6Tu97MguvrRRsyQcLg4"}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        const newMessage: Message = {
          ...payload,
          isSentByCurrentUser: true,
          createdAt: new Date().toISOString(),
        };

        // 🔹 Show immediately in UI
        setMessages((prev) => [...prev, newMessage]);

        // 🔹 Emit via socket (real-time sync)
        if (socket && socket.connected) {
          socket.emit("send_message", newMessage);
        } else {
          console.warn("⚠️ Socket not connected, only API updated UI.");
        }
      }
    } catch (error) {
      console.error("❌ Error sending SMS:", error);
    }

    setReplyText("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-100 p-6">
      <div className="w-full max-w-lg bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-indigo-600 text-white flex flex-col gap-1">
          <h2 className="text-lg font-bold tracking-wide">📡 Live SMS</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-80">Listening as:</span>
            <input
              value={toUser}
              onChange={(e) => setToUser(e.target.value)}
              className="px-2 py-1 rounded-md text-sm text-black w-32 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
          {messages.length === 0 && (
            <p className="text-center text-gray-400 text-sm mt-10">
              No messages yet... 🚀
            </p>
          )}

          {messages.map((msg, i) => {
            if (!msg) return null; // guard undefined
            const isMe = msg.isSentByCurrentUser ?? false;
            return (
              <div
                key={i}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`relative p-3 rounded-2xl shadow-md max-w-[75%] ${
                    isMe
                      ? "bg-indigo-500 text-white rounded-br-none"
                      : "bg-gray-200 text-gray-900 rounded-bl-none"
                  }`}
                >
                  {/* Message */}
                  <p className="text-sm leading-snug">{msg.text}</p>

                  {/* File Attachment */}
                  {msg.files && (
                    <a
                      href={msg.files}
                      target="_blank"
                      rel="noreferrer"
                      className={`block mt-2 text-xs underline ${
                        isMe ? "text-gray-200" : "text-indigo-600"
                      }`}
                    >
                      📎 Attachment
                    </a>
                  )}

                  {/* Timestamp */}
                  {msg.createdAt && (
                    <span
                      className={`absolute -bottom-4 text-[10px] ${
                        isMe
                          ? "right-2 text-indigo-400"
                          : "left-2 text-gray-500"
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Section */}
        <div className="p-4 border-t bg-white flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">
              Reply To:
            </label>
            <input
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              className="flex-1 px-3 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-indigo-400"
              placeholder="recipient username"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-full text-sm focus:ring-2 focus:ring-indigo-400"
              placeholder="Type your reply..."
            />
            <button
              onClick={sendReply}
              className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition shadow"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
