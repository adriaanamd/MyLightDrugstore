import { createRouter, type RouterHistory } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"

type AppRouterOptions = {
  history?: RouterHistory
}

export function getRouter(options: AppRouterOptions = {}) {
  return createRouter({
    routeTree,
    context: { user: null },
    scrollRestoration: true,
    ...options,
  })
}

export const createAppRouter = getRouter
