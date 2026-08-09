"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";

const PUBLIC_PATHS = ["/login", "/signup", "/privacy-policy"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      const isPublic = PUBLIC_PATHS.includes(pathname);
      if (!isAuthenticated && !isPublic && pathname !== "/") {
        let search = "";
        if (typeof window !== "undefined") {
          search = window.location.search;
        }
        const redirectUrl = search ? `${pathname}${search}` : pathname;
        router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);

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

  return <>{children}</>;
}
