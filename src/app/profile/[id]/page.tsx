"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { type DomainScore, displayLevel, engineeringPersonality } from "@/lib/scoring"
import { getReadinessTier, calculatePercentile } from "@/lib/talent-matching"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { PageLoading, ProfileSkeleton } from "@/components/loading"
import { FadeIn, ScaleIn, StaggerList, staggerItem, PageTransition } from "@/components/motion-primitives"
import { motion } from "motion/react"

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
  const [viewerRole, setViewerRole] = useState<string | null>(null)
  const [viewerData, setViewerData] = useState<{ id: string; name: string; email: string } | null>(null)
  const [employerStatus, setEmployerStatus] = useState<string | null>(null)
  const [existingConversationId, setExistingConversationId] = useState<string | null>(null)
  const [showFirstMessage, setShowFirstMessage] = useState(false)
  const [firstMessage, setFirstMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [percentile, setPercentile] = useState<number | null>(null)

  useEffect(() => {
    async function detectViewer() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const role = (user.user_metadata?.role as string) || "candidate"
        setViewerRole(role)
        setViewerData({
          id: user.id,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "",
          email: user.email || "",
        })
        if (role === "employer" && user.id !== params.id) {
          supabase.from("profile_views").insert({
            viewer_id: user.id,
            candidate_id: params.id,
            viewer_role: role,
          }).then(() => {})

          const { data: empProfile } = await supabase
            .from("employer_profiles")
            .select("status")
            .eq("user_id", user.id)
            .single()
          setEmployerStatus(empProfile?.status || null)

          const { data: conv } = await supabase
            .from("conversations")
            .select("id")
            .eq("employer_id", user.id)
            .eq("candidate_id", params.id as string)
            .single()
          if (conv) setExistingConversationId(conv.id)
        }
      }
    }
    detectViewer()
  }, [params.id])

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

        const allHidden = assessments.every(
          (a: Record<string, unknown>) => a.profile_visible === false
        )
        if (allHidden) {
          setError("This profile is private.")
          setLoading(false)
          return
        }

        const name = assessments.find((a: Record<string, unknown>) => a.candidate_name)?.candidate_name
          || "DevOps Candidate"

        setProfile({
          candidateName: name as string,
          assessments: assessments as Assessment[],
        })

        const bestA = assessments.reduce((a: Record<string, unknown>, b: Record<string, unknown>) => {
          const aPct = (a.total_questions as number) > 0 ? (a.total_score as number) / (a.total_questions as number) : 0
          const bPct = (b.total_questions as number) > 0 ? (b.total_score as number) / (b.total_questions as number) : 0
          return aPct >= bPct ? a : b
        })
        const candidatePct = (bestA.total_questions as number) > 0
          ? Math.round(((bestA.total_score as number) / (bestA.total_questions as number)) * 100)
          : 0

        const { data: allAssessments } = await supabase
          .from("assessments")
          .select("total_score, total_questions, candidate_id")
          .eq("profile_visible", true)

        if (allAssessments) {
          const candidateBestScores = new Map<string, number>()
          for (const a of allAssessments) {
            const pct = a.total_questions > 0 ? Math.round((a.total_score / a.total_questions) * 100) : 0
            const existing = candidateBestScores.get(a.candidate_id) ?? -1
            if (pct > existing) candidateBestScores.set(a.candidate_id, pct)
          }
          const allScores = Array.from(candidateBestScores.values())
          setPercentile(calculatePercentile(candidatePct, allScores))
        }
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
        <ProfileSkeleton />
      </>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <p className="text-gray-500 dark:text-gray-400 text-lg">{error || "Profile not found"}</p>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <PageTransition>
      <StaggerList stagger={0.1} className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-20 sm:pb-0">
        {/* Profile Header */}
        <motion.div variants={staggerItem}>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-gray-950 text-white flex items-center justify-center text-3xl font-bold mx-auto">
                {profile.candidateName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{profile.candidateName}</h1>
                <p className="text-muted-foreground text-sm">{personality.title}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Best Score</span>
                  <span className="text-lg font-bold">{bestPct}%</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Level</span>
                  <Badge className="text-sm">{displayLevel(best.overall_level)}</Badge>
                </div>
                {best.assessed_level && (
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Assessment</span>
                    <span className="text-sm font-semibold">{LEVEL_LABELS[best.assessed_level] || best.assessed_level}</span>
                  </div>
                )}
              </div>

              {/* Readiness + Percentile + Trust */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                {(() => {
                  const tier = getReadinessTier(bestPct, best.tab_switches ?? 0, totalAssessments)
                  return (
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${tier.color} ${tier.bgColor} border ${tier.borderColor} rounded-full px-3 py-1`}>
                      {tier.label}
                    </span>
                  )
                })()}
                {percentile !== null && viewerRole === "employer" && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-full px-3 py-1">
                    Top {100 - percentile}%
                  </span>
                )}
                {isTrusted ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-full px-3 py-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Verified
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
        </motion.div>

        {/* Personality Type */}
        <motion.div variants={staggerItem}>
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
        </motion.div>

        {/* Best Assessment — Domain Breakdown */}
        <motion.div variants={staggerItem}>
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
                    <span className="font-medium w-24 sm:w-32 shrink-0 truncate">{d.domainLabel}</span>
                    <Badge variant="outline" className={`${levelColor(d.level)} text-white border-0 text-xs`}>
                      {displayLevel(d.level)}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground">
                    {d.correct}/{d.total} ({d.pct}%)
                  </span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor(d.pct)}`}
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        </motion.div>

        {/* Strengths */}
        {strongDomains.length > 0 && (
          <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="text-green-700 dark:text-green-300">Top Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {strongDomains.map((d) => (
                  <span
                    key={d.domain}
                    className="inline-flex items-center gap-1.5 text-sm font-medium bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800 rounded-full px-3 py-1"
                  >
                    {d.domainLabel}
                    <span className="text-xs text-green-600">{d.pct}%</span>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
          </motion.div>
        )}

        {/* Assessment History */}
        {totalAssessments > 1 && (
          <motion.div variants={staggerItem}>
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
          </motion.div>
        )}

        {/* Employer Action — Paywall or Message */}
        {viewerRole === "employer" && viewerData && params.id !== viewerData.id && (
          <Card className={employerStatus === "active" ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"}>
            <CardContent className="pt-6">
              {employerStatus === "active" ? (
                existingConversationId ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-blue-900 dark:text-blue-200">You have an active conversation</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Continue your conversation with {profile.candidateName}.</p>
                    </div>
                    <Link href={`/messages/${existingConversationId}`}>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                        Open Conversation
                      </Button>
                    </Link>
                  </div>
                ) : showFirstMessage ? (
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-blue-900 dark:text-blue-200">Start a conversation with {profile.candidateName}</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Your message will be delivered through Hyr&apos;s secure messaging.</p>
                    </div>
                    <textarea
                      value={firstMessage}
                      onChange={(e) => setFirstMessage(e.target.value)}
                      placeholder="Hi, we're looking for someone with your skills. Would love to chat about an opportunity..."
                      className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <Button
                        disabled={sendingMessage || !firstMessage.trim()}
                        onClick={async () => {
                          setSendingMessage(true)
                          try {
                            const { data: conv } = await supabase
                              .from("conversations")
                              .insert({
                                employer_id: viewerData.id,
                                candidate_id: params.id,
                              })
                              .select("id")
                              .single()

                            if (conv) {
                              await supabase.from("messages").insert({
                                conversation_id: conv.id,
                                sender_id: viewerData.id,
                                content: firstMessage.trim(),
                              })
                              setExistingConversationId(conv.id)
                              setShowFirstMessage(false)
                            }
                          } catch { /* ignore */ }
                          setSendingMessage(false)
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {sendingMessage ? "Sending..." : "Send Message"}
                      </Button>
                      <Button variant="outline" onClick={() => setShowFirstMessage(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-blue-900 dark:text-blue-200">Interested in {profile.candidateName}?</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Start a secure conversation through Hyr messaging.</p>
                    </div>
                    <Button
                      onClick={() => setShowFirstMessage(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                    >
                      Start Conversation
                    </Button>
                  </div>
                )
              ) : employerStatus === "pending" ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Account Under Review</p>
                    <p className="text-sm text-muted-foreground">Your employer account is being reviewed. Once activated, you can message candidates directly.</p>
                  </div>
                  <Link href="/employers/setup">
                    <Button variant="outline" className="shrink-0">Check Status</Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Connect with {profile.candidateName}</p>
                    <p className="text-sm text-muted-foreground">
                      Set up your company profile to start messaging verified candidates.
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href="/employers/setup">
                      <Button>Set Up Company Profile</Button>
                    </Link>
                    <Link href="/pricing">
                      <Button variant="outline">View Pricing</Button>
                    </Link>
                  </div>
                </div>
              )}
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
            Verified by Hyr — where companies discover verified engineers
          </p>
        </div>
      </StaggerList>
      </PageTransition>
    </div>
  )
}
