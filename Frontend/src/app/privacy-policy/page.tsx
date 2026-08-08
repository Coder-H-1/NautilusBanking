"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Scale, AlertTriangle, FileText, Mail, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function PrivacyPolicyPage() {
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
              <Shield className="w-3 h-3" />
              SECURITY PROTOCOL v2.4
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Title Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Scale className="w-4 h-4 text-primary" />
            <span>LEGAL COMPLIANCE & PRIVACY FRAMEWORK</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            NAUTILUS Privacy Policy & Data Security Charter
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            Effective Date: January 1, 2026 • Last Reviewed: August 2026 • Version 2.4.0-ACPI
          </p>
        </div>

        {/* CRITICAL DISCLAIMER CALLOUT BOX */}
        <div className="rounded-xl border-2 border-destructive/50 bg-destructive/5 p-6 space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-3 text-destructive font-mono font-bold text-sm tracking-wide">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse" />
            <span>CRITICAL LEGAL NOTICE & HOBBY PROJECT DISCLAIMER</span>
          </div>
          <div className="text-xs text-foreground/90 leading-relaxed space-y-2 font-mono">
            <p>
              <strong>1. NOT A LICENSED FINANCIAL INSTITUTION:</strong> NAUTILUS is an educational, research, and hobbyist simulation system engineered solely to model zero-trust inter-bank settlement architectures and asymmetric cryptographic protocols. It is <u>NOT</u> a registered commercial bank, Non-Banking Financial Company (NBFC), or Payment System Operator (PSO).
            </p>
            <p>
              <strong>2. NO NPCI OR UPI AFFILIATION:</strong> We are <strong>COMPLETELY INDEPENDENT AND NOT RELATED TO</strong> the National Payments Corporation of India (NPCI), the Unified Payments Interface (UPI), the Reserve Bank of India (RBI), or any government or commercial financial authority. All simulated identifiers (e.g., CPB, EB, SB) are fictional entities.
            </p>
            <p>
              <strong>3. NO REAL CURRENCY OR ASSETS:</strong> All account balances, transfers, ledgers, and transactions displayed within NAUTILUS are strictly synthetic test values. No real Indian Rupees (INR) or monetary assets are held, accepted, transferred, or exchanged.
            </p>
          </div>
        </div>

        {/* Section 1: Constitutional & Statutory Foundations */}
        <Card className="p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <Scale className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">
              1. Statutory & Constitutional Compliance (Republic of India)
            </h2>
          </div>
          <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <p>
              NAUTILUS adheres to the privacy principles affirmed under the Constitution of India and applicable electronic data security regulations:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-secondary/30 border border-border/60 space-y-1">
                <div className="font-mono font-semibold text-foreground text-xs">Article 21, Constitution of India</div>
                <div className="text-xs text-muted-foreground">
                  Recognizing Privacy as a Fundamental Right under the landmark <em>Justice K.S. Puttaswamy (Retd.) vs Union of India</em> (2017) judgment.
                </div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30 border border-border/60 space-y-1">
                <div className="font-mono font-semibold text-foreground text-xs">IT Act 2000 & SPDI Rules 2011</div>
                <div className="text-xs text-muted-foreground">
                  Compliant with Section 43A of the Information Technology Act and Rule 8 of the Reasonable Security Practices and Procedures.
                </div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30 border border-border/60 space-y-1">
                <div className="font-mono font-semibold text-foreground text-xs">DPDP Act, 2023</div>
                <div className="text-xs text-muted-foreground">
                  Digital Personal Data Protection Act provisions for purpose limitation, data minimization, and user consent integrity.
                </div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30 border border-border/60 space-y-1">
                <div className="font-mono font-semibold text-foreground text-xs">Zero-Sale Commitment</div>
                <div className="text-xs text-muted-foreground">
                  Strict policy prohibiting the commercialization, selling, renting, or unauthorized leasing of user authentication or account data.
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Data Collection & Cryptographic Storage */}
        <Card className="p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">
              2. Data Storage, End-to-End Cryptography & Security
            </h2>
          </div>
          <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <p>
              We prioritize zero-trust cryptographic defense across all operational layers:
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground font-mono">Asymmetric Payload Encryption:</strong> All sensitive transaction requests are encrypted client-side using RSA-OAEP 2048-bit keys before leaving the user browser, ensuring no intermediate proxy can read account contents.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground font-mono">HMAC-SHA256 Integrity Verification:</strong> Inter-bank settlement dispatches are digitally signed using HMAC-SHA256 secret keys to prevent replay attacks, parameter tampering, or man-in-the-middle modifications.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground font-mono">Encrypted Data at Rest:</strong> Database records are hosted within isolated PostgreSQL instances encrypted at rest with AES-256 standards and protected with Row-Level Security (RLS).
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground font-mono">Password Protection:</strong> Passwords are cryptographically salted and hashed prior to verification. Plaintext passwords are never logged, stored, or transmitted unencrypted.
                </div>
              </li>
            </ul>
          </div>
        </Card>

        {/* Section 3: Data We Collect & Usage */}
        <Card className="p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">
              3. Information We Collect & Purpose of Processing
            </h2>
          </div>
          <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <p>We process only the minimum dataset necessary to execute simulated banking workflows:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border border-border/60">
                <thead className="bg-secondary/40 text-foreground border-b border-border/60">
                  <tr>
                    <th className="p-3">Data Field</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Processing Purpose</th>
                    <th className="p-3">Retention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-muted-foreground">
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Account Holder Name</td>
                    <td className="p-3">Identity</td>
                    <td className="p-3">Account creation and recipient identification</td>
                    <td className="p-3">Duration of account active state</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Email Address</td>
                    <td className="p-3">Communication</td>
                    <td className="p-3">One-Time Password (OTP) verification and security alerts</td>
                    <td className="p-3">Duration of account active state</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Bank Affiliation (CPB/EB/SB)</td>
                    <td className="p-3">Partitioning</td>
                    <td className="p-3">Multi-tenant ledger routing and settlement</td>
                    <td className="p-3">Duration of account active state</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">IP Address & Access Logs</td>
                    <td className="p-3">Security</td>
                    <td className="p-3">Rate limiting, brute-force mitigation, and security blocklist</td>
                    <td className="p-3">Temporary rolling window (7-30 days)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Section 4: Grievance Officer & Contact */}
        <Card className="p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">
              4. Grievance Redressal Officer & Contact Channels
            </h2>
          </div>
          <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <p>
              In accordance with Rule 5(9) of the Information Technology (SPDI) Rules, 2011 and the Digital Personal Data Protection Act, 2023, queries or data deletion requests can be addressed directly to our designated Grievance Officer:
            </p>
            <div className="p-5 rounded-lg bg-secondary/30 border border-border/60 space-y-2 font-mono text-xs">
              <div className="text-foreground font-semibold">Grievance & Security Desk:</div>
              <div>Project: NAUTILUS Inter-Bank Simulation Platform</div>
              <div className="flex items-center gap-2 text-primary font-medium">
                <Mail className="w-4 h-4" />
                <a href="mailto:nautilus.project.00001@gmail.com" className="hover:underline">
                  nautilus.project.00001@gmail.com
                </a>
              </div>
              <div className="text-muted-foreground">Response SLA: Within 48 business hours</div>
            </div>
          </div>
        </Card>

        {/* Footer Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/80">
          <Link href="/signup">
            <Button variant="primary" className="font-mono text-xs">
              PROCEED TO ACCOUNT REGISTRATION
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="font-mono text-xs">
              EXISTING USER LOGIN
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
