import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function getUser(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "")
  if (!token) return null
  const client = createClient(supabaseUrl, anonKey)
  const { data: { user } } = await client.auth.getUser(token)
  return user
}

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ error: "Server config missing" }, { status: 500 })
  const admin = createClient(supabaseUrl, serviceKey)

  const { data: profile } = await admin
    .from("candidate_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single()

  return NextResponse.json({ profile: profile || null })
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ error: "Server config missing" }, { status: 500 })
  const admin = createClient(supabaseUrl, serviceKey)

  const body = await req.json()
  const { name, track, experience, skills, headline, linkedinUrl, resumeUrl } = body

  if (!name || !track || !experience || !skills || skills.length < 3) {
    return NextResponse.json({ error: "Name, track, experience, and at least 3 skills are required" }, { status: 400 })
  }

  const { data: existing } = await admin
    .from("candidate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (existing) {
    const { data: updated, error } = await admin
      .from("candidate_profiles")
      .update({
        name,
        track,
        experience,
        skills,
        headline: headline || null,
        linkedin_url: linkedinUrl || null,
        resume_url: resumeUrl || null,
      })
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ profile: updated })
  }

  const { data: created, error } = await admin
    .from("candidate_profiles")
    .insert({
      user_id: user.id,
      name,
      track,
      experience,
      skills,
      headline: headline || null,
      linkedin_url: linkedinUrl || null,
      resume_url: resumeUrl || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: created })
}

export async function PATCH(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ error: "Server config missing" }, { status: 500 })
  const admin = createClient(supabaseUrl, serviceKey)

  const body = await req.json()

  // Whitelist allowed fields to prevent mass assignment
  const allowedFields = ["name", "track", "experience", "skills", "headline", "linkedin_url", "resume_url"] as const
  const safeUpdate: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (key in body) {
      safeUpdate[key] = body[key]
    }
  }

  if (Object.keys(safeUpdate).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
  }

  const { error } = await admin
    .from("candidate_profiles")
    .update(safeUpdate)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
