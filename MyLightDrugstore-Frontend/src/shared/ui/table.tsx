import type { ReactNode } from "react"

export function Table({
  children,
  className = "",
}: {
  children: ReactNode

  className?: string
}) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  )
}

export function Th({
  children,
  className = "",
}: {
  children?: ReactNode

  className?: string
}) {
  return (
    <th
      className={`text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2.5 bg-slate-50 border-b border-slate-200 whitespace-nowrap ${className}`}
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  className = "",
}: {
  children: ReactNode

  className?: string
}) {
  return (
    <td
      className={`px-3 py-2.5 text-slate-700 border-b border-slate-100 ${className}`}
    >
      {children}
    </td>
  )
}

export function Tr({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode

  className?: string

  onClick?: () => void
}) {
  return (
    <tr
      className={`hover:bg-slate-50 transition-colors ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}
