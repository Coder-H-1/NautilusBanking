"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/features/auth/AuthContext";
import { BankName } from "@/features/auth/types";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { OtpModal } from "@/components/auth/OtpModal";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";
import { Shield, ArrowRight, Eye, EyeOff, Building2, User, Mail, Lock, CheckCircle2 } from "lucide-react";
import { sanitizeInput } from "@/features/crypto/sanitizer";

function LoginContent() {
  const [accountHolderName, setAccountHolderName] = useState("");
  const [email, setEmail] = useState("");
  const [bankId, setBankId] = useState<BankName>("CPB");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  // Auto-fill saved login details from localStorage if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nautilus_saved_credentials");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.account_holder_name) setAccountHolderName(parsed.account_holder_name);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.bank_id) setBankId(parsed.bank_id as BankName);
        if (parsed.password) setPassword(parsed.password);
      }
    } catch (e) {
      console.warn("Could not load saved login credentials", e);
    }
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Letters and spaces only
    const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
    setAccountHolderName(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanName = sanitizeInput(accountHolderName).trim().toLowerCase();
    const cleanEmail = sanitizeInput(email).trim().toLowerCase();

    if (!cleanName) {
      setError("Please enter your account holder name (letters only).");
      return;
    }

    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setError("Please provide a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Please enter your password (minimum 6 characters).");
      return;
    }

    setLoading(true);
    const res = await login({
      account_holder_name: cleanName,
      email: cleanEmail,
      bank_id: bankId,
      password: password,
    });
    setLoading(false);

    if (res.success) {
      if (res.requires_otp) {
        setShowOtpModal(true);
      } else {
        router.push(redirectUrl);
      }
    } else {
      setError(res.error || "Authentication failed. Please check your credentials.");
    }
  };

  const handleOtpSuccess = () => {
    setShowOtpModal(false);
    router.push(redirectUrl);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-16rem)] py-12 px-4">
      <div className="w-full max-w-lg space-y-4">
        <Card className="border border-border/80 shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-1 text-primary">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-mono font-bold tracking-wider">NAUTILUS SECURE ACCESS</span>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Sign In to Bank Account</CardTitle>
            <CardDescription className="text-xs font-mono">
              Provide your verified account details to initiate 2FA login verification.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {successMessage && (
                <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs font-mono flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>{successMessage}</div>
                </div>
              )}

              {error && (
                <Alert variant="error" title="Authentication Error">
                  {error}
                </Alert>
              )}

              {/* Account Holder Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-muted-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  ACCOUNT HOLDER NAME
                </label>
                <input
                  type="text"
                  placeholder="e.g. john doe (letters only)"
                  value={accountHolderName}
                  onChange={handleNameChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-secondary/30 text-foreground text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
                <p className="text-[11px] text-muted-foreground font-mono">
                  Case-insensitive, letters and spaces only.
                </p>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  REGISTERED EMAIL
                </label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-secondary/30 text-foreground text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Issuing Bank Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  ISSUING BANK
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["CPB", "EB", "SB"] as BankName[]).map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setBankId(bank)}
                      className={`py-2 px-3 rounded-lg text-xs font-mono font-bold border transition-all ${
                        bankId === bank
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-secondary/20 text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>

              {/* Password with Show/Hide Toggle & Forgot Password Link */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-medium text-muted-foreground flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    PASSWORD
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setShowForgotPasswordModal(true);
                    }}
                    className="text-[11px] font-mono text-zinc-500 hover:text-primary transition-colors underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-border bg-secondary/30 text-foreground text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                className="w-full font-mono text-xs tracking-wider py-2.5"
                size="md"
                isLoading={loading}
              >
                VERIFY CREDENTIALS & SEND OTP <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-muted-foreground w-full pt-2 border-t border-border/40">
                <div>
                  No bank account yet?{" "}
                  <Link href="/signup" className="font-semibold text-foreground hover:underline">
                    Create Account
                  </Link>
                </div>
                <Link href="/privacy-policy" className="hover:underline text-[11px]">
                  Privacy Policy
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* OTP Verification Modal */}
      <OtpModal
        isOpen={showOtpModal}
        email={email.trim().toLowerCase()}
        bankId={bankId}
        accountHolderName={accountHolderName.trim().toLowerCase()}
        flowType="login"
        onSuccess={handleOtpSuccess}
        onClose={() => setShowOtpModal(false)}
      />

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        initialEmail={email}
        initialBankId={bankId}
        onSuccess={(msg) => {
          setShowForgotPasswordModal(false);
          setSuccessMessage(msg);
          setPassword("");
        }}
        onClose={() => setShowForgotPasswordModal(false)}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
