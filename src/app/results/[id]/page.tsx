"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion, useSpring } from "motion/react"
import { supabase } from "@/lib/supabase"
import { type DomainScore, overallLevel, displayLevel, engineeringPersonality, type PersonalityType } from "@/lib/scoring"
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
  tabSwitches?: number
  candidateId?: string
  personalityType?: string
  candidateName?: string
  selfTrack?: string
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

function scoreColor(pct: number) {
  if (pct >= 75) return "text-emerald-500"
  if (pct >= 55) return "text-green-500"
  if (pct >= 35) return "text-yellow-500"
  return "text-red-500"
}

function AnimatedScore({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 40, damping: 18 })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => spring.set(value), 400)
    return () => clearTimeout(timer)
  }, [spring, value])

  useEffect(() => {
    const unsub = spring.on("change", (v: number) => setDisplay(Math.round(v)))
    return unsub
  }, [spring])

  return <span className={scoreColor(display)}>{display}%</span>
}

const PERSONALITY_ICONS: Record<string, string> = {
  "The Infrastructure Architect": "🏗️",
  "The Pipeline Builder": "🔧",
  "The Guardian": "🛡️",
  "The Cloud Native": "☁️",
  "The Automation Engineer": "⚙️",
  "The Full-Stack Ops": "🎯",
  "The Versatile Engineer": "🎯",
  "The Pixel Perfectionist": "✨",
  "The JS Wizard": "🧙",
  "The Performance Hunter": "🏹",
  "The Component Architect": "🧩",
  "The Quality Crafter": "💎",
  "The Data Whisperer": "🗄️",
  "The API Artisan": "🔌",
  "The System Designer": "🏛️",
  "The Reliability Engineer": "🛡️",
  "The Security Sentinel": "🔒",
  "The Test Strategist": "📋",
  "The Automation Ace": "🤖",
  "The Bug Hunter": "🐛",
  "The Security Tester": "🛡️",
  "The Performance Analyst": "📈",
}

const TRACK_LABELS: Record<string, string> = {
  devops: "DevOps",
  frontend: "Frontend",
  backend: "Backend",
  qa: "QA",
}

export default function ResultsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [data, setData] = useState<AssessmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revealStage, setRevealStage] = useState(0)
  const [percentile, setPercentile] = useState<number | null>(null)

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

      try {
        const { data: assessment, error: fetchError } = await supabase
          .from("assessments")
          .select("*")
          .eq("id", id)
          .single()

        if (fetchError) {
          setError("Could not load assessment. Please try again.")
          setLoading(false)
          return
        }

        if (assessment) {
          setData({
            domainScores: assessment.domain_scores as DomainScore[],
            level: assessment.overall_level,
            totalCorrect: assessment.total_score,
            total: assessment.total_questions,
            completedAt: assessment.completed_at,
            assessedLevel: assessment.assessed_level,
            tabSwitches: assessment.tab_switches ?? 0,
            candidateId: assessment.candidate_id,
            personalityType: assessment.personality_type,
            candidateName: assessment.candidate_name,
            selfTrack: assessment.self_track,
          })
        }
      } catch {
        setError("Something went wrong. Please try again.")
      }
      setLoading(false)
    }
    load()
  }, [params.id, searchParams])

  useEffect(() => {
    if (!data || loading) return
    const { totalCorrect: tc, total: tt } = data
    async function computePercentile() {
      try {
        const { data: allScores } = await supabase
          .from("assessments")
          .select("total_score, total_questions")
        if (allScores && allScores.length > 1) {
          const pcts = allScores.map((a: Record<string, unknown>) =>
            Math.round(((a.total_score as number) / (a.total_questions as number)) * 100)
          )
          const myPct = tt > 0 ? Math.round((tc / tt) * 100) : 0
          const below = pcts.filter(p => p < myPct).length
          setPercentile(Math.round((below / pcts.length) * 100))
        }
      } catch { /* ignore */ }
    }
    computePercentile()
  }, [data, loading])

  useEffect(() => {
    if (!data || loading) return
    const timers = [
      setTimeout(() => setRevealStage(1), 300),
      setTimeout(() => setRevealStage(2), 2600),
      setTimeout(() => setRevealStage(3), 3200),
      setTimeout(() => setRevealStage(4), 3800),
      setTimeout(() => setRevealStage(5), 4400),
    ]
    return () => timers.forEach(clearTimeout)
  }, [data, loading])

  if (loading) {
    return (
      <>
        <Navbar />
        <PageLoading />
      </>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <p className="text-gray-500">{error || "Assessment not found."}</p>
            <Link href="/dashboard">
              <Button>Go to Career Hub</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { domainScores, level, totalCorrect, total, assessedLevel, tabSwitches, candidateId, personalityType, candidateName } = data
  const overallPct = total > 0 ? Math.round((totalCorrect / total) * 100) : 0
  const strongDomains = domainScores.filter((d) => d.pct >= 70).sort((a, b) => b.pct - a.pct)
  const gapDomains = domainScores.filter((d) => d.pct < 40).sort((a, b) => a.pct - b.pct)
  const isTrusted = (tabSwitches ?? 0) === 0
  const computedPersonality = engineeringPersonality(domainScores)
  const personality = personalityType
    ? { ...computedPersonality, title: personalityType }
    : computedPersonality
  const personalityIcon = PERSONALITY_ICONS[personality.title] || "🎯"
  const topStrengthNames = strongDomains.slice(0, 2).map(d => d.domainLabel)
  const topGapNames = gapDomains.slice(0, 2).map(d => d.domainLabel)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-20 sm:pb-0">
        {/* Step 1: Score Countup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card>
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-5">
                <motion.h1
                  className="text-2xl sm:text-3xl font-bold text-gray-950"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Your {TRACK_LABELS[data.selfTrack || ""] || "Tech"} Skill Profile
                </motion.h1>

                {revealStage >= 1 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 100, damping: 12 }}
                    className="flex items-center justify-center"
                  >
                    <div className="relative">
                      <span className={`text-6xl sm:text-7xl font-bold ${scoreColor(overallPct)}`}>
                        <AnimatedScore value={overallPct} />
                      </span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {totalCorrect}/{total} correct
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Level Badge Pop */}
                {revealStage >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.3, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
                  >
                    {assessedLevel && (
                      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Assessment Taken</span>
                        <span className="text-sm font-semibold">{LEVEL_LABELS[assessedLevel] || assessedLevel}</span>
                      </div>
                    )}
                    <motion.div
                      initial={{ rotate: -10 }}
                      animate={{ rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="flex items-center gap-2 rounded-lg border-2 border-gray-900 bg-gray-950 px-5 py-2.5"
                    >
                      <span className="text-xs text-gray-400 uppercase tracking-wide">Your Level</span>
                      <span className="text-sm font-bold text-white">{displayLevel(level)}</span>
                    </motion.div>
                  </motion.div>
                )}

                {revealStage >= 2 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-center gap-2 pt-1"
                  >
                    {isTrusted ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Verified — no tab switches detected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1">
                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                        {tabSwitches} tab switch{(tabSwitches ?? 0) > 1 ? "es" : ""} detected
                      </span>
                    )}
                  </motion.div>
                )}

                {revealStage >= 2 && percentile !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-2 inline-block"
                  >
                    <p className="text-sm text-blue-800">
                      You scored higher than <strong>{percentile}%</strong> of all candidates
                    </p>
                  </motion.div>
                )}

                {assessedLevel && revealStage >= 2 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-muted-foreground max-w-md mx-auto"
                  >
                    You took the {LEVEL_LABELS[assessedLevel]} assessment. Your level is based on how you performed.
                  </motion.p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Step 3: Strengths + Growth Callouts */}
        {revealStage >= 3 && (
          <div className="grid md:grid-cols-2 gap-4">
            {topStrengthNames.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                  <p className="text-sm font-semibold text-green-800 mb-1">Your strengths</p>
                  <p className="text-green-700">
                    You crushed{" "}
                    <strong>{topStrengthNames.join(" and ")}</strong>
                  </p>
                </div>
              </motion.div>
            )}
            {topGapNames.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-sm font-semibold text-amber-800 mb-1">Growth areas</p>
                  <p className="text-amber-700">
                    <strong>{topGapNames.join(" and ")}</strong>{" "}
                    {topGapNames.length === 1 ? "is" : "are"} your next frontier — most engineers score below 50% here
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* You're Live Card */}
        {revealStage >= 3 && candidateId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-6">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-emerald-900 text-lg">Your profile is now live</h3>
                  <p className="text-emerald-700 text-sm mt-1 leading-relaxed">
                    Employers browsing Hyr can now discover you based on your verified skills. Your domain scores, trust indicators, and engineering type are all visible to hiring companies.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full px-3 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Visible to employers
                    </span>
                    <span className="text-xs text-emerald-600">
                      Improve your score anytime by retaking the assessment
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Personality Type Card */}
        {revealStage >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative rounded-xl border-2 border-gray-900 bg-gray-950 text-white p-6 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
                <span className="text-4xl">{personalityIcon}</span>
                <div className="text-center sm:text-left">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Your Engineering Type</p>
                  <h3 className="text-xl font-bold">{personality.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{personality.tagline}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 5: Domain Bars */}
        {revealStage >= 4 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Skill Breakdown by Domain</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {domainScores.map((d, i) => (
                  <motion.div
                    key={d.domain}
                    className="space-y-1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium w-24 sm:w-32 shrink-0 truncate">{d.domainLabel}</span>
                        <Badge variant="outline" className={`${levelColor(d.level)} text-white border-0 text-xs`}>
                          {displayLevel(d.level)}
                        </Badge>
                      </div>
                      <span className="text-muted-foreground">
                        {d.correct}/{d.total} ({d.pct}%)
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${barColor(d.pct)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${d.pct}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Strengths and Gaps Detail */}
        {revealStage >= 4 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid md:grid-cols-2 gap-6"
          >
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
          </motion.div>
        )}

        {/* Phase 6: Shareable Results Card */}
        {revealStage >= 5 && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="rounded-2xl border-2 border-gray-200 bg-white shadow-lg p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Shareable Card</p>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">hyr.pk</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-gray-950 text-white flex items-center justify-center text-2xl font-bold shrink-0">
                  {(candidateName || "?").charAt(0).toUpperCase()}
                </div>
                <div className="text-center sm:text-left flex-1">
                  <p className="text-lg font-bold text-gray-950">{candidateName || "Candidate"}</p>
                  <p className="text-sm text-gray-500">{personality.title}</p>
                </div>
                <div className="text-center">
                  <p className={`text-4xl font-bold ${scoreColor(overallPct)}`}>{overallPct}%</p>
                  <Badge className="text-xs mt-1">{displayLevel(level)}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {strongDomains.slice(0, 3).map(d => (
                  <div key={d.domain} className="text-center rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <p className="text-lg font-bold text-gray-950">{d.pct}%</p>
                    <p className="text-xs text-gray-500 mt-0.5">{d.domainLabel}</p>
                  </div>
                ))}
              </div>

              {isTrusted && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-green-700">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Verified Assessment
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Share + Actions */}
        {revealStage >= 5 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">Boost Your Visibility</h3>
                    <p className="text-sm text-muted-foreground">
                      Share your verified profile to reach more employers and hiring managers.
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {candidateId && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const url = `${window.location.origin}/profile/${candidateId}`
                            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank", "noopener")
                          }}
                        >
                          LinkedIn
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const url = `${window.location.origin}/profile/${candidateId}`
                            const trackName = TRACK_LABELS[data.selfTrack || ""] || "tech"
                            const text = `My verified ${trackName} skill profile is live on @HyrPK — ${overallPct}% overall (${displayLevel(level)}). Companies can now find me based on my actual skills.`
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
                              const profileUrl = `${window.location.origin}/profile/${candidateId}`
                              navigator.clipboard.writeText(profileUrl)
                              setCopied(true)
                              setTimeout(() => setCopied(false), 2000)
                            } catch { /* clipboard may not be available in all contexts */ }
                          }}
                        >
                          {copied ? "Copied!" : "Copy Link"}
                        </Button>
                      </>
                    )}
                    <Link href="/dashboard">
                      <Button>Go to Career Hub</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  )
}
