import React from "react";
import Link from "next/link";
import { Shield, Lock, Server, Scale, Mail, FileText } from "lucide-react";

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
              href="/terms-of-use"
              className="flex items-center gap-1.5 text-zinc-900 font-semibold hover:underline"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Terms of Use</span>
            </Link>
            <Link
              href="/privacy-policy"
              className="flex items-center gap-1.5 text-zinc-900 font-semibold hover:underline"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Privacy Policy</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-200/60 text-[11px] text-zinc-400">
          <p className="max-w-3xl leading-relaxed">
            <span className="font-semibold text-zinc-600">Simulated Environment Notice:</span> This is a simulated banking environment created strictly for educational, research, and hobbyist purposes only. This system is <strong>not affiliated with the Reserve Bank of India (RBI), NPCI, UPI, or any real banking institution</strong>. No real fiat currency or legal tender is stored, transferred, or processed.
          </p>
          <a
            href="mailto:nautilus.project.00001@gmail.com"
            className="flex items-center gap-1 hover:text-zinc-700 transition-colors whitespace-nowrap"
          >
            <Mail className="w-3 h-3" />
            <span>nautilus.project.00001@gmail.com</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
