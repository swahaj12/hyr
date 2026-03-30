import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user } } = await client.auth.getUser(token)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { email, name, score, total, level, assessmentId, profileId } = body

    if (!email || !assessmentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Only allow sending to the authenticated user's own email
    if (user.email !== email) {
      return NextResponse.json({ error: "Can only send results to your own email" }, { status: 403 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hyr-snowy.vercel.app"
    const pct = total > 0 ? Math.round((score / total) * 100) : 0
    const firstName = escapeHtml((name || "there").split(" ")[0])

    const resultsUrl = `${siteUrl}/results/${assessmentId}`
    const profileUrl = `${siteUrl}/profile/${profileId}`

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #111;">
        <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px;">
          Well done, ${firstName}!
        </h1>
        <p style="color: #555; font-size: 15px; margin: 0 0 24px;">
          You&rsquo;ve completed your tech skills assessment on Hyr.
        </p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="font-size: 48px; font-weight: 700; margin: 0; color: ${pct >= 70 ? '#059669' : pct >= 40 ? '#d97706' : '#dc2626'};">
            ${pct}%
          </p>
          <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0;">
            ${Number(score) || 0}/${Number(total) || 0} correct &middot; ${escapeHtml(String(level || ""))}
          </p>
        </div>

        <div style="margin-bottom: 24px;">
          <a href="${resultsUrl}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
            View Full Results
          </a>
        </div>

        <p style="font-size: 14px; color: #555; margin: 0 0 16px;">
          Your verified profile is ready to share with employers:
        </p>
        <p style="margin: 0 0 24px;">
          <a href="${profileUrl}" style="color: #2563eb; font-size: 14px; word-break: break-all;">
            ${profileUrl}
          </a>
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">
          &copy; 2026 Hyr &middot; Tech skills verification
        </p>
      </div>
    `

    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Hyr <noreply@hyr.pk>",
          to: email,
          subject: `Your Hyr Assessment: ${pct}% — ${level}`,
          html,
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        console.error("Resend error:", err)
        return NextResponse.json({ sent: false, reason: "email_service_error" })
      }

      return NextResponse.json({ sent: true })
    }

    return NextResponse.json({ sent: false, reason: "no_email_service_configured" })
  } catch (err) {
    console.error("Email route error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
