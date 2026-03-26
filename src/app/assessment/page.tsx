"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { supabase } from "@/lib/supabase"
import { generateAssessmentSession, allQuestions, LEVEL_CONFIG, TRACKS, type Question, type CandidateLevel, type TrackId } from "@/lib/questions"
import { calculateDomainScores, overallLevel, engineeringPersonality, type AnswerRecord } from "@/lib/scoring"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

type AnswerState = AnswerRecord & {
  selected_option: string
  time_taken_ms: number
}

type Stage =
  | "onboard-track"
  | "onboard-experience"
  | "onboard-strengths"
  | "onboard-ready"
  | "select-level"
  | "rules"
  | "countdown"
  | "quiz"
  | "finishing"

const levels: CandidateLevel[] = ["junior", "mid", "senior"]

const TRACK_DOMAINS: Record<string, { key: string; label: string; icon: string }[]> = {
  devops: [
    { key: "kubernetes", label: "Kubernetes", icon: "☸️" },
    { key: "containers", label: "Docker", icon: "🐳" },
    { key: "cloud", label: "Cloud / AWS", icon: "☁️" },
    { key: "cicd", label: "CI/CD", icon: "🔄" },
    { key: "iac", label: "Terraform / IaC", icon: "🏗️" },
    { key: "linux", label: "Linux", icon: "🐧" },
    { key: "monitoring", label: "Monitoring", icon: "📊" },
    { key: "security", label: "Security", icon: "🔒" },
    { key: "scripting", label: "Scripting", icon: "📝" },
    { key: "git", label: "Git", icon: "🔀" },
    { key: "networking", label: "Networking", icon: "🌐" },
    { key: "sre", label: "SRE", icon: "🚀" },
    { key: "finops", label: "FinOps", icon: "💰" },
  ],
  frontend: [
    { key: "html-css", label: "HTML & CSS", icon: "🎨" },
    { key: "javascript", label: "JavaScript", icon: "⚡" },
    { key: "typescript", label: "TypeScript", icon: "🔷" },
    { key: "react", label: "React", icon: "⚛️" },
    { key: "performance", label: "Performance", icon: "🚀" },
    { key: "accessibility", label: "Accessibility", icon: "♿" },
    { key: "testing", label: "Testing", icon: "🧪" },
    { key: "state-mgmt", label: "State Mgmt", icon: "🔄" },
    { key: "apis", label: "APIs", icon: "🔌" },
    { key: "build-tools", label: "Build Tools", icon: "📦" },
  ],
  backend: [
    { key: "databases", label: "Databases", icon: "🗄️" },
    { key: "apis-design", label: "API Design", icon: "🔌" },
    { key: "architecture", label: "Architecture", icon: "🏛️" },
    { key: "security", label: "Security", icon: "🔒" },
    { key: "caching", label: "Caching", icon: "⚡" },
    { key: "messaging", label: "Messaging", icon: "📨" },
    { key: "concurrency", label: "Concurrency", icon: "🔀" },
    { key: "testing", label: "Testing", icon: "🧪" },
    { key: "observability", label: "Observability", icon: "📊" },
    { key: "deployment", label: "Deployment", icon: "🚀" },
  ],
  qa: [
    { key: "test-strategy", label: "Test Strategy", icon: "📋" },
    { key: "manual-testing", label: "Manual Testing", icon: "🔍" },
    { key: "automation", label: "Automation", icon: "🤖" },
    { key: "api-testing", label: "API Testing", icon: "🔌" },
    { key: "performance-testing", label: "Perf Testing", icon: "📈" },
    { key: "mobile-testing", label: "Mobile Testing", icon: "📱" },
    { key: "security-testing", label: "Security Testing", icon: "🛡️" },
    { key: "test-data", label: "Test Data", icon: "🗃️" },
    { key: "bug-tracking", label: "Bug Tracking", icon: "🐛" },
    { key: "ci-cd-testing", label: "CI/CD Testing", icon: "🔄" },
  ],
}

const TRACK_META: Record<string, { label: string; icon: string }> = {
  devops: { label: "DevOps / SRE / Platform", icon: "🛠️" },
  frontend: { label: "Frontend Engineering", icon: "🎨" },
  backend: { label: "Backend Engineering", icon: "⚡" },
  qa: { label: "QA / Testing", icon: "🧪" },
}

const EXPERIENCE_OPTIONS = [
  { value: "0-1", label: "Less than 1 year", desc: "Just getting started" },
  { value: "1-3", label: "1–3 years", desc: "Building foundations" },
  { value: "3-5", label: "3–5 years", desc: "Solid experience" },
  { value: "5+", label: "5+ years", desc: "Seasoned professional" },
]

const EXPERIENCE_TO_LEVEL: Record<string, CandidateLevel> = {
  "0-1": "junior",
  "1-3": "mid",
  "3-5": "mid",
  "5+": "senior",
}

const MILESTONE_MESSAGES = [
  { at: 10, text: "10 down. 30 to go. You're in the zone." },
  { at: 20, text: "Halfway there. Keep that momentum." },
  { at: 30, text: "10 more. You've got this." },
]

export default function AssessmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("")

  const [stage, setStage] = useState<Stage>("onboard-track")
  const [selectedLevel, setSelectedLevel] = useState<CandidateLevel | null>(null)

  // Onboarding state
  const [onboardTrack, setOnboardTrack] = useState<string>("devops")
  const [onboardExperience, setOnboardExperience] = useState<string | null>(null)
  const [onboardStrengths, setOnboardStrengths] = useState<string[]>([])

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<AnswerState[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const [tabSwitches, setTabSwitches] = useState(0)
  const [tabWarning, setTabWarning] = useState(false)
  const [copyWarning, setCopyWarning] = useState(false)
  const [hasResumable, setHasResumable] = useState(false)
  const [resumableData, setResumableData] = useState<{ selectedLevel: CandidateLevel; answers: AnswerState[]; currentIdx: number; tabSwitches: number; savedAt: number; questionIds: string[] } | null>(null)

  // Countdown state
  const [countdownNum, setCountdownNum] = useState(3)

  // Milestone state
  const [milestoneMsg, setMilestoneMsg] = useState<string | null>(null)

  const questionStartRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const submittingRef = useRef(false)

  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data }) => {
        if (!data.user) {
          router.push("/auth")
          return
        }
        if (data.user.user_metadata?.role === "employer") {
          router.push("/employers")
          return
        }
        const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim())
        if (adminEmails.includes(data.user.email || "")) {
          router.push("/admin")
          return
        }
        setUserId(data.user.id)
        setUserName(data.user.user_metadata?.full_name || data.user.email || "")
        setLoading(false)
      })
      .catch(() => {
        router.push("/auth")
      })
  }, [router])

  // Restore progress on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("hyr_assessment_progress")
      if (!saved) return
      const data = JSON.parse(saved)
      const age = Date.now() - (data.savedAt || 0)
      if (age > 30 * 60 * 1000) {
        localStorage.removeItem("hyr_assessment_progress")
        return
      }
      setHasResumable(true)
      setResumableData(data)
    } catch { /* ignore */ }
  }, [])

  function proceedToRules(level: CandidateLevel) {
    setSelectedLevel(level)
    setStage("rules")
  }

  function startCountdown() {
    setStage("countdown")
    setCountdownNum(3)
  }

  useEffect(() => {
    if (stage !== "countdown") return
    if (countdownNum <= 0) {
      actuallyBeginQuiz()
      return
    }
    const t = setTimeout(() => setCountdownNum(prev => prev - 1), 800)
    return () => clearTimeout(t)
  }, [stage, countdownNum])

  function actuallyBeginQuiz() {
    if (!selectedLevel) return
    const q = generateAssessmentSession(selectedLevel, 40, onboardTrack as TrackId)
    setQuestions(q)
    setTimeLeft(q[0]?.time_seconds ?? 15)
    questionStartRef.current = Date.now()
    setStage("quiz")
  }

  const currentQ = questions[currentIdx]

  const advance = useCallback(
    (pickedOption: string | null) => {
      if (!currentQ) return
      const elapsed = Date.now() - questionStartRef.current
      const ans: AnswerState = {
        question_id: currentQ.id,
        domain: currentQ.domain,
        difficulty: currentQ.difficulty,
        is_correct: pickedOption === currentQ.correct,
        selected_option: pickedOption ?? "",
        time_taken_ms: elapsed,
      }
      const nextAnswers = [...answers, ans]
      setAnswers(nextAnswers)
      setSelected(null)

      const nextIdx = currentIdx + 1

      // Milestone messages
      const milestone = MILESTONE_MESSAGES.find(m => m.at === nextIdx)
      if (milestone) {
        setMilestoneMsg(milestone.text)
        setTimeout(() => setMilestoneMsg(null), 1800)
      }

      if (nextIdx < questions.length) {
        const nextQ = questions[nextIdx]
        setCurrentIdx(nextIdx)
        setTimeLeft(nextQ.time_seconds)
        questionStartRef.current = Date.now()
      } else {
        finishAssessment(nextAnswers)
      }
    },
    [currentQ, currentIdx, questions, answers],
  )

  // Timer
  useEffect(() => {
    if (stage !== "quiz" || submitted) return
    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          advance(null)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [stage, submitted, currentIdx, advance])

  // Keyboard shortcuts
  useEffect(() => {
    if (stage !== "quiz" || submitted || !currentQ) return

    const handleKey = (e: KeyboardEvent) => {
      if (tabWarning) return
      const keyMap: Record<string, string> = {
        "1": "A", "2": "B", "3": "C", "4": "D",
        "a": "A", "b": "B", "c": "C", "d": "D",
      }
      const optId = keyMap[e.key.toLowerCase()]
      if (optId && currentQ.options.some(o => o.id === optId)) {
        setSelected(optId)
        setTimeout(() => advance(optId), 200)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [stage, submitted, currentQ, tabWarning, advance])

  // Auto-save
  useEffect(() => {
    if (stage !== "quiz" || answers.length === 0) return
    try {
      localStorage.setItem("hyr_assessment_progress", JSON.stringify({
        answers,
        currentIdx,
        selectedLevel,
        tabSwitches,
        questionIds: questions.map(q => q.id),
        track: onboardTrack,
        savedAt: Date.now(),
      }))
    } catch { /* ignore quota errors */ }
  }, [answers, currentIdx, selectedLevel, tabSwitches, stage, questions])

  function resumeAssessment() {
    if (!resumableData) return
    setSelectedLevel(resumableData.selectedLevel)
    let q: Question[]
    if (resumableData.questionIds?.length) {
      const idOrder = resumableData.questionIds
      const questionMap = new Map(allQuestions.map((qq) => [qq.id, qq]))
      q = idOrder.map(id => questionMap.get(id)).filter(Boolean) as Question[]
      if (q.length < idOrder.length) {
        q = generateAssessmentSession(resumableData.selectedLevel, 40, (resumableData as Record<string, unknown>).track as TrackId || 'devops')
      }
    } else {
      q = generateAssessmentSession(resumableData.selectedLevel, 40, (resumableData as Record<string, unknown>).track as TrackId || 'devops')
    }
    setQuestions(q)
    setAnswers(resumableData.answers || [])
    setCurrentIdx(resumableData.currentIdx || 0)
    setTabSwitches(resumableData.tabSwitches || 0)
    const nextQ = q[resumableData.currentIdx]
    if (nextQ) setTimeLeft(nextQ.time_seconds)
    questionStartRef.current = Date.now()
    setStage("quiz")
    setHasResumable(false)
    localStorage.removeItem("hyr_assessment_progress")
  }

  function discardResumable() {
    localStorage.removeItem("hyr_assessment_progress")
    setHasResumable(false)
    setResumableData(null)
  }

  // Anti-cheat: tab switch detection
  useEffect(() => {
    if (stage !== "quiz" || submitted) return

    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitches((prev) => prev + 1)
        setTabWarning(true)
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [stage, submitted])

  // Anti-cheat: block copy/paste/right-click
  useEffect(() => {
    if (stage !== "quiz" || submitted) return

    const blockCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      setCopyWarning(true)
      setTimeout(() => setCopyWarning(false), 2000)
    }
    const blockContext = (e: MouseEvent) => {
      e.preventDefault()
      setCopyWarning(true)
      setTimeout(() => setCopyWarning(false), 2000)
    }

    document.addEventListener("copy", blockCopy)
    document.addEventListener("cut", blockCopy)
    document.addEventListener("contextmenu", blockContext)
    return () => {
      document.removeEventListener("copy", blockCopy)
      document.removeEventListener("cut", blockCopy)
      document.removeEventListener("contextmenu", blockContext)
    }
  }, [stage, submitted])

  async function finishAssessment(finalAnswers: AnswerState[]) {
    if (submittingRef.current) return
    submittingRef.current = true
    setStage("finishing")
    setSubmitted(true)
    if (timerRef.current) clearInterval(timerRef.current)
    try { localStorage.removeItem("hyr_assessment_progress") } catch { /* ignore */ }

    const domainScores = calculateDomainScores(finalAnswers)
    const level = overallLevel(domainScores)
    const personality = engineeringPersonality(domainScores)
    const totalCorrect = finalAnswers.filter((a) => a.is_correct).length

    const { data: assessment, error } = await supabase
      .from("assessments")
      .insert({
        candidate_id: userId,
        candidate_name: userName,
        total_score: totalCorrect,
        total_questions: finalAnswers.length,
        overall_level: level,
        domain_scores: domainScores,
        assessed_level: selectedLevel,
        tab_switches: tabSwitches,
        personality_type: personality.title,
        self_track: onboardTrack,
        self_experience: onboardExperience,
        self_strengths: onboardStrengths,
      })
      .select("id")
      .single()

    if (!error && assessment) {
      const rows = finalAnswers.map((a) => ({
        assessment_id: assessment.id,
        question_id: a.question_id,
        selected_option: a.selected_option,
        is_correct: a.is_correct,
        time_taken_ms: a.time_taken_ms,
        domain: a.domain,
        difficulty: a.difficulty,
      }))
      await supabase.from("assessment_answers").insert(rows)

      fetch("/api/send-results-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: (await supabase.auth.getUser()).data.user?.email,
          name: userName,
          score: totalCorrect,
          total: finalAnswers.length,
          level,
          assessmentId: assessment.id,
          profileId: userId,
        }),
      }).catch(() => {})

      router.push(`/results/${assessment.id}`)
    } else {
      const fallbackScores = btoa(
        JSON.stringify({ domainScores, level, totalCorrect, total: finalAnswers.length, assessedLevel: selectedLevel, tabSwitches, personalityType: personality.title })
      )
      router.push(`/results/local?d=${encodeURIComponent(fallbackScores)}`)
    }
  }

  function toggleStrength(key: string) {
    setOnboardStrengths(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : prev.length < 3 ? [...prev, key] : prev
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // --- Onboarding: Track Selection ---
  if (stage === "onboard-track") {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-2xl mx-auto px-4 py-12 sm:py-20">
          {/* Resume banner */}
          {hasResumable && resumableData && (
            <div className="mb-8 rounded-xl border border-blue-500/50 bg-blue-500/10 p-5 space-y-3">
              <p className="text-sm font-semibold text-blue-400">You have an unfinished assessment</p>
              <p className="text-sm text-gray-400">
                {LEVEL_CONFIG[resumableData.selectedLevel].label} level &middot; {resumableData.currentIdx}/{40} questions answered
              </p>
              <div className="flex gap-3">
                <Button onClick={resumeAssessment} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Resume
                </Button>
                <Button onClick={discardResumable} variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                  Start Fresh
                </Button>
              </div>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-2 mb-10"
          >
            <p className="text-sm text-blue-400 font-medium uppercase tracking-wider">Step 1 of 4</p>
            <h1 className="text-3xl font-bold">What do you do?</h1>
            <p className="text-gray-400">Choose your engineering discipline</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="space-y-3"
          >
            {[
              { key: "devops", label: "DevOps / SRE / Platform", icon: "🛠️", active: true },
              { key: "frontend", label: "Frontend Engineering", icon: "🎨", active: true },
              { key: "backend", label: "Backend Engineering", icon: "⚡", active: true },
              { key: "qa", label: "QA / Testing", icon: "🧪", active: true },
            ].map(track => (
              <button
                key={track.key}
                onClick={() => { if (track.active) { setOnboardTrack(track.key); setOnboardStrengths([]) } }}
                disabled={!track.active}
                className={`w-full text-left rounded-xl border p-5 transition-all ${
                  onboardTrack === track.key
                    ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/50"
                    : track.active
                      ? "border-gray-700 bg-gray-900 hover:border-gray-500"
                      : "border-gray-800 bg-gray-900/50 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{track.icon}</span>
                    <span className="font-semibold">{track.label}</span>
                  </div>
                  {!track.active && (
                    <Badge variant="outline" className="text-xs text-gray-500 border-gray-700">Coming Soon</Badge>
                  )}
                  {track.active && onboardTrack === track.key && (
                    <div className="w-5 h-5 rounded-full border-2 border-blue-500 bg-blue-500" />
                  )}
                </div>
              </button>
            ))}
          </motion.div>

          <div className="mt-8 text-center">
            <Button
              size="lg"
              onClick={() => setStage("onboard-experience")}
              className="h-11 px-8 text-base"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // --- Onboarding: Experience ---
  if (stage === "onboard-experience") {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-2xl mx-auto px-4 py-12 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-2 mb-10"
          >
            <p className="text-sm text-blue-400 font-medium uppercase tracking-wider">Step 2 of 4</p>
            <h1 className="text-3xl font-bold">How long have you been doing this?</h1>
            <p className="text-gray-400">This helps us understand your journey</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="grid grid-cols-2 gap-3"
          >
            {EXPERIENCE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setOnboardExperience(opt.value)}
                className={`text-left rounded-xl border p-5 transition-all ${
                  onboardExperience === opt.value
                    ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/50"
                    : "border-gray-700 bg-gray-900 hover:border-gray-500"
                }`}
              >
                <p className="font-semibold text-lg">{opt.label}</p>
                <p className="text-sm text-gray-400 mt-1">{opt.desc}</p>
              </button>
            ))}
          </motion.div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setStage("onboard-track")}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Back
            </Button>
            <Button
              size="lg"
              disabled={!onboardExperience}
              onClick={() => setStage("onboard-strengths")}
              className="h-11 px-8 text-base"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // --- Onboarding: Strengths ---
  if (stage === "onboard-strengths") {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-2xl mx-auto px-4 py-12 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-2 mb-10"
          >
            <p className="text-sm text-blue-400 font-medium uppercase tracking-wider">Step 3 of 4</p>
            <h1 className="text-3xl font-bold">What are you strongest in?</h1>
            <p className="text-gray-400">Pick up to 3 domains you feel most confident in</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-2"
          >
            {(TRACK_DOMAINS[onboardTrack] || TRACK_DOMAINS.devops).map(d => {
              const isSelected = onboardStrengths.includes(d.key)
              return (
                <button
                  key={d.key}
                  onClick={() => toggleStrength(d.key)}
                  className={`rounded-xl border p-3 text-center transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/50"
                      : "border-gray-700 bg-gray-900 hover:border-gray-500"
                  }`}
                >
                  <span className="text-xl">{d.icon}</span>
                  <p className="text-sm font-medium mt-1">{d.label}</p>
                </button>
              )
            })}
          </motion.div>

          <p className="text-center text-xs text-gray-500 mt-3">
            {onboardStrengths.length}/3 selected
          </p>

          <div className="mt-6 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setStage("onboard-experience")}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Back
            </Button>
            <Button
              size="lg"
              disabled={onboardStrengths.length === 0}
              onClick={() => setStage("onboard-ready")}
              className="h-11 px-8 text-base"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // --- Onboarding: Ready / Summary ---
  if (stage === "onboard-ready") {
    const strengthLabels = onboardStrengths
      .map(k => (TRACK_DOMAINS[onboardTrack] || TRACK_DOMAINS.devops).find(d => d.key === k)?.label || k)
    const expLabel = EXPERIENCE_OPTIONS.find(o => o.value === onboardExperience)?.label || ""

    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-2xl mx-auto px-4 py-12 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-2 mb-10"
          >
            <p className="text-sm text-blue-400 font-medium uppercase tracking-wider">Step 4 of 4</p>
            <h1 className="text-3xl font-bold">Here&apos;s what you told us</h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="rounded-xl border border-gray-700 bg-gray-900 p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{TRACK_META[onboardTrack]?.icon || "🛠️"}</span>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Track</p>
                <p className="font-semibold">{TRACK_META[onboardTrack]?.label || onboardTrack}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Experience</p>
                <p className="font-semibold">{expLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">💪</span>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Strongest In</p>
                <p className="font-semibold">{strengthLabels.join(", ")}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center"
          >
            <p className="text-gray-400 text-lg">
              Let&apos;s build your verified profile.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Complete the assessment and go live to employers.
            </p>
          </motion.div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setStage("onboard-strengths")}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Back
            </Button>
            <Button
              size="lg"
              onClick={() => {
                if (onboardExperience && !selectedLevel) {
                  setSelectedLevel(EXPERIENCE_TO_LEVEL[onboardExperience] || "junior")
                }
                setStage("select-level")
              }}
              className="h-11 px-8 text-base"
            >
              Choose Level
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // --- Level Selection ---
  if (stage === "select-level") {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-2xl mx-auto px-4 py-12 sm:py-20">
          <div className="text-center space-y-3 mb-10">
            <h1 className="text-3xl font-bold">Choose Your Level</h1>
            <p className="text-gray-400 max-w-lg mx-auto">
              Select the level that best matches your experience. This determines the difficulty mix — every level still includes easy, medium, and hard questions.
            </p>
          </div>

          <div className="space-y-4">
            {levels.map((lvl) => {
              const config = LEVEL_CONFIG[lvl]
              const isSelected = selectedLevel === lvl
              const isRecommended = onboardExperience ? EXPERIENCE_TO_LEVEL[onboardExperience] === lvl : false
              const easyPct = Math.round((config.mix.easy / 40) * 100)
              const medPct = Math.round((config.mix.medium / 40) * 100)
              const hardPct = Math.round((config.mix.hard / 40) * 100)

              return (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`w-full text-left rounded-xl border p-5 transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/50"
                      : isRecommended
                        ? "border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-400"
                        : "border-gray-700 bg-gray-900 hover:border-gray-500"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">{config.label}</span>
                        <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                          {config.yearsHint}
                        </Badge>
                        {isRecommended && (
                          <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            Recommended for you
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{config.description}</p>
                    </div>
                    <div
                      className={`shrink-0 w-5 h-5 rounded-full border-2 mt-1 ${
                        isSelected ? "border-blue-500 bg-blue-500" : "border-gray-600"
                      }`}
                    />
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex h-2 rounded-full overflow-hidden">
                      <div className="bg-green-500" style={{ width: `${easyPct}%` }} />
                      <div className="bg-yellow-500" style={{ width: `${medPct}%` }} />
                      <div className="bg-red-500" style={{ width: `${hardPct}%` }} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Easy {easyPct}%
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                        Medium {medPct}%
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Hard {hardPct}%
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setStage("onboard-ready")}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Back
            </Button>
            <Button
              size="lg"
              disabled={!selectedLevel}
              onClick={() => selectedLevel && proceedToRules(selectedLevel)}
              className="h-11 px-8 text-base"
            >
              Continue
            </Button>
          </div>
          <p className="text-center text-xs text-gray-600 mt-3">40 questions &middot; ~15 minutes &middot; You cannot go back</p>
        </div>
      </div>
    )
  }

  // --- Rules / Before You Begin ---
  if (stage === "rules" && selectedLevel) {
    const config = LEVEL_CONFIG[selectedLevel]
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-2xl mx-auto px-4 py-12 sm:py-20">
          <div className="text-center space-y-2 mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-400 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              After this, your profile goes live to employers
            </div>
            <h1 className="text-3xl font-bold">Before You Begin</h1>
            <p className="text-gray-400">
              {config.label} Assessment &middot; 40 questions &middot; ~15 minutes
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-gray-700 bg-gray-900 p-5 space-y-3">
              <h3 className="font-semibold text-lg">How It Works</h3>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
                  <span>Each question is timed individually (12–20 seconds). If time runs out, the question is skipped automatically.</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
                  <span>Questions are scenario-based — read the situation carefully and pick the best answer. Each option includes reasoning to evaluate.</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">3</span>
                  <span>You cannot go back to previous questions. Once answered or timed out, it moves forward.</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">4</span>
                  <span>Your results are scored across {(TRACK_DOMAINS[onboardTrack] || TRACK_DOMAINS.devops).length} {TRACK_META[onboardTrack]?.label || "tech"} domains and shared on your public profile.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-yellow-500/50 bg-yellow-500/10 p-5 space-y-3">
              <h3 className="font-semibold text-lg text-yellow-400">Integrity Rules</h3>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex gap-3">
                  <span className="shrink-0 text-yellow-400">&#9888;</span>
                  <span><strong className="text-white">Tab switches are tracked.</strong> Every time you leave this tab, it is counted and shown to employers on your profile. On mobile, incoming calls or app switches may also trigger this.</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 text-yellow-400">&#9888;</span>
                  <span><strong className="text-white">Copy/paste is disabled.</strong> You cannot copy question text or right-click during the assessment.</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 text-yellow-400">&#9888;</span>
                  <span><strong className="text-white">Time pressure is intentional.</strong> Questions are designed to test your working knowledge, not your ability to look things up.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-gray-700 bg-gray-900 p-5 space-y-2">
              <h3 className="font-semibold text-lg">Tips</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex gap-3">
                  <span className="shrink-0 text-green-400">&#10003;</span>
                  <span>Use a quiet environment with a stable internet connection.</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 text-green-400">&#10003;</span>
                  <span>Close other tabs and notifications to avoid accidental tab switches.</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 text-green-400">&#10003;</span>
                  <span>Don&apos;t overthink — go with your gut on timed questions. An educated guess beats a timeout.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setStage("select-level")}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Back
            </Button>
            <Button
              size="lg"
              onClick={startCountdown}
              className="h-11 px-8 text-base"
            >
              Start Assessment
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // --- Countdown ---
  if (stage === "countdown") {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <AnimatePresence mode="wait">
          {countdownNum > 0 ? (
            <motion.div
              key={countdownNum}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <span className="text-9xl font-bold bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
                {countdownNum}
              </span>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-500 text-lg mt-4"
              >
                {countdownNum === 3 ? "Get ready..." : countdownNum === 2 ? "Focus..." : "Go!"}
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="go"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <span className="text-7xl font-bold text-blue-400">GO</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // --- Finishing ---
  if (stage === "finishing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto" />
          <p className="text-lg font-semibold">Building your verified profile...</p>
          <p className="text-sm text-gray-400">Scoring {answers.length} answers across your domains</p>
        </motion.div>
      </div>
    )
  }

  // --- Quiz ---
  if (!currentQ) return null

  const progressPct = (currentIdx / questions.length) * 100
  const diffColor = { easy: "bg-green-500", medium: "bg-yellow-500", hard: "bg-red-500" }[currentQ.difficulty]
  const timerColor = timeLeft <= 3 ? "text-red-400" : timeLeft <= 5 ? "text-yellow-400" : "text-white"
  const timerBg = timeLeft <= 3 ? "bg-red-500/20" : timeLeft <= 5 ? "bg-yellow-500/20" : "bg-white/10"

  return (
    <div className="min-h-screen bg-gray-950 text-white select-none">
      {/* Tab switch warning overlay */}
      {tabWarning && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <Card className="max-w-md bg-gray-900 border-yellow-500 text-white">
            <CardContent className="pt-6 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto">
                <span className="text-3xl">&#9888;</span>
              </div>
              <p className="text-xl font-bold text-yellow-400">Tab Switch Detected</p>
              <p className="text-gray-300 text-sm">
                Leaving this tab during the assessment is tracked and visible to employers on your profile.
                {tabSwitches > 1 && (
                  <span className="block mt-2 text-yellow-400 font-medium">
                    You have switched tabs {tabSwitches} time{tabSwitches > 1 ? "s" : ""}.
                  </span>
                )}
              </p>
              <Button onClick={() => setTabWarning(false)} className="w-full">
                Continue Assessment
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Copy blocked toast */}
      {copyWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 border border-red-500 text-red-200 px-4 py-2 rounded-lg text-sm font-medium shadow-lg animate-in fade-in slide-in-from-top-2">
          Copying is disabled during the assessment
        </div>
      )}

      {/* Milestone message overlay */}
      <AnimatePresence>
        {milestoneMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-40 bg-blue-600/90 backdrop-blur-sm text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-xl"
          >
            {milestoneMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 z-30 bg-gray-950 py-2 -mt-2 -mx-4 px-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-400">
              Question {currentIdx + 1} of {questions.length}
              {selectedLevel && (
                <span className="ml-2 text-gray-600">
                  &middot; {LEVEL_CONFIG[selectedLevel].label}
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`${diffColor} text-white border-0 text-xs`}>
                {currentQ.difficulty}
              </Badge>
              <Badge variant="outline" className="text-gray-400 border-gray-700 text-xs">
                {currentQ.domain}
              </Badge>
              {tabSwitches > 0 && (
                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-xs">
                  {tabSwitches} tab switch{tabSwitches > 1 ? "es" : ""}
                </Badge>
              )}
            </div>
          </div>
          <div className={`${timerBg} rounded-full px-4 py-2 text-center min-w-[64px]`}>
            <p className={`text-2xl font-mono font-bold ${timerColor}`}>{timeLeft}</p>
          </div>
        </div>

        <Progress value={progressPct} className="h-1.5" />

        {/* Question */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold leading-snug">{currentQ.question}</h2>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQ.options.map((opt) => {
            const isSelected = selected === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => {
                  setSelected(opt.id)
                  setTimeout(() => advance(opt.id), 200)
                }}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-700 bg-gray-900 hover:border-gray-500 hover:bg-gray-800"
                }`}
              >
                <div className="flex gap-3">
                  <span
                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                      isSelected ? "bg-blue-500 text-white" : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {opt.id}
                  </span>
                  <p className="text-sm leading-relaxed text-gray-200">{opt.text}</p>
                </div>
              </button>
            )
          })}
        </div>

        <p className="text-xs text-gray-600 text-center">
          Select an answer or wait for the timer. You cannot go back.
          <span className="hidden sm:inline"> &middot; Press <kbd className="px-1 py-0.5 rounded bg-gray-800 text-gray-400 font-mono text-[10px]">1</kbd>-<kbd className="px-1 py-0.5 rounded bg-gray-800 text-gray-400 font-mono text-[10px]">4</kbd> to answer quickly.</span>
        </p>
      </div>
    </div>
  )
}
