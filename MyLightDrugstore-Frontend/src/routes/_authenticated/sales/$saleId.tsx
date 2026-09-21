import { createFileRoute, useRouter } from "@tanstack/react-router"
import { createSaleApi } from "@/entities/sale"
import { getAppServices } from "@/app/providers/app-services"
import { SaleDetailPage } from "@/pages/sales/sale-detail-page"

const saleApi = createSaleApi(getAppServices().transport)

export const Route = createFileRoute("/_authenticated/sales/$saleId")({
  loader: async ({ params }) => (await saleApi.show(params.saleId)).data,
  component: SaleDetailRoute,
})

function SaleDetailRoute() {
  const router = useRouter()
  const sale = Route.useLoaderData()
  return (
    <SaleDetailPage
      sale={sale}
      onMarkPaid={async () => {
        await saleApi.markPaid(sale.id)
        await router.invalidate()
      }}
      onCancel={async () => {
        await saleApi.cancel(sale.id, "cancelled by staff")
        await router.invalidate()
      }}
    />
  )
}
