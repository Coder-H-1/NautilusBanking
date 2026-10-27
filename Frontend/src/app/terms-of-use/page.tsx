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
  UserCheck,
  Ban,
  RefreshCw,
  HelpCircle,
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
              TERMS v2.0-ACPI
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        {/* Title Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Scale className="w-4 h-4 text-primary" />
            <span>USER AGREEMENT & GOVERNANCE RULES</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            NAUTILUS Terms of Use & Platform Agreement
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-mono">
            Effective Date: January 1, 2026 • Last Revised: October 2026 • Version 2.0.0
          </p>
        </div>

        {/* CRITICAL DISCLAIMER CALLOUT BOX */}
        <div className="rounded-xl border-2 border-amber-500/50 bg-amber-500/5 p-6 space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-3 text-amber-600 font-mono font-bold text-sm tracking-wide">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>CRITICAL NOTICE: SIMULATION PROTOTYPE ONLY</span>
          </div>
          <div className="text-xs text-foreground/90 leading-relaxed space-y-2 font-mono">
            <p>
              NAUTILUS is an open, experimental educational simulation developed exclusively for academic evaluation, architectural research, and cryptographic testing. It does <strong>not</strong> provide real-world financial, banking, or payment custodial services.
            </p>
          </div>
        </div>

        {/* SECTION 1: ACCEPTANCE & ELIGIBILITY */}
        <Card className="p-8 space-y-4">
          <div className="flex items-center gap-2 text-primary font-mono text-sm font-semibold tracking-wide border-b border-border/60 pb-3">
            <UserCheck className="w-4 h-4" />
            <span>1. ACCEPTANCE OF TERMS & ELIGIBILITY</span>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-3 font-sans">
            <p>
              By creating an account, confirming the terms during registration, or accessing authenticated simulation features, you agree to comply with and be bound by these Terms of Use and our companion{" "}
              <Link href="/privacy-policy" className="text-primary hover:underline font-mono">
                Privacy Policy
              </Link>
              . If you do not agree to these terms, you must not register or access authenticated platform services.
            </p>
            <p>
              <strong>Eligibility:</strong> This platform is designed for adult students, researchers, developers, and professionals. You must be at least 18 years of age or possess legal parental/guardian consent under applicable law to participate in this simulation.
            </p>
          </div>
        </Card>

        {/* SECTION 2: EDUCATIONAL PURPOSE */}
        <Card className="p-8 space-y-4">
          <div className="flex items-center gap-2 text-primary font-mono text-sm font-semibold tracking-wide border-b border-border/60 pb-3">
            <Info className="w-4 h-4" />
            <span>2. EDUCATIONAL & RESEARCH PURPOSE</span>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-3 font-sans">
            <p>
              NAUTILUS demonstrates distributed financial architectures and cryptographic systems:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs text-foreground/90">
              <li>Autonomous double-ledger inter-bank settlement protocols (ACPI).</li>
              <li>Client-side asymmetric public-key payload encryption (RSA-OAEP 2048-bit).</li>
              <li>Role-segregated database partitions modeling participating simulated banks (CPB, EB, SB).</li>
              <li>ACID transactional guarantees, idempotency tokens, and dynamic cryptographic QR generation.</li>
            </ul>
            <p>
              Under no circumstances shall NAUTILUS be operated, marketed, or relied upon as a commercial banking application, real money transmission utility, or custodial financial platform.
            </p>
          </div>
        </Card>

        {/* SECTION 3: REGULATORY NON-AFFILIATION */}
        <Card className="p-8 space-y-4">
          <div className="flex items-center gap-2 text-primary font-mono text-sm font-semibold tracking-wide border-b border-border/60 pb-3">
            <Shield className="w-4 h-4" />
            <span>3. REGULATORY NON-AFFILIATION & TRADEMARKS</span>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-3 font-sans">
            <p>
              NAUTILUS is an independent experimental project. NAUTILUS:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-4 rounded-lg bg-secondary/30 border border-border/60">
                <div className="font-mono text-xs font-bold text-foreground">Independent Project Status</div>
                <div className="text-xs text-muted-foreground mt-1">
                  NAUTILUS is not a regulated commercial bank, registered Non-Banking Financial Company (NBFC), or authorized Payment System Operator (PSO).
                </div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30 border border-border/60">
                <div className="font-mono text-xs font-bold text-foreground">No Official Affiliation</div>
                <div className="text-xs text-muted-foreground mt-1">
                  We have no affiliation, sponsorship, endorsement, or operating license with the Reserve Bank of India (RBI), the National Payments Corporation of India (NPCI), or the Unified Payments Interface (UPI).
                </div>
              </div>
            </div>
            <p className="text-xs font-mono text-muted-foreground pt-1">
              All simulated bank identifiers (Common People&apos;s Bank [CPB], Elses Bank [EB], SomeBank [SB]) are fictional labels created solely for demonstration.
            </p>
          </div>
        </Card>

        {/* SECTION 4: ACCEPTABLE USE & SECURITY BOUNDARIES */}
        <Card className="p-8 space-y-4">
          <div className="flex items-center gap-2 text-primary font-mono text-sm font-semibold tracking-wide border-b border-border/60 pb-3">
            <Ban className="w-4 h-4" />
            <span>4. ACCEPTABLE USE & SECURITY TESTING BOUNDARIES</span>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-3 font-sans">
            <p>
              Users may interact with the platform for lawful educational, research, and functional testing purposes within the features intentionally made available. Users must not:
            </p>
            <ul className="list-disc pl-5 space-y-2 font-mono text-xs text-foreground/90">
              <li>Attempt to access another user&apos;s account, credentials, or private transaction records without explicit authorization.</li>
              <li>Attempt to bypass authentication, authorization headers, rate limits, or platform access controls.</li>
              <li>Conduct denial-of-service (DoS/DDoS) attacks, automated credential stuffing, or volumetric flooding of APIs or web routes.</li>
              <li>Probe, scan, or attack hosting infrastructure, managed databases, or email providers (Vercel, Render, Supabase, Brevo).</li>
              <li>Use the platform or its simulated identifiers to solicit real money, investments, deposits, or fraudulent transactions.</li>
              <li>Misrepresent NAUTILUS, its simulated entities, or its test accounts as real financial products or institutions.</li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Security testing beyond ordinary browser evaluation is permitted only where explicitly authorized in writing by the maintainers. Violations will result in immediate suspension and, where appropriate, referral to competent legal authorities.
            </p>
          </div>
        </Card>

        {/* SECTION 5: SYNTHETIC ASSETS & DATA RESETS */}
        <Card className="p-8 space-y-4">
          <div className="flex items-center gap-2 text-primary font-mono text-sm font-semibold tracking-wide border-b border-border/60 pb-3">
            <RefreshCw className="w-4 h-4" />
            <span>5. SYNTHETIC BALANCES, FAUCETS & SERVICE RESETS</span>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-3 font-sans">
            <p>
              All credits, debits, ledger lines, and faucet allocations within NAUTILUS are strictly synthetic numbers:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs text-foreground/90">
              <li>Synthetic balances carry zero monetary, cash, property, or redemption value.</li>
              <li>Balances cannot be redeemed, transferred to real bank accounts, or exchanged for real currency or goods.</li>
              <li>
                <strong>Data Resets:</strong> NAUTILUS is a development prototype. Simulated accounts, ledger entries, and faucet quotas may be reset, altered, or purged during maintenance, schema upgrades, or security updates. Where reasonably practicable, advance notice of planned resets will be published, but permanent persistence is not guaranteed.
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Data handling and deletion remain subject to our published{" "}
              <Link href="/privacy-policy" className="text-primary hover:underline font-mono">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </Card>

        {/* SECTION 6: INTELLECTUAL PROPERTY & CODE LICENSE */}
        <Card className="p-8 space-y-4">
          <div className="flex items-center gap-2 text-primary font-mono text-sm font-semibold tracking-wide border-b border-border/60 pb-3">
            <Layers className="w-4 h-4" />
            <span>6. INTELLECTUAL PROPERTY & CODE LICENSING</span>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-3 font-sans">
            <p>
              Unless otherwise specified, the original NAUTILUS architecture, user interface, brand assets, and documentation are owned by the project author and contributors.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs text-foreground/90">
              <li>
                <strong>Platform Access:</strong> Access to this hosted web deployment is granted as a revocable, non-exclusive license for personal educational evaluation and research.
              </li>
              <li>
                <strong>Source Code:</strong> The rights to inspect, clone, modify, or distribute the underlying codebase are governed by the specific open-source license published in the repository (e.g., GitHub repository root license).
              </li>
              <li>
                <strong>Third-Party Components:</strong> Third-party libraries, frameworks, icons, and cloud SDKs (Next.js, FastAPI, Supabase, Tailwind, Lucide) remain the property of their respective copyright holders and are governed by their independent licenses.
              </li>
            </ul>
          </div>
        </Card>

        {/* SECTION 7: DISCLAIMER OF WARRANTIES & LIMITATION OF LIABILITY */}
        <Card className="p-8 space-y-4">
          <div className="flex items-center gap-2 text-primary font-mono text-sm font-semibold tracking-wide border-b border-border/60 pb-3">
            <Scale className="w-4 h-4" />
            <span>7. DISCLAIMER OF WARRANTIES & LIMITATION OF LIABILITY</span>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-3 font-sans">
            <p>
              NAUTILUS is an experimental educational simulation provided on an <strong>&ldquo;AS IS&rdquo;</strong> and <strong>&ldquo;AS AVAILABLE&rdquo;</strong> basis.
            </p>
            <div className="rounded-lg bg-secondary/30 p-4 font-mono text-xs space-y-2 border border-border/60 text-foreground/90">
              <p>
                <strong>Disclaimer of Warranties:</strong> To the maximum extent permitted by applicable law, the maintainers and contributors disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, non-infringement, and uninterrupted or error-free operation.
              </p>
              <p>
                <strong>Limitation of Liability:</strong> To the extent permitted by applicable law, the project maintainers and contributors shall not be liable for any indirect, incidental, special, exemplary, or consequential damages, or for loss of data, profits, goodwill, or service interruptions resulting from use or inability to use this educational platform.
              </p>
              <p>
                <strong>Statutory Protections:</strong> Nothing in these terms excludes or limits any statutory liability or legal rights that cannot lawfully be disclaimed or limited under applicable law.
              </p>
            </div>
          </div>
        </Card>

        {/* SECTION 8: SUSPENSION & TERMINATION */}
        <Card className="p-8 space-y-4">
          <div className="flex items-center gap-2 text-primary font-mono text-sm font-semibold tracking-wide border-b border-border/60 pb-3">
            <Lock className="w-4 h-4" />
            <span>8. SUSPENSION, TERMINATION & ACCOUNT CLOSURE</span>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-3 font-sans">
            <p>
              We reserve the right to suspend or terminate any user account or access credentials without liability if we reasonably suspect:
            </p>
            <ul className="list-disc pl-5 space-y-1 font-mono text-xs text-foreground/90">
              <li>Violation of the acceptable use rules outlined in Section 4.</li>
              <li>Security threats, anomalous abusive traffic, or credential exploitation.</li>
              <li>Legal compliance requirements or requests by law enforcement agencies.</li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Users may request voluntary deletion of their account and data at any time in accordance with the procedures described in our{" "}
              <Link href="/privacy-policy" className="text-primary hover:underline font-mono">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </Card>

        {/* SECTION 9: GOVERNING LAW & DISPUTE RESOLUTION */}
        <Card className="p-8 space-y-4">
          <div className="flex items-center gap-2 text-primary font-mono text-sm font-semibold tracking-wide border-b border-border/60 pb-3">
            <Scale className="w-4 h-4" />
            <span>9. GOVERNING LAW & DISPUTE RESOLUTION</span>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2 font-sans">
            <p>
              These Terms of Use and any non-contractual disputes arising from the simulation platform are governed by and construed in accordance with the laws of the Republic of India, without regard to conflict of law principles.
            </p>
            <p>
              In the event of any query, dispute, or claim, users agree to first contact the maintainers in good faith at the contact email below to reach an amicable resolution before pursuing formal proceedings.
            </p>
          </div>
        </Card>

        {/* CONTACT SECTION */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="font-mono text-xs font-semibold text-foreground">Questions or Terms Inquiries?</div>
            <div className="text-xs text-muted-foreground">Direct all governance, security vulnerability, and terms questions to our project desk.</div>
          </div>
          <a
            href="mailto:nautilus.project.00001@gmail.com"
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
