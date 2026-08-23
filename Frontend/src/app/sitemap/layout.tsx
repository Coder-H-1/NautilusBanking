import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sitemap",
  description: "Overview of all pages, endpoints, and resources on the NAUTILUS Banking platform.",
};

export default function SitemapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
