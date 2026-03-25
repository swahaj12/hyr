"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { type DomainScore, displayLevel, engineeringPersonality } from "@/lib/scoring"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { PageLoading } from "@/components/loading"

type Assessment = {
  id: string
  total_score: number
  total_questions: number
  overall_level: string
  assessed_level: string | null
  domain_scores: DomainScore[]
  tab_switches: number
  created_at: string
  personality_type: string | null
}

const PERSONALITY_ICONS: Record<string, string> = {
  "The Infrastructure Architect": "🏗️",
  "The Pipeline Builder": "🔧",
  "The Guardian": "🛡️",
  "The Cloud Native": "☁️",
  "The Automation Engineer": "⚙️",
  "The Full-Stack Ops": "🎯",
}

type ProfileData = {
  candidateName: string
  assessments: Assessment[]
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

export default function ProfilePage() {
  const params = useParams()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const candidateId = params.id as string

      try {
        const { data: assessments, error: fetchError } = await supabase
          .from("assessments")
          .select("*")
          .eq("candidate_id", candidateId)
          .order("created_at", { ascending: false })

        if (fetchError) {
          setError("Could not load profile. Please try again.")
          setLoading(false)
          return
        }

        if (!assessments || assessments.length === 0) {
          setLoading(false)
          return
        }

        const name = assessments.find((a: Record<string, unknown>) => a.candidate_name)?.candidate_name
          || "DevOps Candidate"

        setProfile({
          candidateName: name as string,
          assessments: assessments as Assessment[],
        })
      } catch {
        setError("Something went wrong. Please try again.")
      }
      setLoading(false)
    }
    load()
  }, [params.id])

  if (loading) {
    return (
      <>
        <Navbar />
        <PageLoading />
      </>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <p className="text-gray-500 text-lg">{error || "Profile not found"}</p>
            {!error && (
              <p className="text-sm text-muted-foreground">This candidate hasn&apos;t completed any assessments yet.</p>
            )}
            <Link href="/">
              <Button variant="outline">Go Home</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const best = profile.assessments.reduce((a, b) => {
    const aPct = a.total_questions > 0 ? a.total_score / a.total_questions : 0
    const bPct = b.total_questions > 0 ? b.total_score / b.total_questions : 0
    return aPct >= bPct ? a : b
  })
  const bestPct = best.total_questions > 0 ? Math.round((best.total_score / best.total_questions) * 100) : 0
  const bestDomains = (best.domain_scores as DomainScore[])
  const isTrusted = (best.tab_switches ?? 0) === 0
  const strongDomains = bestDomains.filter((d) => d.pct >= 70)
  const totalAssessments = profile.assessments.length
  const computedPersonality = engineeringPersonality(bestDomains)
  const personality = best.personality_type
    ? { ...computedPersonality, title: best.personality_type }
    : computedPersonality
  const personalityIcon = PERSONALITY_ICONS[personality.title] || "🎯"

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-20 sm:pb-0">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-gray-950 text-white flex items-center justify-center text-3xl font-bold mx-auto">
                {profile.candidateName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{profile.candidateName}</h1>
                <p className="text-muted-foreground text-sm">DevOps Engineer</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Best Score</span>
                  <span className="text-lg font-bold">{bestPct}%</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Level</span>
                  <Badge className="text-sm">{displayLevel(best.overall_level)}</Badge>
                </div>
                {best.assessed_level && (
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Assessment</span>
                    <span className="text-sm font-semibold">{LEVEL_LABELS[best.assessed_level] || best.assessed_level}</span>
                  </div>
                )}
              </div>

              {/* Trust & stats */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                {isTrusted ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Verified — no tab switches
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    {best.tab_switches} tab switch{best.tab_switches > 1 ? "es" : ""}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {totalAssessments} assessment{totalAssessments > 1 ? "s" : ""} completed
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personality Type */}
        <div className="relative rounded-xl border-2 border-gray-900 bg-gray-950 text-white p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
            <span className="text-4xl">{personalityIcon}</span>
            <div className="text-center sm:text-left">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Engineering Type</p>
              <h3 className="text-xl font-bold">{personality.title}</h3>
              <p className="text-sm text-gray-400 mt-1">{personality.tagline}</p>
            </div>
          </div>
        </div>

        {/* Best Assessment — Domain Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Skill Breakdown</CardTitle>
            <p className="text-sm text-muted-foreground">
              Based on best assessment — {new Date(best.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {bestDomains.map((d) => (
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

        {/* Strengths */}
        {strongDomains.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-700">Top Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {strongDomains.map((d) => (
                  <span
                    key={d.domain}
                    className="inline-flex items-center gap-1.5 text-sm font-medium bg-green-50 text-green-800 border border-green-200 rounded-full px-3 py-1"
                  >
                    {d.domainLabel}
                    <span className="text-xs text-green-600">{d.pct}%</span>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assessment History */}
        {totalAssessments > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Assessment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile.assessments.map((a) => {
                  const pct = Math.round((a.total_score / a.total_questions) * 100)
                  const trusted = (a.tab_switches ?? 0) === 0
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold">{pct}%</span>
                        <Badge variant="outline" className="text-xs">
                          {displayLevel(a.overall_level)}
                        </Badge>
                        {a.assessed_level && (
                          <span className="text-xs text-muted-foreground">
                            {LEVEL_LABELS[a.assessed_level]} assessment
                          </span>
                        )}
                        {trusted ? (
                          <span className="w-2 h-2 rounded-full bg-green-500" title="No tab switches" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-yellow-500" title={`${a.tab_switches} tab switches`} />
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Share */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">Share This Profile</h3>
                <p className="text-sm text-muted-foreground">Share this verified skill profile on social media.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = typeof window !== "undefined" ? window.location.href : ""
                    const text = `Check out ${profile.candidateName}'s verified DevOps skill profile on Hyr`
                    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank", "noopener")
                  }}
                >
                  LinkedIn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = typeof window !== "undefined" ? window.location.href : ""
                    const text = `Check out ${profile.candidateName}'s verified DevOps skill profile on @HyrPK`
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank", "noopener")
                  }}
                >
                  Twitter / X
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    try {
                      navigator.clipboard.writeText(window.location.href)
                    } catch { /* ignore */ }
                  }}
                >
                  Copy Link
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            Verified by Hyr — DevOps skills assessment platform
          </p>
        </div>
      </main>
    </div>
  )
}
