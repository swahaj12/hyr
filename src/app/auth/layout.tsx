import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In — Hyr",
  description: "Sign in or create an account to take your free DevOps assessment.",
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
