import { describe, it, expect } from "vitest"
import {
  matchCandidateToNeed,
  getReadinessTier,
  calculatePercentile,
  type CandidateMatchProfile,
} from "./talent-matching"
import type { DomainScore } from "./scoring"

// ─── Helpers ──────────────────────────────────────────────────

function makeDomain(domain: string, pct: number): DomainScore {
  return { domain, domainLabel: domain, correct: pct, total: 100, pct, level: "Proficient" }
}

function makeCandidate(overrides?: Partial<CandidateMatchProfile>): CandidateMatchProfile {
  return {
    candidateId: "c1",
    name: "Test",
    overallPct: 70,
    level: "Mid-Level",
    assessedLevel: null,
    track: "devops",
    tabSwitches: 0,
    totalAssessments: 1,
    domainScores: [
      makeDomain("linux", 80),
      makeDomain("git", 75),
      makeDomain("cloud", 60),
      makeDomain("containers", 40),
    ],
    personalityType: null,
    selfExperience: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

// ─── matchCandidateToNeed ─────────────────────────────────────

describe("matchCandidateToNeed", () => {
  it("returns 100% match when all required skills are above threshold", () => {
    const candidate = makeCandidate()
    const result = matchCandidateToNeed(candidate, ["linux", "git", "cloud"], "junior")
    expect(result.matchPct).toBe(100)
    expect(result.tier).toBe("ready")
    expect(result.matchedSkills).toEqual(["linux", "git", "cloud"])
    expect(result.missingSkills).toEqual([])
  })

  it("returns partial match with missing skills", () => {
    const candidate = makeCandidate()
    const result = matchCandidateToNeed(candidate, ["linux", "git", "containers"], "junior")
    expect(result.matchPct).toBe(67) // 2/3
    expect(result.matchedSkills).toEqual(["linux", "git"])
    expect(result.missingSkills).toEqual(["containers"])
    expect(result.tier).toBe("growing")
  })

  it("returns 0% for empty required skills", () => {
    const candidate = makeCandidate()
    const result = matchCandidateToNeed(candidate, [], "junior")
    expect(result.matchPct).toBe(0)
    expect(result.tier).toBe("low")
  })

  it("downgrades from ready to almost if level is below requirement", () => {
    const candidate = makeCandidate({ level: "Junior" })
    const result = matchCandidateToNeed(candidate, ["linux", "git", "cloud"], "mid-level")
    expect(result.matchPct).toBe(100)
    expect(result.tier).toBe("almost") // downgraded due to level
  })

  it("classifies growing tier at 50-69% match", () => {
    const candidate = makeCandidate({
      domainScores: [
        makeDomain("linux", 80),
        makeDomain("git", 20),
        makeDomain("cloud", 20),
        makeDomain("containers", 20),
      ],
    })
    const result = matchCandidateToNeed(candidate, ["linux", "git"], "junior")
    expect(result.matchPct).toBe(50)
    expect(result.tier).toBe("growing")
  })
})

// ─── getReadinessTier ─────────────────────────────────────────

describe("getReadinessTier", () => {
  it("returns Interview-Ready for 70%+ with clean trust", () => {
    const tier = getReadinessTier(75, 0, 1)
    expect(tier.label).toBe("Interview-Ready")
  })

  it("returns Rising Talent for 55-69%", () => {
    const tier = getReadinessTier(60, 0, 1)
    expect(tier.label).toBe("Rising Talent")
  })

  it("returns Rising Talent for 70%+ with tab switches", () => {
    const tier = getReadinessTier(75, 3, 1)
    expect(tier.label).toBe("Rising Talent")
  })

  it("returns Growth Track for 35-54% with multiple assessments", () => {
    const tier = getReadinessTier(40, 0, 2)
    expect(tier.label).toBe("Growth Track")
  })

  it("returns Building Foundation for low scores", () => {
    const tier = getReadinessTier(20, 0, 1)
    expect(tier.label).toBe("Building Foundation")
  })
})

// ─── calculatePercentile ──────────────────────────────────────

describe("calculatePercentile", () => {
  it("returns 0 for empty scores", () => {
    expect(calculatePercentile(50, [])).toBe(0)
  })

  it("computes percentile correctly", () => {
    const allScores = [20, 30, 40, 50, 60, 70, 80, 90]
    expect(calculatePercentile(55, allScores)).toBe(50) // 4 out of 8 below
  })

  it("returns 100 for top scorer", () => {
    expect(calculatePercentile(100, [10, 20, 30, 40])).toBe(100)
  })

  it("returns 0 for lowest scorer", () => {
    expect(calculatePercentile(5, [10, 20, 30, 40])).toBe(0)
  })
})
