import { createRouter, type RouterOptions } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"

type AppRouterOptions = Omit<RouterOptions<typeof routeTree, "never">, "routeTree">

export function getRouter(options: AppRouterOptions = {}) {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    ...options,
  })
}

export const createAppRouter = getRouter
