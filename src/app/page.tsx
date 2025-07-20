"use client";

// import { useState } from "react";
// import { loadStripe } from "@stripe/stripe-js";
// import {
//   Elements,
//   useStripe,
//   useElements,
//   CardElement,
// } from "@stripe/react-stripe-js";

// // ✅ এটা আপনার Stripe publishable key
// const stripePromise = loadStripe(
//   "pk_test_51R5NAuFl8CziaLNQx7QIJNCLyaKvbyYlCEugM2OdotNm3j5oJNeBWNuIJPgBqMVVGko4DpnGogfxgX0CfYLPXM3500zToPfWCc"
// );

// const clientSecret =
//   "pi_3RhbG6Fl8CziaLNQ1EbG7Lb9_secret_ZWUnWh0DE4vUcwahgTd0DrSi8";

// const CARD_ELEMENT_OPTIONS = {
//   style: {
//     base: {
//       color: "#32325d",
//       fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
//       fontSmoothing: "antialiased",
//       fontSize: "16px",
//       "::placeholder": {
//         color: "#a0aec0",
//       },
//     },
//     invalid: {
//       color: "#fa755a",
//       iconColor: "#fa755a",
//     },
//   },
// };

// const ConfirmPaymentForm = ({ clientSecret }: { clientSecret: string }) => {
//   const stripe = useStripe();
//   const elements = useElements();

//   const [loading, setLoading] = useState(false);
//   const [errorMsg, setErrorMsg] = useState<string | null>(null);
//   const [successMsg, setSuccessMsg] = useState<string | null>(null);

//   const handleSubmit = async (event: React.FormEvent) => {
//     event.preventDefault();

//     if (!stripe || !elements) return;

//     const cardElement = elements.getElement(CardElement);
//     if (!cardElement) {
//       setErrorMsg("Card Element not found");
//       return;
//     }

//     setLoading(true);
//     setErrorMsg(null);
//     setSuccessMsg(null);

//     const result = await stripe.confirmCardPayment(clientSecret, {
//       payment_method: {
//         card: cardElement,
//         billing_details: {
//           name: "Customer Name",
//         },
//       },
//     });
//     console.log(result);
//     setLoading(false);

//     if (result.error) {
//       setErrorMsg(result.error.message ?? "Payment failed");
//     } else if (
//       result.paymentIntent &&
//       result.paymentIntent.status === "succeeded"
//     ) {
//       setSuccessMsg("✅ Payment succeeded!");
//     }
//   };

//   return (
//     <div style={{ maxWidth: 500, margin: "0 auto", padding: "2rem" }}>
//       <form onSubmit={handleSubmit}>
//         <label>
//           Card details
//           <CardElement options={CARD_ELEMENT_OPTIONS} />
//         </label>

//         <button
//           type="submit"
//           disabled={!stripe || loading}
//           style={{
//             marginTop: 20,
//             padding: "10px 20px",
//             backgroundColor: "#6772e5",
//             color: "#fff",
//             border: "none",
//             borderRadius: "4px",
//             cursor: "pointer",
//           }}
//         >
//           {loading ? "Processing…" : "Pay"}
//         </button>
//       </form>

//       {errorMsg && (
//         <div style={{ color: "red", marginTop: 10 }}>{errorMsg}</div>
//       )}
//       {successMsg && (
//         <div style={{ color: "green", marginTop: 10 }}>{successMsg}</div>
//       )}
//     </div>
//   );
// };

// export default function PaymentPage() {
//   const handleLogin = () => {
//     window.location.href = "http://localhost:3000/auth/google";
//   };

//   return (
//     <div>
//       <Elements stripe={stripePromise}>
//         <ConfirmPaymentForm clientSecret={clientSecret} />
//       </Elements>

//       <button
//         onClick={handleLogin}
//         className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
//         style={{ marginTop: "20px", marginLeft: "20px" }}
//       >
//         Login with Google
//       </button>
//     </div>
//   );
// }
// export default GoogleLoginButton;
import React from "react";
import { v4 as uuidv4 } from "uuid";
import sha256 from "crypto-js/sha256";
import Base64 from "crypto-js/enc-base64";

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
    </div>
  );
};

export default TikTokLogin;
