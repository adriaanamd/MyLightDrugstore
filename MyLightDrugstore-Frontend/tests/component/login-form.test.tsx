// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { LoginForm } from "@/features/auth/ui/login-form"

describe("LoginForm", () => {
  it("submits Laravel username and password fields", async () => {
    const user = userEvent.setup()
    let submitted: unknown

    render(
      <LoginForm
        onSubmit={(credentials) => {
          submitted = credentials
        }}
      />,
    )

    await user.type(screen.getByLabelText("Username"), "staff")
    await user.type(screen.getByLabelText("Password"), "secret")
    await user.click(screen.getByRole("button", { name: "Sign in" }))

    expect(submitted).toEqual({ username: "staff", password: "secret" })
  })
})
