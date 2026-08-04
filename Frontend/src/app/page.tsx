"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  Building,
  QrCode,
  Layers,
  Database,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto pt-8">
        <Badge variant="outline" className="px-3 py-1 text-xs">
          ALL CONNECTED PAYMENTS INTERFACE (ACPI)
        </Badge>
        
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-950 leading-[1.15]">
          Zero-Trust Autonomous Inter-Bank Settlement Core
        </h1>

        <p className="text-base sm:text-lg text-zinc-600 font-normal leading-relaxed max-w-2xl">
          NAUTILUS facilitates instant inter-bank fund settlement between Common People&apos;s Bank (CPB),
          Elses Bank (EB), and SomeBank (SB) with real-time ACID clearance and timed QR codes.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {isAuthenticated ? (
            <Button
              size="lg"
              onClick={() => router.push("/dashboard")}
              className="gap-2"
            >
              Go to Banking Dashboard <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <>
              <Button
                size="lg"
                onClick={() => router.push("/signup")}
                className="gap-2"
              >
                Open Bank Account <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push("/login")}
              >
                Existing User Sign In
              </Button>
            </>
          )}
        </div>
      </section>

      {/* 3 Participating Banks Bar */}
      <section className="border-y border-zinc-200 py-6 bg-zinc-50/50 rounded-xl">
        <div className="text-center mb-4">
          <span className="text-[11px] font-mono font-semibold uppercase text-zinc-400 tracking-widest">
            Connected Liquidity Hubs
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center max-w-3xl mx-auto">
          {[
            { name: "Common People's Bank", id: "CPB", tag: "Retail Network" },
            { name: "Elses Bank", id: "EB", tag: "Commercial & Private" },
            { name: "SomeBank", id: "SB", tag: "Reserve & Settlement" },
          ].map((bank) => (
            <div
              key={bank.id}
              className="p-4 bg-white rounded-lg border border-zinc-200 shadow-subtle flex flex-col items-center justify-center"
            >
              <span className="text-lg font-bold font-mono text-zinc-900">{bank.id}</span>
              <span className="text-xs text-zinc-700 font-medium">{bank.name}</span>
              <span className="text-[10px] text-zinc-400 font-mono mt-0.5">{bank.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid md:grid-cols-3 gap-6">
        <Card className="hover:border-zinc-300 transition-all">
          <CardContent className="space-y-3 pt-6">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900">ACPI Settlement Routing</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Central clearing engine verifies sender liquidity, updates bank ledger records atomically, and commits funds to recipient accounts in milliseconds.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-zinc-300 transition-all">
          <CardContent className="space-y-3 pt-6">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900">Zero-Trust Security</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Every sensitive transaction payload is securely verified and signed for mathematical integrity and anti-tampering protection.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-zinc-300 transition-all">
          <CardContent className="space-y-3 pt-6">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900">Timed Encrypted QR</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              2-minute self-expiring payment tokens prevent replay attacks, ensuring touchless transactions are strictly single-use and time-bounded.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
