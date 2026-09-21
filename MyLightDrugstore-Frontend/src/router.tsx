import { createRouter, type RouterHistory } from "@tanstack/react-router"
import { getAppServices } from "./app/providers/app-services"
import { routeTree } from "./routeTree.gen"

type AppRouterOptions = {
  history?: RouterHistory
}

export function getRouter(options: AppRouterOptions = {}) {
  return createRouter({
    routeTree,
    context: { session: getAppServices().session },
    scrollRestoration: true,
    ...options,
  })
}

export const createAppRouter = getRouter
