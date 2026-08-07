"use client";

import React from "react";
import Link from "next/link";
import {
  Compass,
  ArrowLeft,
  ServerCrash,
  Radio,
  RefreshCw,
  Home,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="relative min-h-[85vh] flex flex-col items-center justify-center px-4 overflow-hidden text-foreground">
      {/* Background Animated Grid & Radar Rings */}
      <div className="absolute inset-0 -z-10 pointer-events-none flex items-center justify-center overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />

        {/* Sonar / Radar pulse circles */}
        <div className="absolute w-[360px] h-[360px] rounded-full border border-zinc-300/40 animate-ping opacity-20 [animation-duration:4s]" />
        <div className="absolute w-[540px] h-[540px] rounded-full border border-zinc-300/30 animate-pulse [animation-duration:6s]" />
        <div className="absolute w-[720px] h-[720px] rounded-full border border-dashed border-zinc-200/40" />

        {/* Rotating radar sweep */}
        <div className="absolute w-[500px] h-[500px] rounded-full border border-primary/20 animate-spin [animation-duration:20s] opacity-40">
          <div className="w-1/2 h-1/2 bg-gradient-to-br from-primary/20 via-transparent to-transparent rounded-tl-full" />
        </div>
      </div>

      <div className="w-full max-w-xl mx-auto text-center space-y-8 animate-fade-in relative z-10">
        {/* Top Floating Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-destructive/30 bg-destructive/5 text-destructive font-mono text-xs font-semibold tracking-wider">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
          </span>
          ERR_CODE_404: PROTOCOL_ROUTE_NOT_FOUND
        </div>

        {/* Animated Big 404 Display */}
        <div className="relative select-none">
          <div className="text-8xl sm:text-9xl font-extrabold font-mono tracking-tighter text-zinc-900/90 dark:text-zinc-100">
            4<span className="inline-block animate-bounce [animation-duration:2.5s] text-primary">0</span>4
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-48 h-1.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent blur-sm" />
        </div>

        {/* Descriptive Message */}
        <div className="space-y-3">
          <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">
            Inter-Bank Mesh Endpoint Unreachable
          </h1>
          <p className="text-sm text-muted-foreground font-mono max-w-md mx-auto leading-relaxed">
            The requested subsea route or ACPI transaction endpoint does not exist or has been relocated within the network ledger.
          </p>
        </div>

        {/* Terminal Status Box */}
        <div className="text-left bg-zinc-950 text-zinc-300 rounded-xl p-4 font-mono text-xs border border-zinc-800 shadow-xl space-y-1.5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-[11px] text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>NAUTILUS_DIAGNOSTIC_DAEMON</span>
            </div>
            <span>STATUS: 404_NULL_POINTER</span>
          </div>
          <p className="text-zinc-400 pt-1">
            <span className="text-emerald-400">&gt;</span> ping -c 1 request_path... <span className="text-destructive font-semibold">DROPPED</span>
          </p>
          <p className="text-zinc-400">
            <span className="text-emerald-400">&gt;</span> acpi_route_resolver... <span className="text-amber-400">UNMAPPED_NODE</span>
          </p>
          <p className="text-zinc-500 text-[11px]">
            <span className="text-emerald-400">&gt;</span> recommended_action: fallback_to_gateway
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full font-mono gap-2 text-xs py-5 px-6">
              <Home className="w-4 h-4" />
              <span>RETURN TO MAIN GATEWAY</span>
            </Button>
          </Link>
          <Link href="/transfer" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full font-mono gap-2 text-xs py-5 px-6">
              <ArrowRight className="w-4 h-4" />
              <span>ACPI TRANSFER HUB</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
