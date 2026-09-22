import { useState, type ReactNode } from "react"

import { Card } from "./card"

type BadgeVariant = "green" | "red" | "amber" | "blue" | "gray" | "navy" | "teal"

const badgeColors: Record<BadgeVariant, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  red: "bg-red-50 text-red-700 ring-1 ring-red-200",
  amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  blue: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  gray: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  navy: "bg-navy-50 text-navy-700 ring-1 ring-navy-200",
  teal: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
}

export function Badge({
  variant = "gray",
  children,
  className = "",
}: {
  variant?: BadgeVariant

  children: ReactNode

  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeColors[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

type ToastType = "success" | "error" | "info"

type ToastItem = {
  id: string

  type: ToastType

  message: string
}

let toastSetter: React.Dispatch<React.SetStateAction<ToastItem[]>> | null = null

export function showToast(message: string, type: ToastType = "success") {
  if (!toastSetter) {
    return
  }

  const id = crypto.randomUUID()
  toastSetter((previous) => [...previous, { id, type, message }])

  setTimeout(() => {
    toastSetter?.((previous) => previous.filter((toast) => toast.id !== id))
  }, 4000)
}

const toastIcons: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
}

const toastColors: Record<ToastType, string> = {
  success: "bg-emerald-700 text-white",
  error: "bg-red-700 text-white",
  info: "bg-navy-700 text-white",
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  toastSetter = setToasts

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium pointer-events-auto animate-in slide-in-from-bottom-2 ${toastColors[toast.type]}`}
        >
          <span className="text-base leading-none">
            {toastIcons[toast.type]}
          </span>
          {toast.message}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string

  description?: string

  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24">
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4"
          />
        </svg>
      </div>
      <h3 className="font-medium text-slate-800 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mb-4 max-w-sm">{description}</p>
      )}
      {action}
    </div>
  )
}

export function Pagination({
  page,
  perPage,
  total,
  onPage,
}: {
  page: number

  perPage: number

  total: number

  onPage: (page: number) => void
}) {
  const totalPages = Math.ceil(total / perPage)

  if (totalPages <= 1) {
    return null
  }

  const from = (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)

  return (
    <div className="flex items-center justify-between pt-3 text-sm text-slate-600">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="flex gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ←
        </button>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          →
        </button>
      </div>
    </div>
  )
}

export function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string

  onDismiss?: () => void
}) {
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
      <span className="shrink-0">⚠</span>
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 text-red-400 hover:text-red-600"
        >
          ✕
        </button>
      )}
    </div>
  )
}

export type { BadgeVariant, ToastType }
