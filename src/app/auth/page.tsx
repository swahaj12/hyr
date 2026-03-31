"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"

import { supabase } from "@/lib/supabase"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Mode = "signin" | "signup" | "forgot"
type UserRole = "candidate" | "employer"

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("signin")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>("candidate")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setSuccess(null)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset`,
        })
        if (resetError) {
          setError(resetError.message)
          return
        }
        setSuccess("Check your email for a password reset link")
        return
      }

      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name, role },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (signUpError) {
          setError(signUpError.message)
          return
        }
        setSuccess("Check your email to confirm your account")
        return
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) {
        setError(signInError.message)
        return
      }
      const userRole = signInData.user?.user_metadata?.role
      // Check admin status via server-side endpoint
      let isAdmin = false
      try {
        const session = await supabase.auth.getSession()
        if (session.data.session?.access_token) {
          const verifyRes = await fetch("/api/admin/verify", {
            headers: { Authorization: `Bearer ${session.data.session.access_token}` },
          })
          const verifyData = await verifyRes.json()
          isAdmin = verifyData.isAdmin
        }
      } catch { /* not admin */ }
      router.push(isAdmin ? "/admin" : userRole === "employer" ? "/employers" : "/dashboard")
    } finally {
      setLoading(false)
    }
  }

  const ease = [0.16, 1, 0.3, 1] as const

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [...ease] }}
        className="mx-4 w-full max-w-md"
      >
      <Card>
        <CardHeader>
          <Link href="/" className="text-xl font-bold tracking-tight text-gray-950 dark:text-white hover:opacity-80 transition-opacity">
            Hyr
          </Link>
          <CardTitle className="text-lg">
            {mode === "signin"
              ? "Welcome back"
              : mode === "signup"
                ? "Start your journey"
                : "Reset your password"}
          </CardTitle>
          <CardDescription className="text-sm">
            {mode === "signin"
              ? "Sign in to your account"
              : mode === "signup"
                ? "15 minutes to a verified skill profile"
                : "We'll send you a reset link"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode !== "forgot" && (
            <div className="flex gap-2 rounded-lg border border-border bg-muted/40 p-1">
              <Button
                type="button"
                variant={mode === "signin" ? "default" : "ghost"}
                className="flex-1"
                onClick={() => switchMode("signin")}
              >
                Sign In
              </Button>
              <Button
                type="button"
                variant={mode === "signup" ? "default" : "ghost"}
                className="flex-1"
                onClick={() => switchMode("signup")}
              >
                Sign Up
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25, ease: [...ease] }}
                className="space-y-4"
              >
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label>I am a</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button
                      type="button"
                      onClick={() => setRole("candidate")}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`rounded-lg border p-3 text-center text-sm font-medium transition-colors ${
                        role === "candidate"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-gray-400 dark:border-gray-500"
                      }`}
                    >
                      🎓 Candidate
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => setRole("employer")}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`rounded-lg border p-3 text-center text-sm font-medium transition-colors ${
                        role === "employer"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-gray-400 dark:border-gray-500"
                      }`}
                    >
                      🏢 Employer
                    </motion.button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">{role === "employer" ? "Company / Your Name" : "Full Name"}</Label>
                  <Input
                    id="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline underline-offset-4"
                      onClick={() => switchMode("forgot")}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3"
              >
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3"
              >
                <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
              </motion.div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign In"
                  : mode === "signup"
                    ? "Create Account"
                    : "Send Reset Link"}
            </Button>
              </motion.div>
            </AnimatePresence>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "forgot" ? (
              <>
                Remember your password?{" "}
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => switchMode("signin")}
                >
                  Sign in
                </button>
              </>
            ) : mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => switchMode("signup")}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => switchMode("signin")}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  )
}
