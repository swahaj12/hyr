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

  const convIds = convs.map(c => c.id)

  // Batch: get all messages for these conversations at once
  const { data: allMessages } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, created_at, read")
    .in("conversation_id", convIds)
    .order("created_at", { ascending: false })

  // Batch: get other user names
  const otherIds = new Set<string>()
  const convRoles = new Map<string, { isEmployer: boolean; otherId: string }>()
  for (const c of convs) {
    const isEmployer = c.employer_id === userId
    const otherId = isEmployer ? c.candidate_id : c.employer_id
    otherIds.add(otherId)
    convRoles.set(c.id, { isEmployer, otherId })
  }

  // Batch fetch candidate names
  const { data: candidateNames } = await supabase
    .from("assessments")
    .select("candidate_id, candidate_name")
    .in("candidate_id", Array.from(otherIds))

  // Batch fetch employer names
  const { data: employerNames } = await supabase
    .from("employer_profiles")
    .select("user_id, company_name")
    .in("user_id", Array.from(otherIds))

  const candidateNameMap = new Map<string, string>()
  if (candidateNames) {
    for (const c of candidateNames) {
      if (c.candidate_name) candidateNameMap.set(c.candidate_id, c.candidate_name)
    }
  }
  const employerNameMap = new Map<string, string>()
  if (employerNames) {
    for (const e of employerNames) {
      if (e.company_name) employerNameMap.set(e.user_id, e.company_name)
    }
  }

  const enriched: ConversationWithMeta[] = []

  for (const c of convs) {
    const role = convRoles.get(c.id)!
    const msgs = (allMessages || []).filter(m => m.conversation_id === c.id)
    const lastMsg = msgs[0] || null
    const unreadCount = msgs.filter(m => !m.read && m.sender_id !== userId).length

    let otherName = "User"
    if (role.isEmployer) {
      otherName = candidateNameMap.get(role.otherId) || "Candidate"
    } else {
      otherName = employerNameMap.get(role.otherId) || "Employer"
    }

    enriched.push({
      ...c,
      otherName,
      otherRole: role.isEmployer ? "candidate" : "employer",
      lastMessage: lastMsg?.content || null,
      lastMessageAt: lastMsg?.created_at || c.created_at,
      unreadCount,
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
