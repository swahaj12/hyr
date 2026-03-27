"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const },
  }),
}

type Stats = {
  totalCandidates: number
  publicCandidates: number
  totalAssessments: number
  trackDistribution: { track: string; label: string; count: number; avgScore: number }[]
  levelDistribution: { level: string; count: number }[]
  activeHiringNeeds: number
  activeEmployers: number
}

export default function ForEmployersPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [ctaHref, setCtaHref] = useState("/auth")

  useEffect(() => {
    fetch("/api/talent-stats")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d) })
      .catch(() => {})

    import("@/lib/supabase").then(({ supabase }) => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          const role = user.user_metadata?.role
          if (role === "employer") {
            setCtaHref("/employers/hiring-needs/new")
          } else {
            setCtaHref("/employers/setup")
          }
        }
      })
    })
  }, [])

  const totalCandidates = stats?.publicCandidates || stats?.totalCandidates || 0
  const totalAssessments = stats?.totalAssessments || 0

  return (
    <div className="min-h-screen">
      {/* HERO — Dark */}
      <section className="relative bg-gray-950 text-white overflow-hidden">
        <div className="absolute inset-0 hero-grid" />
        <motion.div
          className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, 15, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10">
          <Navbar />
          <div className="mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6 sm:pb-32 sm:pt-20 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-700/50 bg-emerald-950/50 px-4 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-sm mb-8">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  For Employers
                </span>
              </motion.div>

              <motion.h1 custom={1} initial="hidden" animate="visible" variants={fadeUp}
                className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
              >
                Stop screening.{" "}
                <span className="text-emerald-400">Start hiring.</span>
              </motion.h1>

              <motion.p custom={2} initial="hidden" animate="visible" variants={fadeUp}
                className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-gray-400 sm:text-lg"
              >
                The average tech hire in Pakistan takes 45 days and costs over 150K PKR in screening.
                With Hyr, you get pre-verified engineers matched to your exact requirements — and we actively develop near-match candidates for your role.
              </motion.p>

              <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}
                className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link href={ctaHref}>
                  <Button size="lg" className="h-12 px-8 text-base font-semibold bg-emerald-500 text-white hover:bg-emerald-400 border-0">
                    Start Hiring
                  </Button>
                </Link>
                <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors underline underline-offset-4">
                  See how it works
                </a>
              </motion.div>
            </div>

            {/* Live stats */}
            {stats && (
              <motion.div custom={4} initial="hidden" animate="visible" variants={fadeUp}
                className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto"
              >
                <div className="text-center rounded-xl border border-emerald-800/50 bg-emerald-950/30 backdrop-blur-sm px-4 py-4">
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{totalCandidates}</p>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Verified Engineers</p>
                </div>
                <div className="text-center rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm px-4 py-4">
                  <p className="text-2xl sm:text-3xl font-bold text-white">{totalAssessments}</p>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Assessments Done</p>
                </div>
                <div className="text-center rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm px-4 py-4">
                  <p className="text-2xl sm:text-3xl font-bold text-white">{stats.trackDistribution.length}</p>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Tech Tracks</p>
                </div>
                <div className="text-center rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm px-4 py-4">
                  <p className="text-2xl sm:text-3xl font-bold text-white">48h</p>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Avg Match Time</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-red-500">The Problem</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Hiring in Pakistan is broken
            </h2>
          </motion.div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              {
                stat: "500+",
                label: "applications per role",
                desc: "You post a job and drown in unqualified CVs. 80% can't do what they claim.",
                color: "text-red-600",
              },
              {
                stat: "45",
                label: "days average time-to-hire",
                desc: "Multiple screening rounds, take-home tests, technical interviews — and candidates still ghost.",
                color: "text-amber-600",
              },
              {
                stat: "3 of 5",
                label: "hires underperform in 90 days",
                desc: "Interview performance doesn't equal job performance. Fake skills cost you months.",
                color: "text-red-600",
              },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-gray-200 p-8"
              >
                <p className={`text-4xl font-bold ${item.color}`}>{item.stat}</p>
                <p className="text-sm font-medium text-gray-950 mt-1 uppercase tracking-wider">{item.label}</p>
                <p className="text-gray-600 mt-4 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* THE SOLUTION — Active Talent Marketplace */}
      <section id="how-it-works" className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">The Solution</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Hyr doesn&apos;t just match — it develops talent for your role
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600 text-lg">
              Post your hiring need. We instantly match verified engineers. And we notify near-match candidates to prepare — so your pipeline grows in real time.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                n: "1",
                title: "Post Your Hiring Need",
                body: "Select the role, track, and required skills. No job description writing — just pick what matters.",
                accent: "from-emerald-500 to-emerald-600",
              },
              {
                n: "2",
                title: "Instant Verified Matches",
                body: "See candidates who already match your requirements with verified skill scores, trust signals, and domain breakdowns.",
                accent: "from-blue-500 to-blue-600",
              },
              {
                n: "3",
                title: "Pipeline Grows Automatically",
                body: "Near-match candidates are notified to complete targeted assessments. New qualified candidates appear within 48 hours.",
                accent: "from-violet-500 to-violet-600",
              },
            ].map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="group relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${step.accent} text-white text-sm font-bold mb-5`}>
                  {step.n}
                </div>
                <h3 className="text-xl font-bold text-gray-950 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">What You Get</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                More than a job board. It&apos;s a hiring engine.
              </h2>
              <p className="mt-4 text-gray-600 text-lg leading-relaxed">
                Every candidate on Hyr has been through a timed, anti-cheat assessment. You see their actual skill DNA — not their resume writing ability.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  "Verified scores across 40+ technical domains",
                  "Trust indicators — tab switches, assessment count, consistency",
                  "Percentile rankings within each track",
                  "Engineering personality types that predict team fit",
                  "Real-time talent pipeline that grows for your specific role",
                  "Skip straight to final interview — we did the technical screening",
                ].map((item, i) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className="flex items-start gap-3"
                  >
                    <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs mt-0.5">&#10003;</span>
                    <span className="text-gray-700">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Mock employer dashboard preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-gray-200 bg-white shadow-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-gray-950">Senior Backend Engineer</p>
                  <p className="text-xs text-muted-foreground">Posted 2 hours ago</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">Active</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <p className="text-xl font-bold text-emerald-700">3</p>
                  <p className="text-[10px] text-emerald-600">Ready Now</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-xl font-bold text-blue-700">8</p>
                  <p className="text-[10px] text-blue-600">Almost There</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <p className="text-xl font-bold text-amber-700">12</p>
                  <p className="text-[10px] text-amber-600">Notified</p>
                </div>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs text-blue-800">
                  <strong>8 candidates</strong> have been notified to prepare for your requirements.
                  Expect updated matches within 48 hours.
                </p>
              </div>

              {[
                { name: "Sarah K.", match: 95, score: 82, tier: "Ready Now", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                { name: "Ahmed R.", match: 88, score: 76, tier: "Almost There", badge: "bg-blue-50 text-blue-700 border-blue-200" },
                { name: "Fatima A.", match: 75, score: 71, tier: "Almost There", badge: "bg-blue-50 text-blue-700 border-blue-200" },
              ].map(c => (
                <div key={c.name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-950 text-white flex items-center justify-center text-xs font-bold">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${c.badge}`}>{c.tier}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{c.match}% match</p>
                    <p className="text-[10px] text-muted-foreground">{c.score}% score</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="bg-gray-950 text-white py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">The Difference</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Traditional hiring vs Hyr
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-red-900/50 bg-red-950/20 p-8"
            >
              <p className="font-bold text-red-400 text-sm uppercase tracking-wider mb-6">Traditional Hiring</p>
              <ul className="space-y-4">
                {[
                  "Post job → 500+ random applications",
                  "3-5 screening rounds over 6 weeks",
                  "Candidates claim skills with no proof",
                  "Take-home tests that top candidates ignore",
                  "150K+ PKR recruiter fees per hire",
                  "3 of 5 hires underperform",
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-gray-400">
                    <span className="text-red-500 mt-0.5">&#10007;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-emerald-700/50 bg-emerald-950/20 p-8"
            >
              <p className="font-bold text-emerald-400 text-sm uppercase tracking-wider mb-6">Hiring with Hyr</p>
              <ul className="space-y-4">
                {[
                  "Post requirements → instant verified matches",
                  "Skip to final interview in days, not weeks",
                  "Every skill score is verified and anti-cheat monitored",
                  "Near-match candidates actively prepare for your role",
                  "Fraction of the cost of traditional recruiting",
                  "Hire with confidence — skills are already proven",
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-gray-300">
                    <span className="text-emerald-400 mt-0.5">&#10003;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* LIVE TALENT POOL */}
      {stats && stats.trackDistribution.length > 0 && (
        <section className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Live Talent Pool</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                Real engineers. Real data. Right now.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-gray-600 text-lg">
                These numbers are live from our platform — not marketing fluff.
              </p>
            </motion.div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {stats.trackDistribution.map((t, i) => (
                <motion.div
                  key={t.track}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl border border-gray-200 p-6 text-center hover:shadow-md transition-shadow"
                >
                  <p className="text-4xl font-bold text-gray-950">{t.count}</p>
                  <p className="font-semibold text-sm mt-1">{t.label} Engineers</p>
                  <p className="text-xs text-muted-foreground mt-2">Avg score: {t.avgScore}%</p>
                </motion.div>
              ))}
            </div>

            {stats.levelDistribution.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-12 max-w-lg mx-auto"
              >
                <p className="text-sm font-medium text-center text-gray-950 mb-4">Level Distribution</p>
                <div className="space-y-2">
                  {stats.levelDistribution.map(l => {
                    const pct = totalCandidates > 0 ? Math.round((l.count / totalCandidates) * 100) : 0
                    return (
                      <div key={l.level} className="flex items-center gap-3">
                        <span className="text-sm w-24 text-right text-gray-600">{l.level}</span>
                        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gray-950 rounded-full"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${pct}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                          />
                        </div>
                        <span className="text-sm w-12 text-gray-600">{l.count}</span>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            <div className="mt-8 text-center">
              <Link href="/talent-market" className="text-sm text-blue-600 hover:text-blue-800 font-medium underline underline-offset-4 transition-colors">
                View full Talent Market Report &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="relative bg-gray-950 text-white py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 hero-grid" />
        <motion.div
          className="absolute top-0 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
          animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Your next great hire is already verified.
            </h2>
            <p className="mt-6 text-gray-400 text-lg max-w-xl mx-auto">
              Post your first hiring need in 2 minutes. See instant matches. Watch your pipeline grow.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={ctaHref}>
                <Button size="lg" className="h-12 px-8 text-base font-semibold bg-emerald-500 text-white hover:bg-emerald-400 border-0">
                  Start Hiring — Free
                </Button>
              </Link>
              <Link href="/talent-market" className="text-sm text-gray-400 hover:text-white transition-colors underline underline-offset-4">
                Browse talent market data
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-950 border-t border-gray-800 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg">Hyr</span>
              <span className="text-gray-600 text-sm">&middot; Where companies discover verified engineers</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Home</Link>
              <Link href="/talent-market" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Talent Market</Link>
              <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Pricing</Link>
              <Link href="/about" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">About</Link>
            </div>
            <p className="text-xs text-gray-600">&copy; 2026 Hyr</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
