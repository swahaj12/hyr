"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageTransition, FadeIn, StaggerList, staggerItem } from "@/components/motion-primitives"
import { motion } from "motion/react"
import personalityData from "@/data/personality-profiles.json"
import { TRACK_LABELS } from "@/lib/talent-matching"

type PersonalityProfile = {
  emoji: string
  track: string
  overview: string
  strengths: string[]
  growthAreas: string[]
  idealRoles: string[]
  famousQuote: string
  workStyle: string
}

const profiles = personalityData as Record<string, PersonalityProfile>
const allTypes = Object.keys(profiles)

export default function PersonalityPage() {
  const params = useParams()
  const router = useRouter()
  const raw = decodeURIComponent(params.type as string)

  const profile = profiles[raw]

  if (!profile) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-16">
          <div className="max-w-3xl mx-auto px-4 text-center py-20">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Personality type not found</h1>
            <p className="text-muted-foreground mb-6">
              &quot;{raw}&quot; isn&apos;t a recognized engineering personality type.
            </p>
            <Link href="/assessment">
              <Button>Take Assessment</Button>
            </Link>
          </div>
        </main>
      </>
    )
  }

  const trackLabel = TRACK_LABELS[profile.track as keyof typeof TRACK_LABELS] || profile.track
  const sameTrackTypes = allTypes.filter(t => profiles[t].track === profile.track && t !== raw)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-16">
        <PageTransition>
          <div className="max-w-3xl mx-auto px-4">
            <StaggerList stagger={0.08} className="space-y-6">
              {/* Hero */}
              <motion.div variants={staggerItem}>
                <div className="text-center space-y-4">
                  <span className="text-6xl">{profile.emoji}</span>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{raw}</h1>
                  <p className="text-lg text-muted-foreground max-w-lg mx-auto">{profile.overview}</p>
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    {trackLabel} Track
                  </Badge>
                </div>
              </motion.div>

              {/* Quote */}
              <motion.div variants={staggerItem}>
                <div className="border-l-4 border-violet-400 pl-6 py-4 bg-violet-50 dark:bg-violet-950/30 rounded-r-xl">
                  <p className="text-base italic text-gray-700 dark:text-gray-300">{profile.famousQuote}</p>
                </div>
              </motion.div>

              {/* Work Style */}
              <motion.div variants={staggerItem}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span>💡</span> How You Work
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{profile.workStyle}</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Strengths & Growth */}
              <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                      <span>💪</span> Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {profile.strengths.map(s => (
                        <li key={s} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <span className="text-emerald-500 mt-0.5">✓</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                      <span>🌱</span> Growth Areas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {profile.growthAreas.map(g => (
                        <li key={g} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <span className="text-amber-500 mt-0.5">→</span>
                          {g}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Ideal Roles */}
              <motion.div variants={staggerItem}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span>🎯</span> Ideal Roles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {profile.idealRoles.map(r => (
                        <Badge key={r} variant="secondary" className="text-sm px-3 py-1">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Same track types */}
              {sameTrackTypes.length > 0 && (
                <motion.div variants={staggerItem}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Other {trackLabel} Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sameTrackTypes.map(t => (
                          <Link
                            key={t}
                            href={`/personality/${encodeURIComponent(t)}`}
                            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <span className="text-2xl">{profiles[t].emoji}</span>
                            <div>
                              <p className="font-medium text-sm text-gray-900 dark:text-white">{t}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{profiles[t].overview.slice(0, 60)}...</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* CTA */}
              <motion.div variants={staggerItem}>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Link href="/assessment">
                    <Button size="lg">Take Assessment</Button>
                  </Link>
                  <Link href="/talent-market">
                    <Button variant="outline" size="lg">View Talent Market</Button>
                  </Link>
                </div>
              </motion.div>
            </StaggerList>
          </div>
        </PageTransition>
      </main>
    </>
  )
}
