import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean)

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      return NextResponse.json({ isAdmin: false }, { status: 500 })
    }

    const authHeader = req.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ isAdmin: false })
    }

    const client = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user } } = await client.auth.getUser(authHeader.replace("Bearer ", ""))

    if (!user || !user.email) {
      return NextResponse.json({ isAdmin: false })
    }

    const isAdmin = ADMIN_EMAILS.some(e => e.toLowerCase() === user.email!.toLowerCase())
    return NextResponse.json({ isAdmin })
  } catch {
    return NextResponse.json({ isAdmin: false }, { status: 500 })
  }
}
