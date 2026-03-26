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

    const { data: conversations, error: convErr } = await admin
      .from("conversations")
      .select("*")
      .order("created_at", { ascending: false })

    if (convErr || !conversations) {
      return NextResponse.json({ error: convErr?.message || "Failed to load" }, { status: 500 })
    }

    const employerIds = [...new Set(conversations.map(c => c.employer_id))]
    const candidateIds = [...new Set(conversations.map(c => c.candidate_id))]

    const [empResult, candResult, msgResult] = await Promise.all([
      employerIds.length > 0
        ? admin.from("employer_profiles").select("user_id, company_name").in("user_id", employerIds)
        : Promise.resolve({ data: [] }),
      candidateIds.length > 0
        ? admin.from("assessments").select("candidate_id, candidate_name").in("candidate_id", candidateIds)
        : Promise.resolve({ data: [] }),
      admin.from("messages").select("conversation_id, created_at, content, read, sender_id").order("created_at", { ascending: false }),
    ])

    const empMap: Record<string, string> = {}
    for (const e of (empResult.data || [])) {
      empMap[e.user_id] = e.company_name
    }

    const candMap: Record<string, string> = {}
    for (const c of (candResult.data || [])) {
      if (!candMap[c.candidate_id] && c.candidate_name) {
        candMap[c.candidate_id] = c.candidate_name
      }
    }

    type MsgRow = { conversation_id: string; created_at: string; content: string; read: boolean; sender_id: string }
    const msgsByConv: Record<string, MsgRow[]> = {}
    for (const m of (msgResult.data || []) as MsgRow[]) {
      if (!msgsByConv[m.conversation_id]) msgsByConv[m.conversation_id] = []
      msgsByConv[m.conversation_id].push(m)
    }

    const enriched = conversations.map(conv => {
      const msgs = msgsByConv[conv.id] || []
      const lastMsg = msgs[0] || null
      return {
        id: conv.id,
        employerName: empMap[conv.employer_id] || "Unknown Employer",
        candidateName: candMap[conv.candidate_id] || "Unknown Candidate",
        employerId: conv.employer_id,
        candidateId: conv.candidate_id,
        messageCount: msgs.length,
        lastMessage: lastMsg?.content || null,
        lastMessageAt: lastMsg?.created_at || conv.created_at,
        createdAt: conv.created_at,
      }
    })

    return NextResponse.json({ conversations: enriched })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
