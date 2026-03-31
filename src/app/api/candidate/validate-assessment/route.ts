import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Validation thresholds
const MIN_TOTAL_TIME_MS = 180_000 // 3 minutes minimum for 40 questions
const MIN_AVG_ANSWER_MS = 2_000 // 2 seconds minimum per question
const MAX_ASSESSMENTS_PER_TRACK_PER_DAY = 1
const MAX_ASSESSMENTS_PER_IP_PER_DAY = 3

type IntegrityFlag = "clean" | "suspicious" | "flagged"

type ValidationResult = {
  flag: IntegrityFlag
  reasons: string[]
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
  const { assessmentId, track, answers } = body

  if (!assessmentId || !track) {
    return NextResponse.json({ error: "assessmentId and track required" }, { status: 400 })
  }

  const admin = createClient(supabaseUrl, serviceKey)
  const reasons: string[] = []

  // 1. Check rate limit: max 1 assessment per track per 24h
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString()
  const { data: recentByTrack } = await admin
    .from("assessments")
    .select("id")
    .eq("candidate_id", user.id)
    .eq("self_track", track)
    .gte("created_at", oneDayAgo)

  if (recentByTrack && recentByTrack.length > MAX_ASSESSMENTS_PER_TRACK_PER_DAY) {
    reasons.push(`More than ${MAX_ASSESSMENTS_PER_TRACK_PER_DAY} assessment in same track within 24h`)
  }

  // 2. Check IP-based rate limit
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  if (clientIp !== "unknown") {
    const { data: recentByIp } = await admin
      .from("assessments")
      .select("id")
      .gte("created_at", oneDayAgo)

    // Approximate IP check — in production, store IP in assessments table
    // For now, check total recent assessments by this user
    const { data: recentByUser } = await admin
      .from("assessments")
      .select("id")
      .eq("candidate_id", user.id)
      .gte("created_at", oneDayAgo)

    if (recentByUser && recentByUser.length > MAX_ASSESSMENTS_PER_IP_PER_DAY) {
      reasons.push(`More than ${MAX_ASSESSMENTS_PER_IP_PER_DAY} assessments in 24h`)
    }
  }

  // 3. Check timing from answers (if provided)
  if (answers && Array.isArray(answers) && answers.length > 0) {
    const totalTimeMs = answers.reduce((sum: number, a: { time_taken_ms?: number }) => sum + (a.time_taken_ms || 0), 0)
    const avgTimeMs = totalTimeMs / answers.length

    if (totalTimeMs < MIN_TOTAL_TIME_MS) {
      reasons.push(`Total time ${Math.round(totalTimeMs / 1000)}s is below minimum ${Math.round(MIN_TOTAL_TIME_MS / 1000)}s`)
    }

    if (avgTimeMs < MIN_AVG_ANSWER_MS) {
      reasons.push(`Average answer time ${Math.round(avgTimeMs / 1000)}s is below minimum ${Math.round(MIN_AVG_ANSWER_MS / 1000)}s`)
    }

    // Check for suspiciously fast answers (>80% under 1 second)
    const veryFastAnswers = answers.filter((a: { time_taken_ms?: number }) => (a.time_taken_ms || 0) < 1000)
    if (veryFastAnswers.length > answers.length * 0.8) {
      reasons.push(`${veryFastAnswers.length}/${answers.length} answers under 1 second`)
    }
  }

  // Determine flag level
  let flag: IntegrityFlag = "clean"
  if (reasons.length >= 3) {
    flag = "flagged"
  } else if (reasons.length >= 1) {
    flag = "suspicious"
  }

  // Update assessment with integrity flag
  if (assessmentId) {
    await admin
      .from("assessments")
      .update({ integrity_flag: flag })
      .eq("id", assessmentId)
      .eq("candidate_id", user.id)
  }

  return NextResponse.json({ flag, reasons })
}
