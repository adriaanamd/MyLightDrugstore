import { createFileRoute } from "@tanstack/react-router"
import { createInventoryApi } from "@/entities/inventory"
import { getAppServices } from "@/app/providers/app-services"
import { InventoryMovementsPage } from "@/pages/inventory/inventory-movements-page"

const inventoryApi = createInventoryApi(getAppServices().transport)

export const Route = createFileRoute("/_authenticated/inventory/movements")({
  loader: async () => (await inventoryApi.movements()).data,
  component: () => <InventoryMovementsPage items={Route.useLoaderData()} />,
})
