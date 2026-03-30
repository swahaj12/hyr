"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { PageLoading } from "@/components/loading"

type MessageRow = {
  id: string
  sender_id: string
  content: string
  read: boolean
  created_at: string
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()

  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  if (isToday) return time
  if (isYesterday) return `Yesterday ${time}`
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${time}`
}

export default function AdminConversationViewerPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as string
  const bottomRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [employerName, setEmployerName] = useState("Employer")
  const [candidateName, setCandidateName] = useState("Candidate")
  const [employerId, setEmployerId] = useState("")
  const [candidateId, setCandidateId] = useState("")

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/admin"); return }

      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ""

      try {
        const verifyRes = await fetch("/api/admin/verify", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const { isAdmin } = await verifyRes.json()
        if (!isAdmin) { router.push("/admin"); return }
      } catch { router.push("/admin"); return }

      const res = await fetch(`/api/admin/conversations?id=${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) { router.push("/admin/support"); return }

      const { conversation: conv, messages: msgs } = await res.json()

      if (!conv) { router.push("/admin/support"); return }

      setEmployerName(conv.employerName)
      setCandidateName(conv.candidateName)
      setEmployerId(conv.employerId)
      setCandidateId(conv.candidateId)
      setMessages((msgs || []) as MessageRow[])
      setLoading(false)
    }
    load()
  }, [conversationId, router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (loading) return <><Navbar /><PageLoading /></>

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/admin/support" className="text-gray-500 hover:text-gray-900 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm">{employerName}</p>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              <p className="font-semibold text-sm">{candidateName}</p>
            </div>
            <p className="text-xs text-muted-foreground">Read-only oversight — {messages.length} messages</p>
          </div>
          <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Read Only</Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No messages in this conversation yet.</p>
            </div>
          )}
          {messages.map(msg => {
            const isEmployerMsg = msg.sender_id === employerId
            const senderLabel = isEmployerMsg ? employerName : candidateName
            const senderRole = isEmployerMsg ? "Employer" : "Candidate"

            return (
              <div key={msg.id} className={`flex ${isEmployerMsg ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    isEmployerMsg
                      ? "bg-purple-50 border border-purple-100 text-gray-900 rounded-bl-md"
                      : "bg-blue-50 border border-blue-100 text-gray-900 rounded-br-md"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold text-muted-foreground">{senderLabel}</span>
                    <Badge variant="outline" className="text-[8px] py-0 px-1">{senderRole}</Badge>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* No input — read only notice */}
      <div className="border-t border-gray-200 bg-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            Admin oversight mode — you cannot send messages in this conversation
          </p>
        </div>
      </div>
    </div>
  )
}
