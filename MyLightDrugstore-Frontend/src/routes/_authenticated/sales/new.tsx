import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { createSaleApi } from "@/entities/sale"
import { getAppServices } from "@/app/providers/app-services"
import { SaleNewPage } from "@/pages/sales/sale-new-page"

const saleApi = createSaleApi(getAppServices().transport)

export const Route = createFileRoute("/_authenticated/sales/new")({
  component: NewSaleRoute,
})

function NewSaleRoute() {
  const navigate = useNavigate()
  return (
    <SaleNewPage
      onCreate={async (payload, idempotencyKey) => {
        const response = await saleApi.create(payload, idempotencyKey)
        await navigate({
          to: "/sales/$saleId",
          params: { saleId: response.data.id },
        })
      }}
    />
  )
}
