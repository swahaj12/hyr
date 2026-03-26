import { ImageResponse } from "next/og"
import { createClient } from "@supabase/supabase-js"

export const runtime = "edge"
export const alt = "Hyr — Candidate Skill Profile"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let name = "Candidate"
  let pct = 0
  let personality = ""
  let topDomains: { label: string; score: number }[] = []

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: assessments } = await supabase
      .from("assessments")
      .select("total_score, total_questions, overall_level, domain_scores, candidate_name, personality_type")
      .eq("candidate_id", id)
      .order("created_at", { ascending: false })

    if (assessments && assessments.length > 0) {
      const best = assessments.reduce((a, b) => {
        const ap = a.total_questions > 0 ? a.total_score / a.total_questions : 0
        const bp = b.total_questions > 0 ? b.total_score / b.total_questions : 0
        return ap >= bp ? a : b
      })

      name = best.candidate_name || "Candidate"
      pct = best.total_questions > 0 ? Math.round((best.total_score / best.total_questions) * 100) : 0
      personality = best.personality_type || best.overall_level || ""

      if (Array.isArray(best.domain_scores)) {
        topDomains = best.domain_scores
          .map((d: Record<string, unknown>) => ({ label: String(d.domainLabel || d.domain || ""), score: Number(d.pct || 0) }))
          .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
          .slice(0, 4)
      }
    }
  } catch {
    // fall through to default rendering
  }

  const scoreColor = pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444"
  const initial = name.charAt(0).toUpperCase()

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#030712",
          color: "#ffffff",
          padding: "60px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top row: avatar + name | score */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: "#1f2937",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                fontWeight: 700,
                marginRight: 20,
              }}
            >
              {initial}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 34, fontWeight: 700 }}>{name}</div>
              <div style={{ fontSize: 18, color: "#9ca3af", marginTop: 4 }}>{personality}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ fontSize: 64, fontWeight: 700, color: scoreColor }}>{pct}%</div>
            <div style={{ fontSize: 16, color: "#6b7280" }}>Overall Score</div>
          </div>
        </div>

        {/* Domain cards */}
        <div style={{ display: "flex", marginTop: 40 }}>
          {topDomains.length > 0 ? (
            topDomains.map((d, i) => (
              <div
                key={String(i)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  backgroundColor: "#111827",
                  borderRadius: 16,
                  padding: "28px 16px",
                  border: "1px solid #1f2937",
                  marginLeft: i > 0 ? 16 : 0,
                }}
              >
                <div style={{ fontSize: 34, fontWeight: 700, color: d.score >= 70 ? "#10b981" : d.score >= 40 ? "#f59e0b" : "#ef4444" }}>
                  {d.score}%
                </div>
                <div style={{ fontSize: 14, color: "#9ca3af", marginTop: 8, textAlign: "center" }}>
                  {d.label}
                </div>
              </div>
            ))
          ) : (
            <div style={{ display: "flex", fontSize: 20, color: "#6b7280" }}>Verified on Hyr</div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 32 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, marginRight: 12 }}>Hyr</div>
            <div style={{ fontSize: 15, color: "#6b7280" }}>Verified Tech Skills</div>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#10b981", marginRight: 8 }} />
            <div style={{ fontSize: 15, color: "#6b7280" }}>Verified Assessment</div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
