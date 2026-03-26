"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { displayLevel, DOMAIN_LABELS } from "@/lib/scoring"
import { TRACK_LABELS } from "@/lib/talent-matching"
import { Navbar } from "@/components/navbar"
import { PageLoading } from "@/components/loading"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type MatchData = {
  candidate: {
    candidateId: string
    name: string
    overallPct: number
    level: string
    assessedLevel: string | null
    tabSwitches: number
    totalAssessments: number
    personalityType: string | null
    selfExperience: string | null
    domainScores: { domain: string; domainLabel: string; pct: number }[]
  }
  matchPct: number
  matchedSkills: string[]
  missingSkills: string[]
  tier: "ready" | "almost" | "growing" | "low"
}

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
}

const TIER_CONFIG = {
  ready: { label: "Ready Now", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
  almost: { label: "Almost There", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" },
  growing: { label: "Growing", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
  low: { label: "Exploring", color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200", dot: "bg-gray-400" },
}

const URGENCY_LABELS: Record<string, string> = {
  immediate: "Hiring Now",
  "2weeks": "Within 2 Weeks",
  month: "Within a Month",
}

export default function HiringNeedMatchesPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [need, setNeed] = useState<HiringNeed | null>(null)
  const [matches, setMatches] = useState<MatchData[]>([])
  const [activeFilter, setActiveFilter] = useState<string>("all")

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth"); return }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const res = await fetch(`/api/hiring-needs?id=${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setNeed(data.need)
        setMatches(data.matches)
      }
      setLoading(false)
    }
    load()
  }, [id, router])

  if (loading) return <><Navbar /><PageLoading /></>
  if (!need) return <><Navbar /><main className="max-w-lg mx-auto px-4 py-16 text-center"><p>Hiring need not found.</p></main></>

  const readyMatches = matches.filter(m => m.tier === "ready")
  const almostMatches = matches.filter(m => m.tier === "almost")
  const growingMatches = matches.filter(m => m.tier === "growing")

  const filtered = activeFilter === "all"
    ? matches
    : matches.filter(m => m.tier === activeFilter)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => router.push("/employers/hiring-needs")} className="text-sm text-muted-foreground hover:text-gray-950 transition-colors">&larr; All Needs</button>
            </div>
            <h1 className="text-2xl font-bold">{need.title}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
              <span>{TRACK_LABELS[need.track] || need.track}</span>
              <span>&middot;</span>
              <span>{need.min_level.charAt(0).toUpperCase() + need.min_level.slice(1)}+</span>
              <span>&middot;</span>
              <span>{URGENCY_LABELS[need.urgency] || need.urgency}</span>
            </div>
          </div>
          <Badge className={`shrink-0 ${need.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500"}`}>
            {need.status.charAt(0).toUpperCase() + need.status.slice(1)}
          </Badge>
        </div>

        {/* Required skills */}
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">Required Skills</p>
            <div className="flex flex-wrap gap-2">
              {need.required_skills.map(skill => (
                <span key={skill} className="px-3 py-1 rounded-full text-sm border border-gray-200 bg-white text-gray-700">
                  {DOMAIN_LABELS[skill] || skill}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button onClick={() => setActiveFilter("all")} className={`text-center p-4 rounded-xl border transition-all ${activeFilter === "all" ? "border-gray-950 bg-gray-950 text-white" : "border-gray-200 bg-white hover:border-gray-300"}`}>
            <p className="text-2xl font-bold">{matches.length}</p>
            <p className="text-xs mt-1 opacity-70">Total Matches</p>
          </button>
          <button onClick={() => setActiveFilter("ready")} className={`text-center p-4 rounded-xl border transition-all ${activeFilter === "ready" ? "border-emerald-500 bg-emerald-500 text-white" : "border-emerald-200 bg-emerald-50 hover:border-emerald-300"}`}>
            <p className={`text-2xl font-bold ${activeFilter === "ready" ? "" : "text-emerald-700"}`}>{readyMatches.length}</p>
            <p className={`text-xs mt-1 ${activeFilter === "ready" ? "opacity-70" : "text-emerald-600"}`}>Ready Now</p>
          </button>
          <button onClick={() => setActiveFilter("almost")} className={`text-center p-4 rounded-xl border transition-all ${activeFilter === "almost" ? "border-blue-500 bg-blue-500 text-white" : "border-blue-200 bg-blue-50 hover:border-blue-300"}`}>
            <p className={`text-2xl font-bold ${activeFilter === "almost" ? "" : "text-blue-700"}`}>{almostMatches.length}</p>
            <p className={`text-xs mt-1 ${activeFilter === "almost" ? "opacity-70" : "text-blue-600"}`}>Almost There</p>
          </button>
          <button onClick={() => setActiveFilter("growing")} className={`text-center p-4 rounded-xl border transition-all ${activeFilter === "growing" ? "border-amber-500 bg-amber-500 text-white" : "border-amber-200 bg-amber-50 hover:border-amber-300"}`}>
            <p className={`text-2xl font-bold ${activeFilter === "growing" ? "" : "text-amber-700"}`}>{growingMatches.length}</p>
            <p className={`text-xs mt-1 ${activeFilter === "growing" ? "opacity-70" : "text-amber-600"}`}>Growing</p>
          </button>
        </div>

        {almostMatches.length > 0 && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-blue-800">
              <strong>{almostMatches.length} near-match candidate{almostMatches.length !== 1 ? "s have" : " has"}</strong> been notified to prepare for your requirements. Updated matches typically appear within 48 hours.
            </p>
          </div>
        )}

        {/* Candidate cards */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="pt-6 pb-6 text-center">
              <p className="text-muted-foreground">No candidates in this category yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(match => {
              const tier = TIER_CONFIG[match.tier]
              return (
                <Card key={match.candidate.candidateId} className="hover:shadow-md transition-all">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-gray-950 text-white flex items-center justify-center text-sm font-bold shrink-0">
                          {match.candidate.name.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{match.candidate.name}</p>
                            <Badge className={`text-[10px] ${tier.bg} ${tier.color} ${tier.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${tier.dot} mr-1 inline-block`} />
                              {tier.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground flex-wrap">
                            <span>{displayLevel(match.candidate.level)}</span>
                            {match.candidate.selfExperience && (
                              <>
                                <span>&middot;</span>
                                <span>{match.candidate.selfExperience} yrs</span>
                              </>
                            )}
                            {match.candidate.personalityType && (
                              <>
                                <span>&middot;</span>
                                <span className="truncate">{match.candidate.personalityType}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{match.matchPct}%</p>
                          <p className="text-[10px] text-muted-foreground">Match</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold">{match.candidate.overallPct}%</p>
                          <p className="text-[10px] text-muted-foreground">Score</p>
                        </div>
                        <Link href={`/profile/${match.candidate.candidateId}`}>
                          <Button size="sm" variant="outline">View Profile</Button>
                        </Link>
                      </div>
                    </div>

                    {/* Skill breakdown */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {match.matchedSkills.map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {DOMAIN_LABELS[s] || s} &#10003;
                        </span>
                      ))}
                      {match.missingSkills.map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                          {DOMAIN_LABELS[s] || s} &#10007;
                        </span>
                      ))}
                    </div>

                    {/* Trust signals */}
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      {match.candidate.tabSwitches === 0 ? (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {match.candidate.tabSwitches} tab switch{match.candidate.tabSwitches > 1 ? "es" : ""}
                        </span>
                      )}
                      <span>{match.candidate.totalAssessments} assessment{match.candidate.totalAssessments > 1 ? "s" : ""}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
