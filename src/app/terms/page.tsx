import Link from "next/link"
import { Navbar } from "@/components/navbar"

export const metadata = {
  title: "Terms of Service — Hyr",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="light" />
      <main className="max-w-3xl mx-auto px-4 py-12 sm:py-16 pb-20 sm:pb-0">
        <h1 className="text-3xl font-bold tracking-tight text-gray-950 mb-8">Terms of Service</h1>
        <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-700 leading-relaxed">
          <p className="text-xs text-muted-foreground">Last updated: March 25, 2026</p>

          <section>
            <h2 className="text-lg font-semibold text-gray-950 mt-8 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Hyr (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service.
              If you do not agree, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-950 mt-8 mb-3">2. Description of Service</h2>
            <p>
              Hyr provides a free online tech skills assessment platform. Candidates complete timed assessments
              to generate verified skill profiles. Employers can browse public candidate profiles to identify talent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-950 mt-8 mb-3">3. User Accounts</h2>
            <p>
              You must provide accurate information when creating an account. You are responsible for maintaining
              the security of your credentials. You may not use another person&apos;s account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-950 mt-8 mb-3">4. Assessment Integrity</h2>
            <p>
              Assessments must be completed honestly. The following are prohibited during assessments:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Using AI tools, search engines, or external resources to answer questions</li>
              <li>Having another person take the assessment on your behalf</li>
              <li>Sharing assessment questions or answers publicly</li>
              <li>Circumventing anti-cheat measures</li>
            </ul>
            <p className="mt-2">
              Violations may result in assessment invalidation and account suspension.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-950 mt-8 mb-3">5. Profile Visibility</h2>
            <p>
              Assessment results may be visible to employers through your public profile.
              You can control visibility via the toggle on your dashboard. Disabling visibility
              removes your profile from employer searches.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-950 mt-8 mb-3">6. Employer Use</h2>
            <p>
              Employers may browse and use candidate profiles for recruitment purposes only.
              Employers may not scrape, bulk download, or redistribute candidate data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-950 mt-8 mb-3">7. Intellectual Property</h2>
            <p>
              All assessment content, scoring algorithms, and platform design are the property of Hyr.
              You may not reproduce, distribute, or create derivative works from our content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-950 mt-8 mb-3">8. Limitation of Liability</h2>
            <p>
              Hyr is provided &ldquo;as is&rdquo; without warranties. We are not liable for hiring decisions
              made based on assessment results. Assessment scores are indicative and should be one of
              multiple factors in hiring decisions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-950 mt-8 mb-3">9. Changes to Terms</h2>
            <p>
              We may update these terms. Continued use of the Service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-950 mt-8 mb-3">10. Contact</h2>
            <p>
              Questions? Reach us at <a href="mailto:hello@hyr.pk" className="text-primary hover:underline">hello@hyr.pk</a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200">
          <Link href="/privacy" className="text-sm text-primary hover:underline">
            Privacy Policy &rarr;
          </Link>
        </div>
      </main>
    </div>
  )
}
