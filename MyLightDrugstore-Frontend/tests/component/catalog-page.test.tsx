// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { CatalogMedicineEditor } from "@/features/catalog-medicine-editing/ui/catalog-medicine-editor"
import { CatalogPage } from "@/pages/catalog/catalog-page"

describe("CatalogMedicineEditor", () => {
  it("submits the edited medicine payload", async () => {
    const user = userEvent.setup()
    let submitted: unknown

    render(
      <CatalogMedicineEditor
        medicine={{ id: "med-1", name: "Paracetamol 500mg" }}
        onSave={(payload) => {
          submitted = payload
        }}
      />,
    )

    const name = screen.getByLabelText("Medicine name")
    await user.clear(name)
    await user.type(name, "Paracetamol 650mg")
    await user.click(screen.getByRole("button", { name: "Save medicine" }))

    expect(submitted).toEqual({ name: "Paracetamol 650mg" })
  })

  it("renders the catalog page through its widget boundary", () => {
    render(
      <CatalogPage
        medicines={[{ id: "med-1", name: "Paracetamol 500mg" }]}
        onUpdate={() => undefined}
      />,
    )

    expect(screen.getByRole("heading", { name: "Catalog" })).toBeTruthy()
    expect(screen.getByDisplayValue("Paracetamol 500mg")).toBeTruthy()
  })
})
