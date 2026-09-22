import { describe, expect, it } from "vitest"

import type { Page } from "@/entities/shared/model/page"
import type { BackupJob } from "@/entities/backup/model/types"
import type { InventorySummary } from "@/entities/inventory/model/types"
import type { Medicine } from "@/entities/medicine/model/types"
import type { ReportFilters } from "@/entities/report/model/types"
import type { Sale } from "@/entities/sale/model/types"
import type { User } from "@/entities/user/model/types"

describe("entity model contracts", () => {
  it("accepts documented resource shapes", () => {
    const medicine = {
      id: 42,
      genericName: "Amoxicillin",
      brandName: "Amoxil",
      description: null,
      dosageForm: "capsule",
      strength: "500 mg",
      unitPrice: "12.50",
      storageLocation: null,
      active: true,
      stockOnHand: 18,
      createdAt: "2026-09-18T02:00:00Z",
      updatedAt: null,
    } satisfies Medicine

    const sale = {
      id: 9001,
      state: "open",
      paymentStatus: "unpaid",
      items: [],
      grandTotal: "25.00",
      createdBy: 7,
      createdByName: "Ada Staff",
      createdAt: "2026-09-18T02:00:00Z",
      completedAt: null,
      cancelledAt: null,
      cancellationReason: null,
      cancelledBy: null,
    } satisfies Sale

    const page = {
      data: [medicine],
      meta: { currentPage: 1, perPage: 25, total: 1, lastPage: 1 },
    } satisfies Page<Medicine>

    const inventory = {
      medicineId: 42,
      genericName: "Amoxicillin",
      brandName: "Amoxil",
      dosageForm: "capsule",
      strength: "500 mg",
      unitPrice: "12.50",
      stockOnHand: 18,
      lowStock: true,
      earliestExpiry: null,
    } satisfies InventorySummary

    const user = {
      id: 7,
      username: "ada",
      fullName: "Ada Staff",
      role: "staff",
      active: true,
      createdAt: "2026-09-18T02:00:00Z",
      updatedAt: null,
    } satisfies User

    const backup = {
      id: 77,
      status: "queued",
      requestedAt: "2026-09-18T02:00:00Z",
      completedAt: null,
      size: null,
    } satisfies BackupJob

    const filters = {
      from: "2026-09-01",
      to: "2026-09-30",
      lowStock: true,
      expiresBefore: "2026-09-30",
      page: 1,
      perPage: 25,
    } satisfies ReportFilters

    expect({
      medicine,
      sale,
      page,
      inventory,
      user,
      backup,
      filters,
    }).toBeDefined()
  })
})
