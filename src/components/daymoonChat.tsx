"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Paperclip, FileText, Check, CheckCheck, X } from "lucide-react";
import io, { Socket } from "socket.io-client";

const API_BASE = "http://localhost:3000";
const SOCKET_URL = "http://localhost:3000/chat";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: "TEXT" | "IMAGE" | "PDF";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  createdAt: string;
  conversationId: string;
}

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    email?: string;
  };
  lastMessage?: string;
  lastMessageAt?: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    userExists: {
      id: string;
      email: string;
      name: string;
      phone: string;
      role: string;
      isActive: boolean;
      isEmailVerified: boolean;
    };
  };
}

const DaymoonChat = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [token, setToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineUsers, setOnlineUsers] = useState(new Set<string>());
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ===== LOGIN =====
  const handleLogin = async () => {
    if (!emailInput || !passwordInput) {
      alert("Please enter both email and password");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, password: passwordInput }),
      });

      const data: LoginResponse = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Login failed");
      }

      const userIdFromServer = data.data.userExists.id;
      const tokenFromServer = data.data.token;
      const userNameFromServer = data.data.userExists.name;

      setUserId(userIdFromServer);
      setToken(tokenFromServer);
      setUserName(userNameFromServer);
      setIsAuthenticated(true);

      // Fetch conversations after login
      await fetchConversations(tokenFromServer);
    } catch (err: any) {
      console.error("Login error:", err);
      alert("Login failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== FETCH CONVERSATIONS =====
  const fetchConversations = async (authToken?: string) => {
    try {
      const res = await fetch(`${API_BASE}/chat/conversations`, {
        headers: { Authorization: `Bearer ${authToken || token}` },
      });
      const data = await res.json();

      if (data.success) {
        setConversations(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    }
  };

  // ===== FETCH MESSAGES =====
  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`${API_BASE}/chat/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationId, page: 1, limit: 50 }),
      });
      const data = await res.json();

      if (data.success) {
        setMessages(data.data?.messages || []);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  // ===== UPDATE CONVERSATION =====
  const updateConversationLastMessage = useCallback((msg: Message) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === msg.conversationId
          ? {
              ...c,
              lastMessage: msg.content,
              lastMessageAt: msg.createdAt,
            }
          : c
      )
    );
  }, []);

  // ===== SOCKET.IO CONNECTION =====
  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const newSocket = io(SOCKET_URL, {
      query: { userId },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected");
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    newSocket.on("new_message", (msg: Message) => {
      console.log("📨 New message:", msg);
      setMessages((prev) => [...prev, msg]);
      updateConversationLastMessage(msg);
    });

    newSocket.on("message_updated", (msg: Message) => {
      console.log("✏️ Message updated:", msg);
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
    });

    newSocket.on("message_deleted", ({ messageId }: { messageId: string }) => {
      console.log("🗑️ Message deleted:", messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    newSocket.on(
      "user_online",
      ({ userId: onlineUserId }: { userId: string }) => {
        console.log("🟢 User online:", onlineUserId);
        setOnlineUsers((prev) => new Set(prev).add(onlineUserId));
      }
    );

    newSocket.on(
      "user_offline",
      ({ userId: offlineUserId }: { userId: string }) => {
        console.log("⚫ User offline:", offlineUserId);
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(offlineUserId);
          return newSet;
        });
      }
    );

    newSocket.on("connect_error", (error: any) => {
      console.error("🔴 Socket error:", error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [isAuthenticated, userId, updateConversationLastMessage]);

  // ===== SEND MESSAGE =====
  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const temp = messageInput;
    setMessageInput("");

    try {
      const res = await fetch(`${API_BASE}/chat/messages/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: selectedConversation.otherUser.id,
          content: temp,
          messageType: "TEXT",
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [...prev, data.data]);
        updateConversationLastMessage(data.data);
      } else {
        setMessageInput(temp);
        alert("Failed to send message");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setMessageInput(temp);
      alert("Error sending message");
    }
  };

  // ===== FILE UPLOAD =====
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("receiverId", selectedConversation.otherUser.id);
    formData.append(
      "fileType",
      file.type.startsWith("image/") ? "IMAGE" : "PDF"
    );
    formData.append("caption", file.name);

    try {
      const res = await fetch(`${API_BASE}/chat/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [...prev, data.data]);
        updateConversationLastMessage(data.data);
      } else {
        alert("File upload failed");
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("File upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ===== SELECT CONVERSATION =====
  const handleSelectConversation = async (conv: Conversation) => {
    setSelectedConversation(conv);
    await fetchMessages(conv.id);
  };

  // ===== FILTER CONVERSATIONS =====
  const filteredConversations = conversations.filter((c) =>
    c.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ===== FORMAT TIME =====
  const formatTime = (date: string) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ===== LOGIN SCREEN =====
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Send className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">Sign in to continue chatting</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && !isLoading && handleLogin()
                }
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:opacity-50"
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== CHAT SCREEN =====
  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-white">Messages</h1>
              <p className="text-xs text-white/80">{userName}</p>
            </div>
            <div className="text-xs text-white/80">
              {socket?.connected ? "🟢 Connected" : "⚫ Disconnected"}
            </div>
          </div>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/90 focus:bg-white outline-none text-sm"
          />
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isOnline = onlineUsers.has(conv.otherUser?.id);
              const isSelected = selectedConversation?.id === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-lg">
                        {conv.otherUser?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {conv.otherUser?.name || "Unknown"}
                        </h3>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatTime(conv.lastMessageAt || "")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {conv.lastMessage || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold">
                  {selectedConversation.otherUser?.name?.[0]?.toUpperCase() ||
                    "?"}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {selectedConversation.otherUser?.name || "Unknown"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {onlineUsers.has(selectedConversation.otherUser?.id)
                      ? "🟢 Online"
                      : "⚫ Offline"}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isSent = msg.senderId === userId;

                  // Ensure content is always a string
                  const messageContent =
                    typeof msg.content === "string"
                      ? msg.content
                      : JSON.stringify(msg.content);

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        isSent ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div className="max-w-md">
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isSent
                              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                              : "bg-white text-gray-900 border border-gray-200"
                          }`}
                        >
                          {/* IMAGE */}
                          {msg.messageType === "IMAGE" && msg.fileUrl && (
                            <img
                              src={msg.fileUrl}
                              alt="Shared image"
                              className="rounded-lg mb-2 max-w-full cursor-pointer hover:opacity-90"
                              onClick={() => window.open(msg.fileUrl, "_blank")}
                            />
                          )}

                          {/* PDF */}
                          {msg.messageType === "PDF" && msg.fileUrl && (
                            <a
                              href={msg.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center space-x-2 mb-2 p-2 rounded transition-colors ${
                                isSent
                                  ? "bg-white/20 hover:bg-white/30"
                                  : "bg-gray-100 hover:bg-gray-200"
                              }`}
                            >
                              <FileText size={20} />
                              <span className="text-sm font-medium truncate">
                                {msg.fileName || "Document.pdf"}
                              </span>
                            </a>
                          )}

                          {/* TEXT CONTENT - MUST BE STRING */}
                          <p className="break-words whitespace-pre-wrap">
                            {messageContent}
                          </p>
                        </div>

                        {/* Timestamp & Read Receipt */}
                        <div
                          className={`flex items-center space-x-1 mt-1 text-xs text-gray-500 ${
                            isSent ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span>{formatTime(msg.createdAt)}</span>
                          {isSent && (
                            <span className="text-blue-500">
                              {msg.isRead ? (
                                <CheckCheck size={14} />
                              ) : (
                                <Check size={14} />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-colors"
                  title="Upload file"
                >
                  <Paperclip size={20} className="text-gray-600" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  accept="image/*,.pdf"
                  className="hidden"
                />
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !isUploading &&
                    sendMessage()
                  }
                  placeholder="Type a message..."
                  disabled={isUploading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || isUploading}
                  className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Send message"
                >
                  <Send size={20} />
                </button>
              </div>
              {isUploading && (
                <div className="mt-2 text-sm text-gray-500 text-center animate-pulse">
                  Uploading file...
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Send className="text-blue-500" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Select a conversation
              </h2>
              <p className="text-gray-600">
                Choose a conversation from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DaymoonChat;
