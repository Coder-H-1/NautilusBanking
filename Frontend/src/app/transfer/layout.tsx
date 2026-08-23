import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inter-Bank Transfer",
  description: "Execute fast, encrypted inter-bank money transfers across CPB, EB, and SB via ACPI protocol.",
};

export default function TransferLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
