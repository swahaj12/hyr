"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { DOMAIN_LABELS } from "@/lib/scoring"
import { TRACK_DOMAINS, TRACK_LABELS } from "@/lib/talent-matching"
import { Navbar } from "@/components/navbar"
import { PageLoading } from "@/components/loading"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function NewHiringNeedPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [token, setToken] = useState("")

  const [title, setTitle] = useState("")
  const [track, setTrack] = useState("devops")
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [minLevel, setMinLevel] = useState("junior")
  const [urgency, setUrgency] = useState("2weeks")
  const [description, setDescription] = useState("")

  const [result, setResult] = useState<{
    readyNow: number
    almostThere: number
    growing: number
    notified: number
    needId: string
  } | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.user_metadata?.role !== "employer") {
        router.push("/auth")
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) setToken(session.access_token)
      setLoading(false)
    }
    load()
  }, [router])

  function toggleSkill(skill: string) {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  async function handleSubmit() {
    if (!title.trim() || selectedSkills.length === 0) return
    setSubmitting(true)

    try {
      const res = await fetch("/api/hiring-needs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          track,
          requiredSkills: selectedSkills,
          minLevel,
          urgency,
          description: description.trim() || null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setResult({
          ...data.summary,
          needId: data.need.id,
        })
      }
    } catch {
      // handle error silently
    }
    setSubmitting(false)
  }

  if (loading) return <><Navbar /><PageLoading /></>

  const availableSkills = TRACK_DOMAINS[track] || []

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-12">
          <Card className="border-2 border-emerald-200">
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Hiring need posted!</h2>
                <p className="text-muted-foreground mt-2">
                  Hyr has scanned the talent pool and here&apos;s what we found:
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                <div className="text-center p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-3xl font-bold text-emerald-700">{result.readyNow}</p>
                  <p className="text-xs text-emerald-600 mt-1 font-medium">Ready Now</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <p className="text-3xl font-bold text-blue-700">{result.almostThere}</p>
                  <p className="text-xs text-blue-600 mt-1 font-medium">Almost There</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-3xl font-bold text-amber-700">{result.growing}</p>
                  <p className="text-xs text-amber-600 mt-1 font-medium">Growing</p>
                </div>
              </div>

              {result.notified > 0 && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 max-w-md mx-auto">
                  <p className="text-sm text-blue-800">
                    <strong>{result.notified} candidates</strong> have been notified to prepare for your requirements.
                    Expect updated matches within 48 hours.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button onClick={() => router.push(`/employers/hiring-needs/${result.needId}`)}>
                  View Matches
                </Button>
                <Button variant="outline" onClick={() => router.push("/employers/hiring-needs")}>
                  All Hiring Needs
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Post a Hiring Need</h1>
          <p className="text-muted-foreground">
            Define what you&apos;re looking for. Hyr will match verified candidates instantly and notify near-matches to prepare.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Role Details</CardTitle>
            <CardDescription>What position are you hiring for?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Role Title</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Senior DevOps Engineer, Frontend Developer"
              />
            </div>

            <div className="space-y-2">
              <Label>Track</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(TRACK_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => { setTrack(key); setSelectedSkills([]) }}
                    className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                      track === key
                        ? "border-gray-950 bg-gray-950 text-white"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum Level</Label>
                <select
                  value={minLevel}
                  onChange={e => setMinLevel(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  <option value="junior">Junior</option>
                  <option value="mid">Mid-Level</option>
                  <option value="senior">Senior</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Urgency</Label>
                <select
                  value={urgency}
                  onChange={e => setUrgency(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  <option value="immediate">Hiring Now</option>
                  <option value="2weeks">Within 2 Weeks</option>
                  <option value="month">Within a Month</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Required Skills</CardTitle>
            <CardDescription>
              Select the skills this role requires. Candidates will be matched against these.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableSkills.map(skill => {
                const isSelected = selectedSkills.includes(skill)
                return (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      isSelected
                        ? "bg-gray-950 text-white border-gray-950"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {DOMAIN_LABELS[skill] || skill}
                    {isSelected && (
                      <span className="ml-1.5">&#10003;</span>
                    )}
                  </button>
                )
              })}
            </div>
            {selectedSkills.length > 0 && (
              <p className="text-xs text-muted-foreground mt-3">
                {selectedSkills.length} skill{selectedSkills.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
            <CardDescription>Optional description to help candidates understand the role</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the role, team, or any specific requirements..."
              rows={4}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={() => router.push("/employers/hiring-needs")}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || selectedSkills.length === 0}
            className="h-11 px-8"
          >
            {submitting ? "Searching talent pool..." : "Post & Find Matches"}
          </Button>
        </div>
      </main>
    </div>
  )
}
