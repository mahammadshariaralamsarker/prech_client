// Auth Types
export type UserRole = "CONSUMER" | "ADMIN" | "VENDOR";

export type Provider = "GOOGLE" | "FACEBOOK" | "LOCAL" | null;

export interface User {
  id: string;
  email: string;
  password: string;
  picture: string | null;
  name: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  isDeleted: boolean;
  isBlocked: boolean;
  provider: Provider;
  otp: string | null;
  otpExpiresAt: string | null;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    userExists: User;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
}

// Auth Context/State
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
