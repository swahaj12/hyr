"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { type DomainScore, displayLevel } from "@/lib/scoring"
import { Navbar } from "@/components/navbar"
import { PageLoading } from "@/components/loading"
import { SupportButton } from "@/components/support-dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Assessment = {
  id: string
  total_score: number
  total_questions: number
  overall_level: string
  assessed_level: string | null
  domain_scores: DomainScore[]
  created_at: string
  profile_visible?: boolean
}

const LEVEL_LABELS: Record<string, string> = {
  junior: "Junior",
  mid: "Mid-Level",
  senior: "Senior",
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState("")
  const [userId, setUserId] = useState("")
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [profileCopied, setProfileCopied] = useState(false)
  const [profileVisible, setProfileVisible] = useState(true)

  const [error, setError] = useState<string | null>(null)
  const [interests, setInterests] = useState<{ employer_name: string; employer_email: string; message: string | null; created_at: string }[]>([])
  const [profileViews, setProfileViews] = useState(0)
  const [hiringCompanies, setHiringCompanies] = useState<{ company_name: string; hiring_tracks: string[]; hiring_description: string | null }[]>([])
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [sessionToken, setSessionToken] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/auth")
          return
        }
        if (user.user_metadata?.role === "employer") {
          router.push("/employers")
          return
        }
        const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim())
        if (adminEmails.includes(user.email || "")) {
          router.push("/admin")
          return
        }
        setUserName(user.user_metadata?.full_name || user.email || "")
        setUserId(user.id)

        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) setSessionToken(session.access_token)

        const { data, error: fetchError } = await supabase
          .from("assessments")
          .select("*")
          .eq("candidate_id", user.id)
          .order("created_at", { ascending: false })

        supabase
          .from("employer_interests")
          .select("employer_name, employer_email, message, created_at")
          .eq("candidate_id", user.id)
          .order("created_at", { ascending: false })
          .then(({ data: intData }) => {
            if (intData) setInterests(intData as typeof interests)
          })

        supabase
          .from("profile_views")
          .select("id", { count: "exact", head: true })
          .eq("candidate_id", user.id)
          .eq("viewer_role", "employer")
          .then(({ count }) => {
            if (count) setProfileViews(count)
          })

        supabase
          .from("employer_profiles")
          .select("company_name, hiring_tracks, hiring_description")
          .eq("status", "active")
          .then(({ data: empData }) => {
            if (empData) setHiringCompanies(empData as typeof hiringCompanies)
          })

        supabase
          .from("conversations")
          .select("id")
          .or(`candidate_id.eq.${user.id}`)
          .then(async ({ data: convs }) => {
            if (convs && convs.length > 0) {
              const convIds = convs.map(c => c.id)
              const { count } = await supabase
                .from("messages")
                .select("id", { count: "exact", head: true })
                .in("conversation_id", convIds)
                .eq("read", false)
                .neq("sender_id", user.id)
              if (count) setUnreadMessages(count)
            }
          })

        if (fetchError) {
          setError("Could not load your assessments. Please refresh the page.")
        } else if (data) {
          setAssessments(data as Assessment[])
          const first = data[0] as Record<string, unknown> | undefined
          if (first && typeof first.profile_visible === "boolean") {
            setProfileVisible(first.profile_visible)
          }
        }
      } catch {
        setError("Something went wrong. Please refresh the page.")
      }
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return <><Navbar /><PageLoading /></>
  }

  const latest = assessments[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8 pb-20 sm:pb-0">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {userName.split(" ")[0] || "there"}</h1>
            <p className="text-muted-foreground">Your career profile</p>
          </div>
          {assessments.length > 0 && userId && (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <button
                  type="button"
                  role="switch"
                  aria-checked={profileVisible}
                  onClick={async () => {
                    const next = !profileVisible
                    setProfileVisible(next)
                    await supabase
                      .from("assessments")
                      .update({ profile_visible: next })
                      .eq("candidate_id", userId)
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                    profileVisible ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      profileVisible ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-muted-foreground">Visible to employers</span>
              </label>
              <Button
                variant="outline"
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(`${window.location.origin}/profile/${userId}`)
                    setProfileCopied(true)
                    setTimeout(() => setProfileCopied(false), 2000)
                  } catch { /* clipboard unavailable */ }
                }}
              >
                {profileCopied ? "Copied!" : "Share Profile"}
              </Button>
            </div>
          )}
        </div>

        {/* Profile Status */}
        {assessments.length > 0 && userId && (
          <div className={`rounded-xl border-2 p-5 ${profileVisible ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50" : "border-gray-200 bg-gray-50"}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${profileVisible ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
                <div>
                  <p className={`font-semibold text-sm ${profileVisible ? "text-emerald-900" : "text-gray-700"}`}>
                    {profileVisible ? "Your profile is live — employers can discover you" : "Your profile is hidden from employers"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {profileVisible
                      ? "Companies browsing Hyr can find you by your skills, level, and engineering type"
                      : "Toggle visibility above to let employers find your profile"
                    }
                  </p>
                </div>
              </div>
              <Link href={`/profile/${userId}`} className="shrink-0">
                <Button variant="outline" size="sm">View Public Profile</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Messages shortcut */}
        {assessments.length > 0 && unreadMessages > 0 && (
          <Link href="/messages">
            <Card className="border-blue-200 bg-blue-50 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">💬</span>
                    <div>
                      <p className="font-semibold text-blue-900 text-sm">
                        {unreadMessages} unread message{unreadMessages !== 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-blue-700">From employers interested in your profile</p>
                    </div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Companies Actively Hiring */}
        {assessments.length > 0 && hiringCompanies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Companies Actively Hiring
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </CardTitle>
              <CardDescription>These companies are looking for engineers on Hyr</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {hiringCompanies.map((company, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                    <div className="w-10 h-10 rounded-lg bg-gray-950 text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {company.company_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{company.company_name}</p>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {(company.hiring_tracks || []).map(track => (
                          <Badge key={track} variant="outline" className="text-[10px]">
                            {track === "devops" ? "DevOps" : track === "frontend" ? "Frontend" : track === "backend" ? "Backend" : track === "qa" ? "QA" : track}
                          </Badge>
                        ))}
                      </div>
                      {company.hiring_description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{company.hiring_description}</p>
                      )}
                    </div>
                    <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200 shrink-0">
                      Hiring
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Employer Activity */}
        {assessments.length > 0 && (interests.length > 0 || profileViews > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Employer Activity</CardTitle>
              <CardDescription>Companies engaging with your profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profileViews > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <span className="text-lg">👀</span>
                    <p className="text-sm text-blue-800">
                      Your profile has been viewed <strong>{profileViews}</strong> time{profileViews !== 1 ? "s" : ""} by employers
                    </p>
                  </div>
                )}
                {interests.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">{interests.length} employer{interests.length !== 1 ? "s" : ""} interested</p>
                    {interests.map((interest, i) => (
                      <div key={i} className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-emerald-900 text-sm">{interest.employer_name || "A company"}</p>
                            {interest.message && (
                              <p className="text-sm text-emerald-700 mt-1">&ldquo;{interest.message}&rdquo;</p>
                            )}
                            <p className="text-xs text-emerald-600 mt-1">
                              {new Date(interest.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                          {interest.employer_email && (
                            <a
                              href={`mailto:${interest.employer_email}`}
                              className="shrink-0 text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Reply
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Tracking */}
        {assessments.length >= 2 && (() => {
          const latestPct = Math.round((assessments[0].total_score / assessments[0].total_questions) * 100)
          const previousPct = Math.round((assessments[1].total_score / assessments[1].total_questions) * 100)
          const delta = latestPct - previousPct
          if (delta === 0) return null
          return (
            <div className={`rounded-xl border p-4 flex items-center gap-3 ${
              delta > 0 ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"
            }`}>
              <span className={`text-2xl font-bold ${delta > 0 ? "text-green-700" : "text-amber-700"}`}>
                {delta > 0 ? "+" : ""}{delta}%
              </span>
              <div>
                <p className={`text-sm font-medium ${delta > 0 ? "text-green-800" : "text-amber-800"}`}>
                  {delta > 0 ? "Score improved since last assessment" : "Score dropped since last assessment"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {previousPct}% &rarr; {latestPct}%
                </p>
              </div>
            </div>
          )
        })()}

        {assessments.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4 py-8">
                <div className="text-5xl">&#127919;</div>
                <h2 className="text-xl font-semibold">Build Your Career Profile</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Complete a 15-minute assessment to create your verified skill profile. Once live, employers can discover you based on your actual skills — no applications needed.
                </p>
                <Link href="/assessment">
                  <Button size="lg">Build Your Profile</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Latest Result Summary */}
            {latest && (
              <Card>
                <CardHeader>
                  <CardTitle>Latest Assessment</CardTitle>
                  <CardDescription>
                    {new Date(latest.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold">
                          {Math.round((latest.total_score / latest.total_questions) * 100)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {latest.total_score}/{latest.total_questions}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        {latest.assessed_level && (
                          <div className="text-center px-3 py-1.5 rounded-md bg-gray-100 border border-gray-200">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Took</p>
                            <p className="text-sm font-semibold">{LEVEL_LABELS[latest.assessed_level] || latest.assessed_level}</p>
                          </div>
                        )}
                        <div className="text-center px-3 py-1.5 rounded-md bg-gray-100 border border-gray-200">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Your Level</p>
                          <p className="text-sm font-semibold">{displayLevel(latest.overall_level)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/results/${latest.id}`}>
                        <Button variant="outline">View Full Results</Button>
                      </Link>
                      <Link href="/assessment">
                        <Button>Improve Your Profile</Button>
                      </Link>
                    </div>
                  </div>

                  {/* Quick domain bars */}
                  {latest.domain_scores && (
                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {(latest.domain_scores as DomainScore[]).map((d) => (
                        <div
                          key={d.domain}
                          className="bg-gray-50 rounded-lg p-3 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium truncate">{d.domainLabel}</span>
                            <span className="text-xs text-muted-foreground">{d.pct}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                d.pct >= 70
                                  ? "bg-emerald-500"
                                  : d.pct >= 40
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${d.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Progress Chart */}
            {assessments.length >= 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Score Progression</CardTitle>
                  <CardDescription>Your assessment scores over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const sorted = [...assessments].reverse()
                    const points = sorted.map((a, i) => ({
                      pct: Math.round((a.total_score / a.total_questions) * 100),
                      date: new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                      index: i,
                    }))

                    const W = 100
                    const H = 40
                    const pad = { top: 4, bottom: 8, left: 2, right: 2 }
                    const chartW = W - pad.left - pad.right
                    const chartH = H - pad.top - pad.bottom

                    const minPct = Math.max(0, Math.min(...points.map(p => p.pct)) - 10)
                    const maxPct = Math.min(100, Math.max(...points.map(p => p.pct)) + 10)
                    const range = maxPct - minPct || 1

                    const coords = points.map((p, i) => ({
                      x: pad.left + (points.length > 1 ? (i / (points.length - 1)) * chartW : chartW / 2),
                      y: pad.top + chartH - ((p.pct - minPct) / range) * chartH,
                      ...p,
                    }))

                    const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ")
                    const areaD = `${pathD} L ${coords[coords.length - 1].x} ${pad.top + chartH} L ${coords[0].x} ${pad.top + chartH} Z`

                    return (
                      <div className="w-full">
                        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40 sm:h-48" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                            </linearGradient>
                          </defs>
                          <path d={areaD} fill="url(#chartGrad)" />
                          <path d={pathD} fill="none" stroke="#10b981" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />
                          {coords.map((c) => (
                            <circle key={c.index} cx={c.x} cy={c.y} r="1" fill="#10b981" stroke="#fff" strokeWidth="0.3" />
                          ))}
                        </svg>
                        <div className="flex justify-between mt-1">
                          {points.map((p, i) => (
                            <div key={i} className="text-center" style={{ width: `${100 / points.length}%` }}>
                              <p className="text-xs font-semibold text-gray-950">{p.pct}%</p>
                              <p className="text-[10px] text-muted-foreground">{p.date}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            )}

            {/* All Assessments */}
            <Card>
              <CardHeader>
                <CardTitle>All Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assessments.map((a, i) => (
                    <Link
                      key={a.id}
                      href={`/results/${a.id}`}
                      className={`flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors ${
                        i === 0 ? "border-gray-300 bg-gray-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold w-10">
                          {Math.round((a.total_score / a.total_questions) * 100)}%
                        </span>
                        {a.assessed_level && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            {LEVEL_LABELS[a.assessed_level] || a.assessed_level}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {displayLevel(a.overall_level)}
                        </Badge>
                        {i === 0 && (
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Latest</span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {sessionToken && <SupportButton sessionToken={sessionToken} />}
      </main>
    </div>
  )
}
