import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate the request
    const token = req.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { employerId, employerName, employerEmail, candidateId, candidateName, message } = body

    if (!employerId || !candidateId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify the caller is the employer they claim to be
    if (user.id !== employerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let candidateEmail: string | null = null

    if (supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      await supabase.from("employer_interests").insert({
        employer_id: employerId,
        employer_name: employerName,
        employer_email: employerEmail,
        candidate_id: candidateId,
        message: message || null,
      })

      const { data: userData } = await supabase.auth.admin.getUserById(candidateId)
      candidateEmail = userData?.user?.email || null
    }

    const resendKey = process.env.RESEND_API_KEY
    if (resendKey && candidateEmail) {
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #111;">An employer is interested in you</h1>
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            <strong>${escapeHtml(employerName || "A company")}</strong> viewed your Hyr profile and wants to connect with you.
          </p>
          ${message ? `<div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 20px 0;"><p style="color: #333; font-size: 14px; margin: 0;"><strong>Their message:</strong></p><p style="color: #555; font-size: 14px; margin: 8px 0 0;">${escapeHtml(message)}</p></div>` : ""}
          <p style="color: #555; font-size: 14px;">
            ${employerEmail ? `You can reply directly to <strong>${escapeHtml(employerEmail)}</strong>` : "Log in to Hyr to see more details."}
          </p>
          <div style="margin-top: 24px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://hyr-snowy.vercel.app"}/dashboard" 
               style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
              View on Dashboard
            </a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 32px;">
            This email was sent by Hyr because an employer expressed interest in your verified skill profile.
          </p>
        </div>
      `

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Hyr <notifications@hyr.pk>",
          to: candidateEmail,
          subject: `${escapeHtml(employerName || "A company")} is interested in your profile — Hyr`,
          html,
        }),
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
