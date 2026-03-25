# Deployment Notes

## LinkedIn OG Image Re-scrape

When you update the Open Graph metadata (title, description, image), LinkedIn caches the old version. To force a refresh:

1. Go to [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
2. Paste your URL: `https://hyr-snowy.vercel.app` (or your custom domain)
3. Click **Inspect**
4. LinkedIn will fetch the latest OG tags and show a preview
5. Share links will now use the updated metadata

Do the same for any specific pages you share (e.g., `/profile/[id]`).

## Twitter Card Validator

1. Go to [Twitter Card Validator](https://cards-dev.twitter.com/validator)
2. Paste your URL and click **Preview card**

## Email Setup (Resend)

Post-assessment emails are ready but need an API key:

1. Sign up at [resend.com](https://resend.com) (free tier: 100 emails/day)
2. Verify your domain (`hyr.pk`) or use the sandbox
3. Get your API key
4. Add to Vercel environment variables: `RESEND_API_KEY=re_xxxxx`
5. Redeploy

## SQL Migrations

Run these in order in the Supabase SQL Editor:

1. `supabase-add-candidate-name.sql` — candidate_name column
2. `supabase-add-personality.sql` — personality_type column
3. `supabase-add-waitlist.sql` — waitlist table
4. `supabase-add-onboarding.sql` — self_track, self_experience, self_strengths, profile_visible columns
5. `supabase-rls-audit.sql` — tightened RLS policies
6. `supabase-fix-toggle.sql` — update policy for profile visibility toggle

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `NEXT_PUBLIC_ADMIN_EMAILS` | Yes | Comma-separated admin emails |
| `NEXT_PUBLIC_SITE_URL` | Yes | Production URL (for OG meta, emails) |
| `RESEND_API_KEY` | No | Resend API key for post-assessment emails |

## Custom Domain Setup

When ready:

1. Purchase domain (e.g., `hyr.pk` or `hyr.co`)
2. In Vercel: Settings > Domains > Add domain
3. Configure DNS as instructed by Vercel
4. Update `NEXT_PUBLIC_SITE_URL` in Vercel env vars
5. Update Supabase Auth redirect URLs: Dashboard > Auth > URL Configuration
6. Re-scrape LinkedIn/Twitter (see above)
