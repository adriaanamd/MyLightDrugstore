import { createFileRoute, useRouter } from "@tanstack/react-router"
import { createSaleApi } from "@/entities/sale"
import { getAppServices } from "@/app/providers/app-services"
import { SaleCartPage } from "@/pages/sales/sale-cart-page"

const saleApi = createSaleApi(getAppServices().transport)

export const Route = createFileRoute("/_authenticated/sales/cart")({
  loader: async () => (await saleApi.list({ status: "open" })).data[0],
  component: SaleCartRoute,
})

function SaleCartRoute() {
  const router = useRouter()
  const sale = Route.useLoaderData()
  return (
    <SaleCartPage
      sale={sale}
      onMarkPaid={async () => {
        if (!sale) return
        await saleApi.markPaid(sale.id)
        await router.invalidate()
      }}
      onCancel={async () => {
        if (!sale) return
        await saleApi.cancel(sale.id, "cancelled by staff")
        await router.invalidate()
      }}
    />
  )
}
