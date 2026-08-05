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
  Lock,
  Search,
  UserCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { executeTransfer, fetchUserDetails } from "@/features/bank/api";
import { sanitizeNumber } from "@/features/crypto/sanitizer";

const BANK_OPTIONS: BankName[] = ["CPB", "EB", "SB"];

export default function TransferPage() {
  const { user, refreshBalance } = useAuth();

  // Form State
  const [receiverBank, setReceiverBank] = useState<BankName>("EB");
  const [receiverUserId, setReceiverUserId] = useState("");
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

  const handleVerifyRecipient = async () => {
    if (!receiverUserId) {
      setError("Please enter a beneficiary user ID.");
      return;
    }
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
    } else {
      const errMsg = res.error || "Account not found";
      if (
        errMsg.toLowerCase().includes("not found") ||
        errMsg.toLowerCase().includes("no account") ||
        errMsg.toLowerCase().includes("invalid bank_user_id")
      ) {
        setError("You don't have any accounts in this bank. Please choose another or check the ID.");
      } else {
        setError(errMsg);
      }
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("User session is not active.");
      return;
    }

    if (!receiverUserId) {
      setError("Please specify a Beneficiary User ID.");
      return;
    }

    const numAmount = sanitizeNumber(amount);
    if (numAmount <= 0) {
      setError("Please enter a valid transfer amount greater than $0.");
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
      const errMsg = res.error || "Transfer failed.";
      if (
        errMsg.toLowerCase().includes("not found") ||
        errMsg.toLowerCase().includes("no account")
      ) {
        setError("You don't have any accounts in this bank.");
      } else {
        setError(errMsg);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Transfer Money
        </h1>
        <p className="text-xs text-zinc-500 font-normal mt-0.5">
          Send funds securely to accounts across CPB, EB, and SB.
        </p>
      </div>

      {/* Transfer Form */}
      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle>Transfer Details</CardTitle>
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
                  Originating Account (Debit)
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
                    placeholder="0"
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
                label="Transfer Amount (USD)"
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
              <Send className="w-3.5 h-3.5" /> Transfer Funds
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Success Modal Receipt */}
      <Modal
        isOpen={!!successReceipt}
        onClose={() => setSuccessReceipt(null)}
        title="Transaction Completed"
        description="Transfer has been successfully processed."
      >
        {successReceipt && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">TRANSACTION ID:</span>
                <span className="font-bold text-zinc-900">{successReceipt.transactionId || "TX-OK"}</span>
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
                <span className="text-zinc-500">STATUS:</span>
                <span className="font-bold text-emerald-600">COMPLETED</span>
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
