"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { type DomainScore, displayLevel } from "@/lib/scoring"
import { Navbar } from "@/components/navbar"
import { PageLoading } from "@/components/loading"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type CandidateProfile = {
  candidateId: string
  name: string
  bestScore: number
  bestTotal: number
  bestLevel: string
  assessedLevel: string | null
  tabSwitches: number
  totalAssessments: number
  topDomains: { name: string; pct: number }[]
  allDomains: DomainScore[]
  lastDate: string
  personalityType: string | null
  selfExperience: string | null
}

const LEVEL_LABELS: Record<string, string> = {
  junior: "Junior",
  mid: "Mid-Level",
  senior: "Senior",
}

const DOMAIN_FILTERS = [
  "All Domains",
  "Kubernetes", "Docker", "Cloud / AWS", "Terraform / IaC",
  "CI/CD", "Linux", "Monitoring", "Security",
  "Networking", "Git", "Scripting", "SRE", "FinOps",
]

const DOMAIN_KEY_MAP: Record<string, string> = {
  "Kubernetes": "kubernetes",
  "Docker": "containers",
  "Cloud / AWS": "cloud",
  "Terraform / IaC": "iac",
  "CI/CD": "cicd",
  "Linux": "linux",
  "Monitoring": "monitoring",
  "Security": "security",
  "Networking": "networking",
  "Git": "git",
  "Scripting": "scripting",
  "SRE": "sre",
  "FinOps": "finops",
}

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "admin@hyr.pk,chkk@hyr.pk").split(",").map(e => e.trim())

export default function EmployersPage() {
  const [candidates, setCandidates] = useState<CandidateProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [domainFilter, setDomainFilter] = useState("All Domains")
  const [levelFilter, setLevelFilter] = useState("All")
  const [sortBy, setSortBy] = useState<"score" | "recent">("score")

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        const role = user?.user_metadata?.role
        const isAdmin = user && ADMIN_EMAILS.includes(user.email || "")

        if (!user || (role !== "employer" && !isAdmin)) {
          setAuthorized(false)
          setLoading(false)
          return
        }
        setAuthorized(true)

        const { data: assessments, error: fetchError } = await supabase
          .from("assessments")
          .select("*")
          .eq("profile_visible", true)
          .order("created_at", { ascending: false })

        if (fetchError || !assessments) {
          setError("Could not load candidates. Please try again.")
          setLoading(false)
          return
        }

      const grouped = new Map<string, typeof assessments>()
      for (const a of assessments) {
        const existing = grouped.get(a.candidate_id) || []
        existing.push(a)
        grouped.set(a.candidate_id, existing)
      }

      const profiles: CandidateProfile[] = []
      grouped.forEach((userAssessments, candidateId) => {
        const best = userAssessments.reduce((a, b) =>
          (a.total_score / a.total_questions) >= (b.total_score / b.total_questions) ? a : b
        )

        const domains = best.domain_scores as DomainScore[]
        const topDomains = [...domains]
          .sort((a, b) => b.pct - a.pct)
          .slice(0, 4)
          .map(d => ({ name: d.domainLabel, pct: d.pct }))

        const candidateName = best.candidate_name
          || userAssessments.find((a: Record<string, unknown>) => a.candidate_name)?.candidate_name
          || null

        profiles.push({
          candidateId,
          name: candidateName || `Candidate ${candidateId.slice(0, 6)}`,
          bestScore: best.total_score,
          bestTotal: best.total_questions,
          bestLevel: best.overall_level,
          assessedLevel: best.assessed_level,
          tabSwitches: best.tab_switches ?? 0,
          totalAssessments: userAssessments.length,
          topDomains,
          allDomains: domains,
          lastDate: best.created_at,
          personalityType: best.personality_type ?? null,
          selfExperience: best.self_experience ?? null,
        })
      })

      setCandidates(profiles)
      } catch {
        setError("Something went wrong. Please refresh the page.")
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = candidates
    .filter((c) => {
      if (searchTerm) {
        const s = searchTerm.toLowerCase()
        if (!c.candidateId.toLowerCase().includes(s) && !c.name.toLowerCase().includes(s)) return false
      }
      if (levelFilter !== "All") {
        const scored = displayLevel(c.bestLevel).toLowerCase()
        if (!scored.includes(levelFilter.toLowerCase())) return false
      }
      if (domainFilter !== "All Domains") {
        const domainKey = DOMAIN_KEY_MAP[domainFilter]
        if (!domainKey) return true
        const hasDomain = c.allDomains.some(
          d => d.domain === domainKey && d.pct >= 50
        )
        if (!hasDomain) return false
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === "score") {
        return (b.bestScore / b.bestTotal) - (a.bestScore / a.bestTotal)
      }
      return new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()
    })

  if (loading) {
    return (
      <>
        <Navbar />
        <PageLoading />
      </>
    )
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-lg mx-auto px-4 py-16">
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-5">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">For Employers Only</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  This page lets employers browse verified candidate profiles.
                  Sign up as an employer to access it.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <Link href="/auth">
                  <Button>Sign Up as Employer</Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline">Go to Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6 pb-20 sm:pb-0">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold">Browse Candidates</h1>
          <p className="text-muted-foreground">Verified skill profiles — click any candidate to see their full breakdown.</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-base sm:text-sm min-h-11 sm:min-h-9 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="w-full sm:w-auto rounded-lg border border-gray-200 bg-white px-4 py-2 text-base sm:text-sm min-h-11 sm:min-h-9 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                {DOMAIN_FILTERS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full sm:w-auto rounded-lg border border-gray-200 bg-white px-4 py-2 text-base sm:text-sm min-h-11 sm:min-h-9 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <option value="All">All Levels</option>
                <option value="Senior">Senior</option>
                <option value="Mid">Mid-Level</option>
                <option value="Junior">Junior</option>
                <option value="Entry">Entry-Level</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "score" | "recent")}
                className="w-full sm:w-auto rounded-lg border border-gray-200 bg-white px-4 py-2 text-base sm:text-sm min-h-11 sm:min-h-9 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <option value="score">Highest Score</option>
                <option value="recent">Most Recent</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          {filtered.length} candidate{filtered.length !== 1 ? "s" : ""} found
        </p>

        {/* Candidate cards */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground py-8">
                No candidates match your filters. Try broadening your search.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((c) => {
              const pct = c.bestTotal > 0 ? Math.round((c.bestScore / c.bestTotal) * 100) : 0
              const isTrusted = c.tabSwitches === 0
              return (
                <Link
                  key={c.candidateId}
                  href={`/profile/${c.candidateId}`}
                  className="block group"
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-gray-300">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-gray-950 text-white flex items-center justify-center text-sm font-bold shrink-0">
                            {c.name.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{c.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {displayLevel(c.bestLevel)}
                              </Badge>
                              {c.personalityType && (
                                <span className="text-xs text-muted-foreground">
                                  {c.personalityType}
                                </span>
                              )}
                              {c.selfExperience && (
                                <span className="text-xs text-muted-foreground">
                                  &middot; {c.selfExperience} yrs
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{pct}%</p>
                          <p className="text-xs text-muted-foreground">{c.bestScore}/{c.bestTotal}</p>
                        </div>
                      </div>

                      {/* Top domains */}
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {c.topDomains.map((d) => (
                          <span
                            key={d.name}
                            className={`text-xs px-2 py-0.5 rounded-full border ${
                              d.pct >= 70
                                ? "bg-green-50 text-green-700 border-green-200"
                                : d.pct >= 50
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  : "bg-gray-50 text-gray-600 border-gray-200"
                            }`}
                          >
                            {d.name} {d.pct}%
                          </span>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          {isTrusted ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              Verified
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-yellow-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                              {c.tabSwitches} tab switch{c.tabSwitches > 1 ? "es" : ""}
                            </span>
                          )}
                          <span>{c.totalAssessments} assessment{c.totalAssessments > 1 ? "s" : ""}</span>
                        </div>
                        <span>{new Date(c.lastDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
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
