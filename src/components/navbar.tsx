"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button, buttonVariants } from "@/components/ui/button"
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon"
import { useScroll } from "@/components/ui/use-scroll"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/lib/use-user"

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "admin@hyr.pk,chkk@hyr.pk").split(",").map(e => e.trim())

type NavLink = { label: string; href: string; badge?: number }

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const scrolled = useScroll(10)
  const [open, setOpen] = useState(false)
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

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  // Close mobile menu on navigation
  useEffect(() => { setOpen(false) }, [pathname])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/")
  }

  const isAdmin = user && ADMIN_EMAILS.includes(user.email)
  const isEmployer = user?.role === "employer"
  const isCandidate = user && !isEmployer && !isAdmin

  const links: NavLink[] = []
  if (user && isCandidate) {
    links.push({ label: "Dashboard", href: "/dashboard" })
    links.push({ label: "Assess", href: "/assessment" })
    links.push({ label: "Messages", href: "/messages", badge: unreadCount })
  } else if (user && isEmployer) {
    links.push({ label: "Candidates", href: "/employers" })
    links.push({ label: "Messages", href: "/messages", badge: unreadCount })
    links.push({ label: "Pricing", href: "/pricing" })
  } else if (isAdmin) {
    links.push({ label: "Dashboard", href: "/admin" })
    links.push({ label: "Employers", href: "/admin/employers" })
    links.push({ label: "Support", href: "/admin/support" })
  } else if (!user && checked) {
    links.push({ label: "For Employers", href: "/employers" })
    links.push({ label: "Pricing", href: "/pricing" })
  }

  function isActive(href: string) {
    return pathname === href || (href !== "/" && pathname?.startsWith(href))
  }

  const roleBadge = isAdmin
    ? <span className="hidden md:inline text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-100 text-amber-700">Admin</span>
    : isEmployer
      ? <span className="hidden md:inline text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-100 text-blue-700">Employer</span>
      : null

  return (
    <header
      className={cn(
        "sticky top-0 z-50 mx-auto w-full max-w-6xl border-b border-transparent md:rounded-md md:border md:transition-all md:ease-out",
        {
          "bg-background/95 supports-[backdrop-filter]:bg-background/50 border-border backdrop-blur-lg md:top-4 md:max-w-5xl md:shadow":
            scrolled && !open,
          "bg-background": !scrolled && !open,
          "bg-background/95": open,
        },
      )}
    >
      <nav
        className={cn(
          "flex h-14 w-full items-center justify-between px-4 md:h-12 md:transition-all md:ease-out",
          { "md:px-3": scrolled },
        )}
      >
        {/* Logo */}
        <Link href="/" className="text-lg font-bold tracking-tight">
          Hyr
        </Link>

        {/* Desktop links */}
        {checked && (
          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  buttonVariants({ variant: isActive(link.href) ? "secondary" : "ghost", size: "sm" }),
                  "relative text-sm",
                )}
              >
                {link.label}
                {(link.badge ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                    {(link.badge ?? 0) > 9 ? "9+" : link.badge}
                  </span>
                )}
              </Link>
            ))}

            <div className="w-px h-5 bg-border mx-1" />

            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{user.name.split(" ")[0]}</span>
                {roleBadge}
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth">
                  <Button variant="outline" size="sm">Sign In</Button>
                </Link>
                <Link href="/assessment">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Mobile toggle */}
        <Button size="icon" variant="outline" onClick={() => setOpen(!open)} className="md:hidden">
          <MenuToggleIcon open={open} className="size-5" duration={300} />
        </Button>
      </nav>

      {/* Mobile full-screen menu */}
      <div
        className={cn(
          "bg-background/95 fixed top-14 right-0 bottom-0 left-0 z-50 flex flex-col overflow-hidden border-y md:hidden",
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
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  buttonVariants({
                    variant: isActive(link.href) ? "secondary" : "ghost",
                    className: "justify-start text-base relative",
                  }),
                )}
              >
                {link.label}
                {(link.badge ?? 0) > 0 && (
                  <span className="ml-2 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {(link.badge ?? 0) > 9 ? "9+" : link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-2 pb-safe">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-gray-950 text-white flex items-center justify-center text-sm font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  {roleBadge}
                </div>
                <Button variant="outline" className="w-full" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
                <Link href="/assessment">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
