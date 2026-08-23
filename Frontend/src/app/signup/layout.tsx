import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Open Account",
  description: "Create and register a new bank account on the NAUTILUS settlement network.",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
