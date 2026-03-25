"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import type { UserRole } from "@/lib/use-user"

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "admin@hyr.pk,chkk@hyr.pk").split(",").map(e => e.trim())

type NavVariant = "dark" | "light"

export function Navbar({ variant = "dark" }: { variant?: NavVariant }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; name: string; role: UserRole } | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          email: data.user.email || "",
          name: data.user.user_metadata?.full_name || data.user.email || "",
          role: (data.user.user_metadata?.role as UserRole) || "candidate",
        })
      }
      setChecked(true)
    })
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/")
  }

  const isDark = variant === "dark"
  const bg = isDark ? "bg-gray-950 text-white" : "bg-white text-gray-950 border-b border-gray-200"
  const linkClass = isDark
    ? "text-sm text-gray-300 hover:text-white transition-colors"
    : "text-sm text-gray-600 hover:text-gray-950 transition-colors"
  const activeLinkClass = isDark ? "text-sm text-white font-medium" : "text-sm text-gray-950 font-medium"

  const isAdmin = user && ADMIN_EMAILS.includes(user.email)
  const isEmployer = user?.role === "employer"
  const isCandidate = !isEmployer

  function navLinkClass(href: string) {
    return pathname === href ? activeLinkClass : linkClass
  }

  return (
    <header className={bg}>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Hyr
          </Link>
          <div className="hidden sm:flex items-center gap-4">
            {user && checked && isCandidate && (
              <>
                <Link href="/dashboard" className={navLinkClass("/dashboard")}>
                  Dashboard
                </Link>
                <Link href="/assessment" className={navLinkClass("/assessment")}>
                  Assessment
                </Link>
              </>
            )}
            {(!user || isEmployer || isAdmin) && (
              <Link href="/employers" className={navLinkClass("/employers")}>
                {isEmployer ? "Browse Candidates" : "Employers"}
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" className={navLinkClass("/admin")}>
                Admin
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!checked ? (
            <div className="h-8 w-20" />
          ) : user ? (
            <>
              <span className={`text-xs hidden sm:inline ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {user.name.split(" ")[0]}
              </span>
              {isEmployer && (
                <span className={`text-xs hidden sm:inline px-1.5 py-0.5 rounded ${isDark ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-700"}`}>
                  Employer
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                className={isDark
                  ? "text-white border-gray-600 bg-gray-800 hover:bg-gray-700"
                  : "text-gray-900 border-gray-300 hover:bg-gray-100"
                }
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <Link href="/auth">
              <Button
                variant={isDark ? "outline" : "default"}
                size="sm"
                className={isDark
                  ? "text-white border-gray-600 bg-gray-800 hover:bg-gray-700"
                  : ""
                }
              >
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile bottom nav */}
        {checked && (
          <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around py-2 px-4 z-40">
            {user && isCandidate && (
              <Link
                href="/dashboard"
                className={`flex flex-col items-center gap-0.5 text-xs ${pathname === "/dashboard" ? "text-gray-950 font-medium" : "text-gray-500"}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                Dashboard
              </Link>
            )}
            {user && isCandidate && (
              <Link
                href="/assessment"
                className={`flex flex-col items-center gap-0.5 text-xs ${pathname === "/assessment" ? "text-gray-950 font-medium" : "text-gray-500"}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                Assess
              </Link>
            )}
            {(!user || isEmployer || isAdmin) && (
              <Link
                href="/employers"
                className={`flex flex-col items-center gap-0.5 text-xs ${pathname === "/employers" ? "text-gray-950 font-medium" : "text-gray-500"}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                {isEmployer ? "Candidates" : "Employers"}
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                className={`flex flex-col items-center gap-0.5 text-xs ${pathname === "/admin" ? "text-gray-950 font-medium" : "text-gray-500"}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                Admin
              </Link>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}
