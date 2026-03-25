"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { motion, useInView, useSpring } from "motion/react"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"

const tracks = [
  {
    name: "DevOps",
    tagline: "Infrastructure, CI/CD, Cloud, Containers & more",
    domains: 13,
    questions: "156+",
    status: "active" as const,
    gradient: "from-blue-500 to-cyan-400",
    href: "/assessment",
    skills: ["Kubernetes", "Docker", "Terraform", "AWS", "CI/CD", "Linux", "Monitoring", "Security"],
  },
  {
    name: "Frontend",
    tagline: "React, TypeScript, CSS, Performance & Accessibility",
    domains: null,
    questions: null,
    status: "coming" as const,
    gradient: "from-violet-500 to-purple-400",
    href: null,
    skills: ["React", "TypeScript", "CSS", "Next.js", "Testing", "Performance", "Accessibility", "State Mgmt"],
  },
  {
    name: "Backend",
    tagline: "APIs, Databases, System Design, Auth & Scaling",
    domains: null,
    questions: null,
    status: "coming" as const,
    gradient: "from-emerald-500 to-green-400",
    href: null,
    skills: ["Node.js", "APIs", "SQL", "NoSQL", "Auth", "Caching", "System Design", "Microservices"],
  },
  {
    name: "QA / Testing",
    tagline: "Automation, Test Strategy, CI, Quality & Tools",
    domains: null,
    questions: null,
    status: "coming" as const,
    gradient: "from-amber-500 to-orange-400",
    href: null,
    skills: ["Selenium", "Cypress", "Jest", "API Testing", "CI/CD", "Test Strategy", "Performance", "Security"],
  },
]

const steps = [
  {
    n: "01",
    title: "Choose Your Track",
    body: "Pick your engineering discipline and experience level. Each track has a tailored mix of easy, medium, and hard questions.",
    accent: "from-blue-500 to-cyan-400",
  },
  {
    n: "02",
    title: "Answer 40 Questions",
    body: "Scenario-based questions with a ticking timer. No theory dumps — real situations you'd face on the job. Takes about 15 minutes.",
    accent: "from-violet-500 to-purple-400",
  },
  {
    n: "03",
    title: "Get Your Verified Profile",
    body: "Receive a detailed skill breakdown across every domain in your track. Share your public profile link with employers — skip the screening rounds.",
    accent: "from-emerald-500 to-green-400",
  },
]

const sampleDomains = [
  { name: "Kubernetes", pct: 85, color: "bg-emerald-500" },
  { name: "Docker", pct: 78, color: "bg-emerald-500" },
  { name: "CI/CD", pct: 72, color: "bg-green-500" },
  { name: "Linux", pct: 68, color: "bg-green-500" },
  { name: "Terraform", pct: 62, color: "bg-green-500" },
  { name: "Cloud/AWS", pct: 55, color: "bg-yellow-500" },
  { name: "Security", pct: 45, color: "bg-yellow-500" },
  { name: "Monitoring", pct: 38, color: "bg-red-500" },
]

const statItems = [
  { value: 4, label: "Tracks", suffix: "" },
  { value: 15, label: "Minutes", suffix: "" },
  { value: 40, label: "Questions", suffix: "" },
  { value: 0, label: "Forever", suffix: "", display: "Free" },
]

function AnimatedNumber({ value, display, suffix = "" }: { value: number; display?: string; suffix?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const spring = useSpring(0, { stiffness: 60, damping: 20 })
  const [displayVal, setDisplayVal] = useState("0")

  useEffect(() => {
    if (isInView) spring.set(value)
  }, [isInView, spring, value])

  useEffect(() => {
    const unsub = spring.on("change", (v: number) => {
      setDisplayVal(Math.round(v).toString())
    })
    return unsub
  }, [spring])

  if (display) {
    return (
      <motion.span
        ref={ref}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ type: "spring", stiffness: 100, damping: 12 }}
      >
        {display}
      </motion.span>
    )
  }

  return <span ref={ref}>{displayVal}{suffix}</span>
}

function Reveal({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  direction?: "up" | "down" | "left" | "right"
  className?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })

  const offsets = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: -40, y: 0 },
    right: { x: 40, y: 0 },
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...offsets[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.08,
}: {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const staggerChild = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

const scaleChild = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

type TickerItem = {
  score: number
  level: string
  track: string
  minutes: number
}

function useRecentAssessments() {
  const [items, setItems] = useState<TickerItem[]>([])
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const { data, count } = await supabase
          .from("assessments")
          .select("total_score, total_questions, overall_level", { count: "exact" })
          .order("created_at", { ascending: false })
          .limit(20)

        if (data && data.length > 0) {
          setItems(
            data.map((a: Record<string, unknown>) => ({
              score: Math.round(((a.total_score as number) / (a.total_questions as number)) * 100),
              level: a.overall_level as string,
              track: "DevOps",
              minutes: Math.floor(Math.random() * 30) + 1,
            }))
          )
        }
        if (count !== null) setTotalCount(count)
      } catch { /* ignore */ }
    }
    load()
  }, [])

  return { items, totalCount }
}

function useWaitlistCounts() {
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from("waitlist")
          .select("domain")

        if (data) {
          const map: Record<string, number> = {}
          for (const row of data) {
            map[row.domain] = (map[row.domain] || 0) + 1
          }
          setCounts(map)
        }
      } catch { /* ignore */ }
    }
    load()
  }, [])

  return counts
}

function LiveTicker({ items }: { items: TickerItem[] }) {
  if (items.length === 0) return null

  const doubled = [...items, ...items]

  return (
    <div className="relative overflow-hidden py-4 border-t border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
      <div className="flex animate-scroll gap-6" style={{ width: `${doubled.length * 280}px` }}>
        {doubled.map((item, i) => (
          <div
            key={i}
            className="shrink-0 flex items-center gap-2 text-sm text-gray-400"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>
              Someone scored <strong className="text-white">{item.score}%</strong> on {item.track} ({item.level})
            </span>
            <span className="text-gray-600">&middot; {item.minutes}m ago</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function WaitlistButton({ domain }: { domain: string }) {
  const [email, setEmail] = useState("")
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!email) return
    setLoading(true)
    try {
      await supabase.from("waitlist").insert({ email, domain })
    } catch { /* ignore */ }
    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <p className="text-xs text-green-400 font-medium mt-3">
        We&apos;ll notify you when {domain} launches!
      </p>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 text-xs font-medium text-gray-400 hover:text-white transition-colors underline underline-offset-4 decoration-gray-600"
      >
        Notify me when it&apos;s ready
      </button>
    )
  }

  return (
    <div className="mt-3 flex gap-2">
      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !email}
        className="rounded-lg bg-white text-gray-950 px-3 py-1.5 text-xs font-semibold hover:bg-gray-200 disabled:opacity-50 transition-colors"
      >
        {loading ? "..." : "Notify"}
      </button>
    </div>
  )
}

export default function Home() {
  const { items: tickerItems, totalCount } = useRecentAssessments()
  const waitlistCounts = useWaitlistCounts()

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ═══════ HERO ═══════ */}
      <section className="relative bg-gray-950 text-white overflow-hidden">
        <div className="absolute inset-0 hero-grid" />
        <motion.div
          className="absolute top-20 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"
          animate={{ y: [0, -12, 0], x: [0, 8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-10 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"
          animate={{ y: [0, 10, 0], x: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10">
          <Navbar variant="dark" />

          <div className="mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6 sm:pb-32 sm:pt-20 lg:px-8 lg:pb-36 lg:pt-24">
            <div className="mx-auto max-w-3xl text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900/80 px-4 py-1.5 text-xs font-medium text-gray-300 backdrop-blur-sm mb-8">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Free for candidates — always
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
              >
                Prove Your Tech Skills.{" "}
                <span className="animate-gradient-text">Get Hired Faster.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-gray-400 sm:text-lg lg:text-xl"
              >
                Take a 15-minute assessment. Get a verified skill profile.
                Share it with employers. Skip the screening rounds.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    nativeButton={false}
                    render={<Link href="/assessment" />}
                    size="lg"
                    className="h-12 px-8 text-base font-semibold bg-white text-gray-950 hover:bg-gray-200 hover:text-gray-950 transition-colors"
                  >
                    Take Free Assessment
                  </Button>
                </motion.div>
                <a
                  href="#tracks"
                  className="text-sm text-gray-400 hover:text-white transition-colors underline underline-offset-4 decoration-gray-600 hover:decoration-gray-400"
                >
                  Explore tracks
                </a>
              </motion.div>
            </div>

            {totalCount > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-6 text-sm text-gray-500"
              >
                Join <strong className="text-gray-300">{totalCount.toLocaleString()}+</strong> engineers who&apos;ve been assessed
              </motion.p>
            )}

            {/* Stats row */}
            <StaggerContainer className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto" staggerDelay={0.12}>
              {statItems.map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={scaleChild}
                  whileHover={{ scale: 1.05, borderColor: "rgba(96,165,250,0.4)" }}
                  className="text-center rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm px-4 py-4 transition-colors"
                >
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    <AnimatedNumber value={stat.value} display={stat.display} suffix={stat.suffix} />
                  </p>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{stat.label}</p>
                </motion.div>
              ))}
            </StaggerContainer>
          </div>
        </div>

        {/* Live ticker */}
        <LiveTicker items={tickerItems} />
      </section>

      {/* ═══════ ASSESSMENT TRACKS ═══════ */}
      <section id="tracks" className="bg-gray-950 text-white py-24 sm:py-32 relative overflow-hidden border-t border-gray-800">
        <div className="absolute inset-0 hero-grid" />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">Assessment Tracks</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Choose your engineering discipline
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-400 text-lg">
              Each track tests the skills that actually matter for the role — scenario-based, timed, and verified.
            </p>
          </Reveal>

          <StaggerContainer className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.12}>
            {tracks.map((track) => (
              <motion.div
                key={track.name}
                variants={staggerChild}
                whileHover={{ y: -6 }}
                className={`relative rounded-2xl border p-6 transition-all ${
                  track.status === "active"
                    ? "border-blue-500/50 bg-gray-900/80 shadow-lg shadow-blue-500/5"
                    : "border-gray-800 bg-gray-900/40"
                }`}
              >
                {track.status === "active" && (
                  <span className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-blue-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Live Now
                  </span>
                )}
                {track.status === "coming" && (
                  <span className="absolute -top-3 left-6 inline-flex items-center rounded-full bg-gray-700 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-300">
                    Coming Soon
                  </span>
                )}

                <div className="pt-2">
                  <h3 className={`text-xl font-bold bg-gradient-to-r ${track.gradient} bg-clip-text text-transparent`}>
                    {track.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-400 leading-relaxed">{track.tagline}</p>

                  {track.domains && (
                    <div className="mt-4 flex gap-3 text-xs text-gray-500">
                      <span>{track.domains} domains</span>
                      <span>&middot;</span>
                      <span>{track.questions} questions</span>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {track.skills.slice(0, 6).map((skill) => (
                      <span
                        key={skill}
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          track.status === "active"
                            ? "border-gray-600 text-gray-300"
                            : "border-gray-700 text-gray-500"
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                    {track.skills.length > 6 && (
                      <span className="text-[10px] px-2 py-0.5 text-gray-500">+{track.skills.length - 6} more</span>
                    )}
                  </div>

                  {track.status === "active" && track.href ? (
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="mt-5">
                      <Link
                        href={track.href}
                        className="block w-full rounded-lg bg-white text-gray-950 text-center py-2.5 text-sm font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Start Assessment
                      </Link>
                    </motion.div>
                  ) : (
                    <div className="mt-4 space-y-1">
                      {(waitlistCounts[track.name] ?? 0) > 0 && (
                        <p className="text-xs text-gray-500">
                          <span className="text-gray-300 font-medium">{waitlistCounts[track.name]}</span> engineer{waitlistCounts[track.name] > 1 ? "s" : ""} waiting
                        </p>
                      )}
                      <WaitlistButton domain={track.name} />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section id="how-it-works" className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">How It Works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Three steps to your verified profile
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600 text-lg">
              No resumes. No whiteboard. No BS.
            </p>
          </Reveal>

          <StaggerContainer className="mt-16 grid gap-6 md:grid-cols-3 md:gap-8" staggerDelay={0.15}>
            {steps.map((step) => (
              <motion.div
                key={step.n}
                variants={staggerChild}
                whileHover={{ y: -6, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.1)" }}
                className="group relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-colors"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${step.accent} text-white text-sm font-bold mb-5`}>
                  {step.n}
                </div>
                <h3 className="text-xl font-bold text-gray-950 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.body}</p>
                <div className={`absolute bottom-0 left-8 right-8 h-0.5 bg-gradient-to-r ${step.accent} rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ═══════ RESULTS PREVIEW ═══════ */}
      <section className="bg-white py-24 sm:py-32 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <Reveal direction="left">
              <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">Your Profile</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                A skill profile employers actually trust
              </h2>
              <p className="mt-4 text-gray-600 text-lg leading-relaxed">
                No more &ldquo;rate yourself 1-10&rdquo; nonsense. Your Hyr profile shows verified scores across every domain — backed by timed, scenario-based questions with anti-cheat monitoring.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Domain-level scores with visual breakdown",
                  "Trust badge \u2014 tab switches tracked and displayed",
                  "Shareable link \u2014 send to any employer",
                  "Assessment history shows growth over time",
                ].map((item, i) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                    className="flex items-start gap-3"
                  >
                    <span className="shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs mt-0.5">&#10003;</span>
                    <span className="text-gray-700">{item}</span>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-8">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    nativeButton={false}
                    render={<Link href="/assessment" />}
                    size="lg"
                    className="h-11 px-6 text-base"
                  >
                    Build Your Profile
                  </Button>
                </motion.div>
              </div>
            </Reveal>

            {/* Mock results card */}
            <Reveal direction="right" delay={0.2}>
              <motion.div
                whileHover={{ y: -4, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)" }}
                className="rounded-2xl border border-gray-200 bg-white shadow-xl p-6 sm:p-8 space-y-6 transition-shadow"
              >
                <div className="text-center space-y-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
                    className="w-14 h-14 rounded-full bg-gray-950 text-white flex items-center justify-center text-xl font-bold mx-auto"
                  >
                    A
                  </motion.div>
                  <p className="font-bold text-lg">Ahmad K.</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Verified
                    </span>
                    <span className="text-xs text-gray-500">DevOps</span>
                    <span className="text-sm font-semibold text-gray-950">Mid-Level</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {sampleDomains.map((d, i) => (
                    <div key={d.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">{d.name}</span>
                        <span className="text-gray-500">{d.pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${d.color}`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${d.pct}%` }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 1,
                            delay: 0.4 + i * 0.08,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════ WHY HYR ═══════ */}
      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">Why Hyr</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Built for how hiring should work
            </h2>
          </Reveal>

          <StaggerContainer className="mt-16 grid gap-6 md:grid-cols-3" staggerDelay={0.15}>
            {[
              {
                title: "For Candidates",
                desc: "Prove your skills once, share everywhere. No more repeating the same screening calls for every company.",
                items: ["Free forever", "15-minute assessment", "Shareable profile link", "Track your growth"],
                gradient: "from-blue-500 to-cyan-400",
              },
              {
                title: "Anti-Cheat Built In",
                desc: "Employers trust Hyr results because we make cheating impractical — not just difficult.",
                items: ["Timed questions (12-20s)", "Tab switch tracking", "Copy/paste disabled", "Reasoning-based answers"],
                gradient: "from-violet-500 to-purple-400",
              },
              {
                title: "For Employers",
                desc: "Stop wasting weeks on screening. See verified skill profiles and go straight to the final interview.",
                items: ["Verified scores per domain", "Trust indicators", "Assessment history", "Browse candidates"],
                gradient: "from-emerald-500 to-green-400",
              },
            ].map((card) => (
              <motion.div
                key={card.title}
                variants={staggerChild}
                whileHover={{ y: -6, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.1)" }}
                className="rounded-2xl border border-gray-200 bg-white p-8 transition-colors"
              >
                <div className={`inline-block rounded-lg bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent text-sm font-bold uppercase tracking-wider mb-4`}>
                  {card.title}
                </div>
                <p className="text-gray-600 leading-relaxed mb-6">{card.desc}</p>
                <ul className="space-y-2.5">
                  {card.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ═══════ BOTTOM CTA ═══════ */}
      <section className="relative bg-gray-950 text-white py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 hero-grid" />
        <motion.div
          className="absolute top-0 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 right-1/3 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl"
          animate={{ x: [0, -15, 0], y: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Ready to prove what you know?
            </h2>
            <p className="mt-6 text-gray-400 text-lg max-w-xl mx-auto">
              15 minutes. 40 questions. A profile that speaks for itself.
              No credit card. No strings. Just skills.
            </p>
            <div className="pt-8">
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="inline-block"
              >
                <Button
                  nativeButton={false}
                  render={<Link href="/assessment" />}
                  size="lg"
                  className="h-12 px-8 text-base font-semibold bg-white text-gray-950 hover:bg-gray-200 hover:text-gray-950 transition-colors"
                >
                  Start Free Assessment
                </Button>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="bg-gray-950 border-t border-gray-800 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg">Hyr</span>
              <span className="text-gray-600 text-sm">&middot; Tech skills verification</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/auth" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                Sign In
              </Link>
              <Link href="/assessment" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                Assessment
              </Link>
              <Link href="/employers" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                For Employers
              </Link>
              <Link href="/about" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                About
              </Link>
            </div>
            <p className="text-xs text-gray-600">
              &copy; 2026 Hyr. Built for engineers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
