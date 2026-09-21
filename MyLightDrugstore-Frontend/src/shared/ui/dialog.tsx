import type { ReactNode } from "react"

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  if (!open) return null
  return (
    <dialog open aria-label={title}>
      <button onClick={onClose}>Close</button>
      {children}
    </dialog>
  )
}

export function ConfirmDialog({
  open,
  title,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <button onClick={onConfirm}>Confirm</button>
    </Modal>
  )
}
