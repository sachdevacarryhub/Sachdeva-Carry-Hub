import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "gold" | "light" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium tracking-wide whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-300 ease-(--ease-premium) disabled:pointer-events-none disabled:opacity-50 active:translate-y-px select-none";

const variants: Record<ButtonVariant, string> = {
  // Black with a subtle gold accent on hover
  primary:
    "bg-ink text-white shadow-[inset_0_-2px_0_transparent] hover:bg-ink-soft hover:shadow-[inset_0_-2px_0_var(--color-gold)]",
  secondary:
    "border border-ink/80 bg-transparent text-ink hover:border-gold hover:bg-ink/[0.03] hover:text-ink",
  ghost: "text-ink hover:bg-ink/5",
  // For dark surfaces
  gold: "bg-gold text-ink hover:bg-[#d6a63c]",
  light: "border border-white/30 bg-transparent text-white hover:border-gold hover:text-white",
  danger: "bg-danger text-white hover:bg-[#9a1d13]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-7 text-[15px]",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}
