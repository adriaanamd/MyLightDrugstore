import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react"

type FieldProps = {
  label?: string

  error?: string
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hint?: string
} & FieldProps

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & FieldProps

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps

function fieldId(
  label: string | undefined,
  id: string | undefined,
): string | undefined {
  return id ?? label?.toLowerCase().replace(/\s+/g, "-")
}

export function Input({
  label,
  error,
  hint,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = fieldId(label, id)

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-slate-600">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`rounded border px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
          error ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export function Select({
  label,
  error,
  children,
  className = "",
  id,
  ...props
}: SelectProps) {
  const selectId = fieldId(label, id)

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-medium text-slate-600"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`rounded border px-3 py-2 text-sm text-slate-800 bg-white transition focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
          error ? "border-red-400" : "border-slate-300"
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Textarea({
  label,
  error,
  className = "",
  id,
  ...props
}: TextareaProps) {
  const textareaId = fieldId(label, id)

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-xs font-medium text-slate-600"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`rounded border px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none ${
          error ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export type { InputProps, SelectProps, TextareaProps, ReactNode }
