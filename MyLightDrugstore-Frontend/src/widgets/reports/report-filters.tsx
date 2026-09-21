import { useState } from "react"
import type { ReportFilters } from "@/entities/report"

export function ReportFiltersForm({
  prefix,
  submitLabel,
  onSubmit,
}: {
  prefix: string
  submitLabel: string
  onSubmit: (filters: ReportFilters) => void
}) {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit({ from: from || undefined, to: to || undefined })
      }}
    >
      <label>
        {prefix} from
        <input
          aria-label={`${prefix} from`}
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        />
      </label>
      <label>
        {prefix} to
        <input
          aria-label={`${prefix} to`}
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
        />
      </label>
      <button type="submit">{submitLabel}</button>
    </form>
  )
}
