import { ImageResponse } from "next/og"

export const alt = "Hyr — Candidate Skill Profile"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Fetch directly via Supabase REST API (avoids edge runtime issues with the JS client)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let name = "Candidate"
  let pct = 0
  let subtitle = ""
  let topDomains: { label: string; score: number }[] = []

  if (supabaseUrl && supabaseKey) {
    try {
      const url = `${supabaseUrl}/rest/v1/assessments?candidate_id=eq.${id}&select=total_score,total_questions,overall_level,domain_scores,candidate_name,personality_type&order=created_at.desc&limit=5`
      const res = await fetch(url, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      })

      if (res.ok) {
        const assessments = await res.json()

        if (Array.isArray(assessments) && assessments.length > 0) {
          const best = assessments.reduce(
            (a: Record<string, unknown>, b: Record<string, unknown>) => {
              const ap = (a.total_questions as number) > 0 ? (a.total_score as number) / (a.total_questions as number) : 0
              const bp = (b.total_questions as number) > 0 ? (b.total_score as number) / (b.total_questions as number) : 0
              return ap >= bp ? a : b
            }
          )

          name = (best.candidate_name as string) || "Candidate"
          pct = (best.total_questions as number) > 0
            ? Math.round(((best.total_score as number) / (best.total_questions as number)) * 100)
            : 0
          subtitle = (best.personality_type as string) || (best.overall_level as string) || ""

          const ds = best.domain_scores
          if (Array.isArray(ds)) {
            topDomains = ds
              .map((d: Record<string, unknown>) => ({
                label: String(d.domainLabel || d.domain || ""),
                score: Number(d.pct || 0),
              }))
              .sort((a, b) => b.score - a.score)
              .slice(0, 4)
          }
        }
      }
    } catch {
      // fall through to default rendering
    }
  }

  const green = "#10b981"
  const yellow = "#f59e0b"
  const red = "#ef4444"
  const scoreColor = pct >= 70 ? green : pct >= 40 ? yellow : red
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
          color: "white",
          padding: 60,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: "#1f2937",
                fontSize: 32,
                fontWeight: 700,
                color: "white",
                marginRight: 20,
              }}
            >
              {initial}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 34, fontWeight: 700, color: "white" }}>{name}</span>
              <span style={{ fontSize: 18, color: "#9ca3af", marginTop: 4 }}>{subtitle}</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: 64, fontWeight: 700, color: scoreColor }}>{pct}%</span>
            <span style={{ fontSize: 16, color: "#6b7280" }}>Overall Score</span>
          </div>
        </div>

        {/* Domains */}
        {topDomains.length > 0 && (
          <div style={{ display: "flex", marginTop: 40 }}>
            {topDomains.map((d, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                  backgroundColor: "#111827",
                  borderRadius: 16,
                  padding: "24px 12px",
                  marginLeft: i === 0 ? 0 : 16,
                }}
              >
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: d.score >= 70 ? green : d.score >= 40 ? yellow : red,
                  }}
                >
                  {d.score}%
                </span>
                <span style={{ fontSize: 14, color: "#9ca3af", marginTop: 8 }}>{d.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: "white", marginRight: 12 }}>Hyr</span>
            <span style={{ fontSize: 15, color: "#6b7280" }}>Verified Tech Skills</span>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: green, marginRight: 8 }} />
            <span style={{ fontSize: 15, color: "#6b7280" }}>Verified Assessment</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
