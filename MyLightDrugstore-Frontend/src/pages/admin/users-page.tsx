import type { User } from "@/entities/user"

export function AdminUsersPage({
  role,
  users,
  onDeactivate,
}: {
  role?: string
  users: User[]
  onDeactivate: (id: number) => Promise<void> | void
}) {
  if (role !== "admin") {
    return (
      <main>
        <h1>Admin access required</h1>
      </main>
    )
  }

  return (
    <main>
      <header>
        <p>Administration</p>
        <h1>Staff Accounts</h1>
      </header>
      <table>
        <caption>Staff accounts</caption>
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.isActive === false ? "Inactive" : "Active"}</td>
              <td>
                {user.isActive !== false && (
                  <button
                    type="button"
                    onClick={() => void onDeactivate(user.id)}
                  >
                    Deactivate
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
