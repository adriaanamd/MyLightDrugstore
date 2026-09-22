import type {
  UserCreatePayload,
  UserRole,
  UserUpdatePayload,
} from "@/entities/user"

export type StaffCreateFormValues = UserCreatePayload

export type StaffUpdateFormValues = UserUpdatePayload

export type StaffFormValidation = {
  valid: boolean

  message?: string
}

export function validateStaffCreateForm(
  values: StaffCreateFormValues,
): StaffFormValidation {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,63}$/.test(values.username)) {
    return { valid: false, message: "Username must be at least 3 characters." }
  }

  if (!values.fullName.trim()) {
    return { valid: false, message: "Full name is required." }
  }

  if (values.password.length < 12) {
    return { valid: false, message: "Password must be at least 12 characters." }
  }

  if (!isUserRole(values.role)) {
    return { valid: false, message: "A valid role is required." }
  }

  return { valid: true }
}

function isUserRole(value: string): value is UserRole {
  return value === "admin" || value === "staff"
}
