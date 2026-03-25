import questionsData from '@/data/devops-question-bank.json'

export type QuestionOption = {
  id: string
  text: string
}

export type Question = {
  id: string
  domain: string
  skill: string
  difficulty: 'easy' | 'medium' | 'hard'
  time_seconds: number
  question: string
  options: QuestionOption[]
  correct: string
  explanation: string
}

const allQuestions = questionsData.questions as Question[]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateAssessmentSession(count = 40): Question[] {
  const domains = [...new Set(allQuestions.map(q => q.domain))]
  const byDomain = new Map<string, Question[]>()
  for (const q of allQuestions) {
    const arr = byDomain.get(q.domain) || []
    arr.push(q)
    byDomain.set(q.domain, arr)
  }

  const selected: Question[] = []
  const usedIds = new Set<string>()

  // Ensure at least 1 question per domain
  for (const domain of domains) {
    const pool = byDomain.get(domain) || []
    const shuffled = shuffle(pool)
    if (shuffled.length > 0 && !usedIds.has(shuffled[0].id)) {
      selected.push(shuffled[0])
      usedIds.add(shuffled[0].id)
    }
  }

  // Fill remaining slots randomly
  const remaining = shuffle(allQuestions.filter(q => !usedIds.has(q.id)))
  for (const q of remaining) {
    if (selected.length >= count) break
    selected.push(q)
    usedIds.add(q.id)
  }

  // Sort: easy first, then medium, then hard
  const order = { easy: 0, medium: 1, hard: 2 }
  selected.sort((a, b) => order[a.difficulty] - order[b.difficulty])

  return selected
}

export { allQuestions }
