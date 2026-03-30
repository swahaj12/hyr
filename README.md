# Hyr — Where Companies Discover Verified Engineers

A career platform that bridges the gap between tech talent and employers in Pakistan through verified skill assessments, real-time talent matching, and an active talent marketplace.

**Live:** https://hyr-snowy.vercel.app

---

## Setup on a New Machine

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ (LTS) | https://nodejs.org or `nvm install 20` |
| npm | 10+ | Comes with Node.js |
| Git | 2.30+ | `sudo apt install git` (Ubuntu) or https://git-scm.com |

### 1. Clone the Repository

```bash
# Option A: HTTPS (will ask for credentials or PAT)
git clone https://github.com/swahaj12/hyr.git
cd hyr

# Option B: SSH (if you have SSH keys set up on GitHub)
git clone git@github.com:swahaj12/hyr.git
cd hyr
```

**If using HTTPS and you need a Personal Access Token (PAT):**
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (full control)
4. Copy the token — use it as your password when Git asks

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment File

Create a file called `.env.local` in the project root:

```bash
touch .env.local
```

Add these variables (get values from Supabase dashboard or Vercel):

```env
# Supabase (from https://supabase.com/dashboard → Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://reclztpfcloyhpbrhjqn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# App Config
NEXT_PUBLIC_ADMIN_EMAILS=admin@hyr.pk,chkk@hyr.pk
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Email (optional — for sending assessment results and notifications)
RESEND_API_KEY=<your-resend-api-key>
```

**Where to find the keys:**
- **Supabase Anon Key & URL:** Supabase Dashboard → Project Settings → API → `anon public` key and Project URL
- **Service Role Key:** Same page → `service_role` key (keep this secret, never expose client-side)
- **Resend API Key:** https://resend.com/api-keys (optional, only for email features)

### 4. Run Development Server

```bash
npm run dev
```

App runs at **http://localhost:3000**

### 5. Build for Production (optional)

```bash
npm run build
npm start
```

---

## Supabase Database Setup

If setting up a fresh Supabase project, run these SQL migrations **in order** in the Supabase SQL Editor (Dashboard → SQL Editor):

| Order | File | Purpose |
|-------|------|---------|
| 1 | `supabase-schema.sql` | Core `assessments` and `assessment_answers` tables |
| 2 | `supabase-add-candidate-name.sql` | Adds `candidate_name` column |
| 3 | `supabase-add-tab-switches.sql` | Adds `tab_switches` column |
| 4 | `supabase-add-assessed-level.sql` | Adds `assessed_level` column |
| 5 | `supabase-add-onboarding.sql` | Adds `self_track`, `self_experience`, `self_strengths`, `profile_visible` |
| 6 | `supabase-add-personality.sql` | Adds `personality_type` column |
| 7 | `supabase-add-waitlist.sql` | Creates `waitlist` table |
| 8 | `supabase-employer-interests.sql` | Creates `employer_interests` and `profile_views` tables |
| 9 | `supabase-messaging-paywall.sql` | Creates `employer_profiles`, `conversations`, `messages` + Realtime |
| 10 | `supabase-fix-toggle.sql` | Adds RLS policy for profile visibility toggle |
| 11 | `supabase-rls-audit.sql` | Tightens RLS across all tables |
| 12 | `supabase-support-tickets.sql` | Creates `support_tickets` and `support_messages` |
| 13 | `supabase-hiring-needs.sql` | Creates `hiring_needs` and `candidate_notifications` |
| 14 | `supabase-candidate-profiles.sql` | Creates `candidate_profiles` for resume-driven flow |

**Supabase Storage (for resume uploads):**
1. Go to Supabase Dashboard → Storage
2. Create a new bucket called `resumes`
3. Set it to **Private** (not public)
4. Allowed MIME types: `application/pdf`
5. Max file size: 5MB

### Test Data (optional)

To seed dummy candidates for testing:
```
Run supabase-seed-dummy-candidates.sql in the SQL Editor
```
This creates 15 test candidates across all 4 tracks with realistic assessment data.

---

## Deployment (Vercel)

The project is deployed on Vercel and auto-deploys on every push to `main`.

### First-Time Vercel Setup

1. Go to https://vercel.com and sign in with GitHub
2. Import the `swahaj12/hyr` repository
3. Add all environment variables from `.env.local` to Vercel:
   - Settings → Environment Variables
   - Add each variable (use the production Supabase URL, not localhost)
   - Set `NEXT_PUBLIC_SITE_URL` to your Vercel domain (e.g., `https://hyr-snowy.vercel.app`)

### Continuous Deployment

Every `git push origin main` automatically triggers a new deployment on Vercel.

```bash
git add -A
git commit -m "your message"
git push origin main
```

---

## Project Structure

```
hyr/
├── src/
│   ├── app/                    # Next.js pages and API routes
│   │   ├── page.tsx            # Landing page
│   │   ├── assessment/         # Assessment flow
│   │   ├── dashboard/          # Candidate dashboard
│   │   ├── results/[id]/       # Assessment results
│   │   ├── profile/[id]/       # Public candidate profile
│   │   ├── profile/create/     # Resume + skills profile creation
│   │   ├── employers/          # Employer candidate browse + hiring needs
│   │   ├── for-employers/      # Employer landing page
│   │   ├── talent-market/      # Public talent market report
│   │   ├── admin/              # Admin dashboard
│   │   ├── messages/           # Real-time messaging
│   │   ├── auth/               # Authentication
│   │   ├── pricing/            # Pricing page
│   │   └── api/                # API routes
│   │       ├── hiring-needs/   # Hiring needs CRUD + matching engine
│   │       ├── talent-stats/   # Public talent market stats
│   │       ├── candidate/      # Candidate notifications
│   │       ├── candidate-profile/ # Profile CRUD
│   │       ├── admin/          # Admin APIs
│   │       └── ...
│   ├── components/             # Shared UI components
│   │   ├── navbar.tsx          # Global navigation
│   │   ├── ui/                 # shadcn/ui components
│   │   └── ...
│   ├── data/                   # Question banks (JSON)
│   │   ├── devops-question-bank.json
│   │   ├── frontend-question-bank.json
│   │   ├── backend-question-bank.json
│   │   └── qa-question-bank.json
│   └── lib/                    # Shared utilities
│       ├── scoring.ts          # Domain scoring + personality types
│       ├── questions.ts        # Question selection + session generation
│       ├── talent-matching.ts  # Matching engine + readiness tiers
│       ├── supabase.ts         # Supabase client
│       └── utils.ts            # Tailwind cn() utility
├── supabase-*.sql              # Database migrations (run in Supabase SQL Editor)
├── .env.local                  # Environment variables (not in git)
├── package.json
└── README.md
```

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **Animations:** Framer Motion
- **Backend:** Supabase (Auth, PostgreSQL, Storage, Realtime)
- **Hosting:** Vercel
- **Email:** Resend (optional)

---

## Key Features

**For Candidates:**
- Resume upload + skill declaration
- Smart verification (custom test based on declared + employer-gap skills)
- Career Passport with per-skill verified badges
- Percentile ranking and readiness tiers
- Opportunity notifications from employer hiring needs

**For Employers:**
- Post hiring needs with structured skill requirements
- Instant matching engine (Ready Now / Almost There / Growing tiers)
- Near-match candidates notified to prepare
- Browse verified candidate profiles
- Real-time messaging with candidates

**Platform:**
- Public Talent Market Report with live data
- Anti-cheat assessment monitoring
- Multi-track support (DevOps, Frontend, Backend, QA)
- Admin dashboard with analytics
