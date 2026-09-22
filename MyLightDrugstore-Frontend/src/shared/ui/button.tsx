import type { ButtonHTMLAttributes, ReactNode } from "react"

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline"
type ButtonSize = "sm" | "md" | "lg"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant

  size?: ButtonSize

  loading?: boolean
}

const buttonBase =
  "inline-flex items-center justify-center gap-1.5 font-medium rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-teal-500",
  secondary:
    "bg-navy-700 text-white hover:bg-navy-800 focus-visible:ring-navy-500",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
  ghost: "text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400",
  outline:
    "border border-slate-300 text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400",
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: "text-xs px-2.5 py-1.5",
  md: "text-sm px-3.5 py-2",
  lg: "text-sm px-4 py-2.5",
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${buttonBase} ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}

export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const className =
    size === "sm" ? "w-3 h-3" : size === "lg" ? "w-8 h-8" : "w-5 h-5"

  return (
    <svg
      className={`${className} animate-spin text-current`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

export type { ButtonProps, ButtonSize, ButtonVariant, ReactNode }
