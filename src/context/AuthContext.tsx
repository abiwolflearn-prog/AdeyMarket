import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "../services/api";

// Mock User Types for Context
export type Role = "creator" | "brand" | "consumer" | "admin";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  profilePic?: string;
  phone?: string;
  city?: string;
  address?: string;
  bio?: string;
  website?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: any) => Promise<User>;
  register: (data: any) => Promise<User>;
  resetPassword: (data: { email: string; newPassword: string }) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("accessToken");
    const storedRefreshToken = localStorage.getItem("refreshToken");

    // If there is a stored user object but NO tokens, clear stale session
    if (storedUser && !storedToken && !storedRefreshToken) {
      localStorage.removeItem("user");
      return null;
    }

    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  // Validate session on mount
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem("accessToken");
      const refToken = localStorage.getItem("refreshToken");
      if (!token && !refToken) return;

      try {
        const res = await api.get("/auth/me");
        if (res.data) {
          setUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data));
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.removeItem("user");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setUser(null);
        }
      }
    };

    verifySession();
  }, []);

  const login = async (data: any): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", data);
      const { accessToken, refreshToken, ...userData } = response.data;
      
      if (accessToken) localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(userData));
      
      setUser(userData);
      return userData;
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Login failed";
      console.warn("Authentication notice:", msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/register", data);
      const { accessToken, refreshToken, ...userData } = response.data;
      
      if (accessToken) localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(userData));
      
      setUser(userData);
      return userData;
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Registration failed";
      console.warn("Registration notice:", msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (data: { email: string; newPassword: string }): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/reset-password", data);
      const { accessToken, refreshToken, ...userData } = response.data;

      if (accessToken) localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);
      return userData;
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Password reset failed";
      console.warn("Password reset notice:", msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.warn("Logout notice:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
