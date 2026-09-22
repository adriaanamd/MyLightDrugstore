import { describe, expect, it } from "vitest"

import { createBackupApi } from "../../src/entities/backup/api/backup-client"
import { createReportApi } from "../../src/entities/report/api/report-client"
import { createUserApi } from "../../src/entities/user/api/user-client"
import { createSystemApi } from "../../src/entities/system/api/system-client"
import type { TransportResponse } from "../../src/shared/api"

type RequestCall = {
  path: string

  init?: RequestInit & { body?: unknown }
}

function createTestClient(responses: unknown[]) {
  const calls: RequestCall[] = []

  const request = async <T,>(
    path: string,
    init?: RequestCall["init"],
  ): Promise<TransportResponse<T>> => {
    calls.push({ path, init })

    return {
      data: responses.shift() as T,
      status: 200,
      headers: new Headers(),
    }
  }

  return { calls, client: { request } }
}

const user = {
  id: 7,
  username: "ada",
  fullName: "Ada Staff",
  role: "staff",
  active: true,
  createdAt: "2026-09-18T02:00:00Z",
  updatedAt: null,
}

describe("operational entity apis", () => {
  it("supports typed user CRUD and report requests", async () => {
    const { calls, client } = createTestClient([
      { data: [user], meta: { page: 2, perPage: 10, total: 1 } },
      { data: user },
      { data: user },
      { data: user },
      {
        data: [
          {
            medicineId: 42,
            genericName: "Amoxicillin",
            brandName: null,
            dosageForm: "capsule",
            strength: "500 mg",
            unitPrice: "12.50",
            stockOnHand: 18,
            lowStock: true,
            earliestExpiry: null,
          },
        ],
        meta: { page: 1, perPage: 25, total: 1 },
      },
      {
        data: {
          from: "2026-09-01",
          to: "2026-09-30",
          saleCount: 3,
          grossSales: "75.00",
          paidSaleCount: 2,
          paidGrossSales: "50.00",
          cancelledSaleCount: 1,
        },
      },
    ])
    const users = createUserApi(client)
    const reports = createReportApi(client)

    await expect(
      users.list({ active: true, page: 2, perPage: 10 }),
    ).resolves.toEqual({
      data: [user],
      meta: { page: 2, perPage: 10, total: 1 },
    })
    await expect(
      users.create({
        username: "ada",
        fullName: "Ada Staff",
        password: "a-secure-password",
        role: "staff",
      }),
    ).resolves.toEqual(user)
    await expect(users.show(7)).resolves.toEqual(user)
    await expect(users.update(7, { active: false })).resolves.toEqual(user)
    await expect(
      reports.inventory({
        lowStock: true,
        expiresBefore: "2026-09-30",
        page: 1,
      }),
    ).resolves.toEqual({
      rows: [
        {
          medicineId: 42,
          genericName: "Amoxicillin",
          brandName: null,
          dosageForm: "capsule",
          strength: "500 mg",
          unitPrice: "12.50",
          stockOnHand: 18,
          lowStock: true,
          earliestExpiry: null,
        },
      ],
      total: 1,
    })
    await expect(
      reports.sales({ from: "2026-09-01", to: "2026-09-30" }),
    ).resolves.toEqual({
      from: "2026-09-01",
      to: "2026-09-30",
      saleCount: 3,
      grossSales: "75.00",
      paidSaleCount: 2,
      paidGrossSales: "50.00",
      cancelledSaleCount: 1,
    })

    expect(calls.map((call) => call.path)).toEqual([
      "/users?active=true&page=2&perPage=10",
      "/users",
      "/users/7",
      "/users/7",
      "/reports/inventory?lowStock=true&expiresBefore=2026-09-30&page=1",
      "/reports/sales?from=2026-09-01&to=2026-09-30",
    ])
  })

  it("keeps backup status and binary download typed", async () => {
    const bytes = new Uint8Array([1, 2, 3])
    const { calls, client } = createTestClient([
      {
        data: {
          id: 77,
          status: "queued",
          requestedAt: "2026-09-18T02:00:00Z",
          completedAt: null,
          size: null,
        },
      },
      {
        data: {
          id: 77,
          status: "completed",
          requestedAt: "2026-09-18T02:00:00Z",
          completedAt: "2026-09-18T02:01:00Z",
          size: 3,
        },
      },
      bytes,
      { data: { now: "2026-09-18T02:00:00Z" } },
    ])
    const backups = createBackupApi(client)
    const system = createSystemApi(client)

    await expect(backups.create()).resolves.toEqual({
      id: 77,
      status: "queued",
      requestedAt: "2026-09-18T02:00:00Z",
      completedAt: null,
      size: null,
    })
    await expect(backups.show(77)).resolves.toEqual({
      id: 77,
      status: "completed",
      requestedAt: "2026-09-18T02:00:00Z",
      completedAt: "2026-09-18T02:01:00Z",
      size: 3,
    })
    await expect(backups.download(77)).resolves.toEqual(bytes)
    await expect(system.getServerTime()).resolves.toEqual({
      now: "2026-09-18T02:00:00Z",
    })

    expect(calls.map((call) => call.path)).toEqual([
      "/backups",
      "/backups/77",
      "/backups/77/download",
      "/system/time",
    ])
  })
})
