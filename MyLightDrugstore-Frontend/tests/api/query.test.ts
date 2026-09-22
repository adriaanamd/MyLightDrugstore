import { describe, expect, it } from "vitest"

import { readPageMeta, unwrapData, withQuery } from "../../src/shared/api/query"

describe("shared API query helpers", () => {
  it("serializes only meaningful query values", () => {
    expect(
      withQuery("/medicines", {
        q: "pain relief",
        active: true,
        page: 2,
        empty: "",
        omitted: undefined,
      }),
    ).toBe("/medicines?q=pain+relief&active=true&page=2")
  })

  it("unwraps only a single data envelope", () => {
    expect(unwrapData({ data: { id: 42 } })).toEqual({ id: 42 })
    expect(unwrapData({ data: [1, 2], meta: { total: 2 } })).toEqual({
      data: [1, 2],
      meta: { total: 2 },
    })
  })

  it("reads pagination metadata and defaults missing values", () => {
    expect(
      readPageMeta(
        { data: [1, 2], meta: { page: 2, perPage: 10, total: 22 } },
        2,
      ),
    ).toEqual({ page: 2, perPage: 10, total: 22 })
    expect(readPageMeta({ data: [1, 2] }, 2)).toEqual({
      page: 1,
      perPage: 2,
      total: 2,
    })
  })
})
