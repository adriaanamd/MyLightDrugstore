import { createFileRoute, useRouter } from "@tanstack/react-router"
import { getAppServices } from "@/app/providers/app-services"
import { createSaleApi } from "@/entities/sale"
import { SalesPage } from "@/pages/sales/sales-page"

const saleApi = createSaleApi(getAppServices().transport)

export const Route = createFileRoute("/_authenticated/sales")({
  loader: async () => (await saleApi.list()).data,
  component: SalesRoute,
})

function SalesRoute() {
  const router = useRouter()
  const sales = Route.useLoaderData()
  return (
    <SalesPage
      sales={sales}
      onMarkPaid={async (id) => {
        await saleApi.markPaid(id)
        await router.invalidate()
      }}
      onCancel={async (id) => {
        await saleApi.cancel(id, "cancelled by staff")
        await router.invalidate()
      }}
    />
  )
}
