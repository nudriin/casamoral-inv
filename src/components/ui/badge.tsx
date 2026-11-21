import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" | "accent";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900",
    secondary: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    success: "bg-zinc-100 text-zinc-800 border border-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700",
    warning: "bg-orange-500/10 text-orange-700 border border-orange-500/20 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/25",
    destructive: "bg-red-500/10 text-red-600 border border-red-500/20 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25",
    outline: "text-zinc-600 border border-zinc-200/80 dark:border-zinc-800 dark:text-zinc-300",
    accent: "bg-orange-500/10 text-orange-600 border border-orange-500/20 dark:bg-orange-500/15 dark:text-orange-400",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
