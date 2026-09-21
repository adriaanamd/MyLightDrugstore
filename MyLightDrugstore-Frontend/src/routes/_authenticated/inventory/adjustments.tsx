import { createFileRoute, useRouter } from "@tanstack/react-router"
import { createInventoryApi } from "@/entities/inventory"
import { getAppServices } from "@/app/providers/app-services"
import { InventoryAdjustmentsPage } from "@/pages/inventory/inventory-adjustments-page"

const inventoryApi = createInventoryApi(getAppServices().transport)

export const Route = createFileRoute("/_authenticated/inventory/adjustments")({
  loader: async () => (await inventoryApi.list()).data,
  component: InventoryAdjustmentsRoute,
})

function InventoryAdjustmentsRoute() {
  const router = useRouter()
  const items = Route.useLoaderData()
  return (
    <InventoryAdjustmentsPage
      medicineId={items[0]?.medicineId ?? ""}
      onAdjust={async (payload) => {
        await inventoryApi.adjust(payload)
        await router.invalidate()
      }}
    />
  )
}
