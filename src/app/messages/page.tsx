"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { getConversations, type ConversationWithMeta } from "@/lib/messaging"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { PageLoading } from "@/components/loading"
import { FadeIn, StaggerList, staggerItem, PageTransition } from "@/components/motion-primitives"
import { motion } from "motion/react"

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function MessagesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth")
        return
      }
      setUserId(user.id)

      const convs = await getConversations(user.id)
      setConversations(convs)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return <><Navbar /><PageLoading /></>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <PageTransition>
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6 pb-20 sm:pb-0">
        <FadeIn>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground text-sm">Your conversations with {userId ? "employers and candidates" : "others"}</p>
        </FadeIn>

        {conversations.length === 0 ? (
          <FadeIn delay={0.15}>
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-3">
              <div className="text-4xl animate-float">✉️</div>
              <h2 className="text-lg font-semibold">No conversations yet</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                When an employer reaches out through your profile, the conversation will appear here.
              </p>
            </CardContent>
          </Card>
          </FadeIn>
        ) : (
          <StaggerList stagger={0.06} className="space-y-2">
            {conversations.map(conv => (
              <motion.div key={conv.id} variants={staggerItem}>
              <Link
                href={`/messages/${conv.id}`}
                className="block"
              >
                <Card className={`hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${conv.unreadCount > 0 ? "border-blue-200 bg-blue-50/50 animate-glow-pulse" : ""}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-950 text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {conv.otherName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <p className={`font-semibold text-sm ${conv.unreadCount > 0 ? "text-gray-950" : "text-gray-700"}`}>
                              {conv.otherName}
                            </p>
                            <Badge variant="outline" className="text-[10px]">
                              {conv.otherRole === "employer" ? "Company" : "Candidate"}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : ""}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className={`text-sm truncate ${conv.unreadCount > 0 ? "text-gray-900 font-medium" : "text-muted-foreground"}`}>
                            {conv.lastMessage || "No messages yet"}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="shrink-0 w-5 h-5 bg-blue-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              </motion.div>
            ))}
          </StaggerList>
        )}
      </main>
      </PageTransition>
    </div>
  )
}
