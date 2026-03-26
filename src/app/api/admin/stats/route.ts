import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim())

export async function GET(req: NextRequest) {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json({ error: "Server config missing" }, { status: 500 })
    }

    const authHeader = req.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""))
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)

    const [convResult, msgResult, ticketResult] = await Promise.all([
      admin.from("conversations").select("id, employer_id, candidate_id, created_at"),
      admin.from("messages").select("id, conversation_id, created_at, read"),
      admin.from("support_tickets").select("id, status, created_at"),
    ])

    const conversations = convResult.data || []
    const messages = msgResult.data || []
    const tickets = ticketResult.data || []

    const totalConversations = conversations.length
    const totalMessages = messages.length
    const avgMessagesPerConv = totalConversations > 0
      ? Math.round(totalMessages / totalConversations * 10) / 10
      : 0

    const activeConversations = new Set(messages.map(m => m.conversation_id)).size

    const openTickets = tickets.filter(t => t.status === "open").length
    const resolvedTickets = tickets.filter(t => t.status === "resolved").length

    return NextResponse.json({
      conversations: {
        total: totalConversations,
        active: activeConversations,
        totalMessages,
        avgMessagesPerConv,
      },
      support: {
        total: tickets.length,
        open: openTickets,
        resolved: resolvedTickets,
      },
    })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
