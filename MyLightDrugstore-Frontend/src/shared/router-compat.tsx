import { Link as TanStackLink, Outlet, useNavigate as useTanStackNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, type ReactNode } from 'react'

export { Outlet }
export function useNavigate() {
  const navigate = useTanStackNavigate()
  return (to: string, options?: { replace?: boolean }) => navigate({ to: to as never, replace: options?.replace })
}

export function Link(props: any) {
  return <TanStackLink {...props} to={props.to as never} />
}

export function NavLink({ to, className, children, ...props }: any) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const isActive = pathname === to || pathname.startsWith(`${to}/`)
  const resolvedClassName = typeof className === 'function' ? className({ isActive } as { isActive: boolean }) : className
  return <TanStackLink {...props} to={to as never} className={resolvedClassName}>{children}</TanStackLink>
}

export function Navigate({ to, replace = false }: { to: string; replace?: boolean }) {
  const navigate = useTanStackNavigate()
  useEffect(() => { void navigate({ to: to as never, replace }) }, [navigate, to, replace])
  return null
}

export function useParams<T extends Record<string, string | undefined>>() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const saleMatch = pathname.match(/\/sales\/print\/([^/]+)/)
  return { saleId: saleMatch?.[1] } as unknown as T
}

export function useSearchParams(): [URLSearchParams, (next: URLSearchParams) => void] {
  const href = useRouterState({ select: (state) => state.location.href })
  const navigate = useTanStackNavigate()
  const params = new URL(href, window.location.origin).searchParams
  return [params, (next) => void navigate({ search: next.toString() as never })]
}

export type RouterCompatChildren = { children?: ReactNode }
