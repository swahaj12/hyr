import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { type DomainScore, displayLevel, DOMAIN_LABELS } from "@/lib/scoring"
import { matchCandidateToNeed, type CandidateMatchProfile, type MatchResult, TRACK_LABELS } from "@/lib/talent-matching"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim())

function getServiceClient() {
  return createClient(supabaseUrl, serviceKey)
}

async function getAuthUser(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "")
  if (!token) return null
  const { createClient: createBrowserClient } = await import("@supabase/supabase-js")
  const client = createBrowserClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user } } = await client.auth.getUser(token)
  return user
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getServiceClient()
  const isAdmin = ADMIN_EMAILS.includes(user.email || "")
  const isEmployer = user.user_metadata?.role === "employer"

  if (!isEmployer && !isAdmin) {
    return NextResponse.json({ error: "Employer access required" }, { status: 403 })
  }

  const needId = req.nextUrl.searchParams.get("id")

  if (needId) {
    const { data: need } = await admin
      .from("hiring_needs")
      .select("*")
      .eq("id", needId)
      .single()

    if (!need) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (need.employer_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const matches = await computeMatches(admin, need)

    return NextResponse.json({ need, matches })
  }

  let query = admin.from("hiring_needs").select("*").order("created_at", { ascending: false })
  if (!isAdmin) {
    query = query.eq("employer_id", user.id)
  }

  const { data: needs } = await query
  return NextResponse.json({ needs: needs || [] })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isEmployer = user.user_metadata?.role === "employer"
  if (!isEmployer) {
    return NextResponse.json({ error: "Employer access required" }, { status: 403 })
  }

  const admin = getServiceClient()

  const { data: empProfile } = await admin
    .from("employer_profiles")
    .select("company_name, status")
    .eq("user_id", user.id)
    .single()

  if (!empProfile || empProfile.status !== "active") {
    return NextResponse.json({ error: "Employer account must be active" }, { status: 403 })
  }

  const body = await req.json()
  const { title, track, requiredSkills, preferredSkills, minLevel, urgency, description } = body

  if (!title || !track || !requiredSkills?.length) {
    return NextResponse.json({ error: "Title, track, and at least one required skill are needed" }, { status: 400 })
  }

  const { data: need, error: insertError } = await admin
    .from("hiring_needs")
    .insert({
      employer_id: user.id,
      company_name: empProfile.company_name,
      title,
      track,
      required_skills: requiredSkills,
      preferred_skills: preferredSkills || [],
      min_level: minLevel || "junior",
      urgency: urgency || "2weeks",
      description: description || null,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const matches = await computeMatches(admin, need)

  const nearMatches = matches.filter(m => m.tier === "almost")
  const readyMatches = matches.filter(m => m.tier === "ready")

  await admin
    .from("hiring_needs")
    .update({
      matches_count: readyMatches.length,
      near_matches_count: nearMatches.length,
    })
    .eq("id", need.id)

  let notifiedCount = 0
  for (const match of nearMatches) {
    const missingLabels = match.missingSkills.map(s => DOMAIN_LABELS[s] || s).join(", ")
    const trackLabel = TRACK_LABELS[track] || track

    await admin.from("candidate_notifications").insert({
      candidate_id: match.candidate.candidateId,
      hiring_need_id: need.id,
      type: "opportunity",
      title: `${empProfile.company_name} is hiring a ${title}`,
      message: `A company is looking for a ${minLevel || "Junior"}+ ${trackLabel} Engineer. You match ${match.matchPct}% of their requirements. Complete assessments in ${missingLabels} to become a top candidate.`,
      skill_gaps: match.missingSkills,
      match_pct: match.matchPct,
    })
    notifiedCount++
  }

  for (const match of matches.filter(m => m.tier === "growing")) {
    const missingLabels = match.missingSkills.map(s => DOMAIN_LABELS[s] || s).join(", ")
    const trackLabel = TRACK_LABELS[track] || track

    await admin.from("candidate_notifications").insert({
      candidate_id: match.candidate.candidateId,
      hiring_need_id: need.id,
      type: "skill_gap",
      title: `New ${trackLabel} opportunity — build your skills`,
      message: `A company is hiring a ${title}. You match ${match.matchPct}% — strengthen ${missingLabels} to improve your chances.`,
      skill_gaps: match.missingSkills,
      match_pct: match.matchPct,
    })
    notifiedCount++
  }

  await admin
    .from("hiring_needs")
    .update({ notified_count: notifiedCount })
    .eq("id", need.id)

  return NextResponse.json({
    need,
    summary: {
      readyNow: readyMatches.length,
      almostThere: nearMatches.length,
      growing: matches.filter(m => m.tier === "growing").length,
      notified: notifiedCount,
    },
  })
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getServiceClient()
  const body = await req.json()
  const { id, status } = body

  if (!id || !status) {
    return NextResponse.json({ error: "ID and status required" }, { status: 400 })
  }

  const { data: need } = await admin
    .from("hiring_needs")
    .select("employer_id")
    .eq("id", id)
    .single()

  if (!need || need.employer_id !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  await admin
    .from("hiring_needs")
    .update({ status })
    .eq("id", id)

  return NextResponse.json({ success: true })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function computeMatches(
  admin: any,
  need: { track: string; required_skills: string[]; min_level: string },
): Promise<MatchResult[]> {
  const { data: assessments } = await admin
    .from("assessments")
    .select("candidate_id, candidate_name, total_score, total_questions, overall_level, assessed_level, domain_scores, self_track, self_experience, tab_switches, personality_type, profile_visible, created_at")
    .eq("profile_visible", true)

  if (!assessments) return []

  const candidateBest = new Map<string, typeof assessments[0]>()
  const candidateCounts = new Map<string, number>()

  for (const a of assessments) {
    candidateCounts.set(a.candidate_id, (candidateCounts.get(a.candidate_id) || 0) + 1)
    const existing = candidateBest.get(a.candidate_id)
    const aPct = a.total_questions > 0 ? a.total_score / a.total_questions : 0
    const existPct = existing ? existing.total_questions > 0 ? existing.total_score / existing.total_questions : 0 : -1
    if (aPct > existPct) {
      candidateBest.set(a.candidate_id, a)
    }
  }

  const results: MatchResult[] = []

  for (const [candidateId, best] of candidateBest) {
    const domains = best.domain_scores as DomainScore[]
    if (!domains) continue

    const profile: CandidateMatchProfile = {
      candidateId,
      name: best.candidate_name || `Candidate ${candidateId.slice(0, 6)}`,
      overallPct: best.total_questions > 0 ? Math.round((best.total_score / best.total_questions) * 100) : 0,
      level: best.overall_level,
      assessedLevel: best.assessed_level,
      track: best.self_track,
      tabSwitches: best.tab_switches ?? 0,
      totalAssessments: candidateCounts.get(candidateId) || 1,
      domainScores: domains,
      personalityType: best.personality_type,
      selfExperience: best.self_experience,
      createdAt: best.created_at,
    }

    const match = matchCandidateToNeed(profile, need.required_skills, need.min_level)
    if (match.matchPct >= 40) {
      results.push(match)
    }
  }

  results.sort((a, b) => b.matchPct - a.matchPct)
  return results
}
