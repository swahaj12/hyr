import { describe, it, expect } from "vitest"
import {
  overallLevel,
  displayLevel,
  engineeringPersonality,
  calculateDomainScores,
  type DomainScore,
  type AnswerRecord,
} from "./scoring"

// ─── Helpers ──────────────────────────────────────────────────

function makeDomain(domain: string, pct: number): DomainScore {
  return { domain, domainLabel: domain, correct: pct, total: 100, pct, level: "Proficient" }
}

// ─── overallLevel ─────────────────────────────────────────────

describe("overallLevel", () => {
  it("returns Senior for high average", () => {
    const scores = [makeDomain("linux", 80), makeDomain("git", 85)]
    expect(overallLevel(scores)).toBe("Senior")
  })

  it("returns Mid-Level for moderate average", () => {
    const scores = [makeDomain("linux", 60), makeDomain("git", 65)]
    expect(overallLevel(scores)).toBe("Mid-Level")
  })

  it("returns Junior for lower average", () => {
    const scores = [makeDomain("linux", 45), makeDomain("git", 50)]
    expect(overallLevel(scores)).toBe("Junior")
  })

  it("returns Entry-Level for 25-44 avg", () => {
    const scores = [makeDomain("linux", 30), makeDomain("git", 28)]
    expect(overallLevel(scores)).toBe("Entry-Level")
  })

  it("returns Beginner for very low", () => {
    const scores = [makeDomain("linux", 10), makeDomain("git", 15)]
    expect(overallLevel(scores)).toBe("Beginner")
  })
})

// ─── displayLevel ─────────────────────────────────────────────

describe("displayLevel", () => {
  it("maps legacy level strings", () => {
    expect(displayLevel("Senior DevOps (L2-L3)")).toBe("Senior")
    expect(displayLevel("L2+")).toBe("Expert")
    expect(displayLevel("Gap")).toBe("Needs Work")
  })

  it("passes through non-legacy names", () => {
    expect(displayLevel("Senior")).toBe("Senior")
    expect(displayLevel("Custom")).toBe("Custom")
  })
})

// ─── engineeringPersonality ───────────────────────────────────

describe("engineeringPersonality", () => {
  it("detects Infrastructure Architect when k8s+cloud+iac dominate", () => {
    const scores = [
      makeDomain("kubernetes", 90),
      makeDomain("cloud", 85),
      makeDomain("iac", 80),
      makeDomain("linux", 30),
      makeDomain("git", 20),
    ]
    expect(engineeringPersonality(scores).title).toBe("The Infrastructure Architect")
  })

  it("detects Versatile Engineer for uniform high scores", () => {
    const domains = ["kubernetes", "cloud", "iac", "linux", "git", "cicd", "containers", "scripting"]
    const scores = domains.map(d => makeDomain(d, 65))
    const result = engineeringPersonality(scores)
    expect(result.title).toBe("The Versatile Engineer")
  })

  it("detects frontend personality type", () => {
    const scores = [
      makeDomain("html-css", 90),
      makeDomain("accessibility", 85),
      makeDomain("react", 80),
      makeDomain("javascript", 30),
    ]
    expect(engineeringPersonality(scores).title).toBe("The Pixel Perfectionist")
  })

  it("returns tagline with personality", () => {
    const scores = [
      makeDomain("security", 90),
      makeDomain("monitoring", 85),
      makeDomain("sre", 80),
    ]
    const result = engineeringPersonality(scores)
    expect(result.tagline).toBeTruthy()
    expect(result.domains.length).toBeGreaterThan(0)
  })
})

// ─── calculateDomainScores ────────────────────────────────────

describe("calculateDomainScores", () => {
  it("groups answers by domain and computes percentages", () => {
    const answers: AnswerRecord[] = [
      { question_id: "q1", domain: "linux", difficulty: "easy", is_correct: true },
      { question_id: "q2", domain: "linux", difficulty: "medium", is_correct: true },
      { question_id: "q3", domain: "linux", difficulty: "hard", is_correct: false },
      { question_id: "q4", domain: "git", difficulty: "easy", is_correct: true },
      { question_id: "q5", domain: "git", difficulty: "easy", is_correct: false },
    ]
    const scores = calculateDomainScores(answers)

    const linux = scores.find(s => s.domain === "linux")!
    expect(linux.correct).toBe(2)
    expect(linux.total).toBe(3)
    expect(linux.pct).toBe(67)

    const git = scores.find(s => s.domain === "git")!
    expect(git.correct).toBe(1)
    expect(git.total).toBe(2)
    expect(git.pct).toBe(50)
  })

  it("assigns Expert level when pct >= 80 with hard correct", () => {
    const answers: AnswerRecord[] = [
      { question_id: "q1", domain: "linux", difficulty: "hard", is_correct: true },
      { question_id: "q2", domain: "linux", difficulty: "easy", is_correct: true },
      { question_id: "q3", domain: "linux", difficulty: "easy", is_correct: true },
      { question_id: "q4", domain: "linux", difficulty: "easy", is_correct: true },
      { question_id: "q5", domain: "linux", difficulty: "easy", is_correct: true },
    ]
    const scores = calculateDomainScores(answers)
    expect(scores[0].level).toBe("Expert")
  })

  it("assigns Proficient without hard correct at 80%", () => {
    const answers: AnswerRecord[] = [
      { question_id: "q1", domain: "linux", difficulty: "easy", is_correct: true },
      { question_id: "q2", domain: "linux", difficulty: "easy", is_correct: true },
      { question_id: "q3", domain: "linux", difficulty: "easy", is_correct: true },
      { question_id: "q4", domain: "linux", difficulty: "easy", is_correct: true },
      { question_id: "q5", domain: "linux", difficulty: "easy", is_correct: false },
    ]
    const scores = calculateDomainScores(answers)
    expect(scores[0].level).toBe("Proficient")
  })

  it("returns empty for no answers", () => {
    expect(calculateDomainScores([])).toEqual([])
  })

  it("respects DOMAIN_LABELS ordering", () => {
    const answers: AnswerRecord[] = [
      { question_id: "q1", domain: "git", difficulty: "easy", is_correct: true },
      { question_id: "q2", domain: "linux", difficulty: "easy", is_correct: true },
    ]
    const scores = calculateDomainScores(answers)
    expect(scores[0].domain).toBe("linux") // linux comes before git in DOMAIN_LABELS
    expect(scores[1].domain).toBe("git")
  })
})
