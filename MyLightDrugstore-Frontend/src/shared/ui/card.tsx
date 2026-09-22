import type { ReactNode } from "react"

export function Card({
  children,
  className = "",
}: {
  children: ReactNode

  className?: string
}) {
  return (
    <div className={`bg-white rounded-lg border border-slate-200 ${className}`}>
      {children}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string

  subtitle?: string

  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex gap-2">{action}</div>}
    </div>
  )
}

export function StatCard({
  label,
  value,
  sub,
  color = "default",
}: {
  label: string

  value: string | number

  sub?: string

  color?: "default" | "teal" | "amber" | "red" | "navy"
}) {
  const colors: Record<string, string> = {
    default: "text-slate-900",
    teal: "text-teal-700",
    amber: "text-amber-600",
    red: "text-red-600",
    navy: "text-navy-800",
  }

  return (
    <Card className="px-4 py-4">
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className={`text-2xl font-bold mt-1 font-mono ${colors[color]}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </Card>
  )
}

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
      {children}
    </h2>
  )
}
