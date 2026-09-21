import { createFileRoute, useRouter } from "@tanstack/react-router"
import { createInventoryApi } from "@/entities/inventory"
import { getAppServices } from "@/app/providers/app-services"
import { InventoryPage } from "@/pages/inventory/inventory-page"

const inventoryApi = createInventoryApi(getAppServices().transport)

export const Route = createFileRoute("/_authenticated/inventory")({
  loader: async () => {
    const response = await inventoryApi.list()
    return response.data
  },
  component: InventoryRoute,
})

function InventoryRoute() {
  const router = useRouter()
  const items = Route.useLoaderData()
  const medicineId = items[0]?.medicineId ?? ""

  return (
    <InventoryPage
      medicineId={medicineId}
      items={items}
      onReceive={async (payload) => {
        await inventoryApi.receive(payload)
        await router.invalidate()
      }}
      onAdjust={async (payload) => {
        await inventoryApi.adjust(payload)
        await router.invalidate()
      }}
    />
  )
}
