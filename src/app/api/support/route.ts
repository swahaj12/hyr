import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const authHeader = req.headers.get("authorization")
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user } } = await client.auth.getUser(authHeader.replace("Bearer ", ""))
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const serviceClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: tickets } = await serviceClient
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    const ticketIds = (tickets || []).map(t => t.id)
    let messages: Record<string, unknown>[] = []
    if (ticketIds.length > 0) {
      const { data: msgs } = await serviceClient
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const authHeader = req.headers.get("authorization")
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user } } = await client.auth.getUser(authHeader.replace("Bearer ", ""))
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { action, ticketId, subject, message } = await req.json()
    const serviceClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    if (action === "create") {
      if (!subject || !message) {
        return NextResponse.json({ error: "Subject and message required" }, { status: 400 })
      }

      const role = user.user_metadata?.role || "candidate"

      const { data: ticket, error: ticketErr } = await serviceClient
        .from("support_tickets")
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_role: role,
          subject: subject.trim(),
        })
        .select()
        .single()

      if (ticketErr || !ticket) {
        return NextResponse.json({ error: ticketErr?.message || "Failed" }, { status: 500 })
      }

      await serviceClient.from("support_messages").insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        is_admin: false,
        content: message.trim(),
      })

      return NextResponse.json({ ticket })
    }

    if (action === "reply") {
      if (!ticketId || !message) {
        return NextResponse.json({ error: "Ticket ID and message required" }, { status: 400 })
      }

      const { data: ticket } = await serviceClient
        .from("support_tickets")
        .select("user_id")
        .eq("id", ticketId)
        .single()

      if (!ticket || ticket.user_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      await serviceClient.from("support_messages").insert({
        ticket_id: ticketId,
        sender_id: user.id,
        is_admin: false,
        content: message.trim(),
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
