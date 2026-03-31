import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getRateLimitConfig } from "@/lib/rate-limit"

export function middleware(req: NextRequest) {
  // Only rate-limit API routes
  if (!req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon"
  const identifier = `${ip}:${req.nextUrl.pathname}`
  const config = getRateLimitConfig(req.nextUrl.pathname)
  const { allowed, remaining, resetAt } = checkRateLimit(identifier, config)

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      },
    )
  }

  const response = NextResponse.next()
  response.headers.set("X-RateLimit-Remaining", String(remaining))
  return response
}

export const config = {
  matcher: "/api/:path*",
}
