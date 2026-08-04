"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Lock, ArrowRight, Shield } from "lucide-react";
import { sanitizeInput } from "@/features/crypto/sanitizer";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = sanitizeInput(email);
    if (!cleanEmail) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    const res = await login(cleanEmail, password || "SecurePass123!");
    setLoading(false);

    if (res.success) {
      router.push("/dashboard");
    } else {
      setError(res.error || "Authentication failed.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-16rem)] py-12">
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-1 text-zinc-900">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-mono font-bold tracking-wider">NAUTILUS AUTH</span>
            </div>
            <CardTitle>Sign In to Bank Account</CardTitle>
            <CardDescription>
              Enter your credentials to access your multi-bank ACPI console.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="error" title="Authentication Error">
                  {error}
                </Alert>
              )}

              <Input
                label="Email Address"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helperText="Defaults to SecurePass123! if registered recently"
              />
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" size="md" isLoading={loading}>
                Access Console <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="text-center text-xs text-zinc-500">
                Don&apos;t have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/signup")}
                  className="font-semibold text-zinc-900 hover:underline"
                >
                  Open Bank Account
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
