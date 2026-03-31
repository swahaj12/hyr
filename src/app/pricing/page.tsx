"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"

const PLANS = [
  {
    name: "Browse",
    price: "Free",
    period: "",
    description: "See what Hyr has to offer",
    features: [
      "Browse all verified candidate profiles",
      "See scores, domains, and skill breakdowns",
      "View trust indicators and engineering types",
      "Search and filter by track and level",
    ],
    notIncluded: [
      "Message candidates",
      "Job posting",
      "Priority visibility",
    ],
    cta: "Sign Up Free",
    href: "/auth",
    highlighted: false,
  },
  {
    name: "Connect",
    price: "Contact Us",
    period: "",
    description: "Start hiring verified engineers",
    features: [
      "Everything in Browse",
      "Unlimited candidate messaging",
      "In-platform secure conversations",
      "\"Actively Hiring\" badge on your company",
      "Visible to candidates on their dashboard",
      "Priority support",
    ],
    notIncluded: [],
    cta: "Get Started",
    href: "mailto:hello@hyr.pk?subject=Hyr Connect Plan",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For teams hiring at scale",
    features: [
      "Everything in Connect",
      "Bulk candidate matching",
      "Custom assessment tracks",
      "Dedicated account manager",
      "API access for ATS integration",
      "Candidate response guarantee",
    ],
    notIncluded: [],
    cta: "Talk to Us",
    href: "mailto:hello@hyr.pk?subject=Hyr Enterprise",
    highlighted: false,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-16 space-y-12 pb-20 sm:pb-0">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 dark:text-white">
            Simple, transparent pricing
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Browse verified engineers for free. Pay only when you&apos;re ready to connect with candidates.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.highlighted
                  ? "border-2 border-gray-950 shadow-lg"
                  : ""
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gray-950 text-white text-xs px-3 py-0.5">
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="pt-2">
                  <span className="text-3xl font-bold text-gray-950 dark:text-white">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground ml-1">{plan.period}</span>}
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5 shrink-0">&#10003;</span>
                      <span>{f}</span>
                    </li>
                  ))}
                  {plan.notIncluded.map((f, i) => (
                    <li key={`no-${i}`} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-0.5 shrink-0">&#10007;</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-6">
                  {plan.href.startsWith("mailto:") ? (
                    <a href={plan.href}>
                      <Button
                        className={`w-full ${plan.highlighted ? "" : ""}`}
                        variant={plan.highlighted ? "default" : "outline"}
                      >
                        {plan.cta}
                      </Button>
                    </a>
                  ) : (
                    <Link href={plan.href}>
                      <Button
                        className={`w-full ${plan.highlighted ? "" : ""}`}
                        variant={plan.highlighted ? "default" : "outline"}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-xl font-bold text-center">Frequently Asked Questions</h2>

          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <p className="font-semibold text-sm">Is it free for candidates?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Yes, always. Candidates can take assessments, build profiles, and get discovered completely free.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="font-semibold text-sm">What does &quot;verified&quot; mean?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Every candidate completes a timed, scenario-based assessment with anti-cheat monitoring. Their scores are real and trustworthy.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="font-semibold text-sm">Can I browse candidates before paying?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Yes. Sign up for free to browse all candidate profiles, see skill breakdowns, and evaluate talent quality before committing.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="font-semibold text-sm">How does the Connect plan work?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Once activated, you can message any candidate directly through Hyr&apos;s secure messaging. All conversations stay on-platform.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center space-y-3 py-8">
          <h2 className="text-xl font-bold">Ready to find your next engineer?</h2>
          <p className="text-sm text-muted-foreground">
            Browse verified profiles now — no credit card required.
          </p>
          <Link href="/auth">
            <Button size="lg">Get Started Free</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
