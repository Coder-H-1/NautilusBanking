"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Scale, AlertTriangle, FileText, Mail, CheckCircle2, Server, Globe, RefreshCw, Cookie, AlertCircle } from "lucide-react";
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
              SECURITY PROTOCOL v2.5
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        {/* Title Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Scale className="w-4 h-4 text-primary" />
            <span>PRIVACY GOVERNANCE & DATA PRACTICE DISCLOSURE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            NAUTILUS Privacy Policy & Data Security Charter
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-mono">
            Effective Date: January 1, 2026 • Last Revised: October 2026 • Version 2.5.0-ACPI
          </p>
        </div>

        {/* CRITICAL DISCLAIMER CALLOUT BOX */}
        <div className="rounded-xl border-2 border-destructive/50 bg-destructive/5 p-6 space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-3 text-destructive font-mono font-bold text-sm tracking-wide">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse" />
            <span>CRITICAL LEGAL NOTICE & HOBBY SIMULATION DISCLAIMER</span>
          </div>
          <div className="text-xs text-foreground/90 leading-relaxed space-y-2 font-mono">
            <p>
              <strong>1. NOT A LICENSED FINANCIAL ENTITY:</strong> NAUTILUS is an educational, research, and non-commercial simulation platform developed to explore distributed ledger concepts, asymmetric cryptography, and inter-bank routing architectures. It is <u>NOT</u> a bank, Non-Banking Financial Company (NBFC), Payment System Operator (PSO), or authorized deposit-taking institution.
            </p>
            <p>
              <strong>2. INDEPENDENT SIMULATION (NO NPCI/UPI AFFILIATION):</strong> We are completely independent and have no partnership, sponsorship, authorization, or affiliation with the National Payments Corporation of India (NPCI), Unified Payments Interface (UPI), Reserve Bank of India (RBI), or any government body. All bank identifiers (CPB, EB, SB) are fictional simulation partitions.
            </p>
            <p>
              <strong>3. SYNTHETIC CURRENCY ONLY:</strong> All balances, debits, credits, and transactions exist solely within a sandboxed simulation database. No real Indian Rupees (INR) or financial value can be deposited, stored, earned, transferred, or withdrawn.
            </p>
          </div>
        </div>

        {/* Section 1: Constitutional & Statutory Principles */}
        <Card className="p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <Scale className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">
              1. Statutory Framework & Applicable Privacy Principles
            </h2>
          </div>
          <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <p>
              NAUTILUS strives to align its architecture with modern privacy principles recognized in the Republic of India and international security best practices:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-secondary/30 border border-border/60 space-y-1">
                <div className="font-mono font-semibold text-foreground text-xs">Constitutional Privacy Baseline</div>
                <div className="text-xs text-muted-foreground">
                  Inspired by the informational privacy and autonomy tenets affirmed under Article 21 of the Constitution of India (<em>Puttaswamy</em>, 2017).
                </div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30 border border-border/60 space-y-1">
                <div className="font-mono font-semibold text-foreground text-xs">IT Act 2000 & SPDI Rules 2011</div>
                <div className="text-xs text-muted-foreground">
                  Operational practices aim to satisfy reasonable security practices for handling digital information and sensitive credentials during transition.
                </div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30 border border-border/60 space-y-1">
                <div className="font-mono font-semibold text-foreground text-xs">DPDP Act Alignment</div>
                <div className="text-xs text-muted-foreground">
                  Proactively integrating core principles of the Digital Personal Data Protection Act (purpose limitation, data minimization, consent, and user withdrawal).
                </div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30 border border-border/60 space-y-1">
                <div className="font-mono font-semibold text-foreground text-xs">Zero-Monetization Policy</div>
                <div className="text-xs text-muted-foreground">
                  We never sell, rent, commercialize, or broker user accounts, emails, transaction logs, or profile details to third-party advertisers or data brokers.
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Technical Architecture & Cryptographic Disclosure */}
        <Card className="p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">
              2. Technical Architecture & Cryptographic Disclosures
            </h2>
          </div>
          <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <p>
              To maintain transparency, our cryptographic and data security guarantees are specified precisely based on actual system design:
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground font-mono">Client-Side Asymmetric Encryption (RSA-OAEP):</strong> Sensitive transaction transfer payloads are encrypted in the user’s web browser with an RSA-OAEP 2048-bit public key. The corresponding private key is held exclusively in secure server environment variables. This protects payload confidentiality in transit against intermediate proxies; the designated server endpoint decrypts payloads in memory to process transactions.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground font-mono">HMAC-SHA256 Payload Integrity:</strong> Inter-bank clearance messages and signed tokens use HMAC-SHA256 signatures with server-side secrets to verify authenticity and defend against parameter tampering.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground font-mono">Transport Layer Security (TLS 1.2+):</strong> All web and API traffic is served via encrypted HTTPS/TLS connections enforced by host routing edge networks.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground font-mono">Password Hashing:</strong> User credentials are treated with modern cryptographic one-way hashing (e.g. bcrypt/argon2 / PBKDF2). Plaintext passwords are never stored in databases or logged.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground font-mono">Database Protection & Isolation:</strong> Data records are managed via Supabase / PostgreSQL utilizing role-based access control, Row-Level Security (RLS) rules, and underlying managed platform encryption at rest.
                </div>
              </li>
            </ul>
          </div>
        </Card>

        {/* Section 3: Data Inventory & Retention Schedule */}
        <Card className="p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">
              3. Data Collection Inventory & Lifecycle Management
            </h2>
          </div>
          <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <p>We process only the minimum dataset required for simulation identity, authentication, and core routing:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border border-border/60">
                <thead className="bg-secondary/40 text-foreground border-b border-border/60">
                  <tr>
                    <th className="p-3">Data Field</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Processing Purpose</th>
                    <th className="p-3">Retention Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-muted-foreground">
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Account Holder Name</td>
                    <td className="p-3">Identity</td>
                    <td className="p-3">Display profile and simulated recipient discovery</td>
                    <td className="p-3">Until user account deletion</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Email Address</td>
                    <td className="p-3">Communication</td>
                    <td className="p-3">One-Time Password (OTP) validation, login, and alerts</td>
                    <td className="p-3">Until user account deletion</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Hashed Password</td>
                    <td className="p-3">Authentication</td>
                    <td className="p-3">Secure authentication verification</td>
                    <td className="p-3">Until user account deletion</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Bank Partition (CPB/EB/SB)</td>
                    <td className="p-3">Routing</td>
                    <td className="p-3">Simulated ledger allocation and clearance</td>
                    <td className="p-3">Until user account deletion</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Simulated Transactions</td>
                    <td className="p-3">Simulation Activity</td>
                    <td className="p-3">Displaying account statement and balance history</td>
                    <td className="p-3">Until account deletion or test cycle reset</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">IP Address & Security Logs</td>
                    <td className="p-3">System Defense</td>
                    <td className="p-3">Rate limiting, brute-force mitigation, firewall protection</td>
                    <td className="p-3">Rolling window (7–30 days) on host infrastructure</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              <strong>Backup Lifecycle:</strong> Encrypted operational database backups are automatically aged out and purged within 14–30 days of standard platform rotation cycles.
            </p>
          </div>
        </Card>

        {/* Section 4: Third-Party Service Providers */}
        <Card className="p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <Server className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">
              4. Third-Party Infrastructure & Service Providers
            </h2>
          </div>
          <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <p>
              NAUTILUS relies on select third-party cloud infrastructure providers to host, secure, and deliver the service. Each provider processes technical metadata in accordance with their privacy standards:
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-secondary/30 border border-border/60 space-y-1">
                <div className="font-mono font-semibold text-foreground text-xs">Vercel (Frontend Hosting)</div>
                <div className="text-xs text-muted-foreground">
                  Delivers frontend static assets, edge caching, and serverless compute. Receives connection metadata (IP addresses, user-agent headers) for CDN delivery and security.
                </div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30 border border-border/60 space-y-1">
                <div className="font-mono font-semibold text-foreground text-xs">Render (Backend API Hosting)</div>
                <div className="text-xs text-muted-foreground">
                  Executes Python/FastAPI simulation backend microservices, settlement calculations, and server-side encryption/decryption routines.
                </div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30 border border-border/60 space-y-1">
                <div className="font-mono font-semibold text-foreground text-xs">Supabase (PostgreSQL Database)</div>
                <div className="text-xs text-muted-foreground">
                  Provides managed cloud PostgreSQL instances for authentication records, account ledger tables, and transactional simulation states.
                </div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30 border border-border/60 space-y-1">
                <div className="font-mono font-semibold text-foreground text-xs">Brevo / Sendinblue (Email Delivery)</div>
                <div className="text-xs text-muted-foreground">
                  Dispatches transactional authentication emails and One-Time Passwords (OTPs) strictly when requested during verification.
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 5: Cookies, Local Storage & Client State */}
        <Card className="p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <Cookie className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">
              5. Cookies, Browser Storage & Client-Side State
            </h2>
          </div>
          <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <p>
              NAUTILUS does not employ cross-site tracking pixels, third-party advertising cookies, or behavioral profiling trackers. We use local browser storage strictly for essential system functionality:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground font-mono">Authentication Tokens:</strong> Session tokens (JWT or secure cookies) stored locally to authenticate authorized API requests.
              </li>
              <li>
                <strong className="text-foreground font-mono">Interface Preferences:</strong> Theme settings (dark/light mode) and temporary UI states stored in your browser’s <code>localStorage</code>.
              </li>
              <li>
                <strong className="text-foreground font-mono">Ephemeral Keys:</strong> Transient cryptographic parameters utilized during active browser sessions for simulated clearance operations.
              </li>
            </ul>
          </div>
        </Card>

        {/* Section 6: User Rights, Data Deletion & Grievance Mechanism */}
        <Card className="p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <Scale className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">
              6. User Rights, Deletion Procedure & Grievance Redressal
            </h2>
          </div>
          <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <p>
              Users hold comprehensive control over their simulation profile and personal identifiers:
            </p>
            <div className="grid sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 rounded bg-secondary/30 border border-border/60">
                <div className="font-bold text-foreground mb-1">Right to Access & Review</div>
                <div>Review any stored profile information directly inside your dashboard.</div>
              </div>
              <div className="p-3 rounded bg-secondary/30 border border-border/60">
                <div className="font-bold text-foreground mb-1">Right to Correction</div>
                <div>Request corrections to email or profile attributes in case of inaccuracies.</div>
              </div>
              <div className="p-3 rounded bg-secondary/30 border border-border/60">
                <div className="font-bold text-foreground mb-1">Right to Full Erasure</div>
                <div>Request permanent deletion of account credentials and simulation history.</div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="text-foreground font-semibold text-xs font-mono">Deletion & Correction Procedure:</div>
              <p className="text-xs">
                To request complete erasure of your test account and associated records, submit an email from your registered account address to our Grievance Desk below. We verify email ownership and purge records from active production databases within <strong>7 business days</strong>.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-secondary/30 border border-border/60 space-y-2 font-mono text-xs">
              <div className="text-foreground font-semibold">Grievance & Privacy Inquiries:</div>
              <div>Project: NAUTILUS Inter-Bank Simulation Platform</div>
              <div className="flex items-center gap-2 text-primary font-medium">
                <Mail className="w-4 h-4" />
                <a href="mailto:nautilus.project.00001@gmail.com" className="hover:underline">
                  nautilus.project.00001@gmail.com
                </a>
              </div>
              <div className="text-muted-foreground">Standard Acknowledgment: Within 48 hours • Resolution Window: Under 30 calendar days</div>
            </div>
          </div>
        </Card>

        {/* Section 7: International Processing, Security Incidents & Minor Privacy */}
        <Card className="p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">
              7. Additional Governance Disclosures
            </h2>
          </div>
          <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <div className="space-y-3">
              <div>
                <strong className="text-foreground font-mono">Cross-Border Cloud Infrastructure:</strong> While targeted at Indian simulation architectures, infrastructure providers (Vercel, Render, Supabase) may route network traffic through global edge data centers. All cross-border transit is guarded by TLS transport encryption and standard data processing terms.
              </div>
              <div>
                <strong className="text-foreground font-mono">Security Incidents & Breach Response:</strong> In the event of a verified unauthorized access or security breach impacting user accounts, the team will promptly investigate, patch vulnerabilities, and notify registered users via email regarding affected elements and remediation actions.
              </div>
              <div>
                <strong className="text-foreground font-mono">Children’s Privacy:</strong> NAUTILUS is not directed toward children under 18 years of age. We do not knowingly collect personal details from minors. If you believe a minor has registered an account, notify us for prompt removal.
              </div>
              <div>
                <strong className="text-foreground font-mono">Policy Modifications:</strong> Material updates to this charter will be reflected with an incremented revision version and revised timestamp on this page. Continued usage of the simulation signifies acceptance of updated terms.
              </div>
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
