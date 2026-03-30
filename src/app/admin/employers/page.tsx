"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/navbar"
import { PageLoading } from "@/components/loading"

type EmployerRow = {
  id: string
  user_id: string
  company_name: string
  company_website: string | null
  hiring_tracks: string[]
  hiring_description: string | null
  status: string
  created_at: string
}

const TRACK_LABELS: Record<string, string> = {
  devops: "DevOps",
  frontend: "Frontend",
  backend: "Backend",
  qa: "QA",
}

export default function AdminEmployersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [employers, setEmployers] = useState<EmployerRow[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [sessionToken, setSessionToken] = useState("")
  const [activatingId, setActivatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push("/admin/login"); return }

        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token || ""

        // Verify admin status server-side
        const verifyRes = await fetch("/api/admin/verify", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const { isAdmin } = await verifyRes.json()
        if (!isAdmin) {
          setAuthorized(false)
          setLoading(false)
          return
        }
        setAuthorized(true)
        setSessionToken(token)

        const res = await fetch("/api/admin/employers", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const { employers: data } = await res.json()
          if (data) setEmployers(data as EmployerRow[])
        }
      } catch {
        setError("Failed to load data. Please refresh.")
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function handleAction(profileId: string, action: "activate" | "reject") {
    setActivatingId(profileId)
    try {
      const res = await fetch("/api/employer-activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ employerProfileId: profileId, action }),
      })
      if (res.ok) {
        setEmployers(prev =>
          prev.map(e =>
            e.id === profileId
              ? { ...e, status: action === "activate" ? "active" : "rejected" }
              : e
          )
        )
      }
    } catch { /* ignore */ }
    setActivatingId(null)
  }

  if (loading) return <><Navbar /><PageLoading /></>

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-lg font-semibold">Access Denied</p>
            <div className="flex gap-2 justify-center">
              <Link href="/admin/login"><Button>Admin Sign In</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filtered = employers.filter(e => {
    const matchSearch = search === "" || e.company_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "" || e.status === statusFilter
    return matchSearch && matchStatus
  })

  const pendingCount = employers.filter(e => e.status === "pending").length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6 pb-20 sm:pb-8">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-muted-foreground hover:text-gray-950 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Employer Management</h1>
            <p className="text-muted-foreground text-sm">{employers.length} total employer accounts</p>
          </div>
        </div>

        {pendingCount > 0 && (
          <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-900">
              {pendingCount} employer{pendingCount !== 1 ? "s" : ""} awaiting approval
            </p>
            <p className="text-xs text-amber-700 mt-0.5">Review and activate accounts to allow employer access to candidates</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Search by company name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-xs"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-base sm:text-sm bg-white min-h-11 sm:min-h-9"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Employer Cards */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center py-8">
                {employers.length === 0 ? "No employer sign-ups yet." : "No employers match your filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(emp => (
              <Card key={emp.id} className={emp.status === "pending" ? "border-amber-200" : ""}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-gray-950 text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {emp.company_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{emp.company_name}</p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              emp.status === "active"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : emp.status === "pending"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            {emp.status}
                          </Badge>
                        </div>

                        {emp.company_website && (
                          <a
                            href={emp.company_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs mt-0.5 block"
                          >
                            {emp.company_website.replace(/^https?:\/\//, "")}
                          </a>
                        )}

                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {(emp.hiring_tracks || []).map(t => (
                            <Badge key={t} variant="outline" className="text-xs">
                              {TRACK_LABELS[t] || t}
                            </Badge>
                          ))}
                        </div>

                        {emp.hiring_description && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{emp.hiring_description}</p>
                        )}

                        <p className="text-[10px] text-muted-foreground mt-2">
                          Registered {new Date(emp.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {emp.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            disabled={activatingId === emp.id}
                            onClick={() => handleAction(emp.id, "activate")}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {activatingId === emp.id ? "..." : "Activate"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={activatingId === emp.id}
                            onClick={() => handleAction(emp.id, "reject")}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {emp.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={activatingId === emp.id}
                          onClick={() => handleAction(emp.id, "reject")}
                          className="text-red-600 hover:text-red-700"
                        >
                          Deactivate
                        </Button>
                      )}
                      {emp.status === "rejected" && (
                        <Button
                          size="sm"
                          disabled={activatingId === emp.id}
                          onClick={() => handleAction(emp.id, "activate")}
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
