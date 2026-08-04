"use client";

import { useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { BankName } from "@/features/auth/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Coins, CheckCircle2, Building2, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { requestFaucetFunds } from "@/features/bank/api";
import { sanitizeNumber } from "@/features/crypto/sanitizer";

const BANK_OPTIONS: BankName[] = ["CPB", "EB", "SB"];

export default function FaucetPage() {
  const { user, refreshBalance } = useAuth();

  const [targetBank, setTargetBank] = useState<BankName>(user?.bank_name || "CPB");
  const [targetUserId, setTargetUserId] = useState<string>(user?.id || "1");
  const [amount, setAmount] = useState<number | string>(5000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFaucetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const numAmount = sanitizeNumber(amount);
    if (numAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    if (numAmount > 100000) {
      setError("Maximum single faucet deposit limit is $100,000.");
      return;
    }

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
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline">LIQUIDITY FAUCET</Badge>
          <span className="text-xs text-zinc-500 font-mono">CENTRAL RESERVE</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Bank Liquidity Provider
        </h1>
        <p className="text-xs text-zinc-500 font-normal mt-0.5">
          Inject test liquidity into participating accounts for simulation and multi-party testing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Ledger Inflow</CardTitle>
          <CardDescription>
            Deposits funds directly into the bank ledger (Max $100,000 per request).
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
              <Alert variant="success" title="Funds Credited">
                {successMsg}
              </Alert>
            )}

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
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm font-mono text-zinc-900 shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Input
                label="Deposit Amount (USD)"
                type="number"
                min="1"
                max="100000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />

              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Presets:</span>
                {[1000, 5000, 25000, 50000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className="px-2 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-[11px] font-mono text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300"
                  >
                    +${val.toLocaleString()}
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
              <Coins className="w-3.5 h-3.5" /> Inject Liquidity to Ledger
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
