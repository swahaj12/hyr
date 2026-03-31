import { Resend } from "resend"

let _resend: Resend | null = null
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Hyr <notifications@hyr.pk>"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://hyr-snowy.vercel.app"

type EmailResult = { success: boolean; error?: string }

// Rate limit tracking (in-memory, resets on deploy — fine for free tier)
const emailLog = new Map<string, number>()

function rateLimitKey(email: string, eventType: string): string {
  const hour = Math.floor(Date.now() / 3600000)
  return `${email}:${eventType}:${hour}`
}

function isRateLimited(email: string, eventType: string): boolean {
  const key = rateLimitKey(email, eventType)
  const count = emailLog.get(key) || 0
  return count >= 1
}

function recordSend(email: string, eventType: string) {
  const key = rateLimitKey(email, eventType)
  emailLog.set(key, (emailLog.get(key) || 0) + 1)
  // Cleanup old entries (keep under 10K)
  if (emailLog.size > 10000) {
    const entries = Array.from(emailLog.entries())
    const toDelete = entries.slice(0, 5000)
    for (const [k] of toDelete) emailLog.delete(k)
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function emailWrapper(content: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #111;">
      ${content}
      <hr style="margin: 32px 0 16px; border: none; border-top: 1px solid #e5e5e5;">
      <p style="font-size: 12px; color: #888; margin: 0;">
        You're receiving this because you have an account on <a href="${SITE_URL}" style="color: #888;">Hyr</a>.
      </p>
    </div>
  `
}

export async function sendMatchNotification(
  email: string,
  candidateName: string,
  companyName: string,
  jobTitle: string,
  matchPct: number,
  missingSkills: string[],
): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) return { success: false, error: "Email not configured" }
  if (isRateLimited(email, "match")) return { success: false, error: "Rate limited" }

  const firstName = escapeHtml(candidateName.split(" ")[0] || "there")
  const isTopMatch = matchPct >= 90

  const html = emailWrapper(`
    <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px;">
      ${isTopMatch ? "🎉 You're a top match!" : "📋 New opportunity on Hyr"}
    </h1>
    <p style="font-size: 15px; color: #555; margin: 0 0 20px;">Hi ${firstName},</p>
    <div style="background: ${isTopMatch ? "#f0fdf4" : "#eff6ff"}; border-radius: 12px; padding: 20px; margin: 0 0 20px;">
      <p style="font-size: 16px; font-weight: 600; margin: 0 0 4px; color: ${isTopMatch ? "#166534" : "#1e40af"};">
        ${escapeHtml(companyName)} — ${escapeHtml(jobTitle)}
      </p>
      <p style="font-size: 24px; font-weight: 700; margin: 8px 0; color: ${isTopMatch ? "#16a34a" : "#2563eb"};">
        ${matchPct}% match
      </p>
      ${missingSkills.length > 0 ? `
        <p style="font-size: 13px; color: #666; margin: 8px 0 0;">
          Improve in: ${escapeHtml(missingSkills.join(", "))}
        </p>
      ` : ""}
    </div>
    <a href="${SITE_URL}/dashboard" style="display: inline-block; background: #111; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">View on Dashboard</a>
  `)

  try {
    await getResend()!.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: isTopMatch
        ? `🎉 ${companyName} is looking for you!`
        : `${companyName} is hiring — you're ${matchPct}% there`,
      html,
    })
    recordSend(email, "match")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Send failed" }
  }
}

export async function sendNewMessageNotification(
  email: string,
  recipientName: string,
  senderName: string,
  messagePreview: string,
  conversationId: string,
): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) return { success: false, error: "Email not configured" }
  if (isRateLimited(email, "message")) return { success: false, error: "Rate limited" }

  const firstName = escapeHtml(recipientName.split(" ")[0] || "there")
  const preview = escapeHtml(messagePreview.slice(0, 200))

  const html = emailWrapper(`
    <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px;">💬 New message from ${escapeHtml(senderName)}</h1>
    <p style="font-size: 15px; color: #555; margin: 0 0 20px;">Hi ${firstName},</p>
    <div style="background: #f8f9fa; border-left: 3px solid #111; padding: 16px; border-radius: 0 8px 8px 0; margin: 0 0 20px;">
      <p style="font-size: 14px; color: #333; margin: 0; line-height: 1.5;">"${preview}${messagePreview.length > 200 ? "..." : ""}"</p>
    </div>
    <a href="${SITE_URL}/messages/${conversationId}" style="display: inline-block; background: #111; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Reply</a>
  `)

  try {
    await getResend()!.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `New message from ${senderName} on Hyr`,
      html,
    })
    recordSend(email, "message")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Send failed" }
  }
}

export async function sendEmployerStatusNotification(
  email: string,
  companyName: string,
  status: "active" | "rejected",
): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) return { success: false, error: "Email not configured" }
  if (isRateLimited(email, "employer_status")) return { success: false, error: "Rate limited" }

  const approved = status === "active"

  const html = emailWrapper(`
    <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px;">
      ${approved ? "✅ Your company is live on Hyr!" : "Company review update"}
    </h1>
    <p style="font-size: 15px; color: #555; margin: 0 0 20px;">
      ${approved
        ? `Great news! <strong>${escapeHtml(companyName)}</strong> has been approved. You can now browse verified candidates, post hiring needs, and start messaging.`
        : `We've reviewed <strong>${escapeHtml(companyName)}</strong>'s application and it needs some updates before we can activate your account. Please reach out to hello@hyr.pk for details.`}
    </p>
    ${approved ? `
      <a href="${SITE_URL}/employers" style="display: inline-block; background: #111; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Start Browsing Candidates</a>
    ` : ""}
  `)

  try {
    await getResend()!.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: approved
        ? `✅ ${companyName} is now live on Hyr`
        : `Update on your Hyr application`,
      html,
    })
    recordSend(email, "employer_status")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Send failed" }
  }
}

export async function sendAssessmentCompleteEmail(
  email: string,
  name: string,
  score: number,
  total: number,
  level: string,
  assessmentId: string,
  profileId: string,
): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) return { success: false, error: "Email not configured" }
  if (isRateLimited(email, "assessment")) return { success: false, error: "Rate limited" }

  const firstName = escapeHtml((name || "there").split(" ")[0])
  const pct = total > 0 ? Math.round((score / total) * 100) : 0

  const html = emailWrapper(`
    <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px;">🎓 Your Career Passport is ready</h1>
    <p style="font-size: 15px; color: #555; margin: 0 0 20px;">Hi ${firstName},</p>
    <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 0 0 20px; text-align: center;">
      <p style="font-size: 40px; font-weight: 800; margin: 0; color: #111;">${pct}%</p>
      <p style="font-size: 14px; color: #666; margin: 4px 0 0;">${score}/${total} correct · Level: <strong>${escapeHtml(level)}</strong></p>
    </div>
    <p style="font-size: 14px; color: #555; margin: 0 0 20px;">
      Your verified skill profile is now visible to hiring companies on Hyr. Companies searching for engineers with your skills will find you in their candidate pool.
    </p>
    <a href="${SITE_URL}/results/${assessmentId}" style="display: inline-block; background: #111; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-right: 8px;">View Results</a>
    <a href="${SITE_URL}/profile/${profileId}" style="display: inline-block; background: #fff; color: #111; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; border: 1px solid #ddd;">Share Profile</a>
  `)

  try {
    await getResend()!.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Your Hyr Career Passport — ${pct}% (${level})`,
      html,
    })
    recordSend(email, "assessment")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Send failed" }
  }
}
