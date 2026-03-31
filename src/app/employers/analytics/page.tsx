"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageTransition, FadeIn, StaggerList, staggerItem } from "@/components/motion-primitives"
import { motion } from "motion/react"

type Analytics = {
  summary: {
    activeNeeds: number; totalNeeds: number; totalMatches: number; totalNearMatches: number
    pipelineTotal: number; hired: number; shortlisted: number
    profileViewsTotal: number; conversationsTotal: number; messagesTotal: number; unreadMessages: number
  }
  funnel: { stage: string; count: number }[]
  messaging: { sent: number; received: number; responseRate: number; avgTimeToFirstMessage: number }
  activity: { recentViews: number; recentMessages: number; weeklyActivity: { week: string; views: number; messages: number; pipeline: number }[] }
}

const STAGE_LABELS: Record<string, string> = {
  discovered: "Discovered", contacted: "Contacted", interviewing: "Interviewing",
  offered: "Offered", hired: "Hired", rejected: "Passed",
}

const STAGE_COLORS: Record<string, string> = {
  discovered: "bg-gray-200 dark:bg-gray-700", contacted: "bg-blue-400", interviewing: "bg-violet-400",
  offered: "bg-amber-400", hired: "bg-emerald-400", rejected: "bg-red-300",
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Analytics | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth"); return }
      if (user.user_metadata?.role !== "employer") { router.push("/dashboard"); return }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) { router.push("/auth"); return }

      try {
        const res = await fetch("/api/employer-analytics", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (res.ok) setData(await res.json())
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
              <div className="grid grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />)}
              </div>
            </div>
          </div>
        </main>
      </>
    )
  }

  if (!data) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-16">
          <div className="max-w-6xl mx-auto px-4 text-center py-20">
            <p className="text-muted-foreground">Could not load analytics.</p>
          </div>
        </main>
      </>
    )
  }

  const { summary: s, funnel, messaging: m, activity: a } = data
  const maxFunnel = Math.max(...funnel.map(f => f.count), 1)
  const maxWeekly = Math.max(...a.weeklyActivity.map(w => w.views + w.messages + w.pipeline), 1)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-16">
        <PageTransition>
          <div className="max-w-6xl mx-auto px-4">
            <FadeIn>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hiring Analytics</h1>
                  <p className="text-muted-foreground mt-1">Track your hiring performance and engagement</p>
                </div>
                <div className="flex gap-2">
                  <Link href="/employers"><Button variant="outline" size="sm">Candidates</Button></Link>
                  <Link href="/employers/pipeline"><Button variant="outline" size="sm">Pipeline</Button></Link>
                </div>
              </div>
            </FadeIn>

            <StaggerList stagger={0.08} className="space-y-6">
              {/* KPI Cards */}
              <motion.div variants={staggerItem} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Active Needs", value: s.activeNeeds, sub: `${s.totalNeeds} total`, color: "text-blue-600" },
                  { label: "Matches Found", value: s.totalMatches, sub: `${s.totalNearMatches} near-matches`, color: "text-emerald-600" },
                  { label: "In Pipeline", value: s.pipelineTotal, sub: `${s.hired} hired`, color: "text-violet-600" },
                  { label: "Profile Views", value: s.profileViewsTotal, sub: `${a.recentViews} last 30d`, color: "text-amber-600" },
                  { label: "Shortlisted", value: s.shortlisted, sub: "candidates saved", color: "text-pink-600" },
                  { label: "Conversations", value: s.conversationsTotal, sub: `${s.unreadMessages} unread`, color: "text-blue-600" },
                  { label: "Response Rate", value: `${m.responseRate}%`, sub: `${m.sent} sent / ${m.received} received`, color: "text-emerald-600" },
                  { label: "Time to Contact", value: m.avgTimeToFirstMessage > 0 ? `${m.avgTimeToFirstMessage}d` : "—", sub: "avg days to first message", color: "text-orange-600" },
                ].map((kpi, i) => (
                  <Card key={i}>
                    <CardContent className="pt-4 pb-4">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{kpi.label}</p>
                      <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.sub}</p>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>

              {/* Pipeline Funnel */}
              <motion.div variants={staggerItem}>
                <Card>
                  <CardHeader>
                    <CardTitle>Hiring Funnel</CardTitle>
                    <CardDescription>Candidate progression through your pipeline</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {funnel.map(f => (
                        <div key={f.stage} className="flex items-center gap-3">
                          <span className="text-xs font-medium w-24 text-right text-muted-foreground">
                            {STAGE_LABELS[f.stage] || f.stage}
                          </span>
                          <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative">
                            <div
                              className={`h-full rounded-lg transition-all duration-700 ${STAGE_COLORS[f.stage] || "bg-gray-300"}`}
                              style={{ width: `${Math.max((f.count / maxFunnel) * 100, f.count > 0 ? 8 : 0)}%` }}
                            />
                            {f.count > 0 && (
                              <span className="absolute inset-0 flex items-center px-3 text-xs font-semibold text-gray-900 dark:text-white">
                                {f.count}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {s.pipelineTotal === 0 && (
                      <p className="text-sm text-muted-foreground text-center mt-4">
                        No candidates in your pipeline yet. <Link href="/employers" className="text-blue-600 hover:underline">Browse candidates</Link>
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Weekly Activity */}
              <motion.div variants={staggerItem}>
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Activity</CardTitle>
                    <CardDescription>Your engagement over the last 8 weeks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2 h-40">
                      {a.weeklyActivity.map((w, i) => {
                        const total = w.views + w.messages + w.pipeline
                        const height = total > 0 ? Math.max((total / maxWeekly) * 100, 8) : 4
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[10px] text-muted-foreground font-medium">{total > 0 ? total : ""}</span>
                            <div className="w-full flex flex-col-reverse rounded-t-md overflow-hidden" style={{ height: `${height}%` }}>
                              {w.views > 0 && <div className="bg-blue-400" style={{ flex: w.views }} />}
                              {w.messages > 0 && <div className="bg-emerald-400" style={{ flex: w.messages }} />}
                              {w.pipeline > 0 && <div className="bg-violet-400" style={{ flex: w.pipeline }} />}
                              {total === 0 && <div className="bg-gray-200 dark:bg-gray-700 h-full" />}
                            </div>
                            <span className="text-[9px] text-muted-foreground">{w.week}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-4">
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-400 rounded-sm" /><span className="text-[11px] text-muted-foreground">Views</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-400 rounded-sm" /><span className="text-[11px] text-muted-foreground">Messages</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-violet-400 rounded-sm" /><span className="text-[11px] text-muted-foreground">Pipeline</span></div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Actions */}
              <motion.div variants={staggerItem}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Link href="/employers/hiring-needs/new">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="pt-4 pb-4 text-center">
                        <span className="text-2xl">📋</span>
                        <p className="font-semibold text-sm mt-2">Post Hiring Need</p>
                        <p className="text-xs text-muted-foreground">Get matched with candidates</p>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href="/employers">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="pt-4 pb-4 text-center">
                        <span className="text-2xl">🔍</span>
                        <p className="font-semibold text-sm mt-2">Browse Candidates</p>
                        <p className="text-xs text-muted-foreground">Find verified engineers</p>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href="/employers/pipeline">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="pt-4 pb-4 text-center">
                        <span className="text-2xl">📊</span>
                        <p className="font-semibold text-sm mt-2">Manage Pipeline</p>
                        <p className="text-xs text-muted-foreground">Track hiring progress</p>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </motion.div>
            </StaggerList>
          </div>
        </PageTransition>
      </main>
    </>
  )
}
