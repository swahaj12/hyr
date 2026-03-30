import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean)

async function verifyAdmin(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const authHeader = req.headers.get("authorization")
  if (!authHeader) return null

  const client = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user } } = await client.auth.getUser(authHeader.replace("Bearer ", ""))
  if (!user || !ADMIN_EMAILS.includes(user.email || "")) return null
  return user
}

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAdmin(req)
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: tickets } = await admin
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false })

    const ticketIds = (tickets || []).map(t => t.id)
    let messages: Record<string, unknown>[] = []
    if (ticketIds.length > 0) {
      const { data: msgs } = await admin
        .from("support_messages")
        .select("*")
        .in("ticket_id", ticketIds)
        .order("created_at", { ascending: true })
      messages = msgs || []
    }

    return NextResponse.json({ tickets: tickets || [], messages })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAdmin(req)
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { action, ticketId, message } = await req.json()
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    if (action === "reply") {
      if (!ticketId || !message) {
        return NextResponse.json({ error: "Ticket ID and message required" }, { status: 400 })
      }

      await admin.from("support_messages").insert({
        ticket_id: ticketId,
        sender_id: user.id,
        is_admin: true,
        content: message.trim(),
      })

      return NextResponse.json({ success: true })
    }

    if (action === "resolve" || action === "reopen") {
      if (!ticketId) {
        return NextResponse.json({ error: "Ticket ID required" }, { status: 400 })
      }

      await admin
        .from("support_tickets")
        .update({
          status: action === "resolve" ? "resolved" : "open",
          resolved_at: action === "resolve" ? new Date().toISOString() : null,
        })
        .eq("id", ticketId)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
