export type DomainScore = {
  domain: string
  domainLabel: string
  correct: number
  total: number
  pct: number
  level: string
}

export const DOMAIN_LABELS: Record<string, string> = {
  // DevOps
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
  // Frontend
  'html-css': 'HTML & CSS',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  react: 'React',
  performance: 'Performance',
  accessibility: 'Accessibility',
  testing: 'Testing',
  'state-mgmt': 'State Mgmt',
  apis: 'APIs',
  'build-tools': 'Build Tools',
  // Backend
  databases: 'Databases',
  'apis-design': 'API Design',
  architecture: 'Architecture',
  caching: 'Caching',
  messaging: 'Messaging',
  concurrency: 'Concurrency',
  observability: 'Observability',
  deployment: 'Deployment',
  // QA
  'test-strategy': 'Test Strategy',
  'manual-testing': 'Manual Testing',
  automation: 'Automation',
  'api-testing': 'API Testing',
  'performance-testing': 'Perf Testing',
  'mobile-testing': 'Mobile Testing',
  'security-testing': 'Security Testing',
  'test-data': 'Test Data',
  'bug-tracking': 'Bug Tracking',
  'ci-cd-testing': 'CI/CD Testing',
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

export type PersonalityType = {
  title: string
  tagline: string
  domains: string[]
}

const PERSONALITY_TYPES: { title: string; tagline: string; keys: string[][] }[] = [
  // DevOps
  { title: 'The Infrastructure Architect', tagline: 'You build the foundations everything runs on', keys: [['kubernetes', 'cloud', 'iac']] },
  { title: 'The Pipeline Builder', tagline: 'You make code flow from commit to production', keys: [['cicd', 'git', 'scripting']] },
  { title: 'The Guardian', tagline: 'You keep systems safe, stable, and observable', keys: [['security', 'monitoring', 'sre']] },
  { title: 'The Cloud Native', tagline: 'Containers and orchestration are your second language', keys: [['kubernetes', 'containers', 'cloud']] },
  { title: 'The Automation Engineer', tagline: 'If it can be scripted, you\'ve already automated it', keys: [['scripting', 'iac', 'cicd']] },
  // Frontend
  { title: 'The Pixel Perfectionist', tagline: 'You craft interfaces that look and feel flawless', keys: [['html-css', 'accessibility', 'react']] },
  { title: 'The JS Wizard', tagline: 'You bend JavaScript to your will', keys: [['javascript', 'typescript', 'state-mgmt']] },
  { title: 'The Performance Hunter', tagline: 'You squeeze every millisecond out of the browser', keys: [['performance', 'build-tools', 'apis']] },
  { title: 'The Component Architect', tagline: 'You design systems of reusable, composable UI', keys: [['react', 'state-mgmt', 'typescript']] },
  { title: 'The Quality Crafter', tagline: 'Your UIs are accessible, tested, and bulletproof', keys: [['testing', 'accessibility', 'typescript']] },
  // Backend
  { title: 'The Data Whisperer', tagline: 'You model, query, and optimize data at scale', keys: [['databases', 'caching', 'architecture']] },
  { title: 'The API Artisan', tagline: 'You design APIs that developers love', keys: [['apis-design', 'security', 'architecture']] },
  { title: 'The System Designer', tagline: 'You think in distributed systems and message flows', keys: [['architecture', 'messaging', 'concurrency']] },
  { title: 'The Reliability Engineer', tagline: 'Your services stay up when everything else goes down', keys: [['observability', 'deployment', 'concurrency']] },
  { title: 'The Security Sentinel', tagline: 'You build backends that are secure by default', keys: [['security', 'apis-design', 'databases']] },
  // QA
  { title: 'The Test Strategist', tagline: 'You design quality into the process from day one', keys: [['test-strategy', 'test-data', 'ci-cd-testing']] },
  { title: 'The Automation Ace', tagline: 'You make testing fast, reliable, and repeatable', keys: [['automation', 'api-testing', 'ci-cd-testing']] },
  { title: 'The Bug Hunter', tagline: 'If there\'s a defect hiding, you\'ll find it', keys: [['manual-testing', 'bug-tracking', 'test-strategy']] },
  { title: 'The Security Tester', tagline: 'You think like an attacker to protect users', keys: [['security-testing', 'api-testing', 'performance-testing']] },
  { title: 'The Performance Analyst', tagline: 'You know exactly where the system will break under load', keys: [['performance-testing', 'mobile-testing', 'test-data']] },
]

export function engineeringPersonality(scores: DomainScore[]): PersonalityType {
  const scoreMap = new Map(scores.map(s => [s.domain, s.pct]))

  let bestType = PERSONALITY_TYPES[0]
  let bestScore = -1

  for (const pt of PERSONALITY_TYPES) {
    for (const keyGroup of pt.keys) {
      const groupScore = keyGroup.reduce((sum, k) => sum + (scoreMap.get(k) || 0), 0)
      if (groupScore > bestScore) {
        bestScore = groupScore
        bestType = pt
      }
    }
  }

  const avg = scores.reduce((s, d) => s + d.pct, 0) / (scores.length || 1)
  const spread = Math.max(...scores.map(s => s.pct)) - Math.min(...scores.map(s => s.pct))
  if (spread < 20 && avg >= 50) {
    return {
      title: 'The Versatile Engineer',
      tagline: 'Balanced across the board — you can do it all',
      domains: scores.filter(s => s.pct >= 50).map(s => s.domainLabel),
    }
  }

  return {
    title: bestType.title,
    tagline: bestType.tagline,
    domains: bestType.keys[0].map(k => {
      const found = scores.find(s => s.domain === k)
      return found?.domainLabel || k
    }),
  }
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
