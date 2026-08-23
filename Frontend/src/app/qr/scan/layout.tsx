import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scan QR Code",
  description: "Scan encrypted NAUTILUS QR codes for instant payments or account importing.",
};

export default function ScanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
