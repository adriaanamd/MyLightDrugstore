import { createFileRoute } from "@tanstack/react-router"
import { createSaleApi } from "@/entities/sale"
import { getAppServices } from "@/app/providers/app-services"
import { SalePrintPage } from "@/pages/sales/sale-print-page"

const saleApi = createSaleApi(getAppServices().transport)

export const Route = createFileRoute("/_authenticated/sales/$saleId/print")({
  loader: async ({ params }) => (await saleApi.show(params.saleId)).data,
  component: () => <SalePrintPage sale={Route.useLoaderData()} />,
})
