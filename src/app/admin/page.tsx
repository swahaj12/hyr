"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { type DomainScore, DOMAIN_LABELS } from "@/lib/scoring"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/navbar"
import { PageLoading } from "@/components/loading"

type CandidateRow = {
  id: string
  candidate_id: string
  total_score: number
  total_questions: number
  overall_level: string
  domain_scores: DomainScore[]
  created_at: string
  candidate_email: string
  candidate_name: string
  self_track: string
  tab_switches: number
  profile_visible: boolean
}

type EmployerRow = {
  id: string
  user_id: string
  company_name: string
  company_website: string | null
  hiring_tracks: string[]
  hiring_description: string | null
  status: string
  created_at: string
}

type PlatformStats = {
  conversations: { total: number; active: number; totalMessages: number; avgMessagesPerConv: number }
  support: { total: number; open: number; resolved: number }
}

type AdminTab = "overview" | "candidates" | "employers"

const TRACK_LABELS: Record<string, string> = {
  devops: "DevOps",
  frontend: "Frontend",
  backend: "Backend",
  qa: "QA",
}

const LEVEL_COLORS: Record<string, string> = {
  Senior: "bg-purple-500",
  "Mid-Level": "bg-blue-500",
  Junior: "bg-emerald-500",
  "Entry-Level": "bg-amber-500",
  Beginner: "bg-gray-400",
}

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [activeTab, setActiveTab] = useState<AdminTab>("overview")
  const [candidates, setCandidates] = useState<CandidateRow[]>([])
  const [employers, setEmployers] = useState<EmployerRow[]>([])
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [search, setSearch] = useState("")
  const [levelFilter, setLevelFilter] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/admin/login")
          return
        }

        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token || ""

        // Verify admin status server-side
        try {
          const verifyRes = await fetch("/api/admin/verify", {
            headers: { Authorization: `Bearer ${token}` },
          })
          const { isAdmin } = await verifyRes.json()
          if (!isAdmin) {
            setAuthorized(false)
            setLoading(false)
            return
          }
        } catch {
          setAuthorized(false)
          setLoading(false)
          return
        }
        setAuthorized(true)

        const [empRes, statsRes] = await Promise.all([
          fetch("/api/admin/employers", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
          fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        ])

        if (empRes?.ok) {
          const { employers: empData } = await empRes.json()
          if (empData) setEmployers(empData as EmployerRow[])
        }

        if (statsRes?.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }

        const { data, error: fetchError } = await supabase
          .from("assessments")
          .select("*")
          .order("created_at", { ascending: false })

        if (fetchError) {
          setError("Could not load assessments.")
        } else if (data) {
          const rows: CandidateRow[] = data.map((a: Record<string, unknown>) => ({
            id: a.id as string,
            candidate_id: a.candidate_id as string,
            total_score: a.total_score as number,
            total_questions: a.total_questions as number,
            overall_level: a.overall_level as string,
            domain_scores: a.domain_scores as DomainScore[],
            created_at: a.created_at as string,
            candidate_email: (a.candidate_email as string) || "",
            candidate_name: (a.candidate_name as string) || "",
            self_track: (a.self_track as string) || "devops",
            tab_switches: (a.tab_switches as number) || 0,
            profile_visible: a.profile_visible !== false,
          }))
          setCandidates(rows)
        }
      } catch {
        setError("Something went wrong. Please refresh.")
      }
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return <><Navbar /><PageLoading /></>
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-lg font-semibold">Access Denied</p>
            <p className="text-sm text-muted-foreground">You don&apos;t have admin access. Sign in with an authorized admin email.</p>
            <div className="flex gap-2 justify-center">
              <Link href="/admin/login"><Button>Admin Sign In</Button></Link>
              <Link href="/dashboard"><Button variant="outline">Go to Dashboard</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filtered = candidates.filter((c) => {
    const matchSearch = search === "" ||
      c.candidate_email.toLowerCase().includes(search.toLowerCase()) ||
      c.candidate_name.toLowerCase().includes(search.toLowerCase())
    const matchLevel = levelFilter === "" || c.overall_level.includes(levelFilter)
    return matchSearch && matchLevel
  })

  const levels = [...new Set(candidates.map((c) => c.overall_level))]
  const pendingEmployers = employers.filter(e => e.status === "pending")

  // Computed analytics
  const uniqueCandidates = new Set(candidates.map(c => c.candidate_id)).size
  const avgScore = candidates.length > 0
    ? Math.round(candidates.reduce((s, c) => s + (c.total_score / c.total_questions) * 100, 0) / candidates.length)
    : 0
  const publicProfiles = new Set(candidates.filter(c => c.profile_visible).map(c => c.candidate_id)).size

  const trackCounts: Record<string, number> = {}
  const levelCounts: Record<string, number> = {}
  const dailyCounts: Record<string, number> = {}
  const domainTotals: Record<string, { totalPct: number; count: number }> = {}

  let flaggedAssessments = 0
  let totalTabSwitches = 0

  for (const c of candidates) {
    trackCounts[c.self_track] = (trackCounts[c.self_track] || 0) + 1
    levelCounts[c.overall_level] = (levelCounts[c.overall_level] || 0) + 1

    const day = new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    dailyCounts[day] = (dailyCounts[day] || 0) + 1

    if (c.tab_switches > 3) flaggedAssessments++
    totalTabSwitches += c.tab_switches

    for (const ds of (c.domain_scores || [])) {
      if (!domainTotals[ds.domain]) domainTotals[ds.domain] = { totalPct: 0, count: 0 }
      domainTotals[ds.domain].totalPct += ds.pct
      domainTotals[ds.domain].count++
    }
  }

  const sortedTracks = Object.entries(trackCounts).sort((a, b) => b[1] - a[1])
  const maxTrackCount = Math.max(...Object.values(trackCounts), 1)

  const sortedLevels = Object.entries(levelCounts).sort((a, b) => b[1] - a[1])
  const maxLevelCount = Math.max(...Object.values(levelCounts), 1)

  const recentDays = Object.entries(dailyCounts).slice(-14)
  const maxDayCount = Math.max(...recentDays.map(d => d[1]), 1)

  const domainPerformance = Object.entries(domainTotals)
    .map(([domain, { totalPct, count }]) => ({
      domain,
      label: DOMAIN_LABELS[domain] || domain,
      avgPct: Math.round(totalPct / count),
    }))
    .sort((a, b) => b.avgPct - a.avgPct)

  // Employer analytics
  const activeEmployers = employers.filter(e => e.status === "active").length
  const rejectedEmployers = employers.filter(e => e.status === "rejected").length

  const hiringTrackDemand: Record<string, number> = {}
  for (const emp of employers.filter(e => e.status === "active")) {
    for (const t of (emp.hiring_tracks || [])) {
      hiringTrackDemand[t] = (hiringTrackDemand[t] || 0) + 1
    }
  }
  const sortedHiringDemand = Object.entries(hiringTrackDemand).sort((a, b) => b[1] - a[1])
  const maxHiringCount = Math.max(...Object.values(hiringTrackDemand), 1)

  const tabs: { key: AdminTab; label: string; badge?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "candidates", label: `Candidates (${uniqueCandidates})` },
    { key: "employers", label: `Employers (${employers.length})`, badge: pendingEmployers.length },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6 pb-20 sm:pb-8">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">Platform overview and management</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        {/* Tab Switcher */}
        <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit">
          {tabs.map(tab => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.key)}
              className="relative"
            >
              {tab.label}
              {(tab.badge ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {tab.badge}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* ==================== OVERVIEW TAB ==================== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Top KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Total Assessments", value: candidates.length, color: "text-gray-950 dark:text-white" },
                { label: "Unique Candidates", value: uniqueCandidates, color: "text-blue-600" },
                { label: "Avg Score", value: `${avgScore}%`, color: "text-emerald-600" },
                { label: "Active Employers", value: activeEmployers, color: "text-purple-600" },
                { label: "Pending Review", value: pendingEmployers.length, color: pendingEmployers.length > 0 ? "text-amber-600" : "text-gray-400" },
                { label: "Public Profiles", value: publicProfiles, color: "text-cyan-600" },
              ].map(stat => (
                <Card key={stat.label}>
                  <CardContent className="pt-4 pb-3 text-center">
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Track + Level Distribution */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Candidate Track Distribution</CardTitle>
                  <CardDescription className="text-xs">Where candidates are assessing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5">
                    {sortedTracks.map(([track, count]) => (
                      <div key={track} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">{TRACK_LABELS[track] || track}</span>
                          <span className="text-muted-foreground">{count} ({Math.round((count / candidates.length) * 100)}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(count / maxTrackCount) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                    {sortedTracks.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No data yet</p>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Level Distribution</CardTitle>
                  <CardDescription className="text-xs">Scored proficiency levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5">
                    {sortedLevels.map(([level, count]) => (
                      <div key={level} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${LEVEL_COLORS[level] || "bg-gray-400"}`} />
                            <span className="font-medium">{level}</span>
                          </div>
                          <span className="text-muted-foreground">{count} ({Math.round((count / candidates.length) * 100)}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${LEVEL_COLORS[level] || "bg-gray-400"}`} style={{ width: `${(count / maxLevelCount) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                    {sortedLevels.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No data yet</p>}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Chart + Supply vs Demand */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Assessment Activity (last 14 days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-[2px] h-28">
                    {recentDays.map(([day, count]) => (
                      <div key={day} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[8px] text-muted-foreground font-medium">{count}</span>
                        <div
                          className="w-full bg-emerald-500 rounded-sm min-h-[2px]"
                          style={{ height: `${(count / maxDayCount) * 80}px` }}
                        />
                        <span className="text-[8px] text-muted-foreground">{day.split(" ")[0]}</span>
                      </div>
                    ))}
                    {recentDays.length === 0 && <p className="text-xs text-muted-foreground text-center w-full py-8">No recent activity</p>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Hiring Demand vs Supply</CardTitle>
                  <CardDescription className="text-xs">Employer demand vs candidate supply by track</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.keys(TRACK_LABELS).map(track => {
                      const supply = trackCounts[track] || 0
                      const demand = hiringTrackDemand[track] || 0
                      const maxVal = Math.max(supply, demand, 1)
                      return (
                        <div key={track} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium">{TRACK_LABELS[track]}</span>
                            <span className="text-muted-foreground">
                              {supply} candidate{supply !== 1 ? "s" : ""} / {demand} employer{demand !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex gap-1 h-2">
                            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(supply / maxVal) * 100}%` }} />
                            </div>
                            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-400 rounded-full" style={{ width: `${(demand / maxVal) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex gap-4 mt-3 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400" /> Supply</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-400" /> Demand</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trust Metrics + Engagement */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Trust Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Clean assessments</span>
                      <span className="text-sm font-semibold text-emerald-600">
                        {candidates.length > 0 ? Math.round(((candidates.length - flaggedAssessments) / candidates.length) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Flagged (3+ tab switches)</span>
                      <span className="text-sm font-semibold text-amber-600">{flaggedAssessments}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Avg tab switches</span>
                      <span className="text-sm font-semibold">
                        {candidates.length > 0 ? (totalTabSwitches / candidates.length).toFixed(1) : "0"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Messaging Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Total conversations</span>
                      <span className="text-sm font-semibold">{stats?.conversations.total ?? "—"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Active conversations</span>
                      <span className="text-sm font-semibold">{stats?.conversations.active ?? "—"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Total messages</span>
                      <span className="text-sm font-semibold">{stats?.conversations.totalMessages ?? "—"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Avg msgs / conversation</span>
                      <span className="text-sm font-semibold">{stats?.conversations.avgMessagesPerConv ?? "—"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Support Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Open tickets</span>
                      <span className={`text-sm font-semibold ${(stats?.support.open ?? 0) > 0 ? "text-amber-600" : ""}`}>
                        {stats?.support.open ?? "—"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Resolved tickets</span>
                      <span className="text-sm font-semibold text-emerald-600">{stats?.support.resolved ?? "—"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Total tickets</span>
                      <span className="text-sm font-semibold">{stats?.support.total ?? "—"}</span>
                    </div>
                  </div>
                  <Link href="/admin/support" className="block mt-3">
                    <Button variant="outline" size="sm" className="w-full text-xs">View Support Inbox</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Quick Links */}
            <div className="grid sm:grid-cols-3 gap-3">
              <Link href="/admin/employers">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-5 pb-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h.01"/><path d="M9 12h.01"/><path d="M9 15h.01"/><path d="M9 18h.01"/></svg>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Manage Employers</p>
                      <p className="text-xs text-muted-foreground">Review and activate accounts</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/admin/support">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-5 pb-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Support & Oversight</p>
                      <p className="text-xs text-muted-foreground">Tickets and conversation monitoring</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Card className="border-dashed">
                <CardContent className="pt-5 pb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-400">More Coming</p>
                    <p className="text-xs text-muted-foreground">Reports, exports, settings</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ==================== CANDIDATES TAB ==================== */}
        {activeTab === "candidates" && (
          <div className="space-y-6">
            {/* Domain Performance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Domain Performance (all candidates)</CardTitle>
                <CardDescription className="text-xs">Average scores across all assessed domains — identifying talent pool strengths and gaps</CardDescription>
              </CardHeader>
              <CardContent>
                {domainPerformance.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No domain data yet</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {domainPerformance.map(d => (
                      <div key={d.domain} className="rounded-lg border p-2.5 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-medium truncate">{d.label}</span>
                          <span className={`text-[11px] font-bold ${d.avgPct >= 70 ? "text-emerald-600" : d.avgPct >= 45 ? "text-amber-600" : "text-red-500"}`}>
                            {d.avgPct}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${d.avgPct >= 70 ? "bg-emerald-500" : d.avgPct >= 45 ? "bg-amber-500" : "bg-red-400"}`}
                            style={{ width: `${d.avgPct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trust + Top 5 */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Trust Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Clean assessments</span>
                      <span className="font-semibold text-emerald-600">
                        {candidates.length - flaggedAssessments} / {candidates.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Flagged (3+ tab switches)</span>
                      <Badge variant="outline" className={`text-[10px] ${flaggedAssessments > 0 ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800" : ""}`}>
                        {flaggedAssessments}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Avg tab switches</span>
                      <span className="font-semibold">{candidates.length > 0 ? (totalTabSwitches / candidates.length).toFixed(1) : "0"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Top Performers</CardTitle>
                </CardHeader>
                <CardContent>
                  {candidates.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No assessments yet</p>
                  ) : (
                    <div className="space-y-2">
                      {[...candidates]
                        .sort((a, b) => (b.total_score / b.total_questions) - (a.total_score / a.total_questions))
                        .slice(0, 5)
                        .map((c, i) => (
                          <Link key={c.id} href={`/results/${c.id}`} className="flex items-center justify-between text-xs hover:bg-gray-50 dark:hover:bg-gray-900 rounded p-1.5 -mx-1.5 transition-colors">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-4">{i + 1}.</span>
                              <span className="font-medium">{c.candidate_name || c.candidate_email || c.candidate_id.slice(0, 8)}</span>
                            </div>
                            <span className="font-bold text-emerald-600">{Math.round((c.total_score / c.total_questions) * 100)}%</span>
                          </Link>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">All Assessments</h2>
                <p className="text-muted-foreground text-sm">{candidates.length} total</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Input
                  placeholder="Search by email or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:max-w-xs"
                />
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="border rounded-md px-3 py-2 text-base sm:text-sm bg-white dark:bg-gray-900 min-h-11 sm:min-h-9"
                >
                  <option value="">All Levels</option>
                  {levels.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            {/* Assessment Table */}
            <Card>
              <CardContent className="pt-4">
                {filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No assessments found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-medium">Candidate</th>
                          <th className="text-left py-3 px-2 font-medium">Score</th>
                          <th className="text-left py-3 px-2 font-medium hidden sm:table-cell">Level</th>
                          <th className="text-left py-3 px-2 font-medium hidden sm:table-cell">Track</th>
                          <th className="text-left py-3 px-2 font-medium hidden md:table-cell">Top Domains</th>
                          <th className="text-left py-3 px-2 font-medium hidden sm:table-cell">Date</th>
                          <th className="text-right py-3 px-2 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((c) => {
                          const pct = Math.round((c.total_score / c.total_questions) * 100)
                          const topDomains = [...(c.domain_scores || [])].sort((a, b) => b.pct - a.pct).slice(0, 3)
                          return (
                            <tr key={c.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                              <td className="py-3 px-2">
                                <div>
                                  <p className="font-medium">{c.candidate_name || "—"}</p>
                                  <p className="text-xs text-muted-foreground">{c.candidate_email || c.candidate_id.slice(0, 8)}</p>
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <span className="font-semibold">{pct}%</span>
                                <span className="text-xs text-muted-foreground ml-1">({c.total_score}/{c.total_questions})</span>
                                {c.tab_switches > 3 && (
                                  <Badge variant="outline" className="ml-1 text-[9px] bg-red-50 dark:bg-red-950/30 text-red-600 border-red-200 dark:border-red-800">!</Badge>
                                )}
                              </td>
                              <td className="py-3 px-2 hidden sm:table-cell">
                                <Badge variant="outline" className="text-xs">{c.overall_level}</Badge>
                              </td>
                              <td className="py-3 px-2 hidden sm:table-cell">
                                <Badge variant="outline" className="text-xs">{TRACK_LABELS[c.self_track] || c.self_track}</Badge>
                              </td>
                              <td className="py-3 px-2 hidden md:table-cell">
                                <div className="flex gap-1 flex-wrap">
                                  {topDomains.map((d) => (
                                    <Badge key={d.domain} variant="outline" className="text-xs">
                                      {d.domainLabel} {d.pct}%
                                    </Badge>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell">
                                {new Date(c.created_at).toLocaleDateString()}
                              </td>
                              <td className="py-3 px-2 text-right">
                                <Link href={`/results/${c.id}`}>
                                  <Button variant="outline" size="sm">View</Button>
                                </Link>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ==================== EMPLOYERS TAB ==================== */}
        {activeTab === "employers" && (
          <div className="space-y-6">
            {/* Employer KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Employers", value: employers.length, color: "text-gray-950 dark:text-white" },
                { label: "Active", value: activeEmployers, color: "text-emerald-600" },
                { label: "Pending Review", value: pendingEmployers.length, color: pendingEmployers.length > 0 ? "text-amber-600" : "text-gray-400" },
                { label: "Rejected", value: rejectedEmployers, color: rejectedEmployers > 0 ? "text-red-500" : "text-gray-400" },
              ].map(stat => (
                <Card key={stat.label}>
                  <CardContent className="pt-4 pb-3 text-center">
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Hiring Track Demand + Engagement */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Hiring Track Demand</CardTitle>
                  <CardDescription className="text-xs">What active employers are hiring for</CardDescription>
                </CardHeader>
                <CardContent>
                  {sortedHiringDemand.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No active employers yet</p>
                  ) : (
                    <div className="space-y-2.5">
                      {sortedHiringDemand.map(([track, count]) => (
                        <div key={track} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium">{TRACK_LABELS[track] || track}</span>
                            <span className="text-muted-foreground">{count} employer{count !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(count / maxHiringCount) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Engagement Overview</CardTitle>
                  <CardDescription className="text-xs">Employer-candidate communication</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Total conversations</span>
                      <span className="font-semibold">{stats?.conversations.total ?? "—"}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Active conversations</span>
                      <span className="font-semibold">{stats?.conversations.active ?? "—"}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Total messages exchanged</span>
                      <span className="font-semibold">{stats?.conversations.totalMessages ?? "—"}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Avg messages per conversation</span>
                      <span className="font-semibold">{stats?.conversations.avgMessagesPerConv ?? "—"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Link to full management */}
            <Link href="/admin/employers">
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
                <CardContent className="pt-5 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Manage All Employer Accounts</p>
                      <p className="text-xs text-muted-foreground">
                        Activate, reject, or deactivate employer accounts
                        {pendingEmployers.length > 0 && (
                          <span className="text-amber-600 font-medium ml-1">({pendingEmployers.length} pending)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="m9 18 6-6-6-6"/></svg>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
