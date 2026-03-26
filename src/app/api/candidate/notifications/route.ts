import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

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

  const admin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: notifications } = await admin
    .from("candidate_notifications")
    .select("*")
    .eq("candidate_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const unreadCount = notifications?.filter(n => !n.read).length || 0

  const needIds = [...new Set((notifications || []).filter(n => n.hiring_need_id).map(n => n.hiring_need_id))]
  let needsMap: Record<string, { title: string; company_name: string; track: string; status: string }> = {}

  if (needIds.length > 0) {
    const { data: needs } = await admin
      .from("hiring_needs")
      .select("id, title, company_name, track, status")
      .in("id", needIds)

    if (needs) {
      for (const n of needs) {
        needsMap[n.id] = { title: n.title, company_name: n.company_name, track: n.track, status: n.status }
      }
    }
  }

  const enriched = (notifications || []).map(n => ({
    ...n,
    hiring_need: n.hiring_need_id ? needsMap[n.hiring_need_id] || null : null,
  }))

  return NextResponse.json({ notifications: enriched, unreadCount })
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { action, notificationId } = await req.json()

  if (action === "read" && notificationId) {
    await admin
      .from("candidate_notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .eq("candidate_id", user.id)
  }

  if (action === "read_all") {
    await admin
      .from("candidate_notifications")
      .update({ read: true })
      .eq("candidate_id", user.id)
      .eq("read", false)
  }

  return NextResponse.json({ success: true })
}
