// components/GoogleLogin.tsx
import React from "react";

const GOOGLE_AUTH_URL = "http://localhost:3000/auth/google";
// const REDIRECT_URL = "http://localhost:3000/login/success"; // Your SPA route to handle token

const Outmanzizi: React.FC = () => {
  const handleGoogleLogin = () => {
    // Open a popup for Google login
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      GOOGLE_AUTH_URL,
      "Google Login",
      `width=${width},height=${height},top=${top},left=${left}`
    );

    // Listen for message from popup (backend redirects with JWT)
    const receiveMessage = (event: MessageEvent) => {
      if (event.origin !== "http://localhost:3000") return; // secure origin check
      const { token } = event.data;
      if (token) {
        console.log("Received JWT:", token);
        localStorage.setItem("token", token); // store JWT
        window.removeEventListener("message", receiveMessage);
      }
    };

    window.addEventListener("message", receiveMessage, false);
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="px-4 py-2 bg-blue-500 text-white rounded"
    >
      Login with Google
    </button>
  );
};

export default Outmanzizi;
