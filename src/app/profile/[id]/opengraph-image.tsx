import { ImageResponse } from "next/og"
import { createClient } from "@supabase/supabase-js"

export const runtime = "edge"
export const alt = "Hyr — Candidate Skill Profile"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: assessments } = await supabase
    .from("assessments")
    .select("total_score, total_questions, overall_level, domain_scores, candidate_name, personality_type")
    .eq("candidate_id", id)
    .order("created_at", { ascending: false })

  if (!assessments || assessments.length === 0) {
    return new ImageResponse(
      (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "#030712", color: "#fff", fontFamily: "system-ui" }}>
          <div style={{ fontSize: 48, fontWeight: 700 }}>Hyr — Profile Not Found</div>
        </div>
      ),
      { ...size }
    )
  }

  const best = assessments.reduce((a, b) => {
    const aPct = a.total_questions > 0 ? a.total_score / a.total_questions : 0
    const bPct = b.total_questions > 0 ? b.total_score / b.total_questions : 0
    return aPct >= bPct ? a : b
  })

  const name = (best.candidate_name as string) || "Candidate"
  const pct = Math.round((best.total_score / best.total_questions) * 100)
  const level = best.overall_level as string
  const personality = (best.personality_type as string) || ""
  const domains = (best.domain_scores as Array<{ domainLabel: string; pct: number }>)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4)

  const scoreColor = pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444"

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "#030712",
          color: "#fff",
          fontFamily: "system-ui",
          padding: "60px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                background: "#1f2937",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                fontWeight: 700,
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 36, fontWeight: 700 }}>{name}</div>
              <div style={{ fontSize: 20, color: "#9ca3af", marginTop: 4 }}>
                {personality || level}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ fontSize: 72, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
              {pct}%
            </div>
            <div style={{ fontSize: 18, color: "#6b7280", marginTop: 4 }}>
              Overall Score
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 20 }}>
          {domains.map((d) => (
            <div
              key={d.domainLabel}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "#111827",
                borderRadius: 16,
                padding: "28px 16px",
                border: "1px solid #1f2937",
              }}
            >
              <div style={{ fontSize: 36, fontWeight: 700, color: d.pct >= 70 ? "#10b981" : d.pct >= 40 ? "#f59e0b" : "#ef4444" }}>
                {d.pct}%
              </div>
              <div style={{ fontSize: 16, color: "#9ca3af", marginTop: 8, textAlign: "center" }}>
                {d.domainLabel}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>Hyr</div>
            <div style={{ fontSize: 16, color: "#4b5563" }}>·</div>
            <div style={{ fontSize: 16, color: "#6b7280" }}>Verified Tech Skills</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, background: "#10b981" }} />
            <div style={{ fontSize: 16, color: "#6b7280" }}>Verified Assessment</div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
