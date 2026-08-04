import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/features/auth/AuthContext";
import { AuthGuard } from "@/features/auth/AuthGuard";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "NAUTILUS | Secure Inter-Bank Settlement Platform",
  description:
    "Enterprise inter-bank payment system with ACPI protocol, RSA-OAEP encryption, HMAC-SHA256 signatures, and timed QR codes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white">
        <AuthProvider>
          <AuthGuard>
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <Footer />
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
