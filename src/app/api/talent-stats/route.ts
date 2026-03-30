import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { type DomainScore, displayLevel, DOMAIN_LABELS } from "@/lib/scoring"
import { TRACK_DOMAINS, TRACK_LABELS } from "@/lib/talent-matching"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceKey) {
      return NextResponse.json({ error: "Server config missing" }, { status: 500 })
    }

    const admin = createClient(supabaseUrl, serviceKey)

  const { data: assessments } = await admin
    .from("assessments")
    .select("candidate_id, total_score, total_questions, overall_level, domain_scores, self_track, self_experience, profile_visible, tab_switches, created_at")

  if (!assessments) {
    return NextResponse.json({ error: "Could not load data" }, { status: 500 })
  }

  const candidateBest = new Map<string, typeof assessments[0]>()
  for (const a of assessments) {
    const existing = candidateBest.get(a.candidate_id)
    const aPct = a.total_questions > 0 ? a.total_score / a.total_questions : 0
    const existPct = existing ? (existing.total_questions > 0 ? existing.total_score / existing.total_questions : 0) : -1
    if (aPct > existPct) {
      candidateBest.set(a.candidate_id, a)
    }
  }

  const candidates = Array.from(candidateBest.values())
  const totalCandidates = candidates.length
  const totalAssessments = assessments.length

  const trackCounts: Record<string, { count: number; totalPct: number }> = {}
  const levelCounts: Record<string, number> = {}
  const domainTotals: Record<string, { sum: number; count: number }> = {}
  const trackScores: Record<string, number[]> = {}

  for (const c of candidates) {
    const track = c.self_track || "devops"
    if (!trackCounts[track]) trackCounts[track] = { count: 0, totalPct: 0 }
    trackCounts[track].count++
    const pct = c.total_questions > 0 ? Math.round((c.total_score / c.total_questions) * 100) : 0
    trackCounts[track].totalPct += pct

    if (!trackScores[track]) trackScores[track] = []
    trackScores[track].push(pct)

    const level = displayLevel(c.overall_level)
    levelCounts[level] = (levelCounts[level] || 0) + 1

    const domains = c.domain_scores as DomainScore[]
    if (domains) {
      for (const d of domains) {
        if (!domainTotals[d.domain]) domainTotals[d.domain] = { sum: 0, count: 0 }
        domainTotals[d.domain].sum += d.pct
        domainTotals[d.domain].count++
      }
    }
  }

  const trackDistribution = Object.entries(trackCounts)
    .map(([track, data]) => ({
      track,
      label: TRACK_LABELS[track] || track,
      count: data.count,
      avgScore: data.count > 0 ? Math.round(data.totalPct / data.count) : 0,
    }))
    .sort((a, b) => b.count - a.count)

  const levelOrder = ["Senior", "Mid-Level", "Junior", "Entry-Level", "Beginner"]
  const levelDistribution = levelOrder
    .filter(l => levelCounts[l])
    .map(level => ({ level, count: levelCounts[level] }))

  const topDomainScores = Object.entries(domainTotals)
    .map(([domain, data]) => ({
      domain,
      label: DOMAIN_LABELS[domain] || domain,
      avgPct: data.count > 0 ? Math.round(data.sum / data.count) : 0,
    }))
    .sort((a, b) => b.avgPct - a.avgPct)

  const topPercentileThreshold: Record<string, number> = {}
  for (const [track, scores] of Object.entries(trackScores)) {
    const sorted = [...scores].sort((a, b) => a - b)
    const idx = Math.floor(sorted.length * 0.9)
    topPercentileThreshold[track] = sorted[idx] || 0
  }

  const publicCandidates = candidates.filter(c => c.profile_visible !== false).length
  const avgTabSwitches = candidates.length > 0
    ? Math.round(candidates.reduce((s, c) => s + (c.tab_switches ?? 0), 0) / candidates.length * 10) / 10
    : 0

  const { data: hiringNeeds } = await admin
    .from("hiring_needs")
    .select("id, track, status")
    .eq("status", "active")

  const activeHiringNeeds = hiringNeeds?.length || 0

  const { data: employers } = await admin
    .from("employer_profiles")
    .select("id, status")

  const activeEmployers = employers?.filter(e => e.status === "active").length || 0

  const skillsByTrack: Record<string, { domain: string; label: string; avgPct: number }[]> = {}
  for (const [track, domains] of Object.entries(TRACK_DOMAINS)) {
    skillsByTrack[track] = domains
      .map(domain => ({
        domain,
        label: DOMAIN_LABELS[domain] || domain,
        avgPct: domainTotals[domain] ? Math.round(domainTotals[domain].sum / domainTotals[domain].count) : 0,
      }))
      .sort((a, b) => b.avgPct - a.avgPct)
  }

  return NextResponse.json({
    totalCandidates,
    publicCandidates,
    totalAssessments,
    trackDistribution,
    levelDistribution,
    topDomainScores,
    topPercentileThreshold,
    avgTabSwitches,
    activeHiringNeeds,
    activeEmployers,
    skillsByTrack,
  })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
