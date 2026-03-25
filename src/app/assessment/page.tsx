"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { generateAssessmentSession, type Question } from "@/lib/questions"
import { calculateDomainScores, overallLevel, type AnswerRecord } from "@/lib/scoring"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

type AnswerState = AnswerRecord & {
  selected_option: string
  time_taken_ms: number
}

export default function AssessmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<AnswerState[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [tabWarning, setTabWarning] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const questionStartRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/auth")
        return
      }
      setUserId(data.user.id)
      const q = generateAssessmentSession(40)
      setQuestions(q)
      setTimeLeft(q[0]?.time_seconds ?? 15)
      questionStartRef.current = Date.now()
      setLoading(false)
    })
  }, [router])

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

  useEffect(() => {
    if (loading || submitted) return
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
  }, [loading, submitted, currentIdx, advance])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && !submitted) setTabWarning(true)
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [submitted])

  async function finishAssessment(finalAnswers: AnswerState[]) {
    setFinishing(true)
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
      const fallbackScores = btoa(JSON.stringify({ domainScores, level, totalCorrect, total: finalAnswers.length }))
      router.push(`/results/local?d=${encodeURIComponent(fallbackScores)}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <p className="text-lg">Loading assessment...</p>
      </div>
    )
  }

  if (finishing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto" />
          <p className="text-lg">Calculating your results...</p>
        </div>
      </div>
    )
  }

  if (!currentQ) return null

  const progressPct = ((currentIdx) / questions.length) * 100
  const diffColor = { easy: "bg-green-500", medium: "bg-yellow-500", hard: "bg-red-500" }[currentQ.difficulty]
  const timerColor = timeLeft <= 3 ? "text-red-400" : timeLeft <= 5 ? "text-yellow-400" : "text-white"
  const timerBg = timeLeft <= 3 ? "bg-red-500/20" : timeLeft <= 5 ? "bg-yellow-500/20" : "bg-white/10"

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {tabWarning && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <Card className="max-w-md bg-gray-900 border-yellow-500 text-white">
            <CardContent className="pt-6 space-y-4 text-center">
              <p className="text-xl font-bold text-yellow-400">Tab Switch Detected</p>
              <p className="text-gray-300">
                Switching tabs during the assessment is logged. Employers can see this in your profile.
              </p>
              <Button onClick={() => setTabWarning(false)} className="w-full">
                Continue Assessment
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-400">
              Question {currentIdx + 1} of {questions.length}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`${diffColor} text-white border-0 text-xs`}>
                {currentQ.difficulty}
              </Badge>
              <Badge variant="outline" className="text-gray-400 border-gray-700 text-xs">
                {currentQ.domain}
              </Badge>
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
