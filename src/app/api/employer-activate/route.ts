import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim())

export async function POST(req: NextRequest) {
  try {
    const { employerProfileId, action } = await req.json() as {
      employerProfileId: string
      action: "activate" | "reject"
    }

    if (!employerProfileId || !["activate", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json({ error: "Server config missing" }, { status: 500 })
    }

    const authHeader = req.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""))
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const newStatus = action === "activate" ? "active" : "rejected"
    const { error: updateErr } = await adminClient
      .from("employer_profiles")
      .update({
        status: newStatus,
        activated_at: action === "activate" ? new Date().toISOString() : null,
      })
      .eq("id", employerProfileId)

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
