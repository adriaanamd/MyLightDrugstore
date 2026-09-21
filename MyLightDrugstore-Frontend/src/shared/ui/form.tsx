import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react"

export function Input({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return <label>{label}{props.id ? null : null}<input {...props} /></label>
}

export function Select({ label, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; children: ReactNode }) {
  return <label>{label}<select {...props}>{children}</select></label>
}

export function Textarea({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return <label>{label}<textarea {...props} /></label>
}
