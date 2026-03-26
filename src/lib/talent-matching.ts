import { type DomainScore, DOMAIN_LABELS, displayLevel } from "./scoring"

export const TRACK_DOMAINS: Record<string, string[]> = {
  devops: ["linux", "networking", "git", "scripting", "cloud", "containers", "kubernetes", "iac", "cicd", "monitoring", "security", "sre", "finops"],
  frontend: ["html-css", "javascript", "typescript", "react", "performance", "accessibility", "testing", "state-mgmt", "apis", "build-tools"],
  backend: ["databases", "apis-design", "architecture", "caching", "messaging", "concurrency", "observability", "deployment"],
  qa: ["test-strategy", "manual-testing", "automation", "api-testing", "performance-testing", "mobile-testing", "security-testing", "test-data", "bug-tracking", "ci-cd-testing"],
}

export const TRACK_LABELS: Record<string, string> = {
  devops: "DevOps",
  frontend: "Frontend",
  backend: "Backend",
  qa: "QA",
}

export const SKILL_THRESHOLD = 50

export type CandidateMatchProfile = {
  candidateId: string
  name: string
  overallPct: number
  level: string
  assessedLevel: string | null
  track: string | null
  tabSwitches: number
  totalAssessments: number
  domainScores: DomainScore[]
  personalityType: string | null
  selfExperience: string | null
  createdAt: string
}

export type MatchResult = {
  candidate: CandidateMatchProfile
  matchPct: number
  matchedSkills: string[]
  missingSkills: string[]
  tier: "ready" | "almost" | "growing" | "low"
}

export function matchCandidateToNeed(
  candidate: CandidateMatchProfile,
  requiredSkills: string[],
  minLevel: string,
): MatchResult {
  if (requiredSkills.length === 0) {
    return {
      candidate,
      matchPct: 0,
      matchedSkills: [],
      missingSkills: [],
      tier: "low",
    }
  }

  const scoreMap = new Map(candidate.domainScores.map(s => [s.domain, s.pct]))

  const matchedSkills: string[] = []
  const missingSkills: string[] = []

  for (const skill of requiredSkills) {
    const score = scoreMap.get(skill) ?? 0
    if (score >= SKILL_THRESHOLD) {
      matchedSkills.push(skill)
    } else {
      missingSkills.push(skill)
    }
  }

  const matchPct = Math.round((matchedSkills.length / requiredSkills.length) * 100)

  let tier: MatchResult["tier"] = "low"
  if (matchPct >= 90) tier = "ready"
  else if (matchPct >= 70) tier = "almost"
  else if (matchPct >= 50) tier = "growing"

  const levelRank: Record<string, number> = {
    beginner: 0, "entry-level": 1, junior: 2, "mid-level": 3, senior: 4,
  }

  const candidateRank = levelRank[displayLevel(candidate.level).toLowerCase()] ?? 0
  const requiredRank = levelRank[minLevel.toLowerCase()] ?? 0

  if (candidateRank < requiredRank && tier === "ready") {
    tier = "almost"
  }

  return { candidate, matchPct, matchedSkills, missingSkills, tier }
}

export type ReadinessTier = {
  label: string
  color: string
  bgColor: string
  borderColor: string
  description: string
}

export function getReadinessTier(overallPct: number, tabSwitches: number, assessmentCount: number): ReadinessTier {
  const trustClean = tabSwitches === 0

  if (overallPct >= 70 && trustClean) {
    return {
      label: "Interview-Ready",
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      description: "Strong skills with clean trust signals. Ready for final interviews.",
    }
  }

  if (overallPct >= 55) {
    return {
      label: "Rising Talent",
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Solid foundation with room to grow. Retake to strengthen your profile.",
    }
  }

  if (overallPct >= 35 && assessmentCount >= 2) {
    return {
      label: "Growth Track",
      color: "text-amber-700",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      description: "Showing commitment to improvement. Keep building your skills.",
    }
  }

  return {
    label: "Building Foundation",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    description: "Just getting started. Complete assessments to build your career profile.",
  }
}

export function calculatePercentile(candidateScore: number, allScores: number[]): number {
  if (allScores.length === 0) return 0
  const below = allScores.filter(s => s < candidateScore).length
  return Math.round((below / allScores.length) * 100)
}

export function getSkillLabel(domain: string): string {
  return DOMAIN_LABELS[domain] || domain
}

export type TalentMarketStats = {
  totalCandidates: number
  totalAssessments: number
  trackDistribution: { track: string; label: string; count: number; avgScore: number }[]
  levelDistribution: { level: string; count: number }[]
  topDomainScores: { domain: string; label: string; avgPct: number }[]
  topPercentileThreshold: Record<string, number>
}
