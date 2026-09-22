export type PasswordChangeFormValues = {
  currentPassword: string

  newPassword: string

  confirmPassword: string
}

export type PasswordChangeValidation = {
  valid: boolean

  errors: Partial<Record<keyof PasswordChangeFormValues, string>>
}

export function validatePasswordChange(
  values: PasswordChangeFormValues,
): PasswordChangeValidation {
  const errors: PasswordChangeValidation["errors"] = {}

  if (!values.currentPassword) {
    errors.currentPassword = "Enter your current password."
  }

  if (values.newPassword.length < 12) {
    errors.newPassword = "New password must be at least 12 characters."
  }

  if (values.newPassword === values.currentPassword) {
    errors.newPassword = "New password must differ from current password."
  }

  if (values.newPassword !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match."
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
