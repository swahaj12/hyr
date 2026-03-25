export type DomainScore = {
  domain: string
  domainLabel: string
  correct: number
  total: number
  pct: number
  level: string
}

const DOMAIN_LABELS: Record<string, string> = {
  linux: 'Linux',
  networking: 'Networking',
  git: 'Git',
  scripting: 'Scripting',
  cloud: 'Cloud / AWS',
  containers: 'Docker',
  kubernetes: 'Kubernetes',
  iac: 'Terraform / IaC',
  cicd: 'CI/CD',
  monitoring: 'Monitoring',
  security: 'Security',
  sre: 'SRE',
  finops: 'FinOps',
}

function pctToLevel(pct: number, hasHardCorrect: boolean): string {
  if (pct >= 80 && hasHardCorrect) return 'Expert'
  if (pct >= 70) return 'Proficient'
  if (pct >= 55) return 'Developing'
  if (pct >= 35) return 'Basic'
  return 'Needs Work'
}

export function overallLevel(scores: DomainScore[]): string {
  const avg = scores.reduce((s, d) => s + d.pct, 0) / (scores.length || 1)
  if (avg >= 75) return 'Senior'
  if (avg >= 60) return 'Mid-Level'
  if (avg >= 45) return 'Junior'
  if (avg >= 25) return 'Entry-Level'
  return 'Beginner'
}

const LEGACY_LEVEL_MAP: Record<string, string> = {
  'Senior DevOps (L2-L3)': 'Senior',
  'Mid-Level DevOps (L2)': 'Mid-Level',
  'Junior+ DevOps (L1-L2)': 'Junior',
  'Junior DevOps (L1)': 'Entry-Level',
  'Foundational (Pre-L1)': 'Beginner',
  'L2+': 'Expert',
  'L2': 'Proficient',
  'L1-L2': 'Developing',
  'L1': 'Basic',
  'Gap': 'Needs Work',
}

export function displayLevel(stored: string): string {
  return LEGACY_LEVEL_MAP[stored] || stored
}

export type AnswerRecord = {
  question_id: string
  domain: string
  difficulty: string
  is_correct: boolean
}

export function calculateDomainScores(answers: AnswerRecord[]): DomainScore[] {
  const domainMap = new Map<string, { correct: number; total: number; hasHardCorrect: boolean }>()

  for (const a of answers) {
    const d = domainMap.get(a.domain) || { correct: 0, total: 0, hasHardCorrect: false }
    d.total++
    if (a.is_correct) {
      d.correct++
      if (a.difficulty === 'hard') d.hasHardCorrect = true
    }
    domainMap.set(a.domain, d)
  }

  const domainOrder = Object.keys(DOMAIN_LABELS)
  return domainOrder
    .filter(d => domainMap.has(d))
    .map(domain => {
      const { correct, total, hasHardCorrect } = domainMap.get(domain)!
      const pct = Math.round((correct / total) * 100)
      return {
        domain,
        domainLabel: DOMAIN_LABELS[domain] || domain,
        correct,
        total,
        pct,
        level: pctToLevel(pct, hasHardCorrect),
      }
    })
}
