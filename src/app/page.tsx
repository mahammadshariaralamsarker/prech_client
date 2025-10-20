"use client";
import AlvaaroTiktokLogin from "@/components/AlvaaroTiktok";
import DaymoonChat from "@/components/daymoonChat";
import ChatComponent from "@/components/daymoonV2";
import DaymoonChatv2 from "@/components/daymoonV2";
import FacebookButton from "@/components/FacebookButton";
import OutmanziziV2 from "@/components/outmanV2";
import Outmanzizi from "@/components/outmanzizi";
import PaymentStripePage from "@/components/PaymentStripe";
import TikTokLogin from "@/components/TiktokLogin";
import ChatPage2 from "@/components/we";
import WebSocket from "@/components/websocket";
import ChatPage from "@/components/websocket2";
import React from "react";

const Page = () => {
  return (
    <div>
      {/* <PaymentStripePage /> */}
      {/* <FacebookButton /> */}
      {/* <TikTokLogin /> */}
      {/* <AlvaaroTiktokLogin /> */}
      {/* <WebSocket /> */}
      {/* <h1 className="text-2xl font-bold mb-4">WebSocket Chat</h1> */}
      {/* <ChatPage /> */}
      {/* <ChatPage2 /> */}
      {/* <Outmanzizi /> */}
      {/* <DaymoonChat /> */}
      {/* <OutmanziziV2 /> */}
      <ChatComponent />
    </div>
  );
};

export default Page;
