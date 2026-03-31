import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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

const VALID_STAGES = ["discovered", "contacted", "interviewing", "offered", "hired", "rejected"]

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.user_metadata?.role !== "employer") {
    return NextResponse.json({ error: "Employer access required" }, { status: 403 })
  }

  const admin = getServiceClient()

  const hiringNeedId = req.nextUrl.searchParams.get("hiring_need_id")
  let query = admin
    .from("pipeline_entries")
    .select("*")
    .eq("employer_id", user.id)
    .order("updated_at", { ascending: false })

  if (hiringNeedId) {
    query = query.eq("hiring_need_id", hiringNeedId)
  }

  const { data: entries, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enrich with candidate names
  if (entries && entries.length > 0) {
    const candidateIds = [...new Set(entries.map(e => e.candidate_id))]
    const { data: assessments } = await admin
      .from("assessments")
      .select("candidate_id, candidate_name, total_score, total_questions, overall_level, personality_type")
      .in("candidate_id", candidateIds)

    const candidateMap = new Map<string, { name: string; score: number; level: string; personality: string | null }>()
    if (assessments) {
      for (const a of assessments) {
        const existing = candidateMap.get(a.candidate_id)
        const pct = a.total_questions > 0 ? Math.round((a.total_score / a.total_questions) * 100) : 0
        if (!existing || pct > existing.score) {
          candidateMap.set(a.candidate_id, {
            name: a.candidate_name || `Candidate ${a.candidate_id.slice(0, 6)}`,
            score: pct,
            level: a.overall_level,
            personality: a.personality_type,
          })
        }
      }
    }

    const enriched = entries.map(e => ({
      ...e,
      candidate: candidateMap.get(e.candidate_id) || { name: "Unknown", score: 0, level: "", personality: null },
    }))

    return NextResponse.json({ entries: enriched })
  }

  return NextResponse.json({ entries: entries || [] })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.user_metadata?.role !== "employer") {
    return NextResponse.json({ error: "Employer access required" }, { status: 403 })
  }

  const admin = getServiceClient()
  const body = await req.json()
  const { candidateId, hiringNeedId, stage, notes } = body

  if (!candidateId) {
    return NextResponse.json({ error: "candidateId required" }, { status: 400 })
  }

  const entryStage = VALID_STAGES.includes(stage) ? stage : "discovered"

  const { data, error } = await admin
    .from("pipeline_entries")
    .upsert({
      employer_id: user.id,
      candidate_id: candidateId,
      hiring_need_id: hiringNeedId || null,
      stage: entryStage,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "employer_id,candidate_id,hiring_need_id",
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry: data })
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getServiceClient()
  const body = await req.json()
  const { id, stage, notes } = body

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (stage && VALID_STAGES.includes(stage)) update.stage = stage
  if (notes !== undefined) update.notes = notes

  const { error } = await admin
    .from("pipeline_entries")
    .update(update)
    .eq("id", id)
    .eq("employer_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const admin = getServiceClient()
  const { error } = await admin
    .from("pipeline_entries")
    .delete()
    .eq("id", id)
    .eq("employer_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
