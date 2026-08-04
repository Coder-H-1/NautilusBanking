"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import {
  QrCode,
  RefreshCw,
  Clock,
  ShieldCheck,
  Lock,
  Zap,
} from "lucide-react";
import { fetchEncryptedQR, refreshEncryptedQR } from "@/features/bank/api";

export default function QRPage() {
  const { user } = useAuth();
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadQRCode = async (isRefresh: boolean = false) => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    const fetcher = isRefresh ? refreshEncryptedQR : fetchEncryptedQR;
    const res = await fetcher(user.bank_name, user.id);
    setIsLoading(false);

    if (res.data && res.data.success && res.data.qr_image_base64) {
      setQrBase64(res.data.qr_image_base64);
      setExpiresAt(res.data.expires_at);
      setTimeLeft(120); // 2 minutes validity
    } else {
      setError(res.error || "Failed to generate timed QR code.");
    }
  };

  useEffect(() => {
    loadQRCode(false);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user?.bank_name, user?.id]);

  // Countdown timer ticker
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [qrBase64]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline">ZERO-TRUST TIMED TOKEN</Badge>
          <span className="text-xs text-zinc-500 font-mono">DYNAMIC REFRESH</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Encrypted QR Payment Engine
        </h1>
        <p className="text-xs text-zinc-500 font-normal mt-0.5">
          Self-rotating, 2-minute encrypted QR codes protecting against replay attacks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR Display Card */}
        <Card className="flex flex-col items-center text-center">
          <CardHeader className="w-full">
            <CardTitle>Dynamic Payment Code</CardTitle>
            <CardDescription>
              Scan with any ACPI terminal to request transfer to this account.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 flex flex-col items-center">
            {error && (
              <Alert variant="error" title="QR Error">
                {error}
              </Alert>
            )}

            {/* QR Image Container */}
            <div className="relative p-4 rounded-xl border border-zinc-200 bg-white shadow-card">
              {isLoading ? (
                <div className="w-56 h-56 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-mono text-zinc-400">GENERATING TOKEN...</span>
                </div>
              ) : qrBase64 ? (
                <div className="relative">
                  <img
                    src={`data:image/png;base64,${qrBase64}`}
                    alt="Encrypted Payment QR"
                    className={`w-56 h-56 rounded-lg ${timeLeft === 0 ? "filter blur-xs opacity-40" : ""}`}
                  />
                  {timeLeft === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 rounded-lg p-3">
                      <Clock className="w-6 h-6 text-red-600 mb-1" />
                      <span className="text-xs font-bold text-red-600 font-mono">EXPIRED</span>
                      <span className="text-[10px] text-zinc-500 mt-1">Token rotated for security</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-zinc-400 font-mono text-xs">
                  NO QR AVAILABLE
                </div>
              )}
            </div>

            {/* Timer Badge */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-500" />
              <span className="text-xs text-zinc-500 font-mono">VALIDITY REMAINING:</span>
              <span
                className={`text-sm font-mono font-bold ${
                  timeLeft < 20 ? "text-red-600 animate-pulse" : "text-zinc-900"
                }`}
              >
                {formatTimer(timeLeft)}
              </span>
            </div>
          </CardContent>

          <CardFooter className="w-full">
            <Button
              variant={timeLeft === 0 ? "primary" : "outline"}
              size="md"
              className="w-full gap-2"
              onClick={() => loadQRCode(true)}
              isLoading={isLoading}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Rotate & Refresh Token
            </Button>
          </CardFooter>
        </Card>

        {/* Security Specs Card */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-mono">QR TOKEN PROPERTIES</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">PAYEE:</span>
                  <span className="font-semibold text-zinc-900">{user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">ISSUING BANK:</span>
                  <span className="font-semibold text-zinc-900">{user?.bank_name} CORE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">TOKEN EXPIRATION:</span>
                  <span className="font-semibold text-zinc-900">{expiresAt || "120s TTL"}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h5 className="text-[11px] font-semibold text-zinc-700 uppercase">Protection Pillars</h5>
                <ul className="space-y-2 text-[11px] text-zinc-600 list-disc list-inside">
                  <li>Time-bounded RSA payload prevents replay attacks</li>
                  <li>HMAC signature validated prior to transaction execution</li>
                  <li>Instant invalidation upon server key rotation</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
