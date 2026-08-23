import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy & Data Security Charter",
  description: "Read about NAUTILUS cryptographic security, asymmetric encryption protocols, and data privacy policies.",
};

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
