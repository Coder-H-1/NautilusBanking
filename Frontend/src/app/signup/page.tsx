"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/features/auth/AuthContext";
import { BankName } from "@/features/auth/types";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { PrivacyPolicyModal } from "@/components/auth/PrivacyPolicyModal";
import { OtpModal } from "@/components/auth/OtpModal";
import { Building2, ArrowRight, ShieldCheck, User, Mail, Lock, Eye, EyeOff, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { sanitizeInput } from "@/features/crypto/sanitizer";

const BANK_OPTIONS: { id: BankName; name: string; region: string }[] = [
  { id: "CPB", name: "Common People's Bank", region: "Retail Network" },
  { id: "EB", name: "Elses Bank", region: "Commercial & Private" },
  { id: "SB", name: "SomeBank", region: "Reserve & Settlement" },
];

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedBank, setSelectedBank] = useState<BankName>("CPB");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Email validation state
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Privacy Policy state
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // OTP Modal state
  const [showOtpModal, setShowOtpModal] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signup, checkEmail } = useAuth();
  const router = useRouter();

  // Name input handler: letters and spaces only
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
    setName(val);
  };

  // Check email uniqueness on blur or bank switch
  const handleEmailBlur = async () => {
    const cleanEmail = sanitizeInput(email).trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      if (email.length > 0) {
        setEmailError("Please enter a valid email address.");
      }
      return;
    }

    setEmailChecking(true);
    setEmailError(null);
    const res = await checkEmail(cleanEmail, selectedBank);
    setEmailChecking(false);

    if (res.exists) {
      setEmailError(`User already exists in ${selectedBank}. Please log in or choose another bank.`);
    }
  };

  useEffect(() => {
    if (email && email.includes("@") && email.includes(".")) {
      handleEmailBlur();
    }
  }, [selectedBank]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = sanitizeInput(name).trim().toLowerCase();
    const cleanEmail = sanitizeInput(email).trim().toLowerCase();

    if (!cleanName) {
      setFormError("Please enter your legal account holder name (letters only).");
      return;
    }

    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setFormError("Please enter a valid email address.");
      return;
    }

    if (emailError) {
      setFormError("Cannot proceed: " + emailError);
      return;
    }

    if (!password || password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }

    if (!policyAccepted) {
      setFormError("You must read and accept the Privacy Policy & Legal Charter to create an account.");
      setShowPolicyModal(true);
      return;
    }

    setLoading(true);
    const res = await signup({
      account_holder_name: cleanName,
      full_name: cleanName,
      email: cleanEmail,
      bank_id: selectedBank,
      password: password,
      policy_accepted: true,
    });
    setLoading(false);

    if (res.success) {
      if (res.requires_otp) {
        setShowOtpModal(true);
      } else {
        router.push("/dashboard");
      }
    } else {
      setFormError(res.error || "Account registration failed.");
    }
  };

  const handleOtpSuccess = () => {
    setShowOtpModal(false);
    router.push("/dashboard");
  };

  const isFormValid =
    name.trim().length >= 2 &&
    email.includes("@") &&
    email.includes(".") &&
    !emailError &&
    password.length >= 6 &&
    policyAccepted;

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-16rem)] py-12 px-4">
      <div className="w-full max-w-lg space-y-4">
        <Card className="border border-border/80 shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-1 text-primary">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-mono font-bold tracking-wider">NAUTILUS ONBOARDING</span>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Open Bank Account</CardTitle>
            <CardDescription className="text-xs font-mono">
              Register a simulated multi-bank account with mandatory 2FA email verification.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {formError && (
                <Alert variant="error" title="Registration Error">
                  {formError}
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
                  placeholder="e.g. satoshi nakamoto (letters and spaces only)"
                  value={name}
                  onChange={handleNameChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-secondary/30 text-foreground text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
                <p className="text-[11px] text-muted-foreground font-mono">
                  Case-insensitive, letters only. No signs or numbers permitted.
                </p>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError(null);
                    }}
                    onBlur={handleEmailBlur}
                    className={`w-full px-3.5 py-2.5 rounded-lg border bg-secondary/30 text-foreground text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                      emailError ? "border-destructive focus:ring-destructive" : "border-border"
                    }`}
                    required
                  />
                  {emailChecking && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {emailError && (
                  <p className="text-xs text-destructive font-mono flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {emailError}
                  </p>
                )}
              </div>

              {/* Bank Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  SELECT ISSUING FINANCIAL INSTITUTION
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {BANK_OPTIONS.map((bank) => (
                    <label
                      key={bank.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedBank === bank.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-foreground/40 bg-secondary/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="bank"
                          value={bank.id}
                          checked={selectedBank === bank.id}
                          onChange={() => setSelectedBank(bank.id)}
                          className="text-primary focus:ring-primary h-4 w-4 accent-primary"
                        />
                        <div>
                          <p className="text-xs font-semibold text-foreground font-mono">{bank.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{bank.region}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-foreground px-2 py-0.5 rounded bg-secondary">
                        {bank.id}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-muted-foreground flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  ACCOUNT PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="•••••••••••• (min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-border bg-secondary/30 text-foreground text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Privacy Policy Charter Checkbox */}
              <div className="p-3.5 rounded-lg border border-border/80 bg-secondary/20 space-y-2">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="privacy-policy-agree"
                    checked={policyAccepted}
                    onChange={(e) => {
                      if (!policyAccepted) {
                        setShowPolicyModal(true);
                      } else {
                        setPolicyAccepted(e.target.checked);
                      }
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                  <label htmlFor="privacy-policy-agree" className="text-xs font-mono text-muted-foreground cursor-pointer select-none">
                    I acknowledge that NAUTILUS is a non-monetary hobby simulation project and agree to the{" "}
                    <button
                      type="button"
                      onClick={() => setShowPolicyModal(true)}
                      className="font-bold text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                    >
                      Privacy Policy & DPDP Charter
                    </button>
                    .
                  </label>
                </div>

                {!policyAccepted ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPolicyModal(true)}
                    className="w-full text-xs font-mono flex items-center justify-center gap-1.5 mt-2 text-primary border-primary/40 hover:bg-primary/10"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Review & Unlock Privacy Charter (Required)
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-mono font-semibold pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Charter Reviewed & Accepted</span>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                className="w-full font-mono text-xs tracking-wider py-2.5"
                size="md"
                isLoading={loading}
                disabled={!isFormValid || loading}
              >
                {!policyAccepted ? "ACCEPT PRIVACY CHARTER TO PROCEED" : "CREATE ACCOUNT & DISPATCH OTP"}{" "}
                <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-muted-foreground w-full pt-2 border-t border-border/40">
                <div>
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-foreground hover:underline">
                    Sign In
                  </Link>
                </div>
                <Link href="/privacy-policy" className="hover:underline text-[11px]">
                  Read Full Policy
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Privacy Policy Gate Modal */}
      <PrivacyPolicyModal
        isOpen={showPolicyModal}
        onComplete={() => setPolicyAccepted(true)}
        onClose={() => setShowPolicyModal(false)}
      />

      {/* OTP Verification Modal */}
      <OtpModal
        isOpen={showOtpModal}
        email={email.trim().toLowerCase()}
        bankId={selectedBank}
        accountHolderName={name.trim().toLowerCase()}
        flowType="signup"
        onSuccess={handleOtpSuccess}
        onClose={() => setShowOtpModal(false)}
      />
    </div>
  );
}
