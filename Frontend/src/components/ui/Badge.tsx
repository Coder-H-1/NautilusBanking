import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "danger";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent bg-zinc-900 text-white",
    secondary: "border-transparent bg-zinc-100 text-zinc-900",
    outline: "text-zinc-900 border-zinc-200",
    success: "border-transparent bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "border-transparent bg-amber-50 text-amber-700 border border-amber-200",
    danger: "border-transparent bg-red-50 text-red-700 border border-red-200",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold font-mono uppercase tracking-wider transition-colors",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
