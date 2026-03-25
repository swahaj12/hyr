import Link from "next/link";

import { Navbar } from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const domains = [
  "Linux",
  "Networking",
  "Git",
  "Scripting",
  "Cloud/AWS",
  "Docker",
  "Kubernetes",
  "Terraform/IaC",
  "CI/CD",
  "Monitoring",
  "Security",
  "SRE",
  "FinOps",
] as const;

const steps = [
  {
    n: 1,
    title: "Assess",
    body: "Answer 40 scenario-based questions in 15 minutes. No coding required — just real DevOps reasoning.",
  },
  {
    n: 2,
    title: "Get Your Profile",
    body: "Receive a detailed skill breakdown across Kubernetes, AWS, Terraform, CI/CD, and 9 more domains.",
  },
  {
    n: 3,
    title: "Get Matched",
    body: "Share your verified profile with employers. Skip the screening rounds and go straight to the final interview.",
  },
] as const;

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Dark header + hero */}
      <section className="bg-gray-950 text-white">
        <Navbar variant="dark" />

        <div className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 sm:pb-24 sm:pt-16 lg:px-8 lg:pb-28 lg:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Prove Your DevOps Skills. Get Hired Faster.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-gray-300 sm:text-lg">
              Take a free 15-minute assessment. Get a verified skill profile
              across 13 DevOps domains. Show employers exactly what you can do.
            </p>
            <div className="mt-10">
              <Button
                nativeButton={false}
                render={<Link href="/auth" />}
                size="lg"
                className="h-11 px-8 text-base"
              >
                Take Free Assessment →
              </Button>
            </div>
            <p className="mt-14 text-sm text-gray-400">
              Used by DevOps engineers across Pakistan and beyond
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-gray-100 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">
            How It Works
          </h2>
          <div className="mt-14 grid gap-8 md:grid-cols-3 md:gap-10">
            {steps.map((step) => (
              <Card
                key={step.n}
                className="border-gray-100 bg-gray-50/50 shadow-none ring-gray-200/80"
              >
                <CardHeader className="gap-4">
                  <div className="flex justify-center md:justify-start">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-950 text-sm font-semibold text-white">
                      {step.n}
                    </span>
                  </div>
                  <CardTitle className="text-center text-lg md:text-left">
                    {step.title}
                  </CardTitle>
                  <CardDescription className="text-center text-base leading-relaxed md:text-left">
                    {step.body}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Domains */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">
            13 DevOps Domains
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-gray-600">
            Your assessment maps to the skills teams hire for every day.
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-2.5 sm:gap-3">
            {domains.map((domain) => (
              <Badge
                key={domain}
                variant="outline"
                className="border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-800"
              >
                {domain}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-gray-100 bg-gray-50 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">
            Ready to prove your skills?
          </h2>
          <div className="mt-8">
            <Button
              nativeButton={false}
              render={<Link href="/auth" />}
              size="lg"
              className="h-11 px-8 text-base"
            >
              Start Free Assessment →
            </Button>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-gray-100 bg-white py-10">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500 sm:px-6 lg:px-8">
          © 2026 Hyr. Built for DevOps engineers.
        </div>
      </footer>
    </div>
  );
}
