"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import {
  Building2,
  RefreshCw,
  Send,
  QrCode,
  Coins,
  Shield,
  Key,
  Lock,
  ArrowUpRight,
  CheckCircle,
  Database,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { fetchUserDetails } from "@/features/bank/api";
import { BankName } from "@/features/auth/types";

export default function DashboardPage() {
  const { user, refreshBalance, selectBank } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Inspector state
  const [inspectBank, setInspectBank] = useState<BankName>("BOA");
  const [inspectUserId, setInspectUserId] = useState("1");
  const [inspectResult, setInspectResult] = useState<{
    account_holder_name?: string;
    balance?: number;
    error?: string;
  } | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  useEffect(() => {
    refreshBalance();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBalance();
    setTimeout(() => setRefreshing(false), 400);
  };

  const handleInspect = async (e: React.FormEvent) => {
    e.preventDefault();
    setInspectLoading(true);
    setInspectResult(null);

    const res = await fetchUserDetails(inspectBank, inspectUserId);
    setInspectLoading(false);

    if (res.data && res.data.success) {
      setInspectResult({
        account_holder_name: res.data.account_holder_name,
        balance: res.data.balance,
      });
    } else {
      setInspectResult({ error: res.error || "Account not found." });
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
              {user?.bank_name} BANKING PORTAL
            </span>
            <Badge variant="success">ACPI VERIFIED</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Welcome back, {user?.name || "Client"}
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            USER ID: #{user?.id} &bull; EMAIL: {user?.email}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={refreshing}
            className="gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Sync Ledger
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push("/transfer")}
            className="gap-2"
          >
            <Send className="w-3.5 h-3.5" /> New Transfer
          </Button>
        </div>
      </div>

      {/* Main Balance & Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <Card className="md:col-span-2 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 text-white border-zinc-800 shadow-float">
          <CardContent className="p-6 sm:p-8 flex flex-col justify-between h-full space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                  Available Ledger Liquidity
                </span>
                <div className="text-3xl sm:text-4xl font-mono font-bold tracking-tight">
                  {formatCurrency(user?.balance ?? 0)}
                </div>
              </div>
              <div className="px-3 py-1 rounded-md bg-white/10 text-white font-mono text-xs font-semibold border border-white/10">
                {user?.bank_name} CORE
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs font-mono">
              <div>
                <span className="text-zinc-400 block text-[10px]">ACCOUNT HOLDER</span>
                <span className="font-semibold text-white truncate block">{user?.name}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px]">BANK USER ID</span>
                <span className="font-semibold text-white">#{user?.id}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px]">SECURITY LEVEL</span>
                <span className="font-semibold text-emerald-400">RSA-OAEP 2048</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Launch Cards */}
        <div className="flex flex-col gap-3">
          <div
            onClick={() => router.push("/transfer")}
            className="p-4 rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-card cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-zinc-100 text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-900">ACPI Inter-Bank Transfer</h4>
                <p className="text-[11px] text-zinc-500">Send money across any of 5 banks</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
          </div>

          <div
            onClick={() => router.push("/qr")}
            className="p-4 rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-card cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-zinc-100 text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-900">Encrypted QR Pay</h4>
                <p className="text-[11px] text-zinc-500">2-minute timed contactless token</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
          </div>

          <div
            onClick={() => router.push("/faucet")}
            className="p-4 rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-card cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-zinc-100 text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-900">Liquidity Faucet</h4>
                <p className="text-[11px] text-zinc-500">Request test credits from central bank</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
          </div>
        </div>
      </div>

      {/* Network Account Inspector & ACPI Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inter-Bank Account Lookup */}
        <Card>
          <CardHeader>
            <CardTitle>ACPI Multi-Bank Account Inspector</CardTitle>
            <CardDescription>
              Verify real-time account balances and names across any participating bank table.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInspect} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 tracking-wide uppercase font-mono mb-1.5">
                    Target Bank
                  </label>
                  <select
                    value={inspectBank}
                    onChange={(e) => setInspectBank(e.target.value as BankName)}
                    className="flex h-9 w-full rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm font-mono text-zinc-900 shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
                  >
                    <option value="BOA">BOA (Bank of America)</option>
                    <option value="HDFC">HDFC Bank</option>
                    <option value="JPMC">JPMorgan Chase</option>
                    <option value="SWISS">Swiss Private</option>
                    <option value="CITI">Citigroup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 tracking-wide uppercase font-mono mb-1.5">
                    User Account ID
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={inspectUserId}
                    onChange={(e) => setInspectUserId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm font-mono text-zinc-900 shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
                    required
                  />
                </div>
              </div>

              <Button type="submit" variant="secondary" size="sm" isLoading={inspectLoading} className="w-full">
                Verify Account Details
              </Button>

              {inspectResult && (
                <div className="mt-3 p-3 rounded-lg border border-zinc-200 bg-zinc-50 font-mono text-xs space-y-1">
                  {inspectResult.error ? (
                    <span className="text-red-600 font-semibold">{inspectResult.error}</span>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Account Holder:</span>
                        <span className="font-bold text-zinc-900">{inspectResult.account_holder_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Confirmed Balance:</span>
                        <span className="font-bold text-zinc-900">{formatCurrency(inspectResult.balance ?? 0)}</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Security Architecture Status */}
        <Card>
          <CardHeader>
            <CardTitle>Zero-Trust Cryptographic Stack</CardTitle>
            <CardDescription>
              Real-time telemetry of active cryptographic defense mechanisms.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 bg-zinc-50">
                <Lock className="w-4 h-4 text-zinc-700 mt-0.5" />
                <div>
                  <h5 className="text-xs font-semibold text-zinc-900 font-mono">RSA-2048 / OAEP Payload Cipher</h5>
                  <p className="text-[11px] text-zinc-500">Transactions encrypted end-to-end; private key protected in server enclave.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 bg-zinc-50">
                <Shield className="w-4 h-4 text-zinc-700 mt-0.5" />
                <div>
                  <h5 className="text-xs font-semibold text-zinc-900 font-mono">HMAC-SHA256 Request Integrity</h5>
                  <p className="text-[11px] text-zinc-500">Constant-time verification prevents timing attacks and MITM manipulation.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 bg-zinc-50">
                <Database className="w-4 h-4 text-zinc-700 mt-0.5" />
                <div>
                  <h5 className="text-xs font-semibold text-zinc-900 font-mono">Atomic ACPI Settlement</h5>
                  <p className="text-[11px] text-zinc-500">Double-entry ledger debit & credit occurs within synchronized database transactions.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
