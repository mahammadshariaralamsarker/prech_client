import { LoginResponse, User } from "@/types/auth";

const API_BASE = "http://localhost:3000";

/**
 * Save authentication data to localStorage
 */
export const saveAuthData = (loginResponse: LoginResponse) => {
  localStorage.setItem("token", loginResponse.data.token);
  localStorage.setItem("user", JSON.stringify(loginResponse.data.userExists));
};

/**
 * Get token from localStorage
 */
export const getToken = (): string | null => {
  return localStorage.getItem("token");
};

/**
 * Get user from localStorage
 */
export const getUser = (): User | null => {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Clear authentication data
 */
export const clearAuthData = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

/**
 * Login with email and password
 */
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error("Login failed");
  }

  const data: LoginResponse = await res.json();

  if (data.success) {
    saveAuthData(data);
  }

  return data;
};

/**
 * Get current user info
 */
export const getCurrentUser = async (): Promise<User> => {
  const token = getToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE}/auth/me`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch user");
  }

  const data = await res.json();
  return data.data;
};

/**
 * Logout
 */
export const logout = async () => {
  const token = getToken();

  if (token) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  clearAuthData();
};

/**
 * Create Authorization header
 */
export const getAuthHeader = (): { Authorization: string } | Record<string, never> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
