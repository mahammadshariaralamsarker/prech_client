"use client";
import AlvaaroTiktokLogin from "@/components/AlvaaroTiktok";
import FacebookButton from "@/components/FacebookButton";
import PaymentStripePage from "@/components/PaymentStripe";
import TikTokLogin from "@/components/TiktokLogin";
import WebSocket from "@/components/websocket";
import React from "react";

const Page = () => {
  return (
    <div>
      {/* <PaymentStripePage /> */}
      {/* <FacebookButton /> */}
      {/* <TikTokLogin /> */}
      {/* <AlvaaroTiktokLogin /> */}
      <WebSocket />
    </div>
  );
};

export default Page;
