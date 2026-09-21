import type { ReactNode } from "react"

export function Table({ children }: { children: ReactNode }) {
  return (
    <div>
      <table>{children}</table>
    </div>
  )
}

export function Th({ children }: { children?: ReactNode }) {
  return <th>{children}</th>
}

export function Td({ children }: { children: ReactNode }) {
  return <td>{children}</td>
}

export function Tr({ children }: { children: ReactNode }) {
  return <tr>{children}</tr>
}
