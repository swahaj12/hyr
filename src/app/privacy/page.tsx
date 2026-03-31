import Link from "next/link"
import { Navbar } from "@/components/navbar"

export const metadata = {
  title: "Privacy Policy — Hyr",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-12 sm:py-16 pb-20 sm:pb-0">
        <h1 className="text-3xl font-bold tracking-tight text-gray-950 dark:text-white mb-8">Privacy Policy</h1>
        <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          <p className="text-xs text-muted-foreground">Last updated: March 25, 2026</p>

          <section>
            <h2 className="text-lg font-semibold text-gray-950 dark:text-white mt-8 mb-3">1. Information We Collect</h2>
            <p><strong>Account information:</strong> Name, email address, and role (candidate or employer) provided during signup.</p>
            <p className="mt-2"><strong>Assessment data:</strong> Your answers, scores, domain breakdowns, time taken, and assessment metadata (tab switches, timestamps).</p>
            <p className="mt-2"><strong>Self-reported data:</strong> Track preference, experience level, and strengths selected during onboarding.</p>
            <p className="mt-2"><strong>Usage data:</strong> Pages visited, features used, and browser type for improving the platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-950 dark:text-white mt-8 mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Generate and display your skill profile</li>
              <li>Enable employers to discover verified candidates (when your profile is visible)</li>
              <li>Compute percentile rankings and aggregate insights</li>
              <li>Send assessment results via email (optional)</li>
              <li>Improve platform features and assessment quality</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-950 dark:text-white mt-8 mb-3">3. Profile Visibility</h2>
            <p>
              Your profile is visible to employers by default. You can disable this at any time
              from your dashboard using the &ldquo;Visible to employers&rdquo; toggle.
              When disabled, your profile will not appear in employer searches or be accessible
              via direct link.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-950 dark:text-white mt-8 mb-3">4. Data Sharing</h2>
            <p>We do not sell your personal data. We share information only in these cases:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Public profiles:</strong> Assessment scores, domain breakdowns, and personality type are visible to employers (when you have visibility enabled)</li>
              <li><strong>Aggregated data:</strong> Anonymous statistics may be used for marketing (e.g., &ldquo;average candidate scores&rdquo;)</li>
              <li><strong>Service providers:</strong> We use Supabase (database/auth) and Vercel (hosting), which process data on our behalf</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-950 dark:text-white mt-8 mb-3">5. Data Security</h2>
            <p>
              We use industry-standard measures to protect your data, including encrypted
              connections (HTTPS), Row Level Security in our database, and secure authentication.
              However, no method of transmission is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-950 dark:text-white mt-8 mb-3">6. Data Retention</h2>
            <p>
              Your account and assessment data are retained as long as your account is active.
              You may request deletion of your account and data by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-950 dark:text-white mt-8 mb-3">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Control profile visibility to employers</li>
              <li>Export your assessment data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-950 dark:text-white mt-8 mb-3">8. Cookies</h2>
            <p>
              We use essential cookies for authentication and session management.
              We do not use tracking cookies or third-party advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-950 dark:text-white mt-8 mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this policy. Changes will be posted on this page with an updated date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-950 dark:text-white mt-8 mb-3">10. Contact</h2>
            <p>
              For privacy concerns, contact us at <a href="mailto:hello@hyr.pk" className="text-primary hover:underline">hello@hyr.pk</a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link href="/terms" className="text-sm text-primary hover:underline">
            Terms of Service &rarr;
          </Link>
        </div>
      </main>
    </div>
  )
}
