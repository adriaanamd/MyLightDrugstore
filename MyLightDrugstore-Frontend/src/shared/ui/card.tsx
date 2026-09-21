import type { ReactNode } from "react"

export function Card({ children }: { children: ReactNode }) {
  return <section>{children}</section>
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
  return <header><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}{action}</header>
}

export function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return <Card><p>{label}</p><strong>{value}</strong></Card>
}
