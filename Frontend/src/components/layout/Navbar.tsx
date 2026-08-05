"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { BankName } from "@/features/auth/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ShieldCheck,
  RefreshCw,
  LogOut,
  Send,
  QrCode,
  Coins,
  LayoutDashboard,
  Building2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const BANK_OPTIONS: BankName[] = ["CPB", "EB", "SB"];

export function Navbar() {
  const { user, isAuthenticated, logout, refreshBalance, selectBank } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalance();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Transfer", href: "/transfer", icon: Send },
    { label: "QR Payment", href: "/qr", icon: QrCode },
    { label: "Faucet", href: "/faucet", icon: Coins },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-8">
          <div
            onClick={() => router.push(isAuthenticated ? "/dashboard" : "/")}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white font-mono font-bold text-sm shadow-subtle group-hover:bg-zinc-800 transition-colors">
              N
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-wider font-mono text-zinc-900">
                NAUTILUS
              </span>
              <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase">
                BANKING ARCHITECTURE
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      active
                        ? "bg-zinc-100 text-zinc-900 font-semibold"
                        : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right: Bank Selector, Balance, Auth */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              {/* Active Bank Selector */}
              <div className="hidden sm:flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-md px-2.5 py-1">
                <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs text-zinc-500 font-mono">BANK:</span>
                <select
                  value={user.bank_name}
                  onChange={(e) => selectBank(e.target.value as BankName)}
                  className="bg-transparent text-xs font-semibold text-zinc-900 focus:outline-none cursor-pointer"
                >
                  {BANK_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Balance Widget */}
              <div className="flex items-center gap-2 bg-zinc-900 text-white rounded-md px-3 py-1.5 shadow-subtle">
                <div className="flex flex-col text-right">
                  <span className="text-[9px] font-mono text-zinc-400 tracking-wider">BALANCE</span>
                  <span className="text-xs font-mono font-bold">{formatCurrency(user.balance)}</span>
                </div>
                <button
                  onClick={handleRefresh}
                  title="Refresh Balance"
                  className="p-1 text-zinc-400 hover:text-white rounded transition-colors"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-white" : ""}`}
                  />
                </button>
              </div>

              {/* Logout */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="text-zinc-500 hover:text-red-600"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/login")}
              >
                Sign In
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push("/signup")}
              >
                Open Account
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
