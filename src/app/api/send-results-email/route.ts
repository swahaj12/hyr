import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendAssessmentCompleteEmail } from "@/lib/email"

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

    const result = await sendAssessmentCompleteEmail(
      email,
      name || "there",
      Number(score) || 0,
      Number(total) || 0,
      String(level || ""),
      String(assessmentId),
      String(profileId),
    )

    return NextResponse.json({ sent: result.success, reason: result.error })
  } catch (err) {
    console.error("Email route error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
