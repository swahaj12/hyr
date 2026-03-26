import { supabase } from "./supabase"

export type Conversation = {
  id: string
  employer_id: string
  candidate_id: string
  created_at: string
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  read: boolean
  created_at: string
}

export type ConversationWithMeta = Conversation & {
  otherName: string
  otherRole: "employer" | "candidate"
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
}

export async function getConversations(userId: string): Promise<ConversationWithMeta[]> {
  const { data: convs } = await supabase
    .from("conversations")
    .select("*")
    .or(`employer_id.eq.${userId},candidate_id.eq.${userId}`)
    .order("created_at", { ascending: false })

  if (!convs || convs.length === 0) return []

  const enriched: ConversationWithMeta[] = []

  for (const c of convs) {
    const isEmployer = c.employer_id === userId
    const otherId = isEmployer ? c.candidate_id : c.employer_id

    const { data: lastMsg } = await supabase
      .from("messages")
      .select("content, created_at")
      .eq("conversation_id", c.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", c.id)
      .eq("read", false)
      .neq("sender_id", userId)

    let otherName = "User"
    if (isEmployer) {
      const { data: assess } = await supabase
        .from("assessments")
        .select("candidate_name")
        .eq("candidate_id", otherId)
        .limit(1)
        .single()
      otherName = assess?.candidate_name || "Candidate"
    } else {
      const { data: empProfile } = await supabase
        .from("employer_profiles")
        .select("company_name")
        .eq("user_id", otherId)
        .single()
      otherName = empProfile?.company_name || "Employer"
    }

    enriched.push({
      ...c,
      otherName,
      otherRole: isEmployer ? "candidate" : "employer",
      lastMessage: lastMsg?.content || null,
      lastMessageAt: lastMsg?.created_at || c.created_at,
      unreadCount: count || 0,
    })
  }

  return enriched.sort((a, b) =>
    new Date(b.lastMessageAt || b.created_at).getTime() -
    new Date(a.lastMessageAt || a.created_at).getTime()
  )
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  return (data || []) as Message[]
}

export async function sendMessage(conversationId: string, senderId: string, content: string) {
  return supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: senderId,
    content: content.trim(),
  })
}

export async function markMessagesRead(conversationId: string, userId: string) {
  return supabase
    .from("messages")
    .update({ read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .eq("read", false)
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { data: convs } = await supabase
    .from("conversations")
    .select("id")
    .or(`employer_id.eq.${userId},candidate_id.eq.${userId}`)

  if (!convs || convs.length === 0) return 0

  const convIds = convs.map(c => c.id)
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("conversation_id", convIds)
    .eq("read", false)
    .neq("sender_id", userId)

  return count || 0
}
