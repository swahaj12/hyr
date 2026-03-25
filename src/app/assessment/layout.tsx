import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "DevOps Assessment — Hyr",
  description: "40 scenario-based DevOps questions across 13 domains. Timed, anti-cheat monitored, and free.",
}

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
