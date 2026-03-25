import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard — Hyr",
  description: "Your DevOps assessment dashboard. View results, track progress, and share your profile.",
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
