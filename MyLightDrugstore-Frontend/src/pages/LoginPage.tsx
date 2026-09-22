import { useState } from "react"
import { useNavigate, Navigate } from "../shared/router-compat"
import { useSession } from "../shared/SessionContext"
import { MockApiError } from "../shared/api/types"
import { Button, Input, ErrorBanner } from "../shared/ui"

export default function LoginPage() {
  const { user, login } = useSession()
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  const handleLogin = async (u: string, p: string) => {
    setLoading(true)
    setError("")
    try {
      await login(u, p)
      navigate("/dashboard")
    } catch (e) {
      if (e instanceof MockApiError) setError(e.apiError.message)
      else setError("Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.")
      return
    }
    void handleLogin(username, password)
  }

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-600 rounded-2xl mb-4 shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2a1 1 0 011 1v3h3a1 1 0 010 2h-3v3a1 1 0 01-2 0V8H8a1 1 0 010-2h3V3a1 1 0 011-1zM4 14a8 8 0 1016 0H4z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">MyLight Drugstore</h1>
          <p className="text-navy-300 text-sm mt-1">
            Pharmacy Management System
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-5">
              Sign in to your account
            </h2>

            {error && (
              <div className="mb-4">
                <ErrorBanner message={error} onDismiss={() => setError("")} />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <Button
                type="submit"
                className="w-full"
                loading={loading}
                size="lg"
              >
                Sign In
              </Button>
            </form>
          </div>

          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Demo sign-in
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => void handleLogin("admin.reyes", "admin1234")}
                disabled={loading}
                className="flex-1 text-xs font-medium bg-navy-700 text-white py-2 px-3 rounded-lg hover:bg-navy-800 transition-colors disabled:opacity-50"
              >
                Admin demo
              </button>
              <button
                onClick={() => void handleLogin("staff.bautista", "staff1234")}
                disabled={loading}
                className="flex-1 text-xs font-medium bg-teal-600 text-white py-2 px-3 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                Staff demo
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 text-center">
              Demo credentials are for prototype use only. No real data is
              stored.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
