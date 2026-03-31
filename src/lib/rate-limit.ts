// Lightweight in-memory rate limiter for API routes
// Resets on deploy (fine for Vercel serverless)

const requestLog = new Map<string, { count: number; resetAt: number }>()

type RateLimitConfig = {
  maxRequests: number
  windowMs: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60_000, // 1 minute
}

const AUTH_CONFIG: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 60_000,
}

export function getRateLimitConfig(pathname: string): RateLimitConfig {
  if (pathname.includes("/auth/") || pathname.includes("/api/admin/")) {
    return AUTH_CONFIG
  }
  return DEFAULT_CONFIG
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = requestLog.get(identifier)

  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowMs
    requestLog.set(identifier, { count: 1, resetAt })
    return { allowed: true, remaining: config.maxRequests - 1, resetAt }
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt }
}

// Cleanup old entries periodically (max 50K entries)
setInterval(() => {
  const now = Date.now()
  if (requestLog.size > 50000) {
    for (const [key, entry] of requestLog) {
      if (now > entry.resetAt) requestLog.delete(key)
    }
  }
}, 300_000) // every 5 min
