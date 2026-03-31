import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function getAuthUser(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "")
  if (!token) return null
  const client = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user } } = await client.auth.getUser(token)
  return user
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.user_metadata?.role !== "employer") {
    return NextResponse.json({ error: "Employer access required" }, { status: 403 })
  }

  const admin = createClient(supabaseUrl, serviceKey)

  const { data: shortlists, error } = await admin
    .from("shortlists")
    .select("*")
    .eq("employer_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ shortlists: shortlists || [] })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.user_metadata?.role !== "employer") {
    return NextResponse.json({ error: "Employer access required" }, { status: 403 })
  }

  const admin = createClient(supabaseUrl, serviceKey)
  const body = await req.json()
  const { candidateId, hiringNeedId, notes } = body

  if (!candidateId) {
    return NextResponse.json({ error: "candidateId required" }, { status: 400 })
  }

  const { data, error } = await admin
    .from("shortlists")
    .upsert({
      employer_id: user.id,
      candidate_id: candidateId,
      hiring_need_id: hiringNeedId || null,
      notes: notes || null,
    }, {
      onConflict: "employer_id,candidate_id",
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ shortlist: data })
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const candidateId = req.nextUrl.searchParams.get("candidateId")
  if (!candidateId) {
    return NextResponse.json({ error: "candidateId required" }, { status: 400 })
  }

  const admin = createClient(supabaseUrl, serviceKey)
  const { error } = await admin
    .from("shortlists")
    .delete()
    .eq("employer_id", user.id)
    .eq("candidate_id", candidateId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
