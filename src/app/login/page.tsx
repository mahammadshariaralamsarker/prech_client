// "use client";

// import React, { useState } from "react";

// const GoogleLoginButton = () => {
//   // const [user, setUser] = useState<any>(null);

//   const handleLogin = () => {
//     window.location.href = "http://localhost:3000/auth/google";
//   };

//   const handleClick = async () => {
//     try {
//       const res = await fetch("http://localhost:3000/auth/me", {
//         method: "POST",
//         credentials: "include",
//       });

//       const authHeader = res.headers.get("Authorization");
//       console.log("Header:", authHeader);
//     } catch (err: any) {
//       console.log("Error fetching /auth/me:", err.message);
//     }
//   };
//   const handleToken = async () => {
//     try {
//       const res = await fetch("http://localhost:3000/auth/me", {
//         method: "POST",
//         credentials: "include",
//       });

//       const data = await res.json();
//       console.log("Token Data:", data);
//     } catch (err: any) {
//       console.log("Error fetching /auth/token:", err.message);
//     }
//   };

//   return (
//     <div className="space-x-4 m-8">
//       <button
//         onClick={handleLogin}
//         className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
//       >
//         Login with Google
//       </button>

//       <button
//         onClick={handleToken}
//         className="px-4 py-2 bg-green-600 text-white rounded"
//       >
//         Token
//       </button>

//       {user && (
//         <pre className="bg-gray-100 p-2 rounded text-sm text-black mt-4">
//           {JSON.stringify(user, null, 2)}
//         </pre>
//       )}
//     </div>
//   );
// };

// export default GoogleLoginButton;

const LoginPage = () => {
  return <div>Hello</div>;
};

export default LoginPage;
