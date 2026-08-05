"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  RefreshCw,
  Send,
  QrCode,
  Coins,
  ArrowUpRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const { user, refreshBalance } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(false);

  useEffect(() => {
    refreshBalance();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBalance();
    setTimeout(() => setRefreshing(false), 400);
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
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                    Available Balance
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowBalance(!showBalance)}
                    className="p-1 text-zinc-400 hover:text-white transition-colors rounded hover:bg-white/10"
                    title={showBalance ? "Hide balance" : "Show balance"}
                    aria-label="Toggle balance visibility"
                  >
                    {showBalance ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <div className="text-3xl sm:text-4xl font-mono font-bold tracking-tight flex items-center gap-3">
                  {showBalance ? formatCurrency(user?.balance ?? 0) : "$ ••••••••"}
                </div>
              </div>
              <div className="px-3 py-1 rounded-md bg-white/10 text-white font-mono text-xs font-semibold border border-white/10">
                {user?.bank_name} BANK
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs font-mono">
              <div>
                <span className="text-zinc-400 block text-[10px]">ACCOUNT HOLDER</span>
                <span className="font-semibold text-white truncate block">{user?.name}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px]">BANK USER ID</span>
                <span className="font-semibold text-white">#{user?.id}</span>
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
                <h4 className="text-xs font-semibold text-zinc-900">Inter-Bank Transfer</h4>
                <p className="text-[11px] text-zinc-500">Send money across CPB, EB, and SB</p>
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
                <h4 className="text-xs font-semibold text-zinc-900">QR Pay</h4>
                <p className="text-[11px] text-zinc-500">2-minute timed contactless payment</p>
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
                <p className="text-[11px] text-zinc-500">Request funds up to $500 with QR</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}
