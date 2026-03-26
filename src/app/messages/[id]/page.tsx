"use client"

import { useEffect, useState, useRef, type FormEvent } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { getMessages, sendMessage, markMessagesRead, type Message } from "@/lib/messaging"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { PageLoading } from "@/components/loading"

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

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as string

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [otherName, setOtherName] = useState("User")
  const [otherRole, setOtherRole] = useState<"employer" | "candidate">("candidate")
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth")
        return
      }
      setUserId(user.id)

      const { data: conv } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single()

      if (!conv || (conv.employer_id !== user.id && conv.candidate_id !== user.id)) {
        router.push("/messages")
        return
      }

      const isEmployer = conv.employer_id === user.id
      const otherId = isEmployer ? conv.candidate_id : conv.employer_id
      setOtherRole(isEmployer ? "candidate" : "employer")

      if (isEmployer) {
        const { data: assess } = await supabase
          .from("assessments")
          .select("candidate_name")
          .eq("candidate_id", otherId)
          .limit(1)
          .single()
        setOtherName(assess?.candidate_name || "Candidate")
      } else {
        const { data: empProfile } = await supabase
          .from("employer_profiles")
          .select("company_name")
          .eq("user_id", otherId)
          .single()
        setOtherName(empProfile?.company_name || "Employer")
      }

      const msgs = await getMessages(conversationId)
      setMessages(msgs)
      await markMessagesRead(conversationId, user.id)
      setLoading(false)
    }
    load()
  }, [conversationId, router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          if (newMsg.sender_id !== userId) {
            markMessagesRead(conversationId, userId)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, userId])

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !userId || sending) return

    setSending(true)
    const content = newMessage.trim()
    setNewMessage("")

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: userId,
      content,
      read: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    await sendMessage(conversationId, userId, content)
    setSending(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend(e as unknown as FormEvent)
    }
  }

  if (loading) {
    return <><Navbar /><PageLoading /></>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Chat Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/messages" className="text-gray-500 hover:text-gray-900 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <div className="w-9 h-9 rounded-full bg-gray-950 text-white flex items-center justify-center text-sm font-bold shrink-0">
            {otherName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-sm">{otherName}</p>
            <p className="text-xs text-muted-foreground capitalize">{otherRole}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          )}
          {messages.map(msg => {
            const isMine = msg.sender_id === userId
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    isMine
                      ? "bg-gray-950 text-white rounded-br-md"
                      : "bg-white border border-gray-200 text-gray-900 rounded-bl-md"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? "text-gray-400" : "text-muted-foreground"}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white pb-safe">
        <form onSubmit={handleSend} className="max-w-2xl mx-auto px-4 py-3 flex gap-2">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 focus:bg-white"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="rounded-xl px-5"
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  )
}
