import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Liquidity Faucet",
  description: "Request testnet liquidity funds or generate claimable faucet vouchers for testing transactions.",
};

export default function FaucetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
