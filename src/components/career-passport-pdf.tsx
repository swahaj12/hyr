"use client"

import { Document, Page, View, Text, StyleSheet, Font } from "@react-pdf/renderer"
import type { DomainScore } from "@/lib/scoring"

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiA.woff2", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hiA.woff2", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiA.woff2", fontWeight: 700 },
  ],
})

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: "Inter", fontSize: 10, color: "#111" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: "2px solid #111", paddingBottom: 16 },
  logo: { fontSize: 28, fontWeight: 700, letterSpacing: -1 },
  subtitle: { fontSize: 9, color: "#666", marginTop: 2 },
  name: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
  personality: { fontSize: 12, fontWeight: 600, color: "#4f46e5", marginBottom: 2 },
  tagline: { fontSize: 9, color: "#666", marginBottom: 20 },
  scoreRow: { flexDirection: "row", gap: 20, marginBottom: 24 },
  scoreBox: { flex: 1, padding: 16, backgroundColor: "#f9fafb", borderRadius: 8, alignItems: "center" as const },
  scoreValue: { fontSize: 28, fontWeight: 700 },
  scoreLabel: { fontSize: 8, color: "#666", marginTop: 4, textTransform: "uppercase" as const, letterSpacing: 1 },
  sectionTitle: { fontSize: 13, fontWeight: 700, marginBottom: 10, marginTop: 8 },
  domainRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  domainLabel: { width: 100, fontSize: 9, color: "#444" },
  barBg: { flex: 1, height: 10, backgroundColor: "#e5e7eb", borderRadius: 5, overflow: "hidden" },
  barFill: { height: 10, borderRadius: 5 },
  domainPct: { width: 32, fontSize: 9, fontWeight: 600, textAlign: "right" as const },
  strengthsRow: { flexDirection: "row", flexWrap: "wrap" as const, gap: 6, marginBottom: 4 },
  strengthBadge: { backgroundColor: "#ecfdf5", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  strengthText: { fontSize: 8, color: "#166534", fontWeight: 600 },
  gapBadge: { backgroundColor: "#fef9c3", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  gapText: { fontSize: 8, color: "#854d0e", fontWeight: 600 },
  footer: { position: "absolute" as const, bottom: 30, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTop: "1px solid #e5e7eb", paddingTop: 10 },
  footerText: { fontSize: 8, color: "#999" },
  verified: { fontSize: 8, color: "#059669", fontWeight: 600 },
})

function barColor(pct: number): string {
  if (pct >= 70) return "#10b981"
  if (pct >= 40) return "#eab308"
  return "#ef4444"
}

type Props = {
  name: string
  personalityTitle: string
  personalityTagline: string
  overallPct: number
  score: number
  total: number
  level: string
  assessedLevel: string
  domains: DomainScore[]
  profileUrl: string
  date: string
}

export function CareerPassportPDF({
  name, personalityTitle, personalityTagline,
  overallPct, score, total, level, assessedLevel,
  domains, profileUrl, date,
}: Props) {
  const strengths = domains.filter(d => d.pct >= 70).sort((a, b) => b.pct - a.pct)
  const gaps = domains.filter(d => d.pct < 40).sort((a, b) => a.pct - b.pct)
  const sorted = [...domains].sort((a, b) => b.pct - a.pct)

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.logo}>Hyr</Text>
            <Text style={s.subtitle}>Verified Career Passport</Text>
          </View>
          <View style={{ alignItems: "flex-end" as const }}>
            <Text style={s.verified}>✓ Verified Assessment</Text>
            <Text style={{ fontSize: 8, color: "#999", marginTop: 2 }}>{date}</Text>
          </View>
        </View>

        <Text style={s.name}>{name}</Text>
        <Text style={s.personality}>{personalityTitle}</Text>
        <Text style={s.tagline}>{personalityTagline}</Text>

        <View style={s.scoreRow}>
          <View style={s.scoreBox}>
            <Text style={s.scoreValue}>{overallPct}%</Text>
            <Text style={s.scoreLabel}>Overall Score</Text>
          </View>
          <View style={s.scoreBox}>
            <Text style={s.scoreValue}>{score}/{total}</Text>
            <Text style={s.scoreLabel}>Correct Answers</Text>
          </View>
          <View style={s.scoreBox}>
            <Text style={{ ...s.scoreValue, fontSize: 18 }}>{level}</Text>
            <Text style={s.scoreLabel}>Assessed Level</Text>
          </View>
          {assessedLevel && (
            <View style={s.scoreBox}>
              <Text style={{ ...s.scoreValue, fontSize: 14 }}>{assessedLevel}</Text>
              <Text style={s.scoreLabel}>Self-Assessed</Text>
            </View>
          )}
        </View>

        <Text style={s.sectionTitle}>Domain Breakdown</Text>
        {sorted.map(d => (
          <View key={d.domain} style={s.domainRow}>
            <Text style={s.domainLabel}>{d.domainLabel}</Text>
            <View style={s.barBg}>
              <View style={{ ...s.barFill, width: `${d.pct}%`, backgroundColor: barColor(d.pct) }} />
            </View>
            <Text style={s.domainPct}>{d.pct}%</Text>
          </View>
        ))}

        {strengths.length > 0 && (
          <>
            <Text style={{ ...s.sectionTitle, marginTop: 16 }}>Strengths</Text>
            <View style={s.strengthsRow}>
              {strengths.map(d => (
                <View key={d.domain} style={s.strengthBadge}>
                  <Text style={s.strengthText}>{d.domainLabel} ({d.pct}%)</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {gaps.length > 0 && (
          <>
            <Text style={{ ...s.sectionTitle, marginTop: 12 }}>Growth Areas</Text>
            <View style={s.strengthsRow}>
              {gaps.map(d => (
                <View key={d.domain} style={s.gapBadge}>
                  <Text style={s.gapText}>{d.domainLabel} ({d.pct}%)</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={s.footer}>
          <Text style={s.footerText}>{profileUrl}</Text>
          <Text style={s.footerText}>Hyr — Where companies discover verified engineers</Text>
        </View>
      </Page>
    </Document>
  )
}
