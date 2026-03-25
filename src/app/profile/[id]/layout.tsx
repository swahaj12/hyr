import type { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data } = await supabase
    .from("assessments")
    .select("total_score, total_questions, overall_level, candidate_name, personality_type")
    .eq("candidate_id", id)
    .order("created_at", { ascending: false })
    .limit(1)

  if (!data || data.length === 0) {
    return { title: "Profile — Hyr" }
  }

  const best = data[0]
  const name = best.candidate_name || "Candidate"
  const pct = Math.round((best.total_score / best.total_questions) * 100)
  const personality = best.personality_type || best.overall_level

  return {
    title: `${name} — ${pct}% | Hyr`,
    description: `${name} scored ${pct}% on their Hyr tech skills assessment (${personality}). View their verified skill profile across 13 engineering domains.`,
  }
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children
}
