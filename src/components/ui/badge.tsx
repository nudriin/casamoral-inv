import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" | "accent";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900",
    secondary: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
    warning: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    destructive: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
    outline: "text-zinc-700 border border-zinc-200 dark:border-zinc-800 dark:text-zinc-300",
    accent: "bg-amber-500/10 text-amber-700 border border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium tracking-wide transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
