import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QR Pay & Share",
  description: "Generate self-expiring, encrypted QR codes for contactless inter-bank payments and account sharing.",
};

export default function QRLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
