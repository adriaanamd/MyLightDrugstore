import type { UserRole } from "@/entities/user"

export type NavigationPath = "/dashboard" | "/catalog/medicines" | "/inventory" | "/inventory/receipts" | "/inventory/adjustments" | "/inventory/movements" | "/sales/new" | "/sales/cart" | "/sales" | "/reports/inventory" | "/reports/sales" | "/settings/security" | "/admin/users" | "/backups"

const staffPaths: NavigationPath[] = [
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

const adminPaths: NavigationPath[] = ["/admin/users", "/backups"]

export function getNavigationForRole(
  role: UserRole | undefined,
): NavigationPath[] {
  if (role === "admin") {
    return [...staffPaths, ...adminPaths]
  }

  return [...staffPaths]
}
