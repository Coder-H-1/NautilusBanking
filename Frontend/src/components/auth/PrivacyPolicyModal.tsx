"use client";

import React, { useRef, useState, useEffect } from "react";
import { Shield, AlertTriangle, Scale, Lock, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onClose: () => void;
}

export function PrivacyPolicyModal({ isOpen, onComplete, onClose }: PrivacyPolicyModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setHasScrolledToBottom(false);
      setCountdown(10);
      setAcknowledged(false);
    }
  }, [isOpen]);

  // Track scrolling to the very bottom
  const handleScroll = () => {
    if (scrollRef.current && !hasScrolledToBottom) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 15) {
        setHasScrolledToBottom(true);
      }
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (hasScrolledToBottom && countdown > 0 && !acknowledged) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setAcknowledged(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [hasScrolledToBottom, countdown, acknowledged]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in">
      <div className="bg-card text-card-foreground border border-border/80 rounded-xl shadow-2xl max-w-2xl w-full h-[85vh] flex flex-col relative overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-secondary/30">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold font-mono tracking-wide">
              NAUTILUS PRIVACY & LEGAL CHARTER
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 space-y-6 text-xs leading-relaxed text-muted-foreground font-mono select-none"
        >
          {/* Important Notice */}
          <div className="p-4 rounded-lg border-2 border-destructive/60 bg-destructive/10 text-destructive space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Mandatory Disclosure: Hobby Project Only</span>
            </div>
            <p className="text-[11px] leading-normal text-foreground/90">
              NAUTILUS is an educational and research payment simulation project. We are <strong>NOT affiliated with NPCI or UPI</strong>, not a real licensed bank, and do not handle real monetary assets or INR.
            </p>
          </div>

          <section className="space-y-2">
            <div className="flex items-center gap-2 text-foreground font-bold text-sm">
              <Scale className="w-4 h-4 text-primary" />
              <span>1. Statutory Compliance (Republic of India)</span>
            </div>
            <p>
              This system operates in strict accordance with the Constitutional Right to Privacy under Article 21 (<em>Puttaswamy</em>, 2017), the Information Technology Act, 2000 (Section 43A), the SPDI Rules, 2011, and the Digital Personal Data Protection Act, 2023 (DPDP Act).
            </p>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2 text-foreground font-bold text-sm">
              <Lock className="w-4 h-4 text-primary" />
              <span>2. Cryptographic Security & Zero-Sale Policy</span>
            </div>
            <p>
              All payload communications utilize client-side RSA-OAEP 2048-bit encryption, HMAC-SHA256 digital signatures, and TLS 1.3 transport security. Database stores are encrypted at rest with AES-256 standards.
            </p>
            <p className="text-foreground font-semibold">
              We NEVER sell, trade, rent, or distribute personal or authentication data to any third-party advertisement networks or brokers.
            </p>
          </section>

          <section className="space-y-2">
            <div className="text-foreground font-bold text-sm">
              3. Data Fields Collected
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account Holder Full Name (Case-insensitive)</li>
              <li>Registered Email Address (Used for OTP dispatch)</li>
              <li>Bank Affiliation (CPB, EB, or SB)</li>
              <li>Cryptographically Salted & Hashed Passwords</li>
            </ul>
          </section>

          <section className="space-y-2">
            <div className="text-foreground font-bold text-sm">
              4. Grievance Officer Contact
            </div>
            <p>
              Direct privacy queries or deletion requests to:
              <br />
              <strong className="text-foreground">nautilus-project-00001@gmail.com</strong>
            </p>
          </section>

          <div className="py-6 text-center text-muted-foreground border-t border-border/40">
            --- END OF CHARTER DOCUMENT ---
          </div>
        </div>

        {/* Modal Footer / Acknowledgment */}
        <div className="px-6 py-4 border-t border-border/80 bg-secondary/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-mono">
            {!hasScrolledToBottom ? (
              <span className="text-amber-500 font-semibold flex items-center gap-1.5 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                Scroll to the bottom of the policy to unlock acceptance
              </span>
            ) : countdown > 0 ? (
              <span className="text-primary font-semibold flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Verifying document review ({countdown}s)...
              </span>
            ) : (
              <span className="text-emerald-500 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Charter terms unlocked and ready for acceptance
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="w-full sm:w-auto text-xs font-mono"
            >
              CANCEL
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!hasScrolledToBottom || countdown > 0}
              onClick={handleConfirm}
              className="w-full sm:w-auto text-xs font-mono tracking-wider"
            >
              I HAVE READ & ACCEPT
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
