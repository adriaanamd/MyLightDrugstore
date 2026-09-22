import { createFileRoute, useRouterState } from "@tanstack/react-router"
import { Navigate } from "@/shared/router-compat"
import { useSession } from "@/shared/SessionContext"
import AppShell from "@/widgets/AppShell"
import LoginPage from "@/pages/login/login-page"
import DashboardPage from "@/pages/dashboard/dashboard-page"
import CatalogPage from "@/pages/catalog/catalog-page"
import InventoryPage from "@/pages/inventory/inventory-page"
import InventoryReceiptsPage from "@/pages/inventory/receipts-page"
import InventoryAdjustmentsPage from "@/pages/inventory/adjustments-page"
import InventoryMovementsPage from "@/pages/inventory/movements-page"
import SalesNewPage from "@/pages/SalesNewPage"
import SalesCartPage from "@/pages/SalesCartPage"
import SalesListPage from "@/pages/SalesListPage"
import SalesPrintPage from "@/pages/SalesPrintPage"
import ReportsInventoryPage from "@/pages/ReportsInventoryPage"
import ReportsSalesPage from "@/pages/ReportsSalesPage"
import AdminUsersPage from "@/pages/AdminUsersPage"
import SecurityPage from "@/pages/SecurityPage"
import BackupsPage from "@/pages/BackupsPage"

export const Route = createFileRoute("/$")({ component: Surface })

function Surface() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const { user } = useSession()
  if (pathname === "/login") return <LoginPage />
  if (!user) return <Navigate to="/login" replace />
  if (pathname === "/sales/print" || pathname.startsWith("/sales/print/"))
    return <SalesPrintPage />
  if (pathname === "/catalog/medicines")
    return (
      <AppShell>
        <CatalogPage />
      </AppShell>
    )
  if (pathname === "/inventory")
    return (
      <AppShell>
        <InventoryPage />
      </AppShell>
    )
  if (pathname === "/inventory/receipts")
    return (
      <AppShell>
        <InventoryReceiptsPage />
      </AppShell>
    )
  if (pathname === "/inventory/adjustments")
    return (
      <AppShell>
        <InventoryAdjustmentsPage />
      </AppShell>
    )
  if (pathname === "/inventory/movements")
    return (
      <AppShell>
        <InventoryMovementsPage />
      </AppShell>
    )
  if (pathname === "/sales/new")
    return (
      <AppShell>
        <SalesNewPage />
      </AppShell>
    )
  if (pathname === "/sales/cart")
    return (
      <AppShell>
        <SalesCartPage />
      </AppShell>
    )
  if (pathname === "/sales")
    return (
      <AppShell>
        <SalesListPage />
      </AppShell>
    )
  if (pathname === "/reports/inventory")
    return (
      <AppShell>
        <ReportsInventoryPage />
      </AppShell>
    )
  if (pathname === "/reports/sales")
    return (
      <AppShell>
        <ReportsSalesPage />
      </AppShell>
    )
  if (pathname === "/settings/security")
    return (
      <AppShell>
        <SecurityPage />
      </AppShell>
    )
  if (pathname === "/admin/users")
    return user.role === "admin" ? (
      <AppShell>
        <AdminUsersPage />
      </AppShell>
    ) : (
      <Navigate to="/dashboard" replace />
    )
  if (pathname === "/backups")
    return user.role === "admin" ? (
      <AppShell>
        <BackupsPage />
      </AppShell>
    ) : (
      <Navigate to="/dashboard" replace />
    )
  return (
    <AppShell>
      <DashboardPage />
    </AppShell>
  )
}
