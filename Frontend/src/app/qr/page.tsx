"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Clock, QrCode, Share2, DollarSign, Download } from "lucide-react";
import { generateShareQR, generateTransferQR } from "@/features/bank/api";

type QRMode = "share" | "receive";

export default function QRPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<QRMode>("share");
  
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // For 'receive' mode
  const [amount, setAmount] = useState<string>("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadQRCode = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    let res;
    if (mode === "share") {
      res = await generateShareQR(user.bank_name, user.id, user.name);
    } else {
      const numAmount = amount ? parseFloat(amount) : undefined;
      res = await generateTransferQR(user.bank_name, user.id, user.name, numAmount);
    }

    setIsLoading(false);

    if (res.data && res.data.success && res.data.qr_image_base64) {
      setQrBase64(res.data.qr_image_base64);
      setExpiresAt(res.data.expires_at);
      setTimeLeft(120); // 2 minutes validity
    } else {
      setError("QR Generation Failed due to some error, please try again later.");
    }
  };

  useEffect(() => {
    loadQRCode();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user?.bank_name, user?.id, mode]);

  // Countdown timer ticker & auto-refresh on expiry
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Automatically rotate/refresh when countdown expires
          loadQRCode();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [qrBase64, mode, amount]); // Reload if QR changes

  const handleGenerateReceive = (e: React.FormEvent) => {
    e.preventDefault();
    loadQRCode();
  };

  const handleDownload = () => {
    if (!qrImageSrc) return;
    const a = document.createElement("a");
    a.href = qrImageSrc;
    a.download = `nautilus_qr_${mode}_${user?.id || "account"}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          My QR Codes
        </h1>
        <p className="text-xs text-zinc-500 font-normal mt-0.5">
          Generate contactless QR codes for sharing account details or receiving payments. Codes refresh every 2 minutes.
        </p>
      </div>

      <div className="flex gap-2 p-1 bg-zinc-100 rounded-lg w-fit">
        <button
          onClick={() => setMode("share")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${
            mode === "share" 
              ? "bg-white text-zinc-900 shadow-sm" 
              : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50"
          }`}
        >
          <Share2 className="w-4 h-4" /> Share Profile
        </button>
        <button
          onClick={() => setMode("receive")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${
            mode === "receive" 
              ? "bg-white text-zinc-900 shadow-sm" 
              : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50"
          }`}
        >
          <DollarSign className="w-4 h-4" /> Request Payment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left Col: QR Config */}
        <div className="md:col-span-2 space-y-4">
          <Card className="shadow-subtle h-full">
            <CardHeader>
              <CardTitle className="text-sm uppercase font-mono">
                {mode === "share" ? "Profile Details" : "Payment Request"}
              </CardTitle>
              <CardDescription>
                {mode === "share" 
                  ? "Scan this code to instantly get your account information."
                  : "Specify an amount to generate a targeted payment request."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 space-y-2 font-mono text-xs">
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
                  <span className="text-zinc-500">ROTATION:</span>
                  <span className="font-semibold text-zinc-900">120s (Auto)</span>
                </div>
              </div>

              {mode === "receive" && (
                <form onSubmit={handleGenerateReceive} className="space-y-3 pt-2">
                  <Input
                    label="Requested Amount (Optional)"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Enter amount (e.g. 50)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <Button type="submit" className="w-full gap-2">
                    <QrCode className="w-4 h-4" /> Update QR Code
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: QR Display Card */}
        <div className="md:col-span-3">
          <Card className="flex flex-col items-center text-center shadow-subtle h-full">
            <CardHeader className="w-full pb-2">
              <CardTitle>
                {mode === "share" ? "Profile QR" : "Payment QR"}
              </CardTitle>
              <CardDescription>
                Auto-updating secure contactless token
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 flex flex-col items-center pb-6 flex-1 justify-center">
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

              {/* Timer Badge and Download */}
              <div className="flex flex-col items-center gap-4">
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
                
                {qrImageSrc && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDownload}
                    className="gap-2 text-xs"
                  >
                    <Download className="w-3.5 h-3.5" /> Download QR
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
