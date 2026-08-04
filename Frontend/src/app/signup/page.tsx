"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { BankName } from "@/features/auth/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Building2, ArrowRight, ShieldCheck } from "lucide-react";
import { sanitizeInput } from "@/features/crypto/sanitizer";

const BANK_OPTIONS: { id: BankName; name: string; region: string }[] = [
  { id: "CPB", name: "Common People's Bank", region: "Retail Network" },
  { id: "EB", name: "Elses Bank", region: "Commercial & Private" },
  { id: "SB", name: "SomeBank", region: "Reserve & Settlement" },
];

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("SecurePass123!");
  const [selectedBank, setSelectedBank] = useState<BankName>("CPB");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = sanitizeInput(name);
    const cleanEmail = sanitizeInput(email);

    if (!cleanName || !cleanEmail) {
      setError("Please complete all required fields.");
      return;
    }

    setLoading(true);
    const res = await signup(cleanName, cleanEmail, selectedBank, password);
    setLoading(false);

    if (res.success) {
      router.push("/dashboard");
    } else {
      setError(res.error || "Account creation failed.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-16rem)] py-12">
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-1 text-zinc-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-mono font-bold tracking-wider">NAUTILUS ONBOARDING</span>
            </div>
            <CardTitle>Open Bank Account</CardTitle>
            <CardDescription>
              Select your issuing financial institution and register your ACPI account.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="error" title="Onboarding Error">
                  {error}
                </Alert>
              )}

              <Input
                label="Full Legal Name"
                placeholder="e.g. Satoshi Nakamoto"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {/* Bank Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 tracking-wide uppercase font-mono">
                  Issuing Bank
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {BANK_OPTIONS.map((bank) => (
                    <label
                      key={bank.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedBank === bank.id
                          ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
                          : "border-zinc-200 hover:border-zinc-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="bank"
                          value={bank.id}
                          checked={selectedBank === bank.id}
                          onChange={() => setSelectedBank(bank.id)}
                          className="text-zinc-900 focus:ring-zinc-900 h-4 w-4"
                        />
                        <div>
                          <p className="text-xs font-semibold text-zinc-900">{bank.name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">{bank.region}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-zinc-700">{bank.id}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helperText="Pre-filled with default secure testing password"
                required
              />
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" size="md" isLoading={loading}>
                Create Account <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="text-center text-xs text-zinc-500">
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="font-semibold text-zinc-900 hover:underline"
                >
                  Sign In
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
