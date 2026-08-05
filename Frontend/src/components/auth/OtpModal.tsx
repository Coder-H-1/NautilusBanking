"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Clock, AlertCircle, RefreshCw, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/AuthContext";
import { BankName } from "@/features/auth/types";

interface OtpModalProps {
  isOpen: boolean;
  email: string;
  bankId: BankName;
  accountHolderName?: string;
  flowType?: "login" | "signup";
  onSuccess: () => void;
  onClose: () => void;
}

export function OtpModal({
  isOpen,
  email,
  bankId,
  accountHolderName,
  flowType = "login",
  onSuccess,
  onClose,
}: OtpModalProps) {
  const { verifyOtp, resendOtp } = useAuth();
  const router = useRouter();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  // 90 seconds cooldown for resend
  const [cooldown, setCooldown] = useState(90);
  // 180 seconds (3 minutes) OTP expiry
  const [expirySeconds, setExpirySeconds] = useState(180);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOtp("");
      setError(null);
      setResendSuccess(null);
      setCooldown(90);
      setExpirySeconds(180);
      setIsBlocked(false);
    }
  }, [isOpen]);

  // Resend cooldown timer
  useEffect(() => {
    if (!isOpen || cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, cooldown]);

  // Expiry countdown timer
  useEffect(() => {
    if (!isOpen || expirySeconds <= 0) return;
    const timer = setInterval(() => {
      setExpirySeconds((prev) => {
        if (prev <= 1) {
          setError("OTP code has expired. Please request a new code.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, expirySeconds]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit code.");
      return;
    }

    setLoading(true);
    setError(null);
    setResendSuccess(null);

    const res = await verifyOtp({
      email,
      bank_id: bankId,
      otp_code: otp,
      account_holder_name: accountHolderName,
      flow_type: flowType,
    });

    setLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      const errMsg = res.error || "Invalid OTP code";
      setError(errMsg);
      if (errMsg.includes("5 minutes") || errMsg.includes("blocked")) {
        setIsBlocked(true);
      }
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isBlocked) return;

    setResendLoading(true);
    setError(null);
    setResendSuccess(null);

    const res = await resendOtp(email, bankId, accountHolderName);
    setResendLoading(false);

    if (res.success) {
      setResendSuccess("A new 6-digit code has been dispatched to your email.");
      setCooldown(90);
      setExpirySeconds(180);
      setOtp("");
    } else {
      setError(res.error || "Failed to resend code.");
      if (res.error?.includes("blocked") || res.error?.includes("5 minutes")) {
        setIsBlocked(true);
      }
    }
  };

  const handleBlockRedirect = () => {
    onClose();
    router.push("/");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in">
      <div className="bg-card text-card-foreground border border-border/80 rounded-xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative overflow-hidden space-y-6">
        {/* Close Button */}
        {!isBlocked && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary border border-primary/20 mb-2">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-mono tracking-tight">
            TWO-FACTOR AUTHENTICATION
          </h2>
          <p className="text-xs text-muted-foreground font-mono">
            A 6-digit code was sent to <strong className="text-foreground">{email}</strong> ({bankId.toUpperCase()})
          </p>
        </div>

        {/* Expiry Bar */}
        <div className="flex items-center justify-between text-xs font-mono p-2.5 rounded-lg bg-secondary/40 border border-border/60">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-primary" />
            Code Expiry:
          </span>
          <span className={expirySeconds > 30 ? "text-foreground font-bold" : "text-destructive font-bold animate-pulse"}>
            {formatTime(expirySeconds)}
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-mono space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Authentication Notice</span>
            </div>
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {resendSuccess && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-mono flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>{resendSuccess}</span>
          </div>
        )}

        {isBlocked ? (
          <div className="space-y-4 pt-2 text-center">
            <div className="p-4 rounded-lg bg-destructive/15 border border-destructive/40 text-destructive font-mono text-xs leading-relaxed">
              Maximum attempt threshold exceeded. For your security, access from this source is blocked for 5 minutes.
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full font-mono text-xs tracking-wider"
              onClick={handleBlockRedirect}
            >
              RETURN TO HOME
            </Button>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-mono font-medium text-muted-foreground">
                ENTER 6-DIGIT OTP
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="••••••"
                className="w-full text-center text-2xl font-mono font-bold tracking-[0.5em] px-4 py-3 rounded-lg border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                autoFocus
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading || otp.length !== 6 || expirySeconds === 0}
              className="w-full font-mono text-xs tracking-wider py-2.5"
            >
              {loading ? "VERIFYING SECURITY CODE..." : "CONFIRM & AUTHENTICATE"}
            </Button>

            {/* Resend Action */}
            <div className="pt-2 text-center space-y-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || cooldown > 0}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? "animate-spin" : ""}`} />
                {resendLoading
                  ? "DISPATCHING CODE..."
                  : cooldown > 0
                  ? `RESEND CODE IN (${formatTime(cooldown)})`
                  : "DIDN'T RECEIVE CODE? RESEND OTP"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
