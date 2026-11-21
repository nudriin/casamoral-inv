import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "accent";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none";

    const variantStyles = {
      default: "bg-zinc-900 text-zinc-50 hover:bg-zinc-800 shadow-xs dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200",
      accent: "bg-orange-500 text-white hover:bg-orange-600 shadow-xs active:bg-orange-700",
      destructive: "bg-red-600 text-white hover:bg-red-500 shadow-xs active:bg-red-700",
      outline: "border border-zinc-200/80 bg-white hover:bg-zinc-100 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:text-zinc-100",
      secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
      ghost: "hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
      link: "text-orange-600 underline-offset-4 hover:underline dark:text-orange-400",
    };

    const sizeStyles = {
      default: "h-9 px-5 py-2",
      sm: "h-8 rounded-full px-3.5 text-xs",
      lg: "h-11 rounded-full px-8 text-base",
      icon: "h-9 w-9 rounded-full",
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
