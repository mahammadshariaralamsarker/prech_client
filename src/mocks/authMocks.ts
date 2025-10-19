import { LoginResponse, RegisterResponse, User } from "@/types/auth";

/**
 * Mock login response - matches your API structure
 */
export const mockLoginResponse: LoginResponse = {
  success: true,
  message: "User logged in successfully",
  data: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwOGQ0MDhkYS1lZDMyLTRkMDYtYmFmZS0zOTQzYzkwZTI0NGEiLCJlbWFpbCI6InR5dnd1ZnV3ZXd4QGZleHBvc3QuY29tIiwicm9sZSI6IkNPTlNVTUVSIiwiaWF0IjoxNzYwODI5Nzg3LCJleHAiOjE3NjE0MzQ1ODd9.nHXRIXxeKSKZFSgMwiC_eRIRX8jzWvWX-XFqG7DRL_c",
    userExists: {
      id: "08d408da-ed32-4d06-bafe-3943c90e244a",
      email: "tyvwufuwewx@fexpost.com",
      password: "$2b$12$C/UC7an0a8McmGhoQhOKCuUnJeZd3c90fHl1gXZ/4A8.vpt7Oj9tC",
      picture: null,
      name: "John",
      phone: "+112434223443",
      role: "CONSUMER",
      isActive: true,
      isDeleted: false,
      isBlocked: false,
      provider: null,
      otp: null,
      otpExpiresAt: null,
      isEmailVerified: true,
      createdAt: "2025-10-15T23:16:58.647Z",
      updatedAt: "2025-10-15T23:17:35.893Z",
    },
  },
};

/**
 * Mock register response
 */
export const mockRegisterResponse: RegisterResponse = {
  success: true,
  message: "User registered successfully",
  data: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJuZXctdXNlci1pZCIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsInJvbGUiOiJDT05TVU1FUiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwNjA0ODAwfQ.example-signature",
    user: {
      id: "new-user-id",
      email: "test@test.com",
      password: "$2b$12$hashedpassword",
      picture: null,
      name: "Test User",
      phone: "+1234567890",
      role: "CONSUMER",
      isActive: true,
      isDeleted: false,
      isBlocked: false,
      provider: null,
      otp: null,
      otpExpiresAt: null,
      isEmailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
};

/**
 * Mock user object
 */
export const mockUser: User = {
  id: "08d408da-ed32-4d06-bafe-3943c90e244a",
  email: "tyvwufuwewx@fexpost.com",
  password: "$2b$12$C/UC7an0a8McmGhoQhOKCuUnJeZd3c90fHl1gXZ/4A8.vpt7Oj9tC",
  picture: null,
  name: "John",
  phone: "+112434223443",
  role: "CONSUMER",
  isActive: true,
  isDeleted: false,
  isBlocked: false,
  provider: null,
  otp: null,
  otpExpiresAt: null,
  isEmailVerified: true,
  createdAt: "2025-10-15T23:16:58.647Z",
  updatedAt: "2025-10-15T23:17:35.893Z",
};

/**
 * Helper function to create a login response with custom data
 */
export const createLoginResponse = (
  user: Partial<User>,
  token?: string
): LoginResponse => {
  const fullUser: User = {
    ...mockUser,
    ...user,
  };

  return {
    success: true,
    message: "User logged in successfully",
    data: {
      token: token || mockLoginResponse.data.token,
      userExists: fullUser,
    },
  };
};
