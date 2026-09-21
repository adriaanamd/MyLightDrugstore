import type { ReactNode } from "react"

export function Badge({ children }: { children: ReactNode }) {
  return <span>{children}</span>
}

export function Spinner() {
  return <span role="status">Loading…</span>
}

export function ErrorBanner({ message }: { message: string }) {
  return <p role="alert">{message}</p>
}

export function EmptyState({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <section>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </section>
  )
}
