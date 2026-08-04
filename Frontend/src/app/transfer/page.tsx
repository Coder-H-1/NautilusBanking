"use client";

import { useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { BankName } from "@/features/auth/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import {
  Send,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Search,
  Building2,
  UserCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { executeTransfer, fetchUserDetails } from "@/features/bank/api";
import { encryptPayload, createRequestSignature } from "@/features/crypto/clientCrypto";
import { sanitizeNumber } from "@/features/crypto/sanitizer";

const BANK_OPTIONS: BankName[] = ["CPB", "EB", "SB"];

export default function TransferPage() {
  const { user, refreshBalance } = useAuth();

  // Form State
  const [receiverBank, setReceiverBank] = useState<BankName>("EB");
  const [receiverUserId, setReceiverUserId] = useState("1");
  const [amount, setAmount] = useState<number | string>("");

  // Verification & Transfer State
  const [verifiedRecipient, setVerifiedRecipient] = useState<{
    name: string;
    balance: number;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success Modal
  const [successReceipt, setSuccessReceipt] = useState<{
    transactionId?: string;
    amount: number;
    recipientName: string;
    recipientBank: string;
    message?: string;
  } | null>(null);

  // Cryptographic inspector preview
  const [cryptoPreview, setCryptoPreview] = useState<{
    ciphertextSample: string;
    signatureSample: string;
  } | null>(null);

  const handleVerifyRecipient = async () => {
    if (!receiverUserId) return;
    setIsVerifying(true);
    setError(null);
    setVerifiedRecipient(null);

    const res = await fetchUserDetails(receiverBank, receiverUserId);
    setIsVerifying(false);

    if (res.data && res.data.success) {
      setVerifiedRecipient({
        name: res.data.account_holder_name,
        balance: res.data.balance,
      });

      // Generate demo cryptographic preview
      try {
        const payloadSample = JSON.stringify({
          sender: user?.name,
          receiver: res.data.account_holder_name,
          amount: Number(amount) || 100,
          timestamp: Date.now(),
        });
        const enc = encryptPayload(payloadSample);
        const sig = createRequestSignature(payloadSample);
        setCryptoPreview({ ciphertextSample: enc, signatureSample: sig });
      } catch (err) {
        console.warn("Crypto preview error", err);
      }
    } else {
      setError(res.error || "Recipient account not found on target bank.");
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("User session is not active.");
      return;
    }

    const numAmount = sanitizeNumber(amount);
    if (numAmount <= 0) {
      setError("Please enter a valid transfer amount greater than 0.");
      return;
    }

    if (numAmount > user.balance) {
      setError(`Insufficient funds in ${user.bank_name}. Current balance: ${formatCurrency(user.balance)}`);
      return;
    }

    setIsSubmitting(true);
    const res = await executeTransfer({
      sender_account_holder_name: user.name,
      sender_bank_id: user.bank_name,
      sender_bank_user_id: user.id,
      receiver_bank_id: receiverBank,
      receiver_bank_user_id: receiverUserId,
      amount: numAmount,
    });
    setIsSubmitting(false);

    if (res.data && res.data.success) {
      await refreshBalance();
      setSuccessReceipt({
        transactionId: res.data.transaction_id,
        amount: numAmount,
        recipientName: verifiedRecipient?.name || `Account #${receiverUserId}`,
        recipientBank: receiverBank,
        message: res.data.message,
      });
    } else {
      setError(res.error || "Transfer failed. Please check ledger balance or recipient details.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline">ACPI CLEARING ENGINE</Badge>
          <span className="text-xs text-zinc-500 font-mono">SETTLEMENT PROTOCOL</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Inter-Bank Fund Settlement
        </h1>
        <p className="text-xs text-zinc-500 font-normal mt-0.5">
          Execute instantaneous atomic transactions across participating central bank ledgers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Transfer Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Transfer Specification</CardTitle>
            <CardDescription>
              Specify destination bank, account ID, and payment amount.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleTransfer}>
            <CardContent className="space-y-5">
              {error && (
                <Alert variant="error" title="Transfer Error">
                  {error}
                </Alert>
              )}

              {/* Source Account Info */}
              <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 block uppercase">
                    Originating Ledger (Debit)
                  </span>
                  <span className="text-xs font-bold text-zinc-900 font-mono">
                    {user?.bank_name} &bull; {user?.name} (#{user?.id})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-zinc-500 block uppercase">
                    Available Balance
                  </span>
                  <span className="text-xs font-bold font-mono text-emerald-600">
                    {formatCurrency(user?.balance ?? 0)}
                  </span>
                </div>
              </div>

              {/* Destination Bank & ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 tracking-wide uppercase font-mono mb-1.5">
                    Beneficiary Bank
                  </label>
                  <select
                    value={receiverBank}
                    onChange={(e) => {
                      setReceiverBank(e.target.value as BankName);
                      setVerifiedRecipient(null);
                    }}
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
                    Beneficiary User ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 1"
                      value={receiverUserId}
                      onChange={(e) => {
                        setReceiverUserId(e.target.value);
                        setVerifiedRecipient(null);
                      }}
                      className="flex h-9 w-full rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm font-mono text-zinc-900 shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleVerifyRecipient}
                      isLoading={isVerifying}
                      title="Verify Beneficiary"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Recipient Verification Status */}
              {verifiedRecipient && (
                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/70 flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-700" />
                    <div>
                      <span className="text-xs font-semibold text-emerald-900 block font-mono">
                        {verifiedRecipient.name}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-mono">
                        Verified {receiverBank} Account Holder
                      </span>
                    </div>
                  </div>
                  <Badge variant="success">READY</Badge>
                </div>
              )}

              {/* Amount & Quick Select */}
              <div className="space-y-2">
                <Input
                  label="Settlement Amount (USD)"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Enter amount (e.g. 100)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Quick Add:</span>
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
                <Lock className="w-3.5 h-3.5" /> Authorize & Settle Transfer
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Cryptographic Inspector Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-mono">CRYPTOGRAPHIC TELEMETRY</CardTitle>
              <CardDescription className="text-[11px]">
                Payload encryption & signature inspection.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-[11px] font-mono">
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase">CIPHER ALGORITHM</span>
                <span className="text-zinc-900 font-semibold">RSA-OAEP-SHA256 (2048-bit)</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase">INTEGRITY DIGEST</span>
                <span className="text-zinc-900 font-semibold">HMAC-SHA256</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase">ROUTING ENGINE</span>
                <span className="text-zinc-900 font-semibold">ACPI Central Switch</span>
              </div>

              {cryptoPreview && (
                <div className="pt-3 border-t border-zinc-100 space-y-2">
                  <div>
                    <span className="text-zinc-400 block text-[9px] uppercase">ENCRYPTED SAMPLE</span>
                    <div className="p-2 rounded bg-zinc-900 text-zinc-300 font-mono text-[9px] break-all max-h-20 overflow-y-auto">
                      {cryptoPreview.ciphertextSample}
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[9px] uppercase">HMAC SIGNATURE</span>
                    <div className="p-2 rounded bg-zinc-900 text-emerald-400 font-mono text-[9px] break-all">
                      {cryptoPreview.signatureSample}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Modal Receipt */}
      <Modal
        isOpen={!!successReceipt}
        onClose={() => setSuccessReceipt(null)}
        title="Transaction Settled Successfully"
        description="ACPI Inter-Bank Transfer has been committed to database ledgers."
      >
        {successReceipt && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">TRANSACTION ID:</span>
                <span className="font-bold text-zinc-900">{successReceipt.transactionId || "TX-ACPI-OK"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">SETTLED AMOUNT:</span>
                <span className="font-bold text-emerald-600">{formatCurrency(successReceipt.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">BENEFICIARY:</span>
                <span className="font-bold text-zinc-900">{successReceipt.recipientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">DESTINATION BANK:</span>
                <span className="font-bold text-zinc-900">{successReceipt.recipientBank}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">SETTLEMENT STATUS:</span>
                <span className="font-bold text-emerald-600">CLEARED (ACID)</span>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => setSuccessReceipt(null)}
            >
              Done
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
