import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Skills Assessment — Hyr",
  description: "40 scenario-based questions across multiple domains. Timed, anti-cheat monitored, and free.",
}

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
