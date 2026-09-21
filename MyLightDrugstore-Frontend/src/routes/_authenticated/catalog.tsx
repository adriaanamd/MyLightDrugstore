import { createFileRoute, useRouter } from "@tanstack/react-router"
import { createMedicineApi } from "@/entities/medicine"
import { getAppServices } from "@/app/providers/app-services"
import { CatalogPage } from "@/pages/catalog/catalog-page"

const medicineApi = createMedicineApi(getAppServices().transport)

export const Route = createFileRoute("/_authenticated/catalog")({
  loader: async () => {
    const response = await medicineApi.list()
    return response.data.data ?? []
  },
  component: CatalogRoute,
})

function CatalogRoute() {
  const router = useRouter()
  const medicines = Route.useLoaderData()

  return (
    <CatalogPage
      medicines={medicines}
      onUpdate={async (id, payload) => {
        await medicineApi.update(id, payload)
        await router.invalidate()
      }}
    />
  )
}
