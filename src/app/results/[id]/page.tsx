"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { type DomainScore, overallLevel, displayLevel } from "@/lib/scoring"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { PageLoading } from "@/components/loading"

type AssessmentData = {
  domainScores: DomainScore[]
  level: string
  totalCorrect: number
  total: number
  completedAt?: string
  assessedLevel?: string
}

const LEVEL_LABELS: Record<string, string> = {
  junior: "Junior",
  mid: "Mid-Level",
  senior: "Senior",
}

function levelColor(level: string) {
  if (level === "Needs Work" || level === "Gap") return "bg-red-500"
  if (level === "Basic" || level === "L1") return "bg-orange-500"
  if (level === "Developing" || level === "L1-L2") return "bg-yellow-500"
  if (level === "Proficient" || level === "L2") return "bg-green-500"
  if (level === "Expert" || level === "L2+") return "bg-emerald-500"
  return "bg-gray-500"
}

function barColor(pct: number) {
  if (pct >= 75) return "bg-emerald-500"
  if (pct >= 55) return "bg-green-500"
  if (pct >= 35) return "bg-yellow-500"
  return "bg-red-500"
}

export default function ResultsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [data, setData] = useState<AssessmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      const id = params.id as string

      if (id === "local") {
        const encoded = searchParams.get("d")
        if (encoded) {
          try {
            const parsed = JSON.parse(atob(decodeURIComponent(encoded)))
            setData(parsed)
          } catch { /* ignore */ }
        }
        setLoading(false)
        return
      }

      const { data: assessment } = await supabase
        .from("assessments")
        .select("*")
        .eq("id", id)
        .single()

      if (assessment) {
        setData({
          domainScores: assessment.domain_scores as DomainScore[],
          level: assessment.overall_level,
          totalCorrect: assessment.total_score,
          total: assessment.total_questions,
          completedAt: assessment.completed_at,
          assessedLevel: assessment.assessed_level,
        })
      }
      setLoading(false)
    }
    load()
  }, [params.id, searchParams])

  if (loading) {
    return (
      <>
        <Navbar />
        <PageLoading />
      </>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <p className="text-gray-500">Assessment not found.</p>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const { domainScores, level, totalCorrect, total, assessedLevel } = data
  const overallPct = Math.round((totalCorrect / total) * 100)
  const strongDomains = domainScores.filter((d) => d.pct >= 70)
  const gapDomains = domainScores.filter((d) => d.pct < 40)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-20 sm:pb-0">
        {/* Overall Score Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold">Your DevOps Skill Profile</h1>

              <div className="flex items-center justify-center gap-3">
                <span className="text-5xl font-bold">{overallPct}%</span>
                <div className="text-left">
                  <p className="text-sm text-muted-foreground">
                    {totalCorrect}/{total} correct
                  </p>
                </div>
              </div>

              {/* Assessment type + scored result */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {assessedLevel && (
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Assessment Taken</span>
                    <span className="text-sm font-semibold">{LEVEL_LABELS[assessedLevel] || assessedLevel}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Your Level</span>
                  <Badge className="text-sm">{displayLevel(level)}</Badge>
                </div>
              </div>

              {assessedLevel && (
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  You took the {LEVEL_LABELS[assessedLevel]} assessment. Your level is based on how you performed.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Domain Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Skill Breakdown by Domain</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {domainScores.map((d) => (
              <div key={d.domain} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium w-32 shrink-0">{d.domainLabel}</span>
                    <Badge variant="outline" className={`${levelColor(d.level)} text-white border-0 text-xs`}>
                      {displayLevel(d.level)}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground">
                    {d.correct}/{d.total} ({d.pct}%)
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor(d.pct)}`}
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Strengths and Gaps */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-700">Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              {strongDomains.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Complete more practice tasks to build strengths.
                </p>
              ) : (
                <ul className="space-y-2">
                  {strongDomains.map((d) => (
                    <li key={d.domain} className="flex items-center gap-2 text-sm">
                      <span className="text-green-600">&#10003;</span>
                      <span className="font-medium">{d.domainLabel}</span>
                      <Badge variant="outline" className="text-xs">
                        {displayLevel(d.level)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-amber-700">Areas to Improve</CardTitle>
            </CardHeader>
            <CardContent>
              {gapDomains.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No significant gaps detected. Well done!
                </p>
              ) : (
                <ul className="space-y-2">
                  {gapDomains.map((d) => (
                    <li key={d.domain} className="flex items-center gap-2 text-sm">
                      <span className="text-amber-600">&#9650;</span>
                      <span className="font-medium">{d.domainLabel}</span>
                      <Badge variant="outline" className="text-xs text-amber-700">
                        {d.pct}%
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Share + Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">Share Your Profile</h3>
                <p className="text-sm text-muted-foreground">
                  Send this link to employers to showcase your verified skills.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                >
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
                <Link href="/dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
