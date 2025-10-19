# Authentication System Documentation

## Overview

This authentication system matches your backend API response structure and provides TypeScript types, utility functions, and examples.

## Login Response Structure

```typescript
{
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "token": "JWT_TOKEN_HERE",
    "userExists": {
      "id": "user-uuid",
      "email": "user@example.com",
      "password": "hashed-password",
      "picture": null,
      "name": "User Name",
      "phone": "+1234567890",
      "role": "CONSUMER" | "ADMIN" | "VENDOR",
      "isActive": true,
      "isDeleted": false,
      "isBlocked": false,
      "provider": "GOOGLE" | "FACEBOOK" | "LOCAL" | null,
      "otp": null,
      "otpExpiresAt": null,
      "isEmailVerified": true,
      "createdAt": "2025-10-15T23:16:58.647Z",
      "updatedAt": "2025-10-15T23:17:35.893Z"
    }
  }
}
```

## Files Created

### 1. `/src/types/auth.ts`

TypeScript interfaces for authentication:

- `User` - User object structure
- `LoginResponse` - Login API response
- `RegisterResponse` - Registration API response
- `ErrorResponse` - Error response structure
- `AuthState` - Authentication state for React context

### 2. `/src/utils/auth.ts`

Utility functions:

- `saveAuthData()` - Save token and user to localStorage
- `getToken()` - Get stored token
- `getUser()` - Get stored user data
- `clearAuthData()` - Clear authentication data
- `isAuthenticated()` - Check if user is logged in
- `login()` - Login with email/password
- `getCurrentUser()` - Fetch current user info
- `logout()` - Logout and clear data
- `getAuthHeader()` - Get Authorization header for API calls

### 3. `/src/app/login/page.tsx`

Complete login page with:

- Email/password login form
- Google OAuth login
- Error handling
- Response display
- Token storage

### 4. `/src/mocks/authMocks.ts`

Mock data for testing:

- `mockLoginResponse` - Sample login response
- `mockRegisterResponse` - Sample register response
- `mockUser` - Sample user object
- `createLoginResponse()` - Helper to create custom responses

## Usage Examples

### Basic Login

```typescript
import { login } from "@/utils/auth";

const handleLogin = async () => {
  try {
    const response = await login("user@example.com", "password123");
    console.log("Logged in:", response.data.userExists.name);
    // Token is automatically saved to localStorage
  } catch (error) {
    console.error("Login failed:", error);
  }
};
```

### Check Authentication

```typescript
import { isAuthenticated, getUser } from "@/utils/auth";

if (isAuthenticated()) {
  const user = getUser();
  console.log("Current user:", user?.name);
}
```

### Make Authenticated API Calls

```typescript
import { getAuthHeader } from "@/utils/auth";

const fetchData = async () => {
  const response = await fetch("http://localhost:3000/api/data", {
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
  });
  return response.json();
};
```

### Logout

```typescript
import { logout } from "@/utils/auth";

const handleLogout = async () => {
  await logout();
  window.location.href = "/login";
};
```

## API Endpoints (Backend)

Ensure your backend has these endpoints:

- `POST /auth/login` - Login with email/password
- `POST /auth/register` - Register new user
- `GET /auth/me` - Get current user info
- `POST /auth/logout` - Logout
- `GET /auth/google` - Google OAuth login

## Next Steps

1. **Create Auth Context** (Optional but recommended):

```typescript
// src/context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types/auth";
import { getUser, getToken } from "@/utils/auth";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = getUser();
    const storedToken = getToken();
    setUser(storedUser);
    setToken(storedToken);
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

2. **Protected Routes**:

```typescript
// src/components/ProtectedRoute.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/utils/auth";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  if (!isAuthenticated()) {
    return null;
  }

  return <>{children}</>;
}
```

## Testing

Use the mock data for testing:

```typescript
import { mockLoginResponse, mockUser } from "@/mocks/authMocks";

// Test with mock data
console.log(mockUser.name); // "John"
console.log(mockLoginResponse.data.token); // JWT token
```
