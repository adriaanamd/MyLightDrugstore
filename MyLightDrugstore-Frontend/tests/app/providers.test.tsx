import { describe, expect, it } from "vitest"
import { createElement } from "react"

import { AppProviders } from "../../src/app/providers/app-providers"
import { AuthProvider } from "../../src/features/auth"

describe("app providers", () => {
  it("composes the auth provider around application content", () => {
    const child = createElement("main")
    const element = AppProviders({ children: child })

    expect(element.type).toBe(AuthProvider)
    expect(element.props.children).toEqual([child, expect.anything()])
  })
})
