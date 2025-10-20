import { useState, useEffect, useRef } from "react";
import { Send, User, MessageCircle, AlertCircle } from "lucide-react";

export default function ChatComponent() {
  const [ws, setWs] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [currentUserId, setCurrentUserId] = useState(
    "68b3be0e971a14f61c0e7933"
  );
  const [isConnected, setIsConnected] = useState(false);
  const [wsError, setWsError] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Get current user ID from token on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const userId = payload.userId || payload.sub || payload.id || "";
        if (userId) {
          setCurrentUserId(userId);
        }
        console.log("Current User ID from token:", userId);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (!currentUserId) return;

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws) {
        ws.close();
      }
    };
  }, [currentUserId]);

  const connectWebSocket = () => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      return;
    }

    try {
      const socket = new WebSocket(`ws://localhost:3000?user=${currentUserId}`);

      socket.onopen = () => {
        console.log("Connected to WebSocket");
        setIsConnected(true);
        setWsError(null);
        reconnectAttemptsRef.current = 0;
      };

      socket.onclose = () => {
        console.log("Disconnected from WebSocket");
        setIsConnected(false);

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 3000);
        } else {
          setWsError("WebSocket connection failed. Using HTTP only.");
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.event === "receive_message") {
            setMessages((prev) => [...prev, data.data]);
          } else if (data.event === "error") {
            console.error("Socket error:", data.data);
            alert(data.data.message);
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };

      setWs(socket);
    } catch (error) {
      console.error("WebSocket connection error:", error);
      setWsError("WebSocket not available. Using HTTP only.");
    }
  };

  // Load all users
  useEffect(() => {
    if (currentUserId) {
      fetchAllUsers();
    }
  }, [currentUserId]);

  // Load conversation when user is selected
  useEffect(() => {
    if (selectedUser && currentUserId) {
      const userId = selectedUser.id || selectedUser._id;
      if (userId) {
        fetchConversation(userId);
      }
    }
  }, [selectedUser, currentUserId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:3000/api/v1/sms/all-users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("All users response:", data);

      let usersList = [];

      if (Array.isArray(data)) {
        usersList = data;
      } else if (data && typeof data === "object") {
        if (Array.isArray(data.data)) {
          usersList = data.data;
        } else if (Array.isArray(data.users)) {
          usersList = data.users;
        } else if (data.success && Array.isArray(data.result)) {
          usersList = data.result;
        }
      }

      console.log("Processed users:", usersList);
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversation = async (userId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3000/api/v1/sms/list?user=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Conversation response:", data);

      let messagesList = [];

      if (Array.isArray(data)) {
        messagesList = data;
      } else if (data && typeof data === "object") {
        if (Array.isArray(data.data)) {
          messagesList = data.data;
        } else if (Array.isArray(data.messages)) {
          messagesList = data.messages;
        } else if (data.success && Array.isArray(data.result)) {
          messagesList = data.result;
        }
      }

      console.log("Processed messages:", messagesList);
      setMessages(messagesList);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedUser || !currentUserId) {
      console.log("Validation failed:", {
        messageInput,
        selectedUser,
        currentUserId,
      });
      return;
    }

    const toUserId = selectedUser.id || selectedUser._id;
    console.log("Selected user:", selectedUser);
    console.log("Extracted toUserId:", toUserId);

    if (!toUserId) {
      alert("Invalid user selected");
      return;
    }

    const toUserIdString = String(toUserId);
    const currentMessage = messageInput.trim();

    const tempMessage = {
      id: Date.now(),
      senderId: currentUserId,
      from: currentUserId,
      toUserId: toUserIdString,
      to: toUserIdString,
      content: currentMessage,
      text: currentMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);
    setMessageInput("");

    try {
      const token = localStorage.getItem("token");
      const requestBody = {
        toUserId: toUserIdString,
        content: currentMessage,
      };

      console.log("Request body before stringify:", requestBody);
      console.log("Request body stringified:", JSON.stringify(requestBody));

      const response = await fetch("http://localhost:3000/api/v1/sms/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      console.log("Send message response:", result);

      if (!response.ok) {
        console.error("Error details:", result);
        throw new Error(
          result.error?.message?.[0] ||
            result.message ||
            `HTTP error! status: ${response.status}`
        );
      }

      if (result.success && result.data) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempMessage.id ? result.data : msg))
        );
      } else if (result.data) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempMessage.id ? result.data : msg))
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
      setMessageInput(currentMessage);
      alert("Failed to send message: " + error.message);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Users List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            Messages
          </h2>
          <div className="mt-2 flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            <span className="text-sm text-gray-600">
              {isConnected ? "Connected" : "HTTP Mode"}
            </span>
          </div>
          {wsError && (
            <div className="mt-2 flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{wsError}</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && users.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-pulse">Loading users...</div>
            </div>
          ) : !users || users.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No conversations yet</p>
              <p className="text-xs mt-1">Send a message to start chatting</p>
            </div>
          ) : (
            users.map((user, index) => (
              <div
                key={user.id || user._id || index}
                onClick={() => setSelectedUser(user)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                  selectedUser?.id === user.id || selectedUser?._id === user._id
                    ? "bg-blue-50 border-l-4 border-l-blue-500"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                    {user.name?.[0]?.toUpperCase() ||
                      user.username?.[0]?.toUpperCase() || (
                        <User className="w-6 h-6" />
                      )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">
                      {user.name ||
                        user.username ||
                        user.id ||
                        user._id ||
                        "Unknown User"}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {user.lastMessage || "No messages"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                  {selectedUser.name?.[0]?.toUpperCase() ||
                    selectedUser.username?.[0]?.toUpperCase() || (
                      <User className="w-5 h-5" />
                    )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {selectedUser.name ||
                      selectedUser.username ||
                      selectedUser.id ||
                      selectedUser._id ||
                      "Unknown User"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {loading ? "Loading..." : "Click to view profile"}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {loading && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <div className="animate-pulse">Loading messages...</div>
                  </div>
                </div>
              ) : !messages || messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-2" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isSender =
                    msg.senderId === currentUserId ||
                    msg.from === currentUserId ||
                    msg.sender === currentUserId ||
                    msg.sender?.id === currentUserId ||
                    msg.sender?._id === currentUserId;

                  return (
                    <div
                      key={msg.id || msg._id || index}
                      className={`flex ${
                        isSender ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isSender
                            ? "bg-blue-500 text-white"
                            : "bg-white text-gray-800 border border-gray-200"
                        }`}
                      >
                        <p className="break-words">
                          {msg.content || msg.text || msg.message || ""}
                        </p>
                        {(msg.timestamp || msg.createdAt) && (
                          <p
                            className={`text-xs mt-1 ${
                              isSender ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            {new Date(
                              msg.timestamp || msg.createdAt
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!currentUserId}
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || !currentUserId}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-xl">
                Select a conversation to start messaging
              </p>
              <p className="text-sm mt-2 text-gray-400">
                Choose a user from the sidebar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
