"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  QrCode,
  Layers,
  Building2,
  KeyRound,
  FileCheck2,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  return (
    <div className="space-y-16 py-8 animate-fade-in">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto pt-6">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge variant="outline" className="px-3 py-1 text-xs font-mono tracking-wider border-zinc-300 bg-zinc-50">
            ALL CONNECTED PAYMENTS INTERFACE (ACPI)
          </Badge>
          <Badge variant="outline" className="px-3 py-1 text-xs font-mono tracking-wider border-emerald-300 bg-emerald-50 text-emerald-700">
            DPDP ACT 2023 COMPLIANT
          </Badge>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-950 leading-[1.12]">
          Zero-Trust Multi-Bank Settlement Core
        </h1>

        <p className="text-base sm:text-lg text-zinc-600 font-normal leading-relaxed max-w-2xl">
          NAUTILUS provides simulated inter-bank fund settlement between Common People&apos;s Bank (CPB),
          Elses Bank (EB), and SomeBank (SB) with real-time ACID clearance, RSA-OAEP payload encryption, and mandatory two-factor OTP verification.
        </p>

        {/* Hobby Project Disclaimer Banner */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-300 bg-amber-50 text-amber-900 text-xs font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
          <span>Educational Payment Architecture • Not affiliated with NPCI or UPI • Simulated Ledger</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          {isAuthenticated ? (
            <Button
              size="lg"
              onClick={() => router.push("/dashboard")}
              className="gap-2 font-mono text-xs tracking-wider"
            >
              ACCESS BANKING CONSOLE <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <>
              <Button
                size="lg"
                onClick={() => router.push("/signup")}
                className="gap-2 font-mono text-xs tracking-wider shadow-md hover:shadow-lg transition-all"
              >
                OPEN BANK ACCOUNT <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push("/login")}
                className="font-mono text-xs tracking-wider"
              >
                EXISTING USER SIGN IN
              </Button>
            </>
          )}
        </div>
      </section>

      {/* 3 Participating Banks Bar */}
      <section className="border-y border-zinc-200 py-8 bg-zinc-50/60 rounded-2xl">
        <div className="text-center mb-5">
          <span className="text-[11px] font-mono font-semibold uppercase text-zinc-400 tracking-widest">
            Connected Inter-Bank Liquidity Hubs
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center max-w-4xl mx-auto px-4">
          {[
            { name: "Common People's Bank", id: "CPB", tag: "Retail Ledger Network", code: "Routing ID 0x01" },
            { name: "Elses Bank", id: "EB", tag: "Commercial & Private Accounts", code: "Routing ID 0x02" },
            { name: "SomeBank", id: "SB", tag: "Reserve & Settlement Vault", code: "Routing ID 0x03" },
          ].map((bank) => (
            <div
              key={bank.id}
              className="p-5 bg-white rounded-xl border border-zinc-200 shadow-subtle hover:shadow-md transition-all flex flex-col items-center justify-center space-y-1"
            >
              <span className="text-xl font-bold font-mono text-zinc-900">{bank.id}</span>
              <span className="text-xs text-zinc-800 font-semibold">{bank.name}</span>
              <span className="text-[10px] text-zinc-500 font-mono">{bank.tag}</span>
              <span className="text-[9px] text-zinc-400 font-mono pt-1">{bank.code}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:border-zinc-400 transition-all border-zinc-200/90 shadow-subtle">
          <CardContent className="space-y-3 pt-6">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 font-mono">ACPI Atomic Routing</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Decentralized clearing engine verifies sender liquidity, updates bank ledger records atomically, and commits funds to recipient accounts in milliseconds.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-zinc-400 transition-all border-zinc-200/90 shadow-subtle">
          <CardContent className="space-y-3 pt-6">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 font-mono">Mandatory 2FA OTP</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Every sign-up and login requires Brevo-powered 6-digit one-time password verification with rate-limiting and brute-force IP protection.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-zinc-400 transition-all border-zinc-200/90 shadow-subtle">
          <CardContent className="space-y-3 pt-6">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 font-mono">Timed Encrypted QR</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              2-minute self-expiring payment tokens prevent replay attacks, ensuring touchless transactions are strictly single-use and time-bounded.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-zinc-400 transition-all border-zinc-200/90 shadow-subtle">
          <CardContent className="space-y-3 pt-6">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 font-mono">Zero-Sale Privacy Charter</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Compliant with the Digital Personal Data Protection Act 2023. User data is never sold, with strict user consent verification before account activation.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
