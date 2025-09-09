"use client";

import { useEffect, useState } from "react";
import io from "socket.io-client";

interface Message {
  from: string;
  to: string;
  text: string;
}

let socket: any;

export default function LiveSmsCheck() {
  const [toUser, setToUser] = useState("user2");
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!socket) {
      socket = io("ws://localhost:3000", { query: { user: toUser } });

      socket.on("connect", () => console.log(`Connected as ${toUser}`));

      socket.on("new_message", (msg: Message) => {
        console.log("Live SMS received:", msg);
        setMessages((prev) => [...prev, msg]);
      });
    }

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [toUser]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Live SMS Check</h2>
      <div>
        <label>Listening as user: </label>
        <input value={toUser} onChange={(e) => setToUser(e.target.value)} />
      </div>

      <h3>Received Messages:</h3>
      <ul>
        {messages.map((msg, i) => (
          <li key={i}>
            {msg.from} → {msg.to}: {msg.text}
          </li>
        ))}
      </ul>

      <p>
        ✅ Send messages from Postman or another client to <b>{toUser}</b>
      </p>
    </div>
  );
}
