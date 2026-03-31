"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon"
import { useScroll } from "@/components/ui/use-scroll"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/lib/use-user"

type NavLink = { label: string; href: string; badge?: number }

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const scrolled = useScroll(10)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<{ email: string; name: string; role: UserRole; id: string } | null>(null)
  const [checked, setChecked] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const meta = data.user.user_metadata || {}
        setUser({
          id: data.user.id,
          email: data.user.email || "",
          name: meta.full_name || data.user.email || "",
          role: (meta.role as UserRole) || "candidate",
        })

        // Check admin status via server-side endpoint
        try {
          const session = await supabase.auth.getSession()
          if (session.data.session?.access_token) {
            const res = await fetch("/api/admin/verify", {
              headers: { Authorization: `Bearer ${session.data.session.access_token}` },
            })
            if (res.ok) {
              const { isAdmin: admin } = await res.json()
              setIsAdmin(admin)
            }
          }
        } catch { /* fallback: not admin */ }

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

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  useEffect(() => { setOpen(false) }, [pathname])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/")
  }

  const isEmployer = user?.role === "employer"
  const isCandidate = user && !isEmployer && !isAdmin

  const links: NavLink[] = []
  if (user && isCandidate) {
    links.push({ label: "Dashboard", href: "/dashboard" })
    links.push({ label: "Assess", href: "/assessment" })
    links.push({ label: "Messages", href: "/messages", badge: unreadCount })
  } else if (user && isEmployer) {
    links.push({ label: "Candidates", href: "/employers" })
    links.push({ label: "Hiring Needs", href: "/employers/hiring-needs" })
    links.push({ label: "Pipeline", href: "/employers/pipeline" })
    links.push({ label: "Messages", href: "/messages", badge: unreadCount })
  } else if (isAdmin) {
    links.push({ label: "Dashboard", href: "/admin" })
    links.push({ label: "Employers", href: "/admin/employers" })
    links.push({ label: "Support", href: "/admin/support" })
  } else if (!user && checked) {
    links.push({ label: "For Employers", href: "/for-employers" })
    links.push({ label: "Talent Market", href: "/talent-market" })
  }

  function isActiveFn(href: string) {
    return pathname === href || (href !== "/" && pathname?.startsWith(href))
  }

  const roleBadge = isAdmin
    ? <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">Admin</span>
    : isEmployer
      ? <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">Employer</span>
      : null

  return (
    <header
      className={cn(
        "sticky top-0 z-50 mx-auto w-full max-w-6xl md:rounded-xl md:transition-all md:duration-300 md:ease-out",
        scrolled && !open
          ? "md:top-3 md:max-w-5xl"
          : "md:top-0 md:max-w-6xl",
      )}
    >
      <div
        className={cn(
          "transition-all duration-300 ease-out md:rounded-xl",
          scrolled && !open
            ? "bg-gray-950/80 backdrop-blur-xl shadow-lg shadow-black/10 md:border md:border-white/10"
            : "bg-gray-950",
        )}
      >
        <nav
          className={cn(
            "flex h-14 w-full items-center justify-between px-4 md:h-12 transition-all duration-300",
            scrolled ? "md:px-3" : "md:px-4",
          )}
        >
          {/* Logo */}
          <Link href="/" className="text-lg font-bold tracking-tight text-white">
            Hyr
          </Link>

          {/* Desktop links */}
          {checked && (
            <div className="hidden items-center gap-1 md:flex">
              {links.map((link) => {
                const active = isActiveFn(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative px-3 py-1.5 rounded-lg text-sm transition-colors",
                      active
                        ? "bg-white/15 text-white font-medium"
                        : "text-gray-400 hover:text-white hover:bg-white/10",
                    )}
                  >
                    {link.label}
                    {(link.badge ?? 0) > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                        {(link.badge ?? 0) > 9 ? "9+" : link.badge}
                      </span>
                    )}
                  </Link>
                )
              })}

              <div className="w-px h-5 bg-white/15 mx-2" />

              {/* Dark mode toggle */}
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="px-2 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  title={theme === "dark" ? "Light mode" : "Dark mode"}
                >
                  {theme === "dark" ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                  )}
                </button>
              )}

              {user ? (
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-gray-400">{user.name.split(" ")[0]}</span>
                  {roleBadge}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-white border-white/20 bg-transparent hover:bg-white/10 hover:text-white text-xs"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-white border-white/20 bg-transparent hover:bg-white/10 hover:text-white"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/assessment">
                    <Button size="sm" className="bg-white text-gray-950 hover:bg-gray-200">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Mobile toggle */}
          <Button
            size="icon"
            variant="outline"
            onClick={() => setOpen(!open)}
            className="md:hidden text-white border-white/20 bg-transparent hover:bg-white/10"
          >
            <MenuToggleIcon open={open} className="size-5" duration={300} />
          </Button>
        </nav>
      </div>

      {/* Mobile full-screen menu */}
      <div
        className={cn(
          "fixed top-14 right-0 bottom-0 left-0 z-50 flex flex-col overflow-hidden md:hidden",
          "bg-gray-950/98 backdrop-blur-xl",
          open ? "block" : "hidden",
        )}
      >
        <div
          data-slot={open ? "open" : "closed"}
          className={cn(
            "data-[slot=open]:animate-in data-[slot=open]:zoom-in-95 data-[slot=closed]:animate-out data-[slot=closed]:zoom-out-95 ease-out",
            "flex h-full w-full flex-col justify-between gap-y-2 p-4",
          )}
        >
          <div className="grid gap-y-1">
            {links.map((link) => {
              const active = isActiveFn(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center justify-start px-3 py-2.5 rounded-lg text-base transition-colors",
                    active
                      ? "bg-white/15 text-white font-medium"
                      : "text-gray-400 hover:text-white hover:bg-white/10",
                  )}
                >
                  {link.label}
                  {(link.badge ?? 0) > 0 && (
                    <span className="ml-2 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {(link.badge ?? 0) > 9 ? "9+" : link.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          <div className="flex flex-col gap-3 pb-safe">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  {roleBadge}
                </div>
                <Button
                  variant="outline"
                  className="w-full text-white border-white/20 bg-transparent hover:bg-white/10 hover:text-white"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth">
                  <Button
                    variant="outline"
                    className="w-full text-white border-white/20 bg-transparent hover:bg-white/10 hover:text-white"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/assessment">
                  <Button className="w-full bg-white text-gray-950 hover:bg-gray-200">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
