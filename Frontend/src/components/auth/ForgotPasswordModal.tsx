"use client";

import React, { useState, useEffect } from "react";
import { KeyRound, Mail, Lock, ArrowRight, CheckCircle2, Eye, EyeOff, Building2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { BankName } from "@/features/auth/types";
import { apiRequest } from "@/lib/apiClient";
import { sanitizeInput } from "@/features/crypto/sanitizer";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  initialEmail?: string;
  initialBankId?: BankName;
  onSuccess: (message: string) => void;
  onClose: () => void;
}

export function ForgotPasswordModal({
  isOpen,
  initialEmail = "",
  initialBankId = "CPB",
  onSuccess,
  onClose,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState(initialEmail);
  const [bankId, setBankId] = useState<BankName>(initialBankId);
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  useEffect(() => {
    if (isOpen) {
      setStep("request");
      setEmail(initialEmail);
      setBankId(initialBankId);
      setOtpCode("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
      setLoading(false);
      setResendCooldown(60);
    }
  }, [isOpen, initialEmail, initialBankId]);

  useEffect(() => {
    if (!isOpen || step !== "verify" || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, step, resendCooldown]);

  if (!isOpen) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = sanitizeInput(email).trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setError("Please enter a valid registered email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; message: string }>("/auth/forgot-password/request", {
        method: "POST",
        body: JSON.stringify({
          email: cleanEmail,
          bank_id: bankId.toLowerCase(),
        }),
      });

      setLoading(false);
      if (res.error || !res.data?.success) {
        setError(res.error || "Failed to send reset code. Please check your bank and email.");
        return;
      }

      setStep("verify");
      setResendCooldown(60);
    } catch (err: unknown) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Request failed");
    }
  };

  const handleVerifyReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otpCode || otpCode.trim().length !== 6) {
      setError("Please enter the 6-digit OTP code sent to your email.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = sanitizeInput(email).trim().toLowerCase();
      const res = await apiRequest<{ success: boolean; message: string }>("/auth/forgot-password/verify", {
        method: "POST",
        body: JSON.stringify({
          email: cleanEmail,
          bank_id: bankId.toLowerCase(),
          otp_code: otpCode.trim(),
          new_password: newPassword,
        }),
      });

      setLoading(false);
      if (res.error || !res.data?.success) {
        setError(res.error || "Failed to reset password. Please check your OTP.");
        return;
      }

      onSuccess(res.data.message || "Password reset successfully! Please sign in with your new password.");
    } catch (err: unknown) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Password reset failed");
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setError(null);
    try {
      const cleanEmail = sanitizeInput(email).trim().toLowerCase();
      const res = await apiRequest<{ success: boolean; message: string }>("/auth/forgot-password/request", {
        method: "POST",
        body: JSON.stringify({
          email: cleanEmail,
          bank_id: bankId.toLowerCase(),
        }),
      });
      setResendLoading(false);
      if (res.error || !res.data?.success) {
        setError(res.error || "Could not resend OTP code.");
      } else {
        setResendCooldown(60);
      }
    } catch (err: unknown) {
      setResendLoading(false);
      setError("Failed to resend code.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-xl border border-zinc-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-zinc-900 text-white p-5 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-mono font-bold tracking-wide">PASSWORD RECOVERY</h3>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white text-xs font-mono px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
            >
              ESC / CLOSE
            </button>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            {step === "request"
              ? "Verify your bank affiliation & email to receive a secure recovery code."
              : "Enter your verification code and configure a new security password."}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <Alert variant="error" title="Error">
              {error}
            </Alert>
          )}

          {step === "request" ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              {/* Bank selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-zinc-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  ACCOUNT ISSUING BANK
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["CPB", "EB", "SB"] as BankName[]).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBankId(b)}
                      className={`py-2 px-3 rounded-lg text-xs font-mono font-bold border transition-all ${
                        bankId === b
                          ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                          : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-zinc-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  REGISTERED EMAIL
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 bg-white text-zinc-900 text-sm font-mono placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <Button type="button" variant="outline" size="md" onClick={onClose} className="flex-1 font-mono text-xs">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" isLoading={loading} className="flex-1 font-mono text-xs">
                  SEND RESET CODE <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyReset} className="space-y-4">
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs font-mono text-zinc-600">
                Reset code sent to <strong className="text-zinc-900">{email}</strong> ({bankId}).
              </div>

              {/* OTP Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-zinc-700 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-primary" />
                  6-DIGIT VERIFICATION CODE
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center tracking-widest text-lg font-mono font-bold px-3.5 py-2.5 rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  required
                />
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-zinc-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  NEW PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-zinc-300 bg-white text-zinc-900 text-sm font-mono placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-zinc-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  CONFIRM PASSWORD
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 bg-white text-zinc-900 text-sm font-mono placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono pt-1">
                <button
                  type="button"
                  onClick={() => setStep("request")}
                  className="text-zinc-500 hover:text-zinc-900 underline"
                >
                  Change Email / Bank
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resendLoading}
                  className="text-zinc-700 hover:text-zinc-950 font-bold disabled:text-zinc-400 disabled:no-underline"
                >
                  {resendLoading
                    ? "Sending..."
                    : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend Code"}
                </button>
              </div>

              <div className="pt-2 flex gap-2">
                <Button type="button" variant="outline" size="md" onClick={onClose} className="flex-1 font-mono text-xs">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" isLoading={loading} className="flex-1 font-mono text-xs">
                  UPDATE PASSWORD <CheckCircle2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
