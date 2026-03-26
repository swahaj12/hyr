"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean)

type Mode = "signin" | "signup"

export default function AdminLoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("signin")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function isAdminEmail(e: string) {
    return ADMIN_EMAILS.some(admin => admin.toLowerCase() === e.toLowerCase())
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!isAdminEmail(email)) {
      setError("This email is not authorized for admin access.")
      return
    }

    setLoading(true)

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name, role: "admin" },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (signUpError) {
          setError(signUpError.message)
          return
        }
        setSuccess("Check your email to confirm your admin account")
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) {
        setError(signInError.message)
        return
      }
      router.push("/admin")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <Card className="mx-4 w-full max-w-md border-gray-800 bg-gray-900 text-white">
        <CardHeader>
          <Link href="/" className="text-xl font-bold tracking-tight text-white hover:opacity-80 transition-opacity">
            Hyr
          </Link>
          <CardDescription className="text-gray-400">
            {mode === "signin" ? "Admin sign in" : "Create admin account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 rounded-lg border border-gray-700 bg-gray-800/50 p-1">
            <Button
              type="button"
              variant={mode === "signin" ? "default" : "ghost"}
              className={`flex-1 ${mode !== "signin" ? "text-gray-400 hover:text-white" : ""}`}
              onClick={() => { setMode("signin"); setError(null); setSuccess(null) }}
            >
              Sign In
            </Button>
            <Button
              type="button"
              variant={mode === "signup" ? "default" : "ghost"}
              className={`flex-1 ${mode !== "signup" ? "text-gray-400 hover:text-white" : ""}`}
              onClick={() => { setMode("signup"); setError(null); setSuccess(null) }}
            >
              Create Account
            </Button>
          </div>

          {ADMIN_EMAILS.length === 0 && (
            <div className="rounded-md bg-yellow-500/10 border border-yellow-500/30 p-3">
              <p className="text-sm text-yellow-400">
                No admin emails configured. Set <code className="font-mono text-xs bg-gray-800 px-1 py-0.5 rounded">NEXT_PUBLIC_ADMIN_EMAILS</code> in your Vercel environment variables.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label className="text-gray-300">Full Name</Label>
                <Input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border-gray-700 bg-gray-800 text-white placeholder-gray-500"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-gray-300">Admin Email</Label>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Must match NEXT_PUBLIC_ADMIN_EMAILS"
                className="border-gray-700 bg-gray-800 text-white placeholder-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Password</Label>
              <Input
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-gray-700 bg-gray-800 text-white placeholder-gray-500"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-500/10 border border-red-500/30 p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
            {success && (
              <div className="rounded-md bg-green-500/10 border border-green-500/30 p-3">
                <p className="text-sm text-green-400">{success}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Admin Account"}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-500">
            Only emails listed in NEXT_PUBLIC_ADMIN_EMAILS can access this page.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
