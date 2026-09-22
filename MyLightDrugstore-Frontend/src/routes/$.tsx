import { createFileRoute, useRouterState } from "@tanstack/react-router"
import { Navigate } from "@tanstack/react-router"
import { useAuthSession } from "@/features/auth"
import { Spinner } from "@/shared/ui"
import AppShell from "@/widgets/AppShell"
import LoginPage from "@/pages/login/login-page"
import DashboardPage from "@/pages/dashboard/dashboard-page"
import CatalogPage from "@/pages/catalog/catalog-page"
import InventoryPage from "@/pages/inventory/inventory-page"
import InventoryReceiptsPage from "@/pages/inventory/receipts-page"
import InventoryAdjustmentsPage from "@/pages/inventory/adjustments-page"
import InventoryMovementsPage from "@/pages/inventory/movements-page"
import SalesNewPage from "@/pages/sales/new-sale-page"
import SalesCartPage from "@/pages/sales/cart-page"
import SalesListPage from "@/pages/sales/sales-list-page"
import SalesPrintPage from "@/pages/sales/sales-print-page"
import ReportsInventoryPage from "@/pages/reports/inventory-report-page"
import ReportsSalesPage from "@/pages/reports/sales-report-page"
import AdminUsersPage from "@/pages/administration/staff-accounts-page"
import SecurityPage from "@/pages/security/security-page"
import BackupsPage from "@/pages/backups/backups-page"

export const Route = createFileRoute("/$")({ component: Surface })

function Surface() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const { user, status } = useAuthSession()
  if (pathname === "/login") return <LoginPage />
  if (status === "loading")
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
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
      <Navigate to={"/dashboard" as never} replace />
    )
  if (pathname === "/backups")
    return user.role === "admin" ? (
      <AppShell>
        <BackupsPage />
      </AppShell>
    ) : (
      <Navigate to={"/dashboard" as never} replace />
    )
  return (
    <AppShell>
      <DashboardPage />
    </AppShell>
  )
}
