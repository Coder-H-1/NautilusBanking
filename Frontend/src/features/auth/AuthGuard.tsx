"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";
import NotFound from "@/app/not-found";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/privacy-policy",
  "/terms-of-use",
];

const VALID_PROTECTED_PATHS = [
  "/dashboard",
  "/transfer",
  "/qr",
  "/qr/scan",
  "/account",
  "/faucet",
];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-muted-foreground font-mono">AUTHENTICATING...</span>
        </div>
      </div>
    );
  }

  const isPublic = PUBLIC_PATHS.includes(pathname);
  const isValidProtected = VALID_PROTECTED_PATHS.includes(pathname);

  // Show 404 Page when unauthenticated user accesses protected/non-public route
  if (!isAuthenticated && !isPublic) {
    return <NotFound />;
  }

  // Show 404 Page when authenticated user accesses invalid non-existent route
  if (isAuthenticated && !isPublic && !isValidProtected) {
    return <NotFound />;
  }

  return <>{children}</>;
}
