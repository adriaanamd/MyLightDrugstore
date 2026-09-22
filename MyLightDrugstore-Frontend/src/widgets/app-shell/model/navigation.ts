import type { UserRole } from "@/entities/user"

const staffPaths = [
  "/dashboard",
  "/catalog/medicines",
  "/inventory",
  "/inventory/receipts",
  "/inventory/adjustments",
  "/inventory/movements",
  "/sales/new",
  "/sales/cart",
  "/sales",
  "/reports/inventory",
  "/reports/sales",
  "/settings/security",
]

const adminPaths = ["/admin/users", "/backups"]

export function getNavigationForRole(role: UserRole | undefined): string[] {
  if (role === "admin") {
    return [...staffPaths, ...adminPaths]
  }

  return [...staffPaths]
}
