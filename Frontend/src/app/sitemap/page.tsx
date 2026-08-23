import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Compass,
  Home,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Send,
  QrCode,
  Scan,
  Coins,
  Shield,
  FileText,
  Scale,
  ExternalLink,
  Code2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

export default function SitemapPage() {
  const sections = [
    {
      category: "Main & Authentication",
      description: "Entry points, portals, and onboarding routes",
      routes: [
        {
          name: "Home Overview",
          path: "/",
          description: "System architecture, live demo showcase, and platform highlights.",
          icon: Home,
        },
        {
          name: "User Login",
          path: "/login",
          description: "Secure account access with email and password.",
          icon: LogIn,
        },
        {
          name: "Open Account",
          path: "/signup",
          description: "Onboarding and account creation across CPB, EB, and SB.",
          icon: UserPlus,
        },
      ],
    },
    {
      category: "Banking & Operations",
      description: "Financial transactions, balance management, and contactless tools",
      routes: [
        {
          name: "Account Dashboard",
          path: "/dashboard",
          description: "Real-time ledger sync, balance card, and operations launchpad.",
          icon: LayoutDashboard,
        },
        {
          name: "Inter-Bank Transfer",
          path: "/transfer",
          description: "Double-ledger transfer execution via ACPI clearing engine.",
          icon: Send,
        },
        {
          name: "QR Pay & Share",
          path: "/qr",
          description: "Generate 2-minute timed contactless payment and share tokens.",
          icon: QrCode,
        },
        {
          name: "QR Code Scanner",
          path: "/qr/scan",
          description: "Scan dynamic QR payloads with automatic payload decoding.",
          icon: Scan,
        },
        {
          name: "Liquidity Faucet",
          path: "/faucet",
          description: "Request test funds or generate claimable faucet vouchers.",
          icon: Coins,
        },
        {
          name: "Account Security & Settings",
          path: "/account",
          description: "Password updates, account status management, and scheduled deletion.",
          icon: Shield,
        },
      ],
    },
    {
      category: "Legal, Compliance & Machine Feeds",
      description: "System policies, terms of use, and search engine endpoints",
      routes: [
        {
          name: "Privacy Policy",
          path: "/privacy-policy",
          description: "Cryptographic specifications and privacy compliance charter.",
          icon: Scale,
        },
        {
          name: "Terms of Use",
          path: "/terms-of-use",
          description: "Synthetic testnet asset rules and user agreement terms.",
          icon: FileText,
        },
        {
          name: "Raw XML Sitemap",
          path: "/sitemap.xml",
          description: "Machine-readable XML sitemap index for search crawlers.",
          icon: Code2,
          isExternal: true,
        },
        {
          name: "Robots Policy",
          path: "/robots.txt",
          description: "Directives and crawl rules for web robots and search indexers.",
          icon: Code2,
          isExternal: true,
        },
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/"
              className="text-xs font-mono text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              BACK TO HOME
            </Link>
            <span className="text-zinc-300">•</span>
            <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
              NAVIGATION INDEX
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
            <Compass className="w-7 h-7 text-zinc-900" />
            NAUTILUS Website Sitemap
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Canonical index of all web pages, transaction tools, and machine-readable feeds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/sitemap.xml"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-mono font-medium text-zinc-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View XML Feed</span>
          </Link>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.category} className="space-y-3">
            <div className="border-b border-zinc-100 pb-2">
              <h2 className="text-sm font-mono font-bold text-zinc-900 uppercase tracking-wide">
                {section.category}
              </h2>
              <p className="text-xs text-zinc-500 font-mono">
                {section.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {section.routes.map((route) => {
                const Icon = route.icon;
                return (
                  <Link
                    key={route.path}
                    href={route.path}
                    target={route.isExternal ? "_blank" : undefined}
                    className="block group"
                  >
                    <Card className="h-full border-zinc-200 hover:border-zinc-300 hover:shadow-card transition-all bg-white">
                      <CardContent className="p-4 flex items-start gap-3.5">
                        <div className="p-2 rounded-lg bg-zinc-100 text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white transition-colors shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-xs font-semibold text-zinc-900 group-hover:text-zinc-900 transition-colors truncate">
                              {route.name}
                            </h3>
                            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100 shrink-0">
                              {route.path}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2">
                            {route.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
