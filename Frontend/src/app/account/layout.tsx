import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Settings & Security",
  description: "Manage your credentials, change password, and configure account deletion grace period.",
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
