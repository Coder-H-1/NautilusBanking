import React from "react";
import Link from "next/link";
import { Shield, Lock, Server, Scale, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50/50 py-8 mt-auto text-xs font-mono text-zinc-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-900">NAUTILUS</span>
            <span className="text-zinc-400">|</span>
            <span>Autonomous ACPI Inter-Bank Network</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-zinc-700" />
              <span>ACPI Settlement Protocol</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-zinc-700" />
              <span>CPB • EB • SB Hubs</span>
            </div>
            <Link
              href="/privacy-policy"
              className="flex items-center gap-1.5 text-zinc-900 font-semibold hover:underline"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Privacy & Legal Charter</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-2 pt-4 border-t border-zinc-200/60 text-[11px] text-zinc-400">
          <p>
            Disclaimer: NAUTILUS is an educational hobby simulation. We are <strong>NOT related to NPCI or UPI</strong>, and do not process real fiat currency.
          </p>
          <a
            href="mailto:nautilus-project-00001@gmail.com"
            className="flex items-center gap-1 hover:text-zinc-700 transition-colors"
          >
            <Mail className="w-3 h-3" />
            <span>nautilus-project-00001@gmail.com</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
