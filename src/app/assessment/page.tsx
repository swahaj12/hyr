"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { generateAssessmentSession, LEVEL_CONFIG, type Question, type CandidateLevel } from "@/lib/questions"
import { calculateDomainScores, overallLevel, type AnswerRecord } from "@/lib/scoring"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

type AnswerState = AnswerRecord & {
  selected_option: string
  time_taken_ms: number
}

const levels: CandidateLevel[] = ["junior", "mid", "senior"]

export default function AssessmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const [stage, setStage] = useState<"select-level" | "quiz" | "finishing">("select-level")
  const [selectedLevel, setSelectedLevel] = useState<CandidateLevel | null>(null)

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<AnswerState[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const [tabSwitches, setTabSwitches] = useState(0)
  const [tabWarning, setTabWarning] = useState(false)
  const [copyWarning, setCopyWarning] = useState(false)

  const questionStartRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/auth")
        return
      }
      setUserId(data.user.id)
      setLoading(false)
    })
  }, [router])

  function startQuiz(level: CandidateLevel) {
    setSelectedLevel(level)
    const q = generateAssessmentSession(level, 40)
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

      if (currentIdx + 1 < questions.length) {
        const nextQ = questions[currentIdx + 1]
        setCurrentIdx(currentIdx + 1)
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

  // Anti-cheat: block copy/paste/right-click during quiz
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
    setStage("finishing")
    setSubmitted(true)
    if (timerRef.current) clearInterval(timerRef.current)

    const domainScores = calculateDomainScores(finalAnswers)
    const level = overallLevel(domainScores)
    const totalCorrect = finalAnswers.filter((a) => a.is_correct).length

    const { data: assessment, error } = await supabase
      .from("assessments")
      .insert({
        candidate_id: userId,
        total_score: totalCorrect,
        total_questions: finalAnswers.length,
        overall_level: level,
        domain_scores: domainScores,
        assessed_level: selectedLevel,
        tab_switches: tabSwitches,
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
      router.push(`/results/${assessment.id}`)
    } else {
      const fallbackScores = btoa(
        JSON.stringify({ domainScores, level, totalCorrect, total: finalAnswers.length, assessedLevel: selectedLevel, tabSwitches })
      )
      router.push(`/results/local?d=${encodeURIComponent(fallbackScores)}`)
    }
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

          <div className="mt-8 text-center space-y-3">
            <Button
              size="lg"
              disabled={!selectedLevel}
              onClick={() => selectedLevel && startQuiz(selectedLevel)}
              className="h-11 px-8 text-base"
            >
              Start Assessment
            </Button>
            <p className="text-xs text-gray-600">40 questions &middot; ~15 minutes &middot; You cannot go back</p>
          </div>
        </div>
      </div>
    )
  }

  // --- Finishing ---
  if (stage === "finishing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto" />
          <p className="text-lg">Calculating your results...</p>
        </div>
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

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
        </p>
      </div>
    </div>
  )
}
