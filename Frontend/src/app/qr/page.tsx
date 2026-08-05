"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Clock } from "lucide-react";
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

  // Countdown timer ticker & auto-refresh on expiry
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Automatically rotate/refresh when countdown expires
          loadQRCode(true);
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

  const qrImageSrc = qrBase64
    ? qrBase64.startsWith("data:")
      ? qrBase64
      : `data:image/png;base64,${qrBase64}`
    : "";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Payment QR Code
        </h1>
        <p className="text-xs text-zinc-500 font-normal mt-0.5">
          Scan to receive payments. Code automatically refreshes every 2 minutes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR Display Card */}
        <Card className="flex flex-col items-center text-center shadow-subtle">
          <CardHeader className="w-full">
            <CardTitle>Dynamic Payment Code</CardTitle>
            <CardDescription>
              Auto-updating contactless payment token
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 flex flex-col items-center pb-6">
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
                  <span className="text-xs font-mono text-zinc-400">UPDATING CODE...</span>
                </div>
              ) : qrImageSrc ? (
                <div className="relative">
                  <img
                    src={qrImageSrc}
                    alt="Payment QR"
                    className="w-56 h-56 rounded-lg"
                  />
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
        </Card>

        {/* Details Card */}
        <div className="space-y-4">
          <Card className="shadow-subtle">
            <CardHeader>
              <CardTitle className="text-xs font-mono">ACCOUNT DETAILS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-500">PAYEE:</span>
                  <span className="font-semibold text-zinc-900">{user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">ISSUING BANK:</span>
                  <span className="font-semibold text-zinc-900">{user?.bank_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">USER ID:</span>
                  <span className="font-semibold text-zinc-900">#{user?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">ROTATION INTERVAL:</span>
                  <span className="font-semibold text-zinc-900">120 seconds (Auto)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
