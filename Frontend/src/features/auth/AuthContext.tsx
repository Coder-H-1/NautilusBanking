"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthState, BankName, UserAccount } from "./types";
import { apiRequest } from "@/lib/apiClient";
import { fetchUserDetails } from "../bank/api";

interface AuthContextType extends AuthState {
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    bankId: BankName,
    password?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshBalance: () => Promise<void>;
  selectBank: (bank: BankName, bankUserId?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("nautilus_token");
      const storedUser = localStorage.getItem("nautilus_user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser) as UserAccount;
        setUser(parsedUser);
      }
    } catch (e) {
      console.error("Failed to restore session", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh current user balance from bank
  const refreshBalance = async () => {
    if (!user) return;
    try {
      const res = await fetchUserDetails(user.bank_name, user.id);
      if (res.data && res.data.success) {
        const updated = {
          ...user,
          balance: res.data.balance,
          name: res.data.account_holder_name || user.name,
        };
        setUser(updated);
        localStorage.setItem("nautilus_user", JSON.stringify(updated));
      }
    } catch (err) {
      console.warn("Could not refresh balance", err);
    }
  };

  const login = async (email: string, password: string = "SecurePass123!") => {
    setIsLoading(true);
    try {
      const res = await apiRequest<{
        access_token: string;
        message: string;
        success: boolean;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (res.error || !res.data?.access_token) {
        setIsLoading(false);
        return { success: false, error: res.error || "Login failed" };
      }

      const accessToken = res.data.access_token;
      setToken(accessToken);
      localStorage.setItem("nautilus_token", accessToken);

      // Default user session
      const newUser: UserAccount = {
        id: "1",
        username: email.split("@")[0],
        name: email.split("@")[0].toUpperCase(),
        email: email,
        role: "user",
        balance: 1000,
        bank_name: "CPB",
      };

      setUser(newUser);
      localStorage.setItem("nautilus_user", JSON.stringify(newUser));
      setIsLoading(false);
      return { success: true };
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : "Login failed";
      return { success: false, error: msg };
    }
  };

  const signup = async (
    name: string,
    email: string,
    bankId: BankName,
    password: string = "SecurePass123!"
  ) => {
    setIsLoading(true);
    try {
      const res = await apiRequest<{
        access_token?: string;
        message?: string;
        success?: boolean;
        bank_user_id?: number;
        bank_id?: string;
        account_holder_name?: string;
        balance?: number;
      }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          account_holder_name: name,
          bank_id: bankId.toLowerCase(),
          email,
          password,
        }),
      });

      if (res.error || !res.data) {
        setIsLoading(false);
        return { success: false, error: res.error || "Signup failed" };
      }

      const assignedBankUserId = String(res.data.bank_user_id || 1);
      const accessToken = res.data.access_token || `session_${bankId.toLowerCase()}_${assignedBankUserId}`;
      
      setToken(accessToken);
      localStorage.setItem("nautilus_token", accessToken);

      const newUser: UserAccount = {
        id: assignedBankUserId,
        username: email.split("@")[0],
        name: res.data.account_holder_name || name,
        email: email,
        role: "user",
        balance: res.data.balance ?? 1000,
        bank_name: bankId,
      };

      setUser(newUser);
      localStorage.setItem("nautilus_user", JSON.stringify(newUser));
      setIsLoading(false);
      return { success: true };
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : "Signup failed";
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("nautilus_token");
    localStorage.removeItem("nautilus_user");
  };

  const selectBank = (bank: BankName, bankUserId: string = "1") => {
    if (!user) return;
    const updated: UserAccount = {
      ...user,
      bank_name: bank,
      id: bankUserId,
    };
    setUser(updated);
    localStorage.setItem("nautilus_user", JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        signup,
        logout,
        refreshBalance,
        selectBank,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
