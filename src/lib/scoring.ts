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
  if (pct >= 80 && hasHardCorrect) return 'L2+'
  if (pct >= 70) return 'L2'
  if (pct >= 55) return 'L1-L2'
  if (pct >= 35) return 'L1'
  return 'Gap'
}

export function overallLevel(scores: DomainScore[]): string {
  const avg = scores.reduce((s, d) => s + d.pct, 0) / (scores.length || 1)
  if (avg >= 75) return 'Senior DevOps (L2-L3)'
  if (avg >= 60) return 'Mid-Level DevOps (L2)'
  if (avg >= 45) return 'Junior+ DevOps (L1-L2)'
  if (avg >= 25) return 'Junior DevOps (L1)'
  return 'Foundational (Pre-L1)'
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
