"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  FileText,
  AlertTriangle,
  Scale,
  CheckCircle2,
  Lock,
  Mail,
  Info,
  Layers,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-mono tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO NAUTILUS</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-primary/10 text-primary border border-primary/20">
              <FileText className="w-3 h-3" />
              TERMS v1.2-ACPI
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Title Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Scale className="w-4 h-4 text-primary" />
            <span>LEGAL CHARTER & TERMS OF USE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            NAUTILUS Terms of Use & User Agreement
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            Effective Date: January 1, 2026 • Last Reviewed: August 2026 • Version 1.2.0
          </p>
        </div>

        {/* CRITICAL DISCLAIMER CALLOUT BOX */}
        <div className="rounded-xl border-2 border-amber-500/50 bg-amber-500/5 p-6 space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-3 text-amber-600 font-mono font-bold text-sm tracking-wide">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>IMPORTANT NOTICE: SIMULATION ENVIRONMENT & TERMS BINDING</span>
          </div>
          <div className="text-xs text-foreground/90 leading-relaxed space-y-2 font-mono">
            <p>
              By accessing, browsing, interacting with, or testing the NAUTILUS platform, you explicitly acknowledge and agree that this software is an experimental, simulated educational prototype. If you do not agree to these terms, you must immediately cease all access and interaction with the platform.
            </p>
          </div>
        </div>

        {/* SECTION 1: EDUCATIONAL PURPOSE */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-mono text-sm font-semibold tracking-wide border-b border-border/60 pb-2">
            <Info className="w-4 h-4" />
            <span>1. EDUCATIONAL & RESEARCH PURPOSE</span>
          </div>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 font-sans">
            <p>
              NAUTILUS is developed strictly for educational, academic, and research purposes. Its primary goal is to study and demonstrate:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs text-foreground/90">
              <li>Autonomous double-ledger inter-bank settlement protocols (ACPI).</li>
              <li>Client-side asymmetric public-key cryptography (RSA-OAEP 2048-bit).</li>
              <li>Role-based segregated database architectures mimicking autonomous participating banks (CPB, EB, SB).</li>
              <li>High-concurrency database transaction atomicity (ACID) and idempotency controls.</li>
            </ul>
            <p>
              Under no circumstances shall NAUTILUS be construed, operated, or utilized as a commercial banking platform, production money transmission service, or licensed financial custodian.
            </p>
          </div>
        </section>

        {/* SECTION 2: REGULATORY NON-AFFILIATION */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-mono text-sm font-semibold tracking-wide border-b border-border/60 pb-2">
            <Shield className="w-4 h-4" />
            <span>2. REGULATORY NON-AFFILIATION & TRADEMARK DISCLAIMER</span>
          </div>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 font-sans">
            <p>
              NAUTILUS is an independent open prototype and maintains <strong>no formal affiliation, partnership, sponsorship, or licensing</strong> with:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <Card className="p-3.5 bg-card/50 border-border/60">
                <div className="font-mono text-xs font-bold text-foreground">Reserve Bank of India (RBI)</div>
                <div className="text-xs text-muted-foreground mt-1">Not a regulated banking entity, licensed NBFC, or payment aggregator.</div>
              </Card>
              <Card className="p-3.5 bg-card/50 border-border/60">
                <div className="font-mono text-xs font-bold text-foreground">NPCI & UPI Protocols</div>
                <div className="text-xs text-muted-foreground mt-1">Not affiliated with National Payments Corporation of India or UPI infrastructure.</div>
              </Card>
            </div>
            <p className="text-xs font-mono text-muted-foreground">
              All simulated bank identifiers (Central Peoples Bank, Enterprise Bank, Standard Bank) are fictitious entities designed exclusively for demonstration and distributed systems experimentation.
            </p>
          </div>
        </section>

        {/* SECTION 3: ZERO LIABILITY & NO WARRANTY */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-mono text-sm font-semibold tracking-wide border-b border-border/60 pb-2">
            <Scale className="w-4 h-4" />
            <span>3. ABSOLUTE ZERO LIABILITY & AS-IS WARRANTY</span>
          </div>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 font-sans">
            <p>
              NAUTILUS IS PROVIDED ON AN <strong>&ldquo;AS IS&rdquo;</strong> AND <strong>&ldquo;AS AVAILABLE&rdquo;</strong> BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>
            <div className="rounded-lg bg-muted/40 p-4 font-mono text-xs space-y-2 border border-border/60 text-foreground/90">
              <p>
                <strong>NO FIDUCIARY DUTY:</strong> The authors, maintainers, and contributors assume zero liability for any damages, simulated loss of funds, system downtime, transaction inaccuracies, or software bugs arising from the use or inability to use this demonstration system.
              </p>
              <p>
                <strong>USER ASSUMPTION OF RISK:</strong> Any security testing, API invocations, or data submissions are executed entirely at the user&apos;s sole risk and discretion.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4: INTELLECTUAL PROPERTY & CODE USAGE */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-mono text-sm font-semibold tracking-wide border-b border-border/60 pb-2">
            <Layers className="w-4 h-4" />
            <span>4. INTELLECTUAL PROPERTY & CODE LICENSE</span>
          </div>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 font-sans">
            <p>
              The architecture, documentation, and source code of the NAUTILUS platform are developed for non-commercial educational and research exploration.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs text-foreground/90">
              <li>
                <strong>Permitted Usage:</strong> You are granted a limited, revocable, non-exclusive license to inspect, clone, and test the software for personal education and academic evaluation.
              </li>
              <li>
                <strong>Prohibited Commercial Usage:</strong> You may not use, repackage, or market this software as a commercial financial product, solicit real funds from third parties, or misrepresent the platform as a real financial institution.
              </li>
              <li>
                <strong>Third-Party Components:</strong> Third-party libraries (e.g., Lucide Icons, Next.js, FastAPI, Supabase) remain the intellectual property of their respective copyright holders.
              </li>
            </ul>
          </div>
        </section>

        {/* SECTION 5: SYNTHETIC BALANCES & FAUCET TERMS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-mono text-sm font-semibold tracking-wide border-b border-border/60 pb-2">
            <Lock className="w-4 h-4" />
            <span>5. SYNTHETIC ASSETS & TESTNET FAUCET POLICY</span>
          </div>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 font-sans">
            <p>
              All credits, debits, balances, and faucet grants distributed across the platform are strictly synthetic tokens with zero monetary, cash, or redemption value.
            </p>
            <ul className="list-disc pl-5 space-y-1 font-mono text-xs text-foreground/90">
              <li>Balances cannot be converted, redeemed, or exchanged for real currency.</li>
              <li>The project maintainers reserve the right to reset or purge databases and transaction records at any time without notice.</li>
            </ul>
          </div>
        </section>

        {/* CONTACT SECTION */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="font-mono text-xs font-semibold text-foreground">Questions or Legal Inquiries?</div>
            <div className="text-xs text-muted-foreground">Direct all compliance and research queries to our maintainer address.</div>
          </div>
          <a
            href="mailto:nautilus-project-00001@gmail.com"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted text-xs font-mono font-medium transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>nautilus.project.00001@gmail.com</span>
          </a>
        </div>
      </main>
    </div>
  );
}
