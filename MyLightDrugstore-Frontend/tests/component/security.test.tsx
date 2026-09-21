// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { PasswordChangeForm } from "@/features/password-change"

describe("password change", () => {
  it("maps the form fields to the Laravel password payload", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<PasswordChangeForm onChange={onChange} />)
    await user.type(screen.getByLabelText("Current password"), "old-pass")
    await user.type(screen.getByLabelText("New password"), "new-pass")
    await user.type(screen.getByLabelText("Confirm new password"), "new-pass")
    await user.click(screen.getByRole("button", { name: "Change password" }))

    expect(onChange).toHaveBeenCalledWith({
      currentPassword: "old-pass",
      newPassword: "new-pass",
    })
  })
})
