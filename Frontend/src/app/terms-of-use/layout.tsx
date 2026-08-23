import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use & Settlement Policy",
  description: "Review the terms and conditions, synthetic asset rules, and security guidelines of the NAUTILUS platform.",
};

export default function TermsOfUseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
