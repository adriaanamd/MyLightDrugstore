import { Link, Outlet, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { useSession, useSessionStore } from "@/features/auth"

type NavigationItem = {
  label: string
  to:
    | "/dashboard"
    | "/catalog"
    | "/inventory"
    | "/sales"
    | "/sales/new"
    | "/reports/inventory"
    | "/reports/sales"
    | "/settings/security"
    | "/admin/users"
    | "/backups"
  adminOnly?: boolean
}

const navigation: Array<{ label: string; items: NavigationItem[] }> = [
  { label: "Overview", items: [{ label: "Dashboard", to: "/dashboard" }] },
  { label: "Catalog", items: [{ label: "Medicines", to: "/catalog" }] },
  { label: "Inventory", items: [{ label: "Stock overview", to: "/inventory" }] },
  {
    label: "Sales",
    items: [
      { label: "New sale", to: "/sales/new" },
      { label: "Sale history", to: "/sales" },
    ],
  },
  {
    label: "Reports",
    items: [
      { label: "Inventory report", to: "/reports/inventory" },
      { label: "Sales report", to: "/reports/sales" },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Staff accounts", to: "/admin/users", adminOnly: true },
      { label: "Backups", to: "/backups", adminOnly: true },
      { label: "Change password", to: "/settings/security" },
    ],
  },
]

export function AppShell({
  getServerTime,
  onLogout,
}: {
  getServerTime: () => Promise<string>
  onLogout: () => Promise<void>
}) {
  const sessionStore = useSessionStore()
  const session = useSession(sessionStore)
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [serverTime, setServerTime] = useState<string>()

  useEffect(() => {
    let active = true
    const loadTime = async () => {
      try {
        const utc = await getServerTime()
        if (active) setServerTime(utc)
      } catch {
        if (active) setServerTime(undefined)
      }
    }
    void loadTime()
    const timer = window.setInterval(() => void loadTime(), 60_000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  const logout = async () => {
    await onLogout()
    await navigate({ to: "/login" })
  }

  return (
    <div className="app-shell">
      <aside aria-label="Primary navigation" data-open={sidebarOpen}>
        <div className="app-shell__brand">
          <strong>MyLight</strong>
          {sidebarOpen && <span>Drugstore</span>}
        </div>
        <nav>
          {navigation.map((group) => {
            const items = group.items.filter(
              (item) => !item.adminOnly || session.user?.role === "admin",
            )
            if (items.length === 0) return null
            return (
              <section key={group.label} aria-label={group.label}>
                {sidebarOpen && <h2>{group.label}</h2>}
                {items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to as never}
                    activeProps={{ "data-active": true }}
                  >
                    {item.label}
                  </Link>
                ))}
              </section>
            )
          })}
        </nav>
        <button type="button" onClick={() => void logout}>Log out</button>
      </aside>
      <div className="app-shell__content">
        <header>
          <button
            type="button"
            aria-label="Toggle sidebar"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            Menu
          </button>
          <span>{session.user?.fullName ?? session.user?.username}</span>
          {serverTime && <time dateTime={serverTime}>{serverTime}</time>}
        </header>
        <div className="app-shell__page">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
