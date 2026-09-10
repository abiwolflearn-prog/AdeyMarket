import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "../services/api";

// Mock User Types for Context
export type Role = "creator" | "brand" | "consumer";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  profilePic?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  resetPassword: (data: { email: string; newPassword: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", data);
      const { accessToken, ...userData } = response.data;
      
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(userData));
      
      setUser(userData);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Login failed";
      console.warn("Authentication notice:", msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/register", data);
      const { accessToken, ...userData } = response.data;
      
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(userData));
      
      setUser(userData);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Registration failed";
      console.warn("Registration notice:", msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (data: { email: string; newPassword: string }) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/reset-password", data);
      const { accessToken, ...userData } = response.data;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);
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
