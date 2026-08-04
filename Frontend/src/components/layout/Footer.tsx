import React from "react";
import { Shield, Lock, Server } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50/50 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-zinc-900">NAUTILUS</span>
          <span className="text-xs text-zinc-400">|</span>
          <span className="text-xs text-zinc-500">Autonomous ACPI Inter-Bank Core</span>
        </div>

        <div className="flex items-center gap-6 text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-zinc-700" />
            <span>RSA-2048 / OAEP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-zinc-700" />
            <span>HMAC-SHA256</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-zinc-700" />
            <span>ACPI Switch Protocol</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
