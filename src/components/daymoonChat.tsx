"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import io from "socket.io-client";
import axios from "axios";

// ============================================
// TYPES & INTERFACES
// ============================================

interface Message {
  _id: string;
  from: string;
  to: string;
  text: string;
  messageType: "text" | "image" | "pdf";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  thumbnailUrl?: string;
  status: "sent" | "delivered" | "read";
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

interface User {
  _id: string;
  name?: string;
  fullName?: string;
  email: string;
  profile?: {
    avatar?: string;
  };
}

// ============================================
// API SERVICE
// ============================================

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  console.log(
    "Axios interceptor - Token from localStorage:",
    token ? "Exists" : "Not found"
  );
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log(
      "Axios interceptor - Authorization header set:",
      config.headers.Authorization
    );
  } else {
    console.warn("Axios interceptor - No token found in localStorage");
  }
  return config;
});

// Chat API methods
const chatAPI = {
  sendMessage: async (toUserId: string, content: string) => {
    const response = await api.post("/sms/send", { toUserId, content });
    return response.data;
  },

  uploadFile: async (toUserId: string, file: File, caption?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("toUserId", toUserId);
    if (caption) formData.append("caption", caption);

    const response = await api.post("/sms/file-upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  getMessages: async (userId: string) => {
    const response = await api.get(`/sms/list?user=${userId}`);
    return response.data;
  },

  getAllUsers: async () => {
    const response = await api.get("/sms/all-users");
    return response.data;
  },

  markAsRead: async (fromUserId: string) => {
    const response = await api.post("/sms/mark-as-read", { fromUserId });
    return response.data;
  },
};

// ============================================
// SOCKET SERVICE
// ============================================

let socket: ReturnType<typeof io> | null = null;

const connectSocket = (userId: string) => {
  socket = io(WS_URL, {
    query: { user: userId },
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket?.id);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected");
  });

  return socket;
};

const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// ============================================
// MAIN CHAT COMPONENT
// ============================================

export default function DaymoonChat() {
  // Current user (hardcoded for demo - replace with auth)
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserName, setCurrentUserName] = useState<string>("");

  // Chat state
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Typing and connection indicators
  const [typingByUser, setTypingByUser] = useState<Record<string, boolean>>({});
  const [socketConnected, setSocketConnected] = useState(false);

  // Input state
  const [messageText, setMessageText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Login state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // AUTO-SCROLL
  // ============================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ============================================
  // LOGIN
  // ============================================

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Call your auth API
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: loginEmail,
        password: loginPassword,
      });

      console.log("Full API response:", response);
      console.log("Response data:", response.data);
      console.log("Response data keys:", Object.keys(response.data));

      // Handle different response structures
      let token, user;

      if (response.data.token && response.data.user) {
        // Standard structure: { token, user }
        token = response.data.token;
        user = response.data.user;
      } else if (response.data.data) {
        // Nested structure: { data: { access_token, user } } or { data: { token, user } }
        console.log("Nested data structure detected:", response.data.data);
        token =
          response.data.data.access_token ||
          response.data.data.accessToken ||
          response.data.data.token;
        user = response.data.data.user || response.data.data;
      } else if (response.data.accessToken || response.data.access_token) {
        // Alternative token name: { accessToken, user } or { access_token, user }
        token = response.data.access_token || response.data.accessToken;
        user = response.data.user;
      } else if (response.data._id) {
        // Maybe the whole response.data is the user object
        console.log("Response.data appears to be the user object");
        user = response.data;
        token =
          response.headers?.authorization || response.headers?.Authorization;
      } else {
        console.error("Unknown response structure:", response.data);
        throw new Error(
          "Unable to parse login response. Check console for details."
        );
      }

      console.log("Extracted token:", token);
      console.log("Extracted user:", user);

      // Check if token and user exist
      if (!token) {
        console.error("Token validation failed. Token:", token);
        throw new Error(
          "No token received from server. Check console for details."
        );
      }

      if (!user || !user._id) {
        console.error("User validation failed. User object:", user);
        throw new Error(
          "Invalid user data received from server. Check console for details."
        );
      }

      // Store token and user info
      localStorage.setItem("token", token);
      localStorage.setItem("userId", user._id);
      localStorage.setItem(
        "userName",
        user.name || user.fullName || user.email
      );

      setCurrentUserId(user._id);
      setCurrentUserName(user.name || user.fullName || user.email);
      setIsLoggedIn(true);

      // Connect socket
      connectSocket(user._id);

      // Load users
      loadUsers();
    } catch (error) {
      console.error(
        "Login error:",
        error instanceof Error ? error.message : String(error)
      );
      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", error.response?.data);
      }
      alert("Login failed! Check credentials and console for details.");
    }
  };

  // ============================================
  // LOAD USERS
  // ============================================

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log(
        "Loading users with token:",
        token ? "Token exists" : "No token found"
      );

      const response = await chatAPI.getAllUsers();
      console.log("Users API response:", response);

      // Handle different response structures
      let usersList;
      if (Array.isArray(response)) {
        // Direct array: [user1, user2, ...]
        usersList = response;
      } else if (response.data && Array.isArray(response.data)) {
        // Nested in data: { data: [user1, user2, ...] }
        usersList = response.data;
      } else if (response.users && Array.isArray(response.users)) {
        // Nested in users: { users: [user1, user2, ...] }
        usersList = response.users;
      } else {
        console.error("Unknown users response structure:", response);
        usersList = [];
      }

      console.log("Parsed users list:", usersList);
      setUsers(usersList);
    } catch (error) {
      console.error("Error loading users:", error);
      if (axios.isAxiosError(error)) {
        console.error("Status:", error.response?.status);
        console.error("Response data:", error.response?.data);
        console.error("Request headers:", error.config?.headers);
      }
    }
  };

  // ============================================
  // LOAD MESSAGES
  // ============================================

  const loadMessages = async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await chatAPI.getMessages(userId);
      console.log("Messages API response:", response);

      // Handle different response structures
      let messagesList;
      if (Array.isArray(response)) {
        // Direct array: [message1, message2, ...]
        messagesList = response;
      } else if (response.data && Array.isArray(response.data)) {
        // Nested in data: { data: [message1, message2, ...] }
        messagesList = response.data;
      } else if (response.messages && Array.isArray(response.messages)) {
        // Nested in messages: { messages: [message1, message2, ...] }
        messagesList = response.messages;
      } else {
        console.error("Unknown messages response structure:", response);
        messagesList = [];
      }

      console.log("Parsed messages list:", messagesList);
      setMessages(messagesList);
    } catch (error) {
      console.error("Error loading messages:", error);
      setMessages([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // SELECT USER
  // ============================================

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    loadMessages(user._id);
  };

  // ============================================
  // SOCKET LISTENERS
  // ============================================

  useEffect(() => {
    if (!isLoggedIn || !currentUserId) return;

    const s = connectSocket(currentUserId);

    // Track socket connection status for UI badge
    setSocketConnected(s.connected);
    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);

    // Listen for new messages
    s.on("receive_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);

      // Auto-mark as read if chat is open
      if (selectedUser && message.from === selectedUser._id) {
      }
    });

    // Listen for typing indicator
    s.on("user_typing", (data: { userId: string; isTyping: boolean }) => {
      console.log("Typing event received:", data);
      // Update per-user typing map for sidebar
      setTypingByUser((prev) => ({ ...prev, [data.userId]: data.isTyping }));

      // Update header indicator for active chat
      if (selectedUser && data.userId === selectedUser._id) {
        setIsTyping(data.isTyping);
      }

      // Safety auto-clear after 3 seconds
      if (data.isTyping) {
        setTimeout(() => {
          setTypingByUser((prev) => ({ ...prev, [data.userId]: false }));
          if (selectedUser && data.userId === selectedUser._id) {
            setIsTyping(false);
          }
        }, 3000);
      }
    });

    // Listen for status updates
    s.on(
      "message_status_updated",
      (data: { messageId: string; status: "sent" | "delivered" | "read" }) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === data.messageId ? { ...msg, status: data.status } : msg
          )
        );
      }
    );

    // Listen for read receipts
    s.on("messages_read", (data: { readBy: string }) => {
      if (selectedUser && data.readBy === selectedUser._id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.from === currentUserId && msg.to === selectedUser._id
              ? { ...msg, status: "read", isRead: true }
              : msg
          )
        );
      }
    });

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("receive_message");
      s.off("user_typing");
      s.off("message_status_updated");
      s.off("messages_read");
      disconnectSocket();
    };
  }, [isLoggedIn, currentUserId, selectedUser]);

  // ============================================
  // SEND MESSAGE
  // ============================================

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) return;

    try {
      if (selectedFile) {
        // Upload file
        setIsUploading(true);
        // Optionally, you can optimistically add a file message here as well
        await chatAPI.uploadFile(selectedUser._id, selectedFile, messageText);
        setSelectedFile(null);
        setMessageText("");
      } else if (messageText.trim()) {
        // Send text message
        const tempId = `local-${Date.now()}`;
        const newMessage: Message = {
          _id: tempId,
          from: currentUserId,
          to: selectedUser._id,
          text: messageText,
          messageType: "text",
          status: "sent",
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, newMessage]);
        await chatAPI.sendMessage(selectedUser._id, messageText);
        setMessageText("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setIsUploading(false);
    }
  };

  // ============================================
  // TYPING INDICATOR
  // ============================================

  const handleTyping = () => {
    if (!socket || !selectedUser) {
      console.log("❌ Cannot emit typing: socket or selectedUser missing");
      return;
    }

    console.log("✅ Emitting typing_start to:", selectedUser._id);

    socket.emit("typing_start", {
      userId: currentUserId,
      toUserId: selectedUser._id,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      console.log("✅ Auto-emitting typing_stop");
      socket?.emit("typing_stop", {
        userId: currentUserId,
        toUserId: selectedUser._id,
      });
    }, 2000);
  };

  // ============================================
  // FILE SELECTION
  // ============================================

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    const maxSize = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024;

    if (!isImage && !isPdf) {
      alert("Only images (JPG, PNG, WebP) and PDFs are allowed");
      return;
    }

    if (file.size > maxSize) {
      alert(`File too large. Max ${maxSize / 1024 / 1024}MB`);
      return;
    }

    setSelectedFile(file);
  };

  // ============================================
  // FORMAT TIME
  // ============================================

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ============================================
  // RENDER MESSAGE
  // ============================================

  const renderMessage = (message: Message) => {
    const isSentByMe = message.from === currentUserId;

    return (
      <div
        key={message._id}
        className={`flex mb-4 ${isSentByMe ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`max-w-[75%] px-4 py-2 shadow ${
            isSentByMe
              ? "bg-[#0084ff] text-white rounded-2xl rounded-br-sm"
              : "bg-white text-gray-900 border border-gray-200 rounded-2xl rounded-bl-sm"
          }`}
        >
          {/* Message content */}
          {message.messageType === "text" && (
            <p className="break-words">{message.text}</p>
          )}

          {message.messageType === "image" && message.fileUrl && (
            <div>
              <Image
                src={message.fileUrl}
                alt={message.fileName || "image"}
                width={512}
                height={512}
                className="max-w-sm h-auto w-auto rounded cursor-pointer"
                unoptimized
                onClick={() => window.open(message.fileUrl as string, "_blank")}
              />
              {message.text && <p className="mt-2">{message.text}</p>}
            </div>
          )}

          {message.messageType === "pdf" && (
            <div>
              <a
                href={message.fileUrl}
                download={message.fileName}
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                <span>📄</span>
                <span>{message.fileName}</span>
              </a>
              <p className="text-xs mt-1">
                {((message.fileSize || 0) / 1024 / 1024).toFixed(2)} MB
              </p>
              {message.text && <p className="mt-2">{message.text}</p>}
            </div>
          )}

          {/* Footer */}
          <div
            className={`flex items-center mt-1 text-[10px] opacity-70 ${
              isSentByMe ? "justify-end" : "justify-start"
            }`}
          >
            <span className="whitespace-nowrap">
              {formatTime(message.createdAt)}
            </span>
            {isSentByMe && (
              <span className="ml-2">
                {message.status === "sent" && "✓"}
                {message.status === "delivered" && "✓✓"}
                {message.status === "read" && (
                  <span className="text-blue-300">✓✓</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // TYPING BUBBLE (Messenger-like)
  // ============================================

  const TypingBubble = () => (
    <div className="flex mb-4 justify-start">
      <div className="max-w-[60%] px-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-2xl rounded-bl-sm shadow">
        <div className="flex items-center gap-1">
          <span
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "100ms" }}
          />
          <span
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "200ms" }}
          />
        </div>
      </div>
    </div>
  );

  // ============================================
  // RENDER LOGIN
  // ============================================

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg w-96">
          <h1 className="text-2xl font-bold mb-6 text-center">Chat Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER CHAT
  // ============================================

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - User List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-green-600 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">💬 Chats</h2>
            <p className="text-sm opacity-90">{currentUserName}</p>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded ${
              socketConnected ? "bg-green-800" : "bg-gray-500"
            }`}
          >
            {socketConnected ? "Connected" : "Offline"}
          </span>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          {users.map((user) => (
            <div
              key={user._id}
              onClick={() => handleSelectUser(user)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                selectedUser?._id === user._id ? "bg-green-50" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
                  {(user.name || user.fullName || user.email)
                    ?.charAt(0)
                    .toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {user.name || user.fullName || "Unknown"}
                  </h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  {typingByUser[user._id] && (
                    <p className="text-xs text-green-600 animate-pulse">
                      typing...
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
                  {(
                    selectedUser.name ||
                    selectedUser.fullName ||
                    selectedUser.email
                  )
                    ?.charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold">
                    {selectedUser.name || selectedUser.fullName || "Unknown"}
                  </h3>
                  {isTyping && (
                    <p className="text-sm text-green-600 animate-pulse">
                      typing...
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setIsLoggedIn(false);
                  localStorage.clear();
                  disconnectSocket();
                }}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Logout
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">Loading messages...</div>
                </div>
              ) : (
                <>
                  {messages.map(renderMessage)}
                  {/* Messenger-like typing bubble under the last message */}
                  {isTyping && selectedUser && <TypingBubble />}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
              {/* File Preview */}
              {selectedFile && (
                <div className="mb-3 p-3 bg-gray-100 rounded-lg flex items-center justify-between">
                  <span className="text-sm">{selectedFile.name}</span>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                {/* File Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                >
                  📎
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Text Input */}
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    if (selectedUser && socket) {
                      handleTyping();
                    }
                  }}
                  disabled={!isLoggedIn || !selectedUser || !socket}
                  title={
                    !isLoggedIn
                      ? "Please log in to chat"
                      : !selectedUser
                      ? "Select a user to start chatting"
                      : !socket
                      ? "Connecting to chat..."
                      : ""
                  }
                  onBlur={() => {
                    if (socket && selectedUser) {
                      socket.emit("typing_stop", {
                        userId: currentUserId,
                        toUserId: selectedUser._id,
                      });
                    }
                  }}
                  placeholder={
                    selectedFile
                      ? "Add caption (optional)"
                      : "Type a message..."
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={
                    (!messageText.trim() && !selectedFile) || isUploading
                  }
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isUploading ? "⏳" : "Send"}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <h3 className="text-xl font-semibold mb-2">
                Select a user to start chatting
              </h3>
              <p>Choose from the list on the left</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
