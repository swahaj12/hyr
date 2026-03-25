"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export type UserRole = "candidate" | "employer"

export type AppUser = {
  id: string
  email: string
  name: string
  role: UserRole
}

export function useUser() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const meta = data.user.user_metadata || {}
        setUser({
          id: data.user.id,
          email: data.user.email || "",
          name: meta.full_name || data.user.email || "",
          role: (meta.role as UserRole) || "candidate",
        })
      }
      setLoading(false)
    })
  }, [])

  return { user, loading }
}
