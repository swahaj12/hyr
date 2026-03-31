"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { PageLoading } from "@/components/loading"

type ConversationOverview = {
  id: string
  employerName: string
  candidateName: string
  messageCount: number
  lastMessage: string | null
  lastMessageAt: string
  createdAt: string
}

type SupportTicket = {
  id: string
  user_id: string
  user_email: string
  user_role: string
  subject: string
  status: string
  created_at: string
  resolved_at: string | null
}

type SupportMessage = {
  id: string
  ticket_id: string
  sender_id: string
  is_admin: boolean
  content: string
  created_at: string
}

type SupportTab = "conversations" | "tickets"

export default function AdminSupportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [activeTab, setActiveTab] = useState<SupportTab>("tickets")
  const [conversations, setConversations] = useState<ConversationOverview[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [sessionToken, setSessionToken] = useState("")
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({})
  const [replying, setReplying] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push("/admin/login"); return }

        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token || ""

        const verifyRes = await fetch("/api/admin/verify", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const { isAdmin } = await verifyRes.json()
        if (!isAdmin) {
          setAuthorized(false); setLoading(false); return
        }
        setAuthorized(true)
        setSessionToken(token)

        const [convsRes, ticketsRes] = await Promise.all([
          fetch("/api/admin/conversations", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
          fetch("/api/admin/support", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        ])

        if (convsRes?.ok) {
          const { conversations: data } = await convsRes.json()
          if (data) setConversations(data)
        }

        if (ticketsRes?.ok) {
          const { tickets: tData, messages: mData } = await ticketsRes.json()
          if (tData) setTickets(tData)
          if (mData) setMessages(mData)
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [router])

  async function handleTicketAction(ticketId: string, action: "resolve" | "reopen") {
    try {
      const res = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ action, ticketId }),
      })
      if (res.ok) {
        setTickets(prev => prev.map(t =>
          t.id === ticketId ? { ...t, status: action === "resolve" ? "resolved" : "open" } : t
        ))
      }
    } catch { /* ignore */ }
  }

  async function handleReply(ticketId: string) {
    const text = replyTexts[ticketId] || ""
    if (!text.trim()) return
    setReplying(true)
    try {
      const res = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ action: "reply", ticketId, message: text }),
      })
      if (res.ok) {
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          ticket_id: ticketId,
          sender_id: "admin",
          is_admin: true,
          content: text.trim(),
          created_at: new Date().toISOString(),
        }])
        setReplyTexts(prev => ({ ...prev, [ticketId]: "" }))
      }
    } catch { /* ignore */ }
    setReplying(false)
  }

  if (loading) return <><Navbar /><PageLoading /></>

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-lg font-semibold">Access Denied</p>
            <Link href="/admin/login"><Button>Admin Sign In</Button></Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const openTickets = tickets.filter(t => t.status === "open")

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6 pb-20 sm:pb-8">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-muted-foreground hover:text-gray-950 dark:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Support & Oversight</h1>
            <p className="text-muted-foreground text-sm">Monitor conversations and manage support tickets</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit">
          <Button
            variant={activeTab === "tickets" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("tickets")}
            className="relative"
          >
            Support Tickets ({tickets.length})
            {openTickets.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {openTickets.length}
              </span>
            )}
          </Button>
          <Button
            variant={activeTab === "conversations" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("conversations")}
          >
            Conversation Oversight ({conversations.length})
          </Button>
        </div>

        {/* ==================== TICKETS TAB ==================== */}
        {activeTab === "tickets" && (
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground text-center py-8">No support tickets yet.</p>
                </CardContent>
              </Card>
            ) : (
              tickets.map(ticket => {
                const ticketMessages = messages.filter(m => m.ticket_id === ticket.id)
                const isExpanded = expandedTicket === ticket.id
                return (
                  <Card key={ticket.id} className={ticket.status === "open" ? "border-amber-200 dark:border-amber-800" : ""}>
                    <CardContent className="pt-5 pb-4">
                      <div
                        className="flex items-start justify-between gap-3 cursor-pointer"
                        onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm">{ticket.subject}</p>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                ticket.status === "open"
                                  ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                  : "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                              }`}
                            >
                              {ticket.status}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {ticket.user_role}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {ticket.user_email} — {new Date(ticket.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{ticketMessages.length} msg{ticketMessages.length !== 1 ? "s" : ""}</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            className={`text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          >
                            <path d="m6 9 6 6 6-6"/>
                          </svg>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 space-y-3">
                          <div className="border-t pt-3 space-y-2 max-h-64 overflow-y-auto">
                            {ticketMessages.map(msg => (
                              <div key={msg.id} className={`rounded-lg p-3 text-sm ${msg.is_admin ? "bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800 ml-4" : "bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 mr-4"}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    {msg.is_admin ? "Admin" : ticket.user_email}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {new Date(msg.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Reply to this ticket..."
                              value={replyTexts[ticket.id] || ""}
                              onChange={(e) => setReplyTexts(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(ticket.id) } }}
                              className="flex-1 border rounded-md px-3 py-2 text-sm"
                            />
                            <Button
                              size="sm"
                              disabled={replying || !(replyTexts[ticket.id] || "").trim()}
                              onClick={() => handleReply(ticket.id)}
                            >
                              {replying ? "..." : "Reply"}
                            </Button>
                          </div>

                          <div className="flex gap-2">
                            {ticket.status === "open" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTicketAction(ticket.id, "resolve")}
                                className="text-green-600"
                              >
                                Mark Resolved
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTicketAction(ticket.id, "reopen")}
                                className="text-amber-600"
                              >
                                Reopen
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        )}

        {/* ==================== CONVERSATIONS TAB ==================== */}
        {activeTab === "conversations" && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">All Employer-Candidate Conversations</CardTitle>
                <CardDescription className="text-xs">Read-only oversight of all messaging activity on the platform</CardDescription>
              </CardHeader>
            </Card>

            {conversations.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground text-center py-8">No conversations yet.</p>
                </CardContent>
              </Card>
            ) : (
              conversations.map(conv => (
                <Link key={conv.id} href={`/admin/support/conversation/${conv.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer mb-3">
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{conv.employerName}</p>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                            <p className="font-semibold text-sm">{conv.candidateName}</p>
                          </div>
                          {conv.lastMessage && (
                            <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">{conv.lastMessage}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <Badge variant="outline" className="text-[10px]">{conv.messageCount} msg{conv.messageCount !== 1 ? "s" : ""}</Badge>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(conv.lastMessageAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
