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

  // Parallel data fetching
  const [
    { data: hiringNeeds },
    { data: pipeline },
    { data: shortlists },
    { data: profileViews },
    { data: conversations },
    { data: messages },
  ] = await Promise.all([
    admin.from("hiring_needs").select("id, title, track, status, matches_count, near_matches_count, notified_count, created_at, expires_at").eq("employer_id", user.id),
    admin.from("pipeline_entries").select("id, candidate_id, stage, created_at, updated_at").eq("employer_id", user.id),
    admin.from("shortlists").select("id, created_at").eq("employer_id", user.id),
    admin.from("profile_views").select("id, candidate_id, created_at").eq("viewer_id", user.id),
    admin.from("conversations").select("id, candidate_id, created_at").eq("employer_id", user.id),
    admin.from("messages").select("id, conversation_id, sender_id, created_at, read").in(
      "conversation_id",
      (await admin.from("conversations").select("id").eq("employer_id", user.id)).data?.map(c => c.id) || []
    ),
  ])

  const needs = hiringNeeds || []
  const pipes = pipeline || []
  const shorts = shortlists || []
  const views = profileViews || []
  const convos = conversations || []
  const msgs = messages || []

  // Pipeline funnel
  const stages = ["discovered", "contacted", "interviewing", "offered", "hired", "rejected"]
  const funnel = stages.map(stage => ({
    stage,
    count: pipes.filter(p => p.stage === stage).length,
  }))

  // Hiring needs summary
  const activeNeeds = needs.filter(n => n.status === "active").length
  const totalMatches = needs.reduce((sum, n) => sum + (n.matches_count || 0), 0)
  const totalNearMatches = needs.reduce((sum, n) => sum + (n.near_matches_count || 0), 0)

  // Messaging stats
  const sentMessages = msgs.filter(m => m.sender_id === user.id).length
  const receivedMessages = msgs.filter(m => m.sender_id !== user.id).length
  const unreadMessages = msgs.filter(m => m.sender_id !== user.id && !m.read).length
  const responseRate = sentMessages > 0 && receivedMessages > 0
    ? Math.round((Math.min(sentMessages, receivedMessages) / Math.max(sentMessages, receivedMessages)) * 100)
    : 0

  // Time to first message (avg days from profile view to first conversation)
  let avgTimeToFirstMessage = 0
  if (convos.length > 0 && views.length > 0) {
    const viewMap = new Map<string, string>()
    for (const v of views) {
      if (!viewMap.has(v.candidate_id) || v.created_at < viewMap.get(v.candidate_id)!) {
        viewMap.set(v.candidate_id, v.created_at)
      }
    }
    let totalDays = 0
    let count = 0
    for (const c of convos) {
      const firstView = viewMap.get(c.candidate_id)
      if (firstView) {
        const days = (new Date(c.created_at).getTime() - new Date(firstView).getTime()) / 86400000
        if (days >= 0) {
          totalDays += days
          count++
        }
      }
    }
    avgTimeToFirstMessage = count > 0 ? Math.round((totalDays / count) * 10) / 10 : 0
  }

  // Activity over last 30 days (daily counts)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
  const recentViews = views.filter(v => new Date(v.created_at) > thirtyDaysAgo).length
  const recentMessages = msgs.filter(m => new Date(m.created_at) > thirtyDaysAgo && m.sender_id === user.id).length

  // Weekly activity chart (last 8 weeks)
  const weeklyActivity: { week: string; views: number; messages: number; pipeline: number }[] = []
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(Date.now() - (i + 1) * 7 * 86400000)
    const weekEnd = new Date(Date.now() - i * 7 * 86400000)
    const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    weeklyActivity.push({
      week: label,
      views: views.filter(v => { const d = new Date(v.created_at); return d >= weekStart && d < weekEnd }).length,
      messages: msgs.filter(m => { const d = new Date(m.created_at); return d >= weekStart && d < weekEnd && m.sender_id === user.id }).length,
      pipeline: pipes.filter(p => { const d = new Date(p.created_at); return d >= weekStart && d < weekEnd }).length,
    })
  }

  return NextResponse.json({
    summary: {
      activeNeeds,
      totalNeeds: needs.length,
      totalMatches,
      totalNearMatches,
      pipelineTotal: pipes.length,
      hired: pipes.filter(p => p.stage === "hired").length,
      shortlisted: shorts.length,
      profileViewsTotal: views.length,
      conversationsTotal: convos.length,
      messagesTotal: msgs.length,
      unreadMessages,
    },
    funnel,
    messaging: {
      sent: sentMessages,
      received: receivedMessages,
      responseRate,
      avgTimeToFirstMessage,
    },
    activity: {
      recentViews,
      recentMessages,
      weeklyActivity,
    },
  })
}
