"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"

const domains = [
  { name: "Linux", icon: "&#128427;" },
  { name: "Networking", icon: "&#127760;" },
  { name: "Git", icon: "&#128268;" },
  { name: "Scripting", icon: "&#128221;" },
  { name: "Cloud / AWS", icon: "&#9729;" },
  { name: "Docker", icon: "&#128230;" },
  { name: "Kubernetes", icon: "&#9781;" },
  { name: "Terraform / IaC", icon: "&#127959;" },
  { name: "CI/CD", icon: "&#9889;" },
  { name: "Monitoring", icon: "&#128200;" },
  { name: "Security", icon: "&#128274;" },
  { name: "SRE", icon: "&#128736;" },
  { name: "FinOps", icon: "&#128176;" },
]

const steps = [
  {
    n: "01",
    title: "Pick Your Level",
    body: "Choose Junior, Mid-Level, or Senior. Each level has a different mix of easy, medium, and hard questions tailored to your experience.",
    accent: "from-blue-500 to-cyan-400",
  },
  {
    n: "02",
    title: "Answer 40 Questions",
    body: "Scenario-based DevOps questions with a ticking timer. No theory dumps — real situations you'd face on the job. Takes about 15 minutes.",
    accent: "from-violet-500 to-purple-400",
  },
  {
    n: "03",
    title: "Get Your Verified Profile",
    body: "Receive a detailed skill breakdown across all 13 domains. Share your public profile link with employers — skip the screening rounds.",
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

const stats = [
  { value: "156", label: "Questions" },
  { value: "13", label: "Domains" },
  { value: "15", label: "Minutes" },
  { value: "Free", label: "Forever" },
]

export default function Home() {
  const sectionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionsRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("scroll-visible")
            entry.target.classList.remove("scroll-hidden")
          }
        })
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    )
    const items = sectionsRef.current.querySelectorAll(".scroll-hidden")
    items.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={sectionsRef} className="flex min-h-screen flex-col bg-white">
      {/* ═══════ HERO ═══════ */}
      <section className="relative bg-gray-950 text-white overflow-hidden">
        <div className="absolute inset-0 hero-grid" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-float delay-200" />

        <div className="relative z-10">
          <Navbar variant="dark" />

          <div className="mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6 sm:pb-32 sm:pt-20 lg:px-8 lg:pb-36 lg:pt-24">
            <div className="mx-auto max-w-3xl text-center">
              <div className="animate-fade-up">
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900/80 px-4 py-1.5 text-xs font-medium text-gray-300 backdrop-blur-sm mb-8">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Free for candidates — always
                </span>
              </div>

              <h1 className="animate-fade-up delay-100 text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
                Prove Your DevOps Skills.{" "}
                <span className="animate-gradient-text">Get Hired Faster.</span>
              </h1>

              <p className="animate-fade-up delay-200 mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-gray-400 sm:text-lg lg:text-xl">
                Take a 15-minute assessment across 13 DevOps domains.
                Get a verified skill profile. Share it with employers.
                Skip the screening rounds.
              </p>

              <div className="animate-fade-up delay-300 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  nativeButton={false}
                  render={<Link href="/assessment" />}
                  size="lg"
                  className="h-12 px-8 text-base font-semibold bg-white text-gray-950 hover:bg-gray-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Take Free Assessment
                </Button>
                <a
                  href="#how-it-works"
                  className="text-sm text-gray-400 hover:text-white transition-colors underline underline-offset-4 decoration-gray-600 hover:decoration-gray-400"
                >
                  See how it works
                </a>
              </div>
            </div>

            {/* Stats row */}
            <div className="animate-fade-up delay-500 mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="text-center rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm px-4 py-4"
                >
                  <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section id="how-it-works" className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="scroll-hidden text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">How It Works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Three steps to your verified profile
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600 text-lg">
              No resumes. No whiteboard. No BS.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3 md:gap-8">
            {steps.map((step, i) => (
              <div
                key={step.n}
                className={`scroll-hidden group relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${step.accent} text-white text-sm font-bold mb-5`}>
                  {step.n}
                </div>
                <h3 className="text-xl font-bold text-gray-950 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.body}</p>
                <div className={`absolute bottom-0 left-8 right-8 h-0.5 bg-gradient-to-r ${step.accent} rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ RESULTS PREVIEW ═══════ */}
      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="scroll-hidden">
              <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">Your Profile</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                A skill profile employers actually trust
              </h2>
              <p className="mt-4 text-gray-600 text-lg leading-relaxed">
                No more &ldquo;rate yourself 1-10&rdquo; nonsense. Your Hyr profile shows verified scores across every DevOps domain — backed by timed, scenario-based questions with anti-cheat monitoring.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Scores across 13 domains with visual breakdown",
                  "Trust badge \u2014 tab switches tracked and displayed",
                  "Shareable link \u2014 send to any employer",
                  "Assessment history shows growth over time",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs mt-0.5">&#10003;</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button
                  nativeButton={false}
                  render={<Link href="/assessment" />}
                  size="lg"
                  className="h-11 px-6 text-base"
                >
                  Build Your Profile
                </Button>
              </div>
            </div>

            {/* Mock results card */}
            <div className="scroll-hidden">
              <div className="rounded-2xl border border-gray-200 bg-white shadow-xl p-6 sm:p-8 space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-full bg-gray-950 text-white flex items-center justify-center text-xl font-bold mx-auto">A</div>
                  <p className="font-bold text-lg">Ahmad K.</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Verified
                    </span>
                    <span className="text-sm font-semibold text-gray-950">Mid-Level</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {sampleDomains.map((d) => (
                    <div key={d.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">{d.name}</span>
                        <span className="text-gray-500">{d.pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full animate-bar ${d.color}`}
                          style={{ width: `${d.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center pt-2">
                  <p className="text-xs text-gray-400">hyr-snowy.vercel.app/profile/...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 13 DOMAINS ═══════ */}
      <section className="bg-gray-950 text-white py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 hero-grid" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="scroll-hidden text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">Comprehensive Coverage</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              13 domains. One assessment.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-400 text-lg">
              We test every skill that matters in modern DevOps — from Linux fundamentals to FinOps optimization.
            </p>
          </div>

          <div className="scroll-hidden mt-16 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {domains.map((domain, i) => (
              <div
                key={domain.name}
                className="group rounded-xl border border-gray-800 bg-gray-900/60 backdrop-blur-sm p-4 text-center hover:border-gray-600 hover:bg-gray-800/80 transition-all duration-300 hover:-translate-y-0.5"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="text-2xl block mb-2" dangerouslySetInnerHTML={{ __html: domain.icon }} />
                <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{domain.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ WHY HYR ═══════ */}
      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="scroll-hidden text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">Why Hyr</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Built for how hiring should work
            </h2>
          </div>

          <div className="scroll-hidden mt-16 grid gap-6 md:grid-cols-3">
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
                items: ["Verified scores per domain", "Trust indicators", "Assessment history", "Coming: employer dashboard"],
                gradient: "from-emerald-500 to-green-400",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-gray-200 bg-white p-8 hover:shadow-lg transition-all duration-300"
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ BOTTOM CTA ═══════ */}
      <section className="relative bg-gray-950 text-white py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 hero-grid" />
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="scroll-hidden space-y-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Ready to prove what you know?
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              15 minutes. 40 questions. A profile that speaks for itself.
              No credit card. No strings. Just skills.
            </p>
            <div className="pt-4">
              <Button
                nativeButton={false}
                render={<Link href="/assessment" />}
                size="lg"
                className="h-12 px-8 text-base font-semibold bg-white text-gray-950 hover:bg-gray-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Start Free Assessment
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="bg-gray-950 border-t border-gray-800 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg">Hyr</span>
              <span className="text-gray-600 text-sm">&middot; DevOps skills verification</span>
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
            </div>
            <p className="text-xs text-gray-600">
              &copy; 2026 Hyr. Built for DevOps engineers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
