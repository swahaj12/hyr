import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Browse DevOps Candidates — Hyr",
  description: "Browse verified DevOps engineer profiles. Filter by domain expertise and skill level. Skip screening rounds.",
  openGraph: {
    title: "Browse Verified DevOps Candidates — Hyr",
    description: "Find pre-assessed DevOps engineers with verified skill profiles across 13 domains.",
  },
}

export default function EmployersLayout({ children }: { children: React.ReactNode }) {
  return children
}
