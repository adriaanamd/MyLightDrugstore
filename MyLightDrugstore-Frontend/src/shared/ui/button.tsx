import type { ButtonHTMLAttributes, ReactNode } from "react"

export function Button({
  children,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost"
  children: ReactNode
}) {
  return (
    <button data-variant={variant} {...props}>
      {children}
    </button>
  )
}
