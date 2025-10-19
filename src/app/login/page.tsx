"use client";

import React, { useState } from "react";
import { LoginResponse, ErrorResponse } from "@/types/auth";

const API_BASE = "http://localhost:3000";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginData, setLoginData] = useState<LoginResponse | null>(null);

  // Login with email and password
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse | ErrorResponse = await res.json();

      if (data.success) {
        const loginResponse = data as LoginResponse;
        setLoginData(loginResponse);

        // Store token in localStorage
        localStorage.setItem("token", loginResponse.data.token);
        localStorage.setItem(
          "user",
          JSON.stringify(loginResponse.data.userExists)
        );

        console.log("Login successful:", loginResponse);

        // Redirect to home or dashboard
        // window.location.href = "/";
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("An error occurred during login");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Login with Google
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  // Get current user (for testing)
  const handleGetMe = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      console.log("Current user:", data);
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Login
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="mt-4 w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition"
          >
            Login with Google
          </button>
        </div>

        {/* Debug Button */}
        <button
          onClick={handleGetMe}
          className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
        >
          Get Current User
        </button>

        {/* Display login data */}
        {loginData && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Login Response:
            </h3>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96 text-gray-800">
              {JSON.stringify(loginData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
