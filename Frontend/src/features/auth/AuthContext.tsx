"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  AuthState,
  BankName,
  UserAccount,
  CustomLoginPayload,
  CustomSignupPayload,
  OTPVerifyPayload,
  AuthServerResponse,
} from "./types";
import { apiRequest } from "@/lib/apiClient";
import { fetchUserDetails } from "../bank/api";

interface AuthContextType extends AuthState {
  login: (payload: CustomLoginPayload) => Promise<{
    success: boolean;
    requires_otp?: boolean;
    message?: string;
    error?: string;
  }>;
  signup: (payload: CustomSignupPayload) => Promise<{
    success: boolean;
    requires_otp?: boolean;
    message?: string;
    error?: string;
  }>;
  verifyOtp: (payload: OTPVerifyPayload) => Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }>;
  resendOtp: (
    email: string,
    bankId: BankName,
    name?: string
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  checkEmail: (
    email: string,
    bankId: BankName
  ) => Promise<{ exists: boolean; message?: string }>;
  logout: () => void;
  refreshBalance: () => Promise<void>;
  selectBank: (bank: BankName, bankUserId?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and validate session on mount
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener("nautilus_session_expired", handleExpired);

    const initSession = async () => {
      try {
        const storedToken = localStorage.getItem("nautilus_token");
        const storedUser = localStorage.getItem("nautilus_user");

        if (storedToken && storedUser) {
          // Verify with backend to ensure token is not expired
          const res = await apiRequest<AuthServerResponse>("/auth/device", {
            method: "POST",
            body: JSON.stringify({ token: storedToken }),
          });

          if (res.data && res.data.success) {
            setToken(storedToken);
            const parsedUser = JSON.parse(storedUser) as UserAccount;
            setUser(parsedUser);
          } else {
            // Token is expired or invalid
            localStorage.removeItem("nautilus_token");
            localStorage.removeItem("nautilus_user");
            setToken(null);
            setUser(null);
          }
        }
      } catch (e) {
        console.error("Failed to restore session", e);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    return () => {
      window.removeEventListener("nautilus_session_expired", handleExpired);
    };
  }, []);

  // Refresh current user balance from bank
  const refreshBalance = async () => {
    if (!user) return;
    try {
      const res = await fetchUserDetails(user.bank_name, user.id);
      if (res.data && res.data.success) {
        const updated: UserAccount = {
          ...user,
          balance: res.data.balance ?? user.balance,
          name: res.data.account_holder_name || user.name,
        };
        setUser(updated);
        localStorage.setItem("nautilus_user", JSON.stringify(updated));
      }
    } catch (err) {
      console.warn("Could not refresh balance", err);
    }
  };

  const checkEmail = async (email: string, bankId: BankName) => {
    try {
      const res = await apiRequest<{ success: boolean; exists: boolean; message: string }>(
        "/auth/check-email",
        {
          method: "POST",
          body: JSON.stringify({ email, bank_id: bankId.toLowerCase() }),
        }
      );
      if (res.data) {
        return { exists: !!res.data.exists, message: res.data.message };
      }
      return { exists: false };
    } catch (e) {
      return { exists: false };
    }
  };

  const login = async (payload: CustomLoginPayload) => {
    try {
      const cleanName = payload.account_holder_name.trim().toLowerCase();
      const cleanEmail = payload.email.trim().toLowerCase();

      const res = await apiRequest<AuthServerResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          account_holder_name: cleanName,
          email: cleanEmail,
          bank_id: payload.bank_id.toLowerCase(),
          password: payload.password || "SecurePass123!",
        }),
      });

      if (res.error || !res.data) {
        return { success: false, error: res.error || "Login request failed" };
      }

      return {
        success: true,
        requires_otp: res.data.requires_otp ?? true,
        message: res.data.message,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      return { success: false, error: msg };
    }
  };

  const signup = async (payload: CustomSignupPayload) => {
    try {
      const rawName = payload.account_holder_name || payload.full_name || "";
      const cleanName = rawName.trim().toLowerCase();
      const cleanEmail = payload.email.trim().toLowerCase();

      const res = await apiRequest<AuthServerResponse>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          account_holder_name: cleanName,
          email: cleanEmail,
          bank_id: payload.bank_id.toLowerCase(),
          password: payload.password || "SecurePass123!",
        }),
      });

      if (res.error || !res.data) {
        return { success: false, error: res.error || "Signup request failed" };
      }

      return {
        success: true,
        requires_otp: res.data.requires_otp ?? true,
        message: res.data.message,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signup failed";
      return { success: false, error: msg };
    }
  };

  const verifyOtp = async (payload: OTPVerifyPayload) => {
    try {
      const cleanEmail = payload.email.trim().toLowerCase();
      const res = await apiRequest<AuthServerResponse>("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          email: cleanEmail,
          bank_id: payload.bank_id.toLowerCase(),
          otp_code: payload.otp_code.trim(),
          flow_type: payload.flow_type || "login",
          account_holder_name: payload.account_holder_name?.trim().toLowerCase(),
        }),
      });

      if (res.error || !res.data || typeof res.data.access_token !== "string") {
        return { success: false, error: res.error || "OTP verification failed" };
      }

      const data = res.data;
      const accessToken = (data.access_token || "") as string;
      setToken(accessToken);
      localStorage.setItem("nautilus_token", accessToken);

      const assignedBankUserId = String(data.bank_user_id || 1);
      const newUser: UserAccount = {
        id: assignedBankUserId,
        username: cleanEmail.split("@")[0],
        name: (data.account_holder_name || payload.account_holder_name || cleanEmail.split("@")[0]).toLowerCase(),
        email: cleanEmail,
        role: "user",
        balance: data.balance ?? 1000,
        bank_name: payload.bank_id,
      };

      setUser(newUser);
      localStorage.setItem("nautilus_user", JSON.stringify(newUser));

      return { success: true, message: data.message };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "OTP verification failed";
      return { success: false, error: msg };
    }
  };

  const resendOtp = async (email: string, bankId: BankName, name?: string) => {
    try {
      const res = await apiRequest<AuthServerResponse>("/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          bank_id: bankId.toLowerCase(),
          account_holder_name: name?.trim().toLowerCase(),
        }),
      });

      if (res.error || !res.data) {
        return { success: false, error: res.error || "Resend OTP failed" };
      }
      return { success: true, message: res.data.message };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resend OTP";
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
        verifyOtp,
        resendOtp,
        checkEmail,
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
