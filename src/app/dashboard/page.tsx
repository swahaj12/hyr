"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { type DomainScore, displayLevel } from "@/lib/scoring"
import { Navbar } from "@/components/navbar"
import { PageLoading } from "@/components/loading"
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

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/auth")
          return
        }
        setUserName(user.user_metadata?.full_name || user.email || "")
        setUserId(user.id)

        const { data, error: fetchError } = await supabase
          .from("assessments")
          .select("*")
          .eq("candidate_id", user.id)
          .order("created_at", { ascending: false })

        if (fetchError) {
          setError("Could not load your assessments. Please refresh the page.")
        } else if (data) {
          setAssessments(data as Assessment[])
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
            <p className="text-muted-foreground">Your DevOps assessment dashboard</p>
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
                <h2 className="text-xl font-semibold">Take Your First Assessment</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Answer 40 scenario-based DevOps questions in ~15 minutes. Get a verified skill
                  profile across 13 domains.
                </p>
                <Link href="/assessment">
                  <Button size="lg">Start Assessment</Button>
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
                        <Button>Retake Assessment</Button>
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
      </main>
    </div>
  )
}
