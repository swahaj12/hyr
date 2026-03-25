"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { type DomainScore } from "@/lib/scoring"
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
  const [assessments, setAssessments] = useState<Assessment[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth")
        return
      }
      setUserName(user.user_metadata?.full_name || user.email || "")

      const { data } = await supabase
        .from("assessments")
        .select("*")
        .eq("candidate_id", user.id)
        .order("created_at", { ascending: false })

      if (data) setAssessments(data as Assessment[])
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
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {userName.split(" ")[0] || "there"}</h1>
          <p className="text-muted-foreground">Your DevOps assessment dashboard</p>
        </div>

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
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Scored</p>
                          <p className="text-sm font-semibold">{latest.overall_level}</p>
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

            {/* History */}
            {assessments.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Assessment History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {assessments.slice(1).map((a) => (
                      <Link
                        key={a.id}
                        href={`/results/${a.id}`}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">
                            {Math.round((a.total_score / a.total_questions) * 100)}%
                          </span>
                          {a.assessed_level && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              Took {LEVEL_LABELS[a.assessed_level] || a.assessed_level}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            Scored {a.overall_level}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(a.created_at).toLocaleDateString()}
                        </span>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  )
}
