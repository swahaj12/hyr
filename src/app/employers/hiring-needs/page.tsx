"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { TRACK_LABELS } from "@/lib/talent-matching"
import { Navbar } from "@/components/navbar"
import { PageLoading } from "@/components/loading"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type HiringNeed = {
  id: string
  title: string
  track: string
  required_skills: string[]
  min_level: string
  urgency: string
  status: string
  matches_count: number
  near_matches_count: number
  notified_count: number
  created_at: string
  expires_at: string
}

const URGENCY_LABELS: Record<string, string> = {
  immediate: "Hiring Now",
  "2weeks": "Within 2 Weeks",
  month: "Within a Month",
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paused: "bg-amber-50 text-amber-700 border-amber-200",
  filled: "bg-blue-50 text-blue-700 border-blue-200",
  expired: "bg-gray-50 text-gray-500 border-gray-200",
}

export default function HiringNeedsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [needs, setNeeds] = useState<HiringNeed[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.user_metadata?.role !== "employer") {
        router.push("/auth")
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const res = await fetch("/api/hiring-needs", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (res.ok) {
        const { needs: data } = await res.json()
        setNeeds(data)
      }
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <><Navbar /><PageLoading /></>

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Hiring Needs</h1>
            <p className="text-muted-foreground">Post requirements and let Hyr find matching candidates</p>
          </div>
          <Link href="/employers/hiring-needs/new">
            <Button className="h-11 px-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
              Post a Hiring Need
            </Button>
          </Link>
        </div>

        {needs.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">No hiring needs posted yet</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-md mx-auto">
                  Post your first hiring requirement. Hyr will instantly match verified candidates and notify near-matches to prepare.
                </p>
              </div>
              <Link href="/employers/hiring-needs/new">
                <Button>Post Your First Need</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {needs.map(need => {
              const isExpired = new Date(need.expires_at) < new Date()
              const effectiveStatus = isExpired && need.status === "active" ? "expired" : need.status
              return (
                <Link key={need.id} href={`/employers/hiring-needs/${need.id}`} className="block group">
                  <Card className="hover:shadow-md transition-all group-hover:-translate-y-0.5 group-hover:border-gray-300">
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg">{need.title}</h3>
                            <Badge className={`text-[10px] ${STATUS_STYLES[effectiveStatus] || STATUS_STYLES.active}`}>
                              {effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                            <span>{TRACK_LABELS[need.track] || need.track}</span>
                            <span>&middot;</span>
                            <span>{need.min_level.charAt(0).toUpperCase() + need.min_level.slice(1)}+</span>
                            <span>&middot;</span>
                            <span>{URGENCY_LABELS[need.urgency] || need.urgency}</span>
                          </div>
                          <div className="flex gap-1.5 mt-3 flex-wrap">
                            {need.required_skills.slice(0, 5).map(s => (
                              <span key={s} className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 text-gray-600 bg-gray-50">
                                {s}
                              </span>
                            ))}
                            {need.required_skills.length > 5 && (
                              <span className="text-[10px] px-2 py-0.5 text-gray-400">+{need.required_skills.length - 5}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-emerald-600">{need.matches_count}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ready</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{need.near_matches_count}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Almost</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-amber-600">{need.notified_count}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Notified</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Posted {new Date(need.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        <span>Expires {new Date(need.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
