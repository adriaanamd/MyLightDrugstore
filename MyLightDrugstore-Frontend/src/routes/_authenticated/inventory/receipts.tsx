import { createFileRoute, useRouter } from "@tanstack/react-router"
import { createInventoryApi } from "@/entities/inventory"
import { getAppServices } from "@/app/providers/app-services"
import { InventoryReceiptsPage } from "@/pages/inventory/inventory-receipts-page"

const inventoryApi = createInventoryApi(getAppServices().transport)

export const Route = createFileRoute("/_authenticated/inventory/receipts")({
  loader: async () => (await inventoryApi.list()).data,
  component: InventoryReceiptsRoute,
})

function InventoryReceiptsRoute() {
  const router = useRouter()
  const items = Route.useLoaderData()
  return (
    <InventoryReceiptsPage
      medicineId={items[0]?.medicineId ?? ""}
      onReceive={async (payload) => {
        await inventoryApi.receive(payload)
        await router.invalidate()
      }}
    />
  )
}
