"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { BankName } from "@/features/auth/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { QRScanModal } from "@/components/ui/QRScanModal";
import { Coins, QrCode, Download, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { requestFaucetFunds, fetchFaucetQR, claimFaucetQR, QRDecodeResponseData } from "@/features/bank/api";
import { sanitizeNumber } from "@/features/crypto/sanitizer";

const BANK_OPTIONS: BankName[] = ["CPB", "EB", "SB"];

type FaucetMode = "direct" | "generate";

export default function FaucetPage() {
  const { user, refreshBalance } = useAuth();

  const [mode, setMode] = useState<FaucetMode>("direct");
  const [targetBank, setTargetBank] = useState<BankName>(user?.bank_name || "CPB");
  const [targetUserId, setTargetUserId] = useState<string>(user?.id || "");
  const [amount, setAmount] = useState<number | string>(100);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Faucet QR Generation State
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Claim Modal
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  // Countdown timer for generated Faucet QR
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (qrBase64 && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setQrBase64(null); // Clear expired QR
            setError("Generated Faucet QR has expired.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [qrBase64, timeLeft]);

  const handleFaucetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const numAmount = sanitizeNumber(amount);
    if (numAmount <= 0) {
      setError("Please enter a valid amount greater than $0.");
      return;
    }

    if (numAmount > 500) {
      setError("Maximum faucet limit is $500 per request.");
      return;
    }

    if (mode === "direct") {
      setIsSubmitting(true);
      const res = await requestFaucetFunds(targetBank, targetUserId, numAmount);
      setIsSubmitting(false);

      if (res.data && res.data.success) {
        setSuccessMsg(
          `Successfully credited ${formatCurrency(numAmount)} to ${res.data.account_holder_name} (${targetBank} #${targetUserId}). New Balance: ${formatCurrency(res.data.balance)}`
        );
        if (targetBank === user?.bank_name && targetUserId === user?.id) {
          await refreshBalance();
        }
      } else {
        setError(res.error || "Faucet request failed. Check bank and account ID.");
      }
    } else if (mode === "generate") {
      if (!user) {
        setError("You must be logged in to generate a Faucet QR.");
        return;
      }
      setIsSubmitting(true);
      const res = await fetchFaucetQR(user.bank_name, user.id, user.name, numAmount);
      setIsSubmitting(false);

      if (res.data && res.data.success && res.data.qr_image_base64) {
        setQrBase64(res.data.qr_image_base64);
        setExpiresAt(res.data.expires_at);
        setTimeLeft(120); // 2 mins validity
        setSuccessMsg("Faucet QR generated successfully! Anyone can scan this to claim the funds.");
      } else {
        setError(res.error || "Failed to generate Faucet QR.");
      }
    }
  };

  const handleScanSuccess = async (data: QRDecodeResponseData) => {
    if (data.type === "faucet" && data.raw_token && user) {
      setIsSubmitting(true);
      const res = await claimFaucetQR(user.bank_name, user.id, data.raw_token);
      setIsSubmitting(false);

      if (res.data && res.data.success) {
        setSuccessMsg(
          `Successfully claimed faucet funds! New Balance: ${formatCurrency(res.data.balance)}`
        );
        await refreshBalance();
      } else {
        setError(res.error || "Failed to claim Faucet QR. It may be expired or already claimed.");
      }
    } else if (!user) {
      setError("You must be logged in to claim a Faucet QR.");
    } else {
      setError("This is not a valid Faucet QR code.");
    }
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Liquidity Faucet
        </h1>
        <p className="text-xs text-zinc-500 font-normal mt-0.5">
          Request test funds for your account or generate a claimable Faucet QR code.
        </p>
      </div>

      <div className="flex gap-2 p-1 bg-zinc-100 rounded-lg w-fit">
        <button
          onClick={() => {
            setMode("direct");
            setQrBase64(null);
            setSuccessMsg(null);
            setError(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${
            mode === "direct" 
              ? "bg-white text-zinc-900 shadow-sm" 
              : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50"
          }`}
        >
          <Download className="w-4 h-4" /> Direct Deposit
        </button>
        <button
          onClick={() => {
            setMode("generate");
            setSuccessMsg(null);
            setError(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${
            mode === "generate" 
              ? "bg-white text-zinc-900 shadow-sm" 
              : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50"
          }`}
        >
          <QrCode className="w-4 h-4" /> Create Faucet QR
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Col: Request Form */}
        <Card className="shadow-subtle h-fit">
          <CardHeader>
            <CardTitle>{mode === "direct" ? "Request Funds" : "Generate Claimable Faucet"}</CardTitle>
            <CardDescription>
              {mode === "direct" 
                ? "Deposits funds directly into the selected bank account."
                : "Creates a 2-minute QR code that anyone can scan to claim test funds."}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleFaucetRequest}>
            <CardContent className="space-y-5">
              {error && (
                <Alert variant="error" title="Faucet Error">
                  {error}
                </Alert>
              )}

              {successMsg && (
                <Alert variant="success" title="Success">
                  {successMsg}
                </Alert>
              )}

              {mode === "direct" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 tracking-wide uppercase font-mono mb-1.5">
                      Target Bank
                    </label>
                    <select
                      value={targetBank}
                      onChange={(e) => setTargetBank(e.target.value as BankName)}
                      className="flex h-9 w-full rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm font-mono text-zinc-900 shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
                    >
                      {BANK_OPTIONS.map((b) => (
                        <option key={b} value={b}>
                          {b} ({b === "CPB" ? "Common People's Bank" : b === "EB" ? "Elses Bank" : "SomeBank"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 tracking-wide uppercase font-mono mb-1.5">
                      Account ID
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="0"
                      value={targetUserId}
                      onChange={(e) => setTargetUserId(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm font-mono text-zinc-900 shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Input
                  label="Amount (USD - Max $500)"
                  type="number"
                  min="1"
                  max="500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Presets:</span>
                  {[50, 100, 250, 500].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className="px-2 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-[11px] font-mono text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300"
                    >
                      +${val}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                type="submit"
                size="md"
                className="w-full gap-2"
                isLoading={isSubmitting}
              >
                {mode === "direct" ? (
                  <><Coins className="w-3.5 h-3.5" /> Request Faucet Funds</>
                ) : (
                  <><QrCode className="w-3.5 h-3.5" /> Generate Faucet QR</>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Right Col: Output OR Claim */}
        <div className="space-y-6 h-full">
          {mode === "generate" && qrImageSrc ? (
            <Card className="flex flex-col items-center text-center shadow-subtle h-full">
              <CardHeader className="w-full pb-2">
                <CardTitle>Claimable Faucet QR</CardTitle>
                <CardDescription>
                  Anyone can scan this to claim {formatCurrency(amount as number)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 flex flex-col items-center justify-center flex-1">
                <div className="relative p-4 rounded-xl border border-zinc-200 bg-white shadow-card">
                  <img
                    src={qrImageSrc}
                    alt="Faucet QR"
                    className="w-56 h-56 rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs text-zinc-500 font-mono">EXPIRES IN:</span>
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
          ) : (
            <Card className="h-full bg-emerald-50/50 border-emerald-100 shadow-subtle">
              <CardHeader>
                <CardTitle className="text-emerald-900 flex items-center gap-2">
                  <QrCode className="w-5 h-5" /> Claim Faucet via QR
                </CardTitle>
                <CardDescription className="text-emerald-700">
                  Did someone generate a Faucet QR for you? Scan it here to claim the funds into your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center text-center space-y-4 pt-4 flex-1">
                <div className="p-4 bg-white rounded-xl shadow-sm border border-emerald-100">
                  <Coins className="w-12 h-12 text-emerald-400" />
                </div>
                <p className="text-xs text-emerald-800">
                  You must be signed in to your account to claim funds.
                </p>
                <Button 
                  variant="primary" 
                  onClick={() => setIsScanModalOpen(true)}
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                  disabled={!user}
                >
                  <QrCode className="w-4 h-4" /> Scan to Claim
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <QRScanModal 
        isOpen={isScanModalOpen} 
        onClose={() => setIsScanModalOpen(false)} 
        onScanSuccess={handleScanSuccess} 
      />
    </div>
  );
}
