export function formatPHP(amount: string | number): string {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount
  return `₱${numericAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-PH", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}
