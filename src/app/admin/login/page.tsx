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

type Mode = "signin"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function isAdminEmail(e: string) {
    return ADMIN_EMAILS.some(admin => admin.toLowerCase() === e.toLowerCase())
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!isAdminEmail(email)) {
      setError("This email is not authorized for admin access.")
      return
    }

    setLoading(true)

    try {
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
            Admin sign in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ADMIN_EMAILS.length === 0 && (
            <div className="rounded-md bg-yellow-500/10 border border-yellow-500/30 p-3">
              <p className="text-sm text-yellow-400">
                No admin emails configured. Set <code className="font-mono text-xs bg-gray-800 px-1 py-0.5 rounded">NEXT_PUBLIC_ADMIN_EMAILS</code> in your Vercel environment variables.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                autoComplete="current-password"
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-500">
            Only authorized admin emails can access this page.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
