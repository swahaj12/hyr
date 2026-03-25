import devopsData from '@/data/devops-question-bank.json'
import frontendData from '@/data/frontend-question-bank.json'
import backendData from '@/data/backend-question-bank.json'
import qaData from '@/data/qa-question-bank.json'

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

export type CandidateLevel = 'junior' | 'mid' | 'senior'
export type TrackId = 'devops' | 'frontend' | 'backend' | 'qa'

export const TRACKS: Record<TrackId, { label: string; description: string }> = {
  devops: { label: 'DevOps', description: 'Infrastructure, CI/CD, Cloud, Containers, SRE' },
  frontend: { label: 'Frontend', description: 'React, TypeScript, CSS, Performance, Accessibility' },
  backend: { label: 'Backend', description: 'APIs, Databases, Architecture, Caching, Security' },
  qa: { label: 'QA', description: 'Test Strategy, Automation, API Testing, Performance, Security' },
}

export const LEVEL_CONFIG: Record<CandidateLevel, { label: string; description: string; yearsHint: string; mix: { easy: number; medium: number; hard: number } }> = {
  junior: {
    label: 'Junior',
    description: 'Starting out or up to 2 years of experience',
    yearsHint: '0-2 years',
    mix: { easy: 20, medium: 16, hard: 4 },
  },
  mid: {
    label: 'Mid-Level',
    description: 'Comfortable with core concepts, 2-5 years of experience',
    yearsHint: '2-5 years',
    mix: { easy: 8, medium: 20, hard: 12 },
  },
  senior: {
    label: 'Senior',
    description: 'Deep expertise across multiple domains, 5+ years',
    yearsHint: '5+ years',
    mix: { easy: 2, medium: 16, hard: 22 },
  },
}

const questionBanks: Record<TrackId, Question[]> = {
  devops: devopsData.questions as Question[],
  frontend: frontendData.questions as Question[],
  backend: backendData.questions as Question[],
  qa: qaData.questions as Question[],
}

const allQuestions = [
  ...devopsData.questions,
  ...frontendData.questions,
  ...backendData.questions,
  ...qaData.questions,
] as Question[]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateAssessmentSession(level: CandidateLevel, count = 40, track: TrackId = 'devops'): Question[] {
  const config = LEVEL_CONFIG[level]
  const target = config.mix
  const pool = questionBanks[track] || allQuestions

  const easyPool = shuffle(pool.filter(q => q.difficulty === 'easy'))
  const mediumPool = shuffle(pool.filter(q => q.difficulty === 'medium'))
  const hardPool = shuffle(pool.filter(q => q.difficulty === 'hard'))

  const selected: Question[] = []
  const usedIds = new Set<string>()

  function pickFromPool(p: Question[], n: number) {
    let picked = 0
    for (const q of p) {
      if (picked >= n) break
      if (!usedIds.has(q.id)) {
        selected.push(q)
        usedIds.add(q.id)
        picked++
      }
    }
    return picked
  }

  const easyTarget = Math.min(target.easy, easyPool.length)
  const mediumTarget = Math.min(target.medium, mediumPool.length)
  const hardTarget = Math.min(target.hard, hardPool.length)

  pickFromPool(easyPool, easyTarget)
  pickFromPool(mediumPool, mediumTarget)
  pickFromPool(hardPool, hardTarget)

  if (selected.length < count) {
    const remaining = shuffle(pool.filter(q => !usedIds.has(q.id)))
    for (const q of remaining) {
      if (selected.length >= count) break
      selected.push(q)
      usedIds.add(q.id)
    }
  }

  const order = { easy: 0, medium: 1, hard: 2 }
  selected.sort((a, b) => order[a.difficulty] - order[b.difficulty])

  return selected.slice(0, count)
}

export { allQuestions }
