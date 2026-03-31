"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { PageLoading } from "@/components/loading"
import { SupportButton } from "@/components/support-dialog"

const TRACKS = [
  { id: "devops", label: "DevOps / SRE" },
  { id: "frontend", label: "Frontend" },
  { id: "backend", label: "Backend" },
  { id: "qa", label: "QA / Testing" },
]

type ProfileStatus = "none" | "pending" | "active" | "rejected"

export default function EmployerSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<ProfileStatus>("none")
  const [companyName, setCompanyName] = useState("")
  const [companyWebsite, setCompanyWebsite] = useState("")
  const [hiringTracks, setHiringTracks] = useState<string[]>([])
  const [hiringDescription, setHiringDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionToken, setSessionToken] = useState("")

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth")
        return
      }
      if (user.user_metadata?.role !== "employer") {
        router.push("/dashboard")
        return
      }

      const { data: profile } = await supabase
        .from("employer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) setSessionToken(session.access_token)

      if (profile) {
        setStatus(profile.status as ProfileStatus)
        setCompanyName(profile.company_name || "")
        setCompanyWebsite(profile.company_website || "")
        setHiringTracks(profile.hiring_tracks || [])
        setHiringDescription(profile.hiring_description || "")
      } else {
        setCompanyName(user.user_metadata?.full_name || "")
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let website = companyWebsite.trim()
      if (website && !website.startsWith("http://") && !website.startsWith("https://")) {
        website = `https://${website}`
      }
      // Validate URL to prevent javascript: and other dangerous schemes
      if (website) {
        try {
          const parsed = new URL(website)
          if (!["http:", "https:"].includes(parsed.protocol)) {
            setError("Website must be an http or https URL")
            setSubmitting(false)
            return
          }
        } catch {
          setError("Invalid website URL")
          setSubmitting(false)
          return
        }
      }

      const payload = {
        user_id: user.id,
        company_name: companyName.trim(),
        company_website: website || null,
        hiring_tracks: hiringTracks,
        hiring_description: hiringDescription.trim() || null,
        status: "pending",
      }

      if (status === "none") {
        const { error: insertErr } = await supabase
          .from("employer_profiles")
          .insert(payload)
        if (insertErr) {
          setError(insertErr.message)
          return
        }
      } else {
        const { error: updateErr } = await supabase
          .from("employer_profiles")
          .update({
            company_name: payload.company_name,
            company_website: payload.company_website,
            hiring_tracks: payload.hiring_tracks,
            hiring_description: payload.hiring_description,
          })
          .eq("user_id", user.id)
        if (updateErr) {
          setError(updateErr.message)
          return
        }
      }

      setStatus("pending")
    } finally {
      setSubmitting(false)
    }
  }

  function toggleTrack(trackId: string) {
    setHiringTracks(prev =>
      prev.includes(trackId) ? prev.filter(t => t !== trackId) : [...prev, trackId]
    )
  }

  if (loading) {
    return <><Navbar /><PageLoading /></>
  }

  if (status === "active") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <main className="max-w-lg mx-auto px-4 py-16">
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto">
                <span className="text-2xl">&#10003;</span>
              </div>
              <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-200">Account Activated</h2>
              <p className="text-muted-foreground text-sm">
                Your employer account is active. You can browse candidates and connect with them through messaging.
              </p>
              <Link href="/employers">
                <Button>Browse Candidates</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (status === "pending") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <main className="max-w-lg mx-auto px-4 py-16">
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto">
                <span className="text-2xl">&#9203;</span>
              </div>
              <h2 className="text-xl font-bold">Request Under Review</h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Your company profile has been submitted. We&apos;ll review and activate your account shortly.
                In the meantime, you can browse candidate profiles.
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <Link href="/employers">
                  <Button>Browse Candidates</Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline">View Pricing</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (status === "rejected") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <main className="max-w-lg mx-auto px-4 py-16">
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <span className="text-2xl">&#10007;</span>
              </div>
              <h2 className="text-xl font-bold text-red-900 dark:text-red-200">Request Not Approved</h2>
              <p className="text-muted-foreground text-sm">
                Your request was not approved at this time. Please contact support if you believe this is an error.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Set Up Your Company Profile</CardTitle>
            <CardDescription>
              Tell us about your company and hiring needs. Once approved, you can connect with verified candidates directly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name *</Label>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  required
                  placeholder="Acme Corp"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-website">Company Website</Label>
                <Input
                  id="company-website"
                  value={companyWebsite}
                  onChange={e => setCompanyWebsite(e.target.value)}
                  placeholder="www.example.com"
                />
                <p className="text-[11px] text-muted-foreground">e.g. www.example.com or https://example.com</p>
              </div>

              <div className="space-y-2">
                <Label>Hiring For (select tracks) *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {TRACKS.map(track => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => toggleTrack(track.id)}
                      className={`rounded-lg border p-3 text-center text-sm font-medium transition-all ${
                        hiringTracks.includes(track.id)
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-gray-400 dark:border-gray-500"
                      }`}
                    >
                      {track.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hiring-desc">What are you looking for?</Label>
                <textarea
                  id="hiring-desc"
                  value={hiringDescription}
                  onChange={e => setHiringDescription(e.target.value)}
                  placeholder="We're looking for mid-level DevOps engineers with Kubernetes experience..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting || hiringTracks.length === 0}>
                {submitting ? "Submitting..." : "Submit for Review"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                You can browse candidate profiles while your request is being reviewed.
              </p>
            </form>
          </CardContent>
        </Card>
        {sessionToken && <SupportButton sessionToken={sessionToken} />}
      </main>
    </div>
  )
}
