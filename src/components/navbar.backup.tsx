"use client"

import React, { useEffect, useState } from "react"
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
  const [user, setUser] = useState<{ email: string; name: string; role: UserRole; id: string } | null>(null)
  const [checked, setChecked] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || "",
          name: data.user.user_metadata?.full_name || data.user.email || "",
          role: (data.user.user_metadata?.role as UserRole) || "candidate",
        })

        supabase
          .from("conversations")
          .select("id")
          .or(`employer_id.eq.${data.user.id},candidate_id.eq.${data.user.id}`)
          .then(({ data: convs }) => {
            if (convs && convs.length > 0) {
              supabase
                .from("messages")
                .select("id", { count: "exact", head: true })
                .in("conversation_id", convs.map(c => c.id))
                .eq("read", false)
                .neq("sender_id", data.user!.id)
                .then(({ count }) => {
                  if (count) setUnreadCount(count)
                })
            }
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

  const isAdmin = user && ADMIN_EMAILS.includes(user.email)
  const isEmployer = user?.role === "employer"
  const isCandidate = !isEmployer && !isAdmin

  function linkCls(href: string) {
    const active = pathname === href || (href !== "/" && pathname?.startsWith(href))
    const base = "text-sm transition-colors relative"
    if (isDark) return `${base} ${active ? "text-white font-medium" : "text-gray-400 hover:text-white"}`
    return `${base} ${active ? "text-gray-950 font-medium" : "text-gray-500 hover:text-gray-950"}`
  }

  const msgBadge = unreadCount > 0 ? (
    <span className="absolute -top-1.5 -right-3 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
      {unreadCount > 9 ? "9+" : unreadCount}
    </span>
  ) : null

  return (
    <header className={bg}>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Left: logo + links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Hyr
          </Link>

          {checked && (
            <div className="hidden sm:flex items-center gap-5">
              {/* Candidate links */}
              {user && isCandidate && (
                <>
                  <Link href="/dashboard" className={linkCls("/dashboard")}>Dashboard</Link>
                  <Link href="/assessment" className={linkCls("/assessment")}>Assess</Link>
                </>
              )}

              {/* Employer links */}
              {user && isEmployer && (
                <>
                  <Link href="/employers" className={linkCls("/employers")}>Candidates</Link>
                  <Link href="/pricing" className={linkCls("/pricing")}>Pricing</Link>
                </>
              )}

              {/* Admin links */}
              {isAdmin && (
                <>
                  <Link href="/admin" className={linkCls("/admin")}>Dashboard</Link>
                  <Link href="/admin/employers" className={linkCls("/admin/employers")}>Employers</Link>
                  <Link href="/admin/support" className={linkCls("/admin/support")}>Support</Link>
                </>
              )}

              {/* Messages — visible to candidates and employers */}
              {user && !isAdmin && (
                <Link href="/messages" className={linkCls("/messages")}>
                  Messages{msgBadge}
                </Link>
              )}

              {/* Logged-out: show employer CTA */}
              {!user && (
                <>
                  <Link href="/employers" className={linkCls("/employers")}>For Employers</Link>
                  <Link href="/pricing" className={linkCls("/pricing")}>Pricing</Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: user info + sign out */}
        <div className="flex items-center gap-3">
          {!checked ? (
            <div className="h-8 w-20" />
          ) : user ? (
            <>
              <span className={`text-xs hidden sm:inline ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                {user.name.split(" ")[0]}
              </span>
              {isEmployer && (
                <span className={`text-[10px] hidden sm:inline px-1.5 py-0.5 rounded font-medium ${isDark ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-700"}`}>
                  Employer
                </span>
              )}
              {isAdmin && (
                <span className={`text-[10px] hidden sm:inline px-1.5 py-0.5 rounded font-medium ${isDark ? "bg-amber-900/50 text-amber-300" : "bg-amber-100 text-amber-700"}`}>
                  Admin
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                className={isDark
                  ? "text-white border-gray-700 bg-transparent hover:bg-gray-800"
                  : "text-gray-900 border-gray-300 hover:bg-gray-100"
                }
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth">
                <Button
                  variant={isDark ? "outline" : "default"}
                  size="sm"
                  className={isDark
                    ? "text-white border-gray-700 bg-transparent hover:bg-gray-800"
                    : ""
                  }
                >
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile bottom nav */}
        {checked && user && (
          <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around py-2 px-2 z-40">
            {/* Candidate mobile nav */}
            {isCandidate && (
              <>
                <MobileNavItem href="/dashboard" icon="dashboard" label="Home" active={pathname === "/dashboard"} />
                <MobileNavItem href="/assessment" icon="assess" label="Assess" active={pathname === "/assessment"} />
              </>
            )}

            {/* Employer mobile nav */}
            {isEmployer && (
              <MobileNavItem href="/employers" icon="candidates" label="Candidates" active={pathname === "/employers"} />
            )}

            {/* Admin mobile nav */}
            {isAdmin && (
              <>
                <MobileNavItem href="/admin" icon="admin" label="Dashboard" active={pathname === "/admin"} />
                <MobileNavItem href="/admin/employers" icon="building" label="Employers" active={pathname?.startsWith("/admin/employers") || false} />
                <MobileNavItem href="/admin/support" icon="support" label="Support" active={pathname?.startsWith("/admin/support") || false} />
              </>
            )}

            {/* Messages — candidates and employers only */}
            {!isAdmin && (
              <MobileNavItem href="/messages" icon="messages" label="Messages" active={pathname?.startsWith("/messages") || false} badge={unreadCount} />
            )}
          </div>
        )}
      </nav>
    </header>
  )
}

function MobileNavItem({ href, icon, label, active, badge }: {
  href: string
  icon: string
  label: string
  active: boolean
  badge?: number
}) {
  const icons: Record<string, React.ReactNode> = {
    dashboard: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>,
    assess: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>,
    candidates: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    messages: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    admin: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
    building: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h.01"/><path d="M9 12h.01"/><path d="M9 15h.01"/><path d="M9 18h.01"/></svg>,
    support: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/></svg>,
  }

  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 text-xs relative px-2 ${active ? "text-gray-950 font-medium" : "text-gray-400"}`}
    >
      {icons[icon]}
      {label}
      {(badge ?? 0) > 0 && (
        <span className="absolute -top-1 right-0 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
          {(badge ?? 0) > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  )
}
