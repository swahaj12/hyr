import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { type DomainScore, DOMAIN_LABELS } from "@/lib/scoring"
import { matchCandidateToNeed, type CandidateMatchProfile, TRACK_LABELS } from "@/lib/talent-matching"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getServiceClient() {
  return createClient(supabaseUrl, serviceKey)
}

async function getAuthUser(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "")
  if (!token) return null
  const client = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user } } = await client.auth.getUser(token)
  return user
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { assessmentId } = body

  if (!assessmentId || typeof assessmentId !== "string") {
    return NextResponse.json({ error: "assessmentId required" }, { status: 400 })
  }

  const admin = getServiceClient()

  // Fetch the assessment that was just completed
  const { data: assessment } = await admin
    .from("assessments")
    .select("candidate_id, candidate_name, total_score, total_questions, overall_level, assessed_level, domain_scores, self_track, self_experience, tab_switches, personality_type, profile_visible, created_at")
    .eq("id", assessmentId)
    .eq("candidate_id", user.id)
    .single()

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
  }

  // Get all active hiring needs
  const { data: activeNeeds } = await admin
    .from("hiring_needs")
    .select("id, employer_id, company_name, title, track, required_skills, min_level, status")
    .eq("status", "active")

  if (!activeNeeds || activeNeeds.length === 0) {
    return NextResponse.json({ matched: 0, notified: 0 })
  }

  // Get candidate's best assessment per track (including this new one)
  const { data: allAssessments } = await admin
    .from("assessments")
    .select("candidate_id, candidate_name, total_score, total_questions, overall_level, assessed_level, domain_scores, self_track, self_experience, tab_switches, personality_type, profile_visible, created_at")
    .eq("candidate_id", user.id)
    .eq("profile_visible", true)

  if (!allAssessments || allAssessments.length === 0) {
    return NextResponse.json({ matched: 0, notified: 0 })
  }

  // Find the best assessment for this candidate
  let best = allAssessments[0]
  for (const a of allAssessments) {
    const aPct = a.total_questions > 0 ? a.total_score / a.total_questions : 0
    const bestPct = best.total_questions > 0 ? best.total_score / best.total_questions : 0
    if (aPct > bestPct) best = a
  }

  const domains = best.domain_scores as DomainScore[]
  if (!domains) {
    return NextResponse.json({ matched: 0, notified: 0 })
  }

  const profile: CandidateMatchProfile = {
    candidateId: user.id,
    name: best.candidate_name || user.email || "Candidate",
    overallPct: best.total_questions > 0 ? Math.round((best.total_score / best.total_questions) * 100) : 0,
    level: best.overall_level,
    assessedLevel: best.assessed_level,
    track: best.self_track,
    tabSwitches: best.tab_switches ?? 0,
    totalAssessments: allAssessments.length,
    domainScores: domains,
    personalityType: best.personality_type,
    selfExperience: best.self_experience,
    createdAt: best.created_at,
  }

  let totalNotified = 0
  let totalMatched = 0

  for (const need of activeNeeds) {
    const match = matchCandidateToNeed(profile, need.required_skills, need.min_level)

    if (match.matchPct < 40) continue
    totalMatched++

    // Check if notification already exists for this candidate + hiring need
    const { data: existing } = await admin
      .from("candidate_notifications")
      .select("id, match_pct")
      .eq("candidate_id", user.id)
      .eq("hiring_need_id", need.id)
      .limit(1)

    // Skip if already notified with same or better match
    if (existing && existing.length > 0) {
      if (existing[0].match_pct >= match.matchPct) continue
      // Update existing notification with improved match
      await admin
        .from("candidate_notifications")
        .update({
          match_pct: match.matchPct,
          skill_gaps: match.missingSkills,
          title: match.tier === "ready"
            ? `You're a top match for ${need.company_name}'s ${need.title}!`
            : `${need.company_name} is hiring — you're ${match.matchPct}% there`,
          message: match.tier === "ready"
            ? `Great news! You match ${match.matchPct}% of ${need.company_name}'s requirements for ${need.title}. Your profile is now visible to them.`
            : `Complete assessments in ${match.missingSkills.map(s => DOMAIN_LABELS[s] || s).join(", ")} to become a top candidate.`,
          read: false,
        })
        .eq("id", existing[0].id)
      totalNotified++
      continue
    }

    // Create new notification
    const trackLabel = TRACK_LABELS[need.track] || need.track
    const type = match.tier === "ready" ? "opportunity" : match.tier === "almost" ? "opportunity" : "skill_gap"

    await admin.from("candidate_notifications").insert({
      candidate_id: user.id,
      hiring_need_id: need.id,
      type,
      title: match.tier === "ready"
        ? `You're a top match for ${need.company_name}'s ${need.title}!`
        : `${need.company_name} is hiring a ${need.title}`,
      message: match.tier === "ready"
        ? `Great news! You match ${match.matchPct}% of their requirements for a ${trackLabel} position. Your profile is visible to them.`
        : `You match ${match.matchPct}% — strengthen ${match.missingSkills.map(s => DOMAIN_LABELS[s] || s).join(", ")} to improve your chances.`,
      skill_gaps: match.missingSkills,
      match_pct: match.matchPct,
    })
    totalNotified++
  }

  return NextResponse.json({ matched: totalMatched, notified: totalNotified })
}
