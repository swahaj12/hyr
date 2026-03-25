"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { type DomainScore } from "@/lib/scoring"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/navbar"
import { PageLoading } from "@/components/loading"

type CandidateRow = {
  id: string
  candidate_id: string
  total_score: number
  total_questions: number
  overall_level: string
  domain_scores: DomainScore[]
  created_at: string
  candidate_email: string
  candidate_name: string
}

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "admin@hyr.pk,chkk@hyr.pk").split(",").map(e => e.trim())

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [candidates, setCandidates] = useState<CandidateRow[]>([])
  const [search, setSearch] = useState("")
  const [levelFilter, setLevelFilter] = useState("")

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/auth")
          return
        }

        if (!ADMIN_EMAILS.includes(user.email || "")) {
          setAuthorized(false)
          setLoading(false)
          return
        }
        setAuthorized(true)

        const { data, error: fetchError } = await supabase
          .from("assessments")
          .select("*")
          .order("created_at", { ascending: false })

        if (fetchError) {
          setError("Could not load assessments.")
        } else if (data) {
          const rows: CandidateRow[] = data.map((a: Record<string, unknown>) => ({
            id: a.id as string,
            candidate_id: a.candidate_id as string,
            total_score: a.total_score as number,
            total_questions: a.total_questions as number,
            overall_level: a.overall_level as string,
            domain_scores: a.domain_scores as DomainScore[],
            created_at: a.created_at as string,
            candidate_email: (a.candidate_email as string) || "",
            candidate_name: (a.candidate_name as string) || "",
          }))
          setCandidates(rows)
        }
      } catch {
        setError("Something went wrong. Please refresh.")
      }
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <>
        <Navbar />
        <PageLoading />
      </>
    )
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-lg font-semibold">Access Denied</p>
            <p className="text-sm text-muted-foreground">You don&apos;t have admin access.</p>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filtered = candidates.filter((c) => {
    const matchSearch =
      search === "" ||
      c.candidate_email.toLowerCase().includes(search.toLowerCase()) ||
      c.candidate_name.toLowerCase().includes(search.toLowerCase())
    const matchLevel = levelFilter === "" || c.overall_level.includes(levelFilter)
    return matchSearch && matchLevel
  })

  const levels = [...new Set(candidates.map((c) => c.overall_level))]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6 pb-20 sm:pb-0">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Candidate Assessments</h1>
            <p className="text-muted-foreground">{candidates.length} total assessments</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Input
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:max-w-xs"
            />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-base sm:text-sm bg-white min-h-11 sm:min-h-9"
            >
              <option value="">All Levels</option>
              {levels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No assessments found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Candidate</th>
                      <th className="text-left py-3 px-2 font-medium">Score</th>
                      <th className="text-left py-3 px-2 font-medium hidden sm:table-cell">Level</th>
                      <th className="text-left py-3 px-2 font-medium hidden md:table-cell">Top Domains</th>
                      <th className="text-left py-3 px-2 font-medium hidden sm:table-cell">Date</th>
                      <th className="text-right py-3 px-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => {
                      const pct = Math.round(
                        (c.total_score / c.total_questions) * 100
                      )
                      const topDomains = [...(c.domain_scores || [])]
                        .sort((a, b) => b.pct - a.pct)
                        .slice(0, 3)

                      return (
                        <tr key={c.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-medium">{c.candidate_name || "—"}</p>
                              <p className="text-xs text-muted-foreground">
                                {c.candidate_email || c.candidate_id.slice(0, 8)}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <span className="font-semibold">{pct}%</span>
                            <span className="text-xs text-muted-foreground ml-1">
                              ({c.total_score}/{c.total_questions})
                            </span>
                          </td>
                          <td className="py-3 px-2 hidden sm:table-cell">
                            <Badge variant="outline" className="text-xs">
                              {c.overall_level}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 hidden md:table-cell">
                            <div className="flex gap-1 flex-wrap">
                              {topDomains.map((d) => (
                                <Badge
                                  key={d.domain}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {d.domainLabel} {d.pct}%
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell">
                            {new Date(c.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <Link href={`/results/${c.id}`}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
