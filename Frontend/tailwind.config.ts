import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#09090b",
        muted: {
          DEFAULT: "#f4f4f5",
          foreground: "#71717a",
        },
        border: "#e4e4e7",
        input: "#e4e4e7",
        primary: {
          DEFAULT: "#18181b",
          foreground: "#fafafa",
        },
        secondary: {
          DEFAULT: "#f4f4f5",
          foreground: "#18181b",
        },
        accent: {
          DEFAULT: "#f4f4f5",
          foreground: "#18181b",
        },
        success: {
          DEFAULT: "#10b981",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        float: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)",
      },
    },
  },
  plugins: [],
};

export default config;
