"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Stats = {
  totalCandidates: number
  publicCandidates: number
  totalAssessments: number
  trackDistribution: { track: string; label: string; count: number; avgScore: number }[]
  levelDistribution: { level: string; count: number }[]
  topDomainScores: { domain: string; label: string; avgPct: number }[]
  topPercentileThreshold: Record<string, number>
  avgTabSwitches: number
  activeHiringNeeds: number
  activeEmployers: number
  skillsByTrack: Record<string, { domain: string; label: string; avgPct: number }[]>
}

const TRACK_COLORS: Record<string, string> = {
  devops: "bg-blue-500",
  frontend: "bg-violet-500",
  backend: "bg-emerald-500",
  qa: "bg-amber-500",
}

function ScoreBar({ label, pct, delay = 0 }: { label: string; pct: number; delay?: number }) {
  const color = pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : pct >= 30 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-32 text-right text-gray-600 dark:text-gray-400 truncate">{label}</span>
      <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${color} rounded-full`}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay }}
        />
      </div>
      <span className="text-sm w-10 text-gray-600 dark:text-gray-400 font-medium">{pct}%</span>
    </div>
  )
}

export default function TalentMarketPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTrack, setActiveTrack] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/talent-stats")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setStats(d)
          if (d.trackDistribution.length > 0) setActiveTrack(d.trackDistribution[0].track)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-gray-950 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <main className="max-w-lg mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Could not load talent market data. Please try again later.</p>
        </main>
      </div>
    )
  }

  const totalCandidates = stats.publicCandidates || stats.totalCandidates
  const trackSkills = activeTrack && stats.skillsByTrack ? stats.skillsByTrack[activeTrack] || [] : []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-4 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Live Data
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-950 dark:text-white"
          >
            Pakistan&apos;s Tech Talent Report
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto"
          >
            Real-time intelligence on Pakistan&apos;s verified tech talent pool, powered by Hyr assessments. Updated live.
          </motion.p>
        </div>

        {/* Top-level KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: totalCandidates, label: "Verified Engineers", color: "text-blue-600" },
            { value: stats.totalAssessments, label: "Assessments Completed", color: "text-violet-600" },
            { value: stats.activeEmployers, label: "Active Employers", color: "text-emerald-600" },
            { value: stats.activeHiringNeeds, label: "Open Positions", color: "text-amber-600" },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
            >
              <Card>
                <CardContent className="pt-5 pb-5 text-center">
                  <p className={`text-3xl sm:text-4xl font-bold ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{kpi.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Track distribution */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Talent by Track</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.trackDistribution.map(t => {
                const pct = totalCandidates > 0 ? Math.round((t.count / totalCandidates) * 100) : 0
                return (
                  <div key={t.track}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-950 dark:text-white">{t.label}</span>
                      <span className="text-muted-foreground">{t.count} engineers ({pct}%)</span>
                    </div>
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${TRACK_COLORS[t.track] || "bg-gray-500"} rounded-full`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Avg score: {t.avgScore}%</p>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Level Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.levelDistribution.map((l, i) => {
                const pct = totalCandidates > 0 ? Math.round((l.count / totalCandidates) * 100) : 0
                return (
                  <div key={l.level} className="flex items-center gap-3">
                    <span className="text-sm w-24 text-right text-gray-600 dark:text-gray-400">{l.level}</span>
                    <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gray-950 rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                      />
                    </div>
                    <span className="text-sm w-14 text-gray-600 dark:text-gray-400">{l.count} ({pct}%)</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Skills heatmap by track */}
        {stats.skillsByTrack && Object.keys(stats.skillsByTrack).length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle>Skill Proficiency by Track</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  {stats.trackDistribution.map(t => (
                    <button
                      key={t.track}
                      onClick={() => setActiveTrack(t.track)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        activeTrack === t.track
                          ? "bg-gray-950 text-white border-gray-950"
                          : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:border-gray-500"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {trackSkills.map((s, i) => (
                <ScoreBar key={s.domain} label={s.label} pct={s.avgPct} delay={i * 0.05} />
              ))}
              {trackSkills.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No data for this track yet.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Top 10% threshold */}
        {Object.keys(stats.topPercentileThreshold).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top 10% Threshold</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Score needed to be in the top 10% of candidates for each track
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(stats.topPercentileThreshold).map(([track, threshold]) => {
                  const label = stats.trackDistribution.find(t => t.track === track)?.label || track
                  return (
                    <div key={track} className="text-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                      <p className="text-3xl font-bold text-gray-950 dark:text-white">{threshold}%</p>
                      <p className="text-xs text-muted-foreground mt-1">{label}</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trust metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Assessment Integrity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-600">{stats.avgTabSwitches}</p>
                <p className="text-xs text-muted-foreground mt-1">Avg Tab Switches</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-950 dark:text-white">{stats.totalAssessments}</p>
                <p className="text-xs text-muted-foreground mt-1">Anti-Cheat Monitored</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{totalCandidates}</p>
                <p className="text-xs text-muted-foreground mt-1">Unique Engineers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="rounded-2xl bg-gray-950 text-white p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">Ready to hire from this talent pool?</h2>
          <p className="text-gray-400 mt-3 max-w-lg mx-auto">
            Post your hiring need and get instant matches from verified, pre-screened engineers.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/auth">
              <Button size="lg" className="bg-emerald-500 text-white hover:bg-emerald-400 border-0">
                Start Hiring
              </Button>
            </Link>
            <Link href="/for-employers">
              <Button size="lg" variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
