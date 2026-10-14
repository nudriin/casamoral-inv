import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "accent";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none";

    const variantStyles = {
      default: "bg-zinc-900 text-zinc-50 hover:bg-zinc-800 shadow-sm dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200",
      accent: "bg-amber-600 text-white hover:bg-amber-500 shadow-sm active:bg-amber-700",
      destructive: "bg-red-600 text-white hover:bg-red-500 shadow-sm active:bg-red-700",
      outline: "border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:text-zinc-100",
      secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
      ghost: "hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
      link: "text-amber-600 underline-offset-4 hover:underline dark:text-amber-400",
    };

    const sizeStyles = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-11 rounded-lg px-8 text-base",
      icon: "h-9 w-9",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
