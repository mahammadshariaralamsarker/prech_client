"use client";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import sha256 from "crypto-js/sha256";
import Base64 from "crypto-js/enc-base64";
import FacebookButton from "@/components/FacebookButton";

const clientKey = "sbawtbqug63mru0371";
const redirectUri =
  "https://cobra-humorous-sharply.ngrok-free.app/auth/tiktok/callback";

function base64UrlEncode(str: string) {
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateCodeChallenge(codeVerifier: string): string {
  const hash = sha256(codeVerifier);
  return base64UrlEncode(Base64.stringify(hash));
}

const TikTokLogin = () => {
  const handleLogin = async () => {
    const codeVerifier = uuidv4() + uuidv4();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = uuidv4();

    localStorage.setItem("tiktok_code_verifier", codeVerifier);
    localStorage.setItem("tiktok_state", state);
    const url = `https://www.tiktok.com/v2/auth/authorize?client_key=${clientKey}&response_type=code&scope=${encodeURIComponent(
      "video.upload,video.publish,user.info.basic,video.list"
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

    window.location.href = url;
  };

  return (
    <div>
      <button className="bg-red-400 m-12 p-8" onClick={handleLogin}>
        Login with TikTok
      </button>

      <FacebookButton />
    </div>
  );
};

export default TikTokLogin;
