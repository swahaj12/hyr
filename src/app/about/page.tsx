import Link from "next/link"
import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "About — Hyr",
  description: "Hyr bridges the gap between DevOps talent and companies. Learn about our mission and how we're changing tech hiring in Pakistan.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12 sm:py-20 space-y-16 pb-20 sm:pb-0">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-950">
            Bridging the DevOps skills gap
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Hyr is a skills verification platform that helps DevOps engineers prove what they know
            and helps companies find the talent they need — without wasting weeks on screening.
          </p>
        </div>

        {/* The Problem */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-950">The Problem</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6 space-y-2">
                <p className="font-semibold text-gray-950">For Candidates</p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  You repeat the same screening calls for every company. You answer the same basic questions.
                  Your resume doesn&apos;t show what you actually know. There&apos;s no way to prove your skills once
                  and share it everywhere.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-2">
                <p className="font-semibold text-gray-950">For Employers</p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Screening takes weeks. Resumes are unreliable. Technical interviews are expensive.
                  You need to know if someone can actually do the job before investing hours of your
                  engineering team&apos;s time.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* The Solution */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-950">How Hyr Works</h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Candidates take a free 15-minute assessment covering 13 DevOps domains — from Linux
            and Kubernetes to CI/CD and cloud security. Questions are scenario-based, timed, and
            designed to test real working knowledge.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed">
            The result is a verified skill profile that candidates can share with any employer.
            Anti-cheat measures (tab tracking, copy blocking, time pressure) ensure results are trustworthy.
            Employers can browse candidates, see domain-level breakdowns, and go straight to the final interview.
          </p>
        </div>

        {/* Built in Pakistan */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-950">Built for Pakistan&apos;s Tech Industry</h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Pakistan&apos;s tech sector is growing fast, but the skills gap between what universities
            teach and what companies need remains wide. Hyr is built to close that gap — starting
            with DevOps, the backbone of modern software delivery.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed">
            Whether you&apos;re a fresh graduate proving your first skills or a senior engineer
            looking for your next role, Hyr gives you a verified profile that speaks for itself.
          </p>
        </div>

        {/* Contact */}
        <Card className="border-gray-200">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-gray-950">Get in Touch</h2>
                <p className="text-gray-600">
                  Questions, partnerships, or feedback — we&apos;d love to hear from you.
                </p>
                <p className="text-sm text-gray-500">
                  Email: <a href="mailto:hello@hyr.pk" className="text-gray-950 font-medium hover:underline">hello@hyr.pk</a>
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/assessment">
                  <Button>Take Assessment</Button>
                </Link>
                <Link href="/employers">
                  <Button variant="outline">Browse Candidates</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
