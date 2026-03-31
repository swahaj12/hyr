"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { displayLevel } from "@/lib/scoring"
import { PageTransition, FadeIn, StaggerList, staggerItem } from "@/components/motion-primitives"
import { motion } from "motion/react"

type PipelineEntry = {
  id: string
  candidate_id: string
  hiring_need_id: string | null
  stage: string
  notes: string | null
  updated_at: string
  candidate: { name: string; score: number; level: string; personality: string | null }
}

const STAGES = [
  { key: "discovered", label: "Discovered", color: "bg-gray-100 text-gray-700 border-gray-200", emoji: "🔍" },
  { key: "contacted", label: "Contacted", color: "bg-blue-50 text-blue-700 border-blue-200", emoji: "💬" },
  { key: "interviewing", label: "Interviewing", color: "bg-violet-50 text-violet-700 border-violet-200", emoji: "🎯" },
  { key: "offered", label: "Offered", color: "bg-amber-50 text-amber-700 border-amber-200", emoji: "📋" },
  { key: "hired", label: "Hired", color: "bg-emerald-50 text-emerald-700 border-emerald-200", emoji: "✅" },
  { key: "rejected", label: "Passed", color: "bg-red-50 text-red-700 border-red-200", emoji: "✗" },
]

export default function PipelinePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<PipelineEntry[]>([])
  const [token, setToken] = useState("")

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth"); return }
      if (user.user_metadata?.role !== "employer") { router.push("/dashboard"); return }

      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token || ""
      setToken(accessToken)

      try {
        const res = await fetch("/api/pipeline", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        const data = await res.json()
        setEntries(data.entries || [])
      } catch { /* ignore */ }

      setLoading(false)
    }
    load()
  }, [router])

  async function moveStage(entryId: string, newStage: string) {
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, stage: newStage, updated_at: new Date().toISOString() } : e))
    await fetch("/api/pipeline", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: entryId, stage: newStage }),
    })
  }

  async function removeEntry(entryId: string) {
    setEntries(prev => prev.filter(e => e.id !== entryId))
    await fetch(`/api/pipeline?id=${entryId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-64" />
              <div className="grid grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </>
    )
  }

  const total = entries.length
  const hiredCount = entries.filter(e => e.stage === "hired").length

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <PageTransition>
          <div className="max-w-7xl mx-auto px-4">
            <FadeIn>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Hiring Pipeline</h1>
                  <p className="text-gray-500 mt-1">
                    {total} candidate{total !== 1 ? "s" : ""} in pipeline
                    {hiredCount > 0 && ` · ${hiredCount} hired`}
                  </p>
                </div>
                <Link href="/employers">
                  <Button variant="outline">Browse Candidates</Button>
                </Link>
              </div>
            </FadeIn>

            {total === 0 ? (
              <FadeIn delay={0.1}>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12 space-y-4">
                      <div className="text-5xl">🔍</div>
                      <h2 className="text-xl font-semibold">No candidates in your pipeline yet</h2>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Browse candidates and add them to your pipeline to track your hiring progress.
                      </p>
                      <Link href="/employers">
                        <Button>Browse Candidates</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {STAGES.map(stage => {
                  const stageEntries = entries.filter(e => e.stage === stage.key)
                  return (
                    <div key={stage.key}>
                      <div className={`rounded-t-xl p-3 border ${stage.color} flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                          <span>{stage.emoji}</span>
                          <span className="font-semibold text-sm">{stage.label}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">{stageEntries.length}</Badge>
                      </div>
                      <div className="bg-white rounded-b-xl border border-t-0 min-h-[200px] p-2 space-y-2">
                        {stageEntries.map(entry => (
                          <div
                            key={entry.id}
                            className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:shadow-sm transition-shadow"
                          >
                            <Link href={`/profile/${entry.candidate_id}`}>
                              <p className="font-medium text-sm hover:text-blue-600 transition-colors">
                                {entry.candidate.name}
                              </p>
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{entry.candidate.score}%</span>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground">{displayLevel(entry.candidate.level)}</span>
                            </div>
                            {entry.candidate.personality && (
                              <p className="text-[10px] text-muted-foreground mt-1 truncate">{entry.candidate.personality}</p>
                            )}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {STAGES.filter(s => s.key !== stage.key && s.key !== "discovered").slice(0, 3).map(s => (
                                <button
                                  key={s.key}
                                  onClick={() => moveStage(entry.id, s.key)}
                                  className="text-[10px] px-2 py-0.5 rounded-full border hover:bg-gray-100 transition-colors"
                                  title={`Move to ${s.label}`}
                                >
                                  {s.emoji} {s.label}
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={() => removeEntry(entry.id)}
                              className="text-[10px] text-gray-400 hover:text-red-500 mt-1"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </PageTransition>
      </main>
    </>
  )
}
