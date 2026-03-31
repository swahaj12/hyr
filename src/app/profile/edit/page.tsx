"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { PageTransition, FadeIn, StaggerList, staggerItem } from "@/components/motion-primitives"
import { motion } from "motion/react"

const TRACKS = [
  { value: "devops", label: "DevOps / SRE", icon: "🛠️" },
  { value: "frontend", label: "Frontend", icon: "🎨" },
  { value: "backend", label: "Backend", icon: "⚡" },
  { value: "qa", label: "QA / Testing", icon: "🧪" },
]

const EXPERIENCE_OPTIONS = [
  { value: "0-1", label: "Less than 1 year" },
  { value: "1-3", label: "1–3 years" },
  { value: "3-5", label: "3–5 years" },
  { value: "5+", label: "5+ years" },
]

const TRACK_SKILLS: Record<string, { key: string; label: string }[]> = {
  devops: [
    { key: "kubernetes", label: "Kubernetes" }, { key: "containers", label: "Docker" },
    { key: "cloud", label: "Cloud / AWS" }, { key: "cicd", label: "CI/CD" },
    { key: "iac", label: "Terraform / IaC" }, { key: "linux", label: "Linux" },
    { key: "monitoring", label: "Monitoring" }, { key: "security", label: "Security" },
    { key: "scripting", label: "Scripting" }, { key: "git", label: "Git" },
    { key: "networking", label: "Networking" }, { key: "sre", label: "SRE" },
    { key: "finops", label: "FinOps" },
  ],
  frontend: [
    { key: "html-css", label: "HTML & CSS" }, { key: "javascript", label: "JavaScript" },
    { key: "typescript", label: "TypeScript" }, { key: "react", label: "React" },
    { key: "performance", label: "Performance" }, { key: "accessibility", label: "Accessibility" },
    { key: "testing", label: "Testing" }, { key: "state-mgmt", label: "State Mgmt" },
    { key: "apis", label: "APIs" }, { key: "build-tools", label: "Build Tools" },
  ],
  backend: [
    { key: "databases", label: "Databases" }, { key: "apis-design", label: "API Design" },
    { key: "architecture", label: "Architecture" }, { key: "security", label: "Security" },
    { key: "caching", label: "Caching" }, { key: "messaging", label: "Messaging" },
    { key: "concurrency", label: "Concurrency" }, { key: "testing", label: "Testing" },
    { key: "observability", label: "Observability" }, { key: "deployment", label: "Deployment" },
  ],
  qa: [
    { key: "test-strategy", label: "Test Strategy" }, { key: "manual-testing", label: "Manual Testing" },
    { key: "automation", label: "Automation" }, { key: "api-testing", label: "API Testing" },
    { key: "performance-testing", label: "Perf Testing" }, { key: "mobile-testing", label: "Mobile Testing" },
    { key: "security-testing", label: "Security Testing" }, { key: "test-data", label: "Test Data" },
    { key: "bug-tracking", label: "Bug Tracking" }, { key: "ci-cd-testing", label: "CI/CD Testing" },
  ],
}

type ProfileData = {
  name: string
  track: string
  experience: string
  skills: string[]
  headline: string
  linkedin_url: string
  resume_url: string
}

export default function ProfileEditPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState("")
  const [token, setToken] = useState("")
  const [hasExistingProfile, setHasExistingProfile] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState<ProfileData>({
    name: "",
    track: "",
    experience: "",
    skills: [],
    headline: "",
    linkedin_url: "",
    resume_url: "",
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth"); return }
      if (user.user_metadata?.role === "employer") { router.push("/employers"); return }

      setUserId(user.id)
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token || ""
      setToken(accessToken)

      // Pre-fill from assessment data
      const { data: assessments } = await supabase
        .from("assessments")
        .select("candidate_name, self_track, self_experience")
        .eq("candidate_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)

      const assessment = assessments?.[0]

      // Load existing profile
      try {
        const res = await fetch("/api/candidate-profile", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        const { profile } = await res.json()
        if (profile) {
          setHasExistingProfile(true)
          setForm({
            name: profile.name || assessment?.candidate_name || user.user_metadata?.full_name || "",
            track: profile.track || assessment?.self_track || "",
            experience: profile.experience || assessment?.self_experience || "",
            skills: profile.skills || [],
            headline: profile.headline || "",
            linkedin_url: profile.linkedin_url || "",
            resume_url: profile.resume_url || "",
          })
        } else if (assessment) {
          setForm(prev => ({
            ...prev,
            name: assessment.candidate_name || user.user_metadata?.full_name || "",
            track: assessment.self_track || "",
            experience: assessment.self_experience || "",
          }))
        } else {
          setForm(prev => ({
            ...prev,
            name: user.user_metadata?.full_name || "",
          }))
        }
      } catch {
        if (assessment) {
          setForm(prev => ({
            ...prev,
            name: assessment.candidate_name || user.user_metadata?.full_name || "",
            track: assessment.self_track || "",
            experience: assessment.self_experience || "",
          }))
        }
      }

      setLoading(false)
    }
    load()
  }, [router])

  function toggleSkill(key: string) {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(key)
        ? prev.skills.filter(s => s !== key)
        : [...prev.skills, key],
    }))
  }

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Resume must be less than 5MB")
      return
    }

    setUploading(true)
    setError(null)

    const filePath = `${userId}/${Date.now()}-resume.pdf`
    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setError("Upload failed: " + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from("resumes").getPublicUrl(filePath)
    setForm(prev => ({ ...prev, resume_url: publicUrl }))
    setUploading(false)
  }

  async function handleSave() {
    setError(null)
    setSaved(false)

    if (!form.name.trim()) { setError("Name is required"); return }
    if (!form.track) { setError("Select a track"); return }
    if (!form.experience) { setError("Select your experience level"); return }
    if (form.skills.length < 3) { setError("Select at least 3 skills"); return }

    if (form.linkedin_url && !form.linkedin_url.startsWith("https://")) {
      setError("LinkedIn URL must start with https://")
      return
    }

    setSaving(true)

    try {
      const method = hasExistingProfile ? "PATCH" : "POST"
      const payload = hasExistingProfile
        ? {
            name: form.name.trim(),
            track: form.track,
            experience: form.experience,
            skills: form.skills,
            headline: form.headline.trim() || null,
            linkedin_url: form.linkedin_url.trim() || null,
            resume_url: form.resume_url || null,
          }
        : {
            name: form.name.trim(),
            track: form.track,
            experience: form.experience,
            skills: form.skills,
            headline: form.headline.trim(),
            linkedinUrl: form.linkedin_url.trim(),
            resumeUrl: form.resume_url,
          }

      const res = await fetch("/api/candidate-profile", {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Save failed")
        setSaving(false)
        return
      }

      setHasExistingProfile(true)
      setSaved(true)
      setSaving(false)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError("Network error — try again")
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 pt-24 pb-16">
          <div className="max-w-2xl mx-auto px-4">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-64" />
              <div className="h-48 bg-gray-200 rounded-xl" />
              <div className="h-48 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </main>
      </>
    )
  }

  const availableSkills = TRACK_SKILLS[form.track] || []

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <PageTransition>
          <div className="max-w-2xl mx-auto px-4">
            <FadeIn>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {hasExistingProfile ? "Edit Profile" : "Create Profile"}
                  </h1>
                  <p className="text-gray-500 mt-1">
                    This information is visible to hiring companies alongside your assessment results.
                  </p>
                </div>
                <Link href={`/profile/${userId}`}>
                  <Button variant="outline" size="sm">View Public Profile</Button>
                </Link>
              </div>
            </FadeIn>

            <StaggerList className="space-y-6">
              {/* Basic Info */}
              <motion.div variants={staggerItem}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Your full name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="headline">Headline</Label>
                      <Input
                        id="headline"
                        value={form.headline}
                        onChange={e => setForm(prev => ({ ...prev, headline: e.target.value }))}
                        placeholder="e.g. DevOps Engineer | Kubernetes & Cloud Enthusiast"
                        className="mt-1"
                        maxLength={120}
                      />
                      <p className="text-xs text-gray-400 mt-1">{form.headline.length}/120</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Track & Experience */}
              <motion.div variants={staggerItem}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Track & Experience</CardTitle>
                    <CardDescription>What best describes your engineering focus?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Track *</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {TRACKS.map(t => (
                          <button
                            key={t.value}
                            onClick={() => setForm(prev => ({ ...prev, track: t.value, skills: [] }))}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              form.track === t.value
                                ? "border-gray-900 bg-gray-900 text-white"
                                : "border-gray-200 hover:border-gray-400"
                            }`}
                          >
                            <span className="text-lg mr-2">{t.icon}</span>
                            <span className="font-medium text-sm">{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Experience *</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {EXPERIENCE_OPTIONS.map(exp => (
                          <button
                            key={exp.value}
                            onClick={() => setForm(prev => ({ ...prev, experience: exp.value }))}
                            className={`p-3 rounded-lg border text-left transition-all text-sm ${
                              form.experience === exp.value
                                ? "border-gray-900 bg-gray-900 text-white"
                                : "border-gray-200 hover:border-gray-400"
                            }`}
                          >
                            {exp.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Skills */}
              {form.track && (
                <motion.div variants={staggerItem}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Skills *</CardTitle>
                      <CardDescription>Select at least 3 skills you&apos;re confident in ({form.skills.length} selected)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {availableSkills.map(skill => (
                          <button
                            key={skill.key}
                            onClick={() => toggleSkill(skill.key)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                              form.skills.includes(skill.key)
                                ? "bg-gray-900 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {skill.label}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Links */}
              <motion.div variants={staggerItem}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Links</CardTitle>
                    <CardDescription>Optional — help employers learn more about you</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="linkedin">LinkedIn URL</Label>
                      <Input
                        id="linkedin"
                        value={form.linkedin_url}
                        onChange={e => setForm(prev => ({ ...prev, linkedin_url: e.target.value }))}
                        placeholder="https://linkedin.com/in/yourprofile"
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Resume */}
              <motion.div variants={staggerItem}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resume</CardTitle>
                    <CardDescription>Upload a PDF resume (max 5MB). Visible to employers.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {form.resume_url && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <span className="text-green-600 text-lg">📄</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-green-800">Resume uploaded</p>
                          <a
                            href={form.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 hover:underline truncate block"
                          >
                            View PDF ↗
                          </a>
                        </div>
                        <button
                          onClick={() => setForm(prev => ({ ...prev, resume_url: "" }))}
                          className="text-gray-400 hover:text-red-500 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleResumeUpload}
                        disabled={uploading}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 disabled:opacity-50"
                      />
                      {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Save */}
              <motion.div variants={staggerItem}>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8"
                  >
                    {saving ? "Saving..." : hasExistingProfile ? "Save Changes" : "Create Profile"}
                  </Button>
                  {saved && (
                    <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                      ✓ Saved
                    </Badge>
                  )}
                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}
                </div>
              </motion.div>
            </StaggerList>
          </div>
        </PageTransition>
      </main>
    </>
  )
}
