import { useState, useEffect } from "react"
import { createUserApi, type User, type UserRole } from "@/entities/user"
import { createStaffActions } from "@/features/staff-management"
import { useAuthSession } from "@/features/auth"
import { normalizeApiError } from "@/shared/api"
import { apiClient } from "@/shared/api/api-client"
import {
  PageHeader,
  Button,
  Card,
  Table,
  Th,
  Td,
  Tr,
  Badge,
  Modal,
  Input,
  Select,
  ConfirmDialog,
  ErrorBanner,
  showToast,
  formatDate,
  EmptyState,
} from "@/shared/ui"

const userApi = createUserApi(apiClient.transport)

interface UserForm {
  username: string
  fullName: string
  password: string
  role: UserRole
}
const emptyForm: UserForm = {
  username: "",
  fullName: "",
  password: "",
  role: "staff",
}

export default function AdminUsersPage() {
  const { user: me } = useAuthSession()
  const staffActions = createStaffActions(userApi, me?.role ?? "staff")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [form, setForm] = useState<UserForm>(emptyForm)
  const [formError, setFormError] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null)
  const [deactivateLoading, setDeactivateLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const result = await userApi.list({ perPage: 100 })
      setUsers(result.data)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const openCreate = () => {
    setEditUser(null)
    setForm(emptyForm)
    setFormError("")
    setShowForm(true)
  }
  const openEdit = (u: User) => {
    setEditUser(u)
    setForm({
      username: u.username,
      fullName: u.fullName,
      password: "",
      role: u.role,
    })
    setFormError("")
    setShowForm(true)
  }

  const handleSave = async () => {
    setFormError("")
    if (!form.fullName.trim()) {
      setFormError("Full name is required.")
      return
    }
    if (!editUser) {
      if (!form.username.trim()) {
        setFormError("Username is required.")
        return
      }
      if (!form.password.trim()) {
        setFormError("Password is required.")
        return
      }
    }
    setFormLoading(true)
    try {
      if (editUser) {
        await staffActions.update(editUser.id, {
          fullName: form.fullName,
          role: form.role,
        })
        showToast("Account updated.")
      } else {
        await staffActions.create(form)
        showToast("Account created.")
      }
      setShowForm(false)
      await load()
    } catch (cause: unknown) {
      setFormError(normalizeApiError(cause).message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeactivate = async () => {
    if (!deactivateUser) return
    setDeactivateLoading(true)
    try {
      await staffActions.deactivate(deactivateUser.id)
      showToast(`${deactivateUser.fullName} deactivated.`)
      setDeactivateUser(null)
      await load()
    } catch (cause: unknown) {
      showToast(normalizeApiError(cause).message, "error")
    } finally {
      setDeactivateLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Staff Accounts"
        subtitle="Manage system users"
        action={<Button onClick={openCreate}>+ Add Account</Button>}
      />

      <Card>
        {loading ? null : (
          <Table>
            <thead>
              <tr>
                <Th>Full Name</Th>
                <Th>Username</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState title="No users found" />
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <Tr key={u.id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-navy-700 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {u.fullName.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-800">
                        {u.fullName}
                      </span>
                      {u.id === me?.id && <Badge variant="teal">You</Badge>}
                    </div>
                  </Td>
                  <Td>
                    <span className="font-mono text-xs text-slate-500">
                      {u.username}
                    </span>
                  </Td>
                  <Td>
                    <Badge
                      variant={u.role === "admin" ? "navy" : "gray"}
                      className="capitalize"
                    >
                      {u.role}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge variant={u.active ? "green" : "red"}>
                      {u.active ? "Active" : "Inactive"}
                    </Badge>
                  </Td>
                  <Td className="text-xs text-slate-400">
                    {formatDate(u.createdAt)}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(u)}
                        className="text-xs text-teal-600 hover:underline font-medium"
                      >
                        Edit
                      </button>
                      {u.active && u.id !== me?.id && (
                        <>
                          <span className="text-slate-200">·</span>
                          <button
                            onClick={() => setDeactivateUser(u)}
                            className="text-xs text-red-500 hover:underline font-medium"
                          >
                            Deactivate
                          </button>
                        </>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Create/Edit modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editUser ? `Edit: ${editUser.fullName}` : "Add Staff Account"}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={formLoading}>
              {editUser ? "Save Changes" : "Create Account"}
            </Button>
          </>
        }
      >
        {formError && (
          <div className="mb-4">
            <ErrorBanner
              message={formError}
              onDismiss={() => setFormError("")}
            />
          </div>
        )}
        <div className="space-y-4">
          {!editUser && (
            <Input
              label="Username"
              value={form.username}
              onChange={(e) =>
                setForm((f) => ({ ...f, username: e.target.value }))
              }
              placeholder="e.g. staff.dela.cruz"
              hint="Cannot be changed after creation"
            />
          )}
          <Input
            label="Full Name"
            value={form.fullName}
            onChange={(e) =>
              setForm((f) => ({ ...f, fullName: e.target.value }))
            }
            placeholder="e.g. Juan dela Cruz"
          />
          {!editUser && (
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              hint="Temporary password for first login"
            />
          )}
          <Select
            label="Role"
            value={form.role}
            onChange={(e) =>
              setForm((f) => ({ ...f, role: e.target.value as UserRole }))
            }
          >
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </Select>
          {editUser && (
            <p className="text-xs text-slate-400">
              To change the password, the user should use the Change Password
              screen.
            </p>
          )}
        </div>
      </Modal>

      {/* Deactivate confirm */}
      <ConfirmDialog
        open={!!deactivateUser}
        onClose={() => setDeactivateUser(null)}
        onConfirm={handleDeactivate}
        title="Deactivate Account"
        message={`Deactivate ${deactivateUser?.fullName}? They will no longer be able to sign in. This does not delete their data or transaction history.`}
        confirmLabel="Deactivate"
        loading={deactivateLoading}
      />
    </div>
  )
}
