# Hyr

**Pakistan's first verified talent intelligence platform.**

Where companies discover pre-verified engineers and candidates get discovered by their skills — not their resume.

**Live:** https://hyr-snowy.vercel.app

---

## The Problem We're Solving

Pakistan's tech hiring is fundamentally broken on both sides.

**For employers:** A single job post attracts 500+ applications. 80% of candidates can't do what their resume claims. Companies spend 45+ days and 150K+ PKR per hire across 3-5 screening rounds — phone screens, take-home tests, technical interviews — only to discover 3 out of 5 hires underperform within 90 days. Companies with offshore C-levels can't remotely verify technical skills and rely on HR teams who may not be technical enough to evaluate properly.

**For candidates:** Talented engineers from smaller cities or less prestigious universities get overlooked because hiring in Pakistan is network-based. Resumes are untrusted. Bootcamp certificates are meaningless. There's no standardized way to prove what you can actually do. Freshers are demotivated by generic rejection. Seniors are spammed by irrelevant recruiters on LinkedIn.

**The core issue is trust.** Pakistan has no reliable signal for technical skill. Unlike the West, where company brands and certifications carry weight, Pakistan's tech ecosystem lacks a credible verification layer.

---

## What Hyr Does

Hyr is a two-sided marketplace that connects verified tech talent with hiring companies. It does three things that no existing platform in Pakistan does:

### 1. Verified Skill Profiles (Career Passports)

Candidates complete a skill verification — a timed, anti-cheat-monitored assessment — and receive a verified Career Passport showing per-skill badges, percentile rankings, and readiness tiers. This isn't a generic test score. It's a detailed skill DNA across 40+ technical domains that employers can trust because every score is backed by integrity monitoring (tab-switch tracking, copy/paste prevention, time limits, reasoning-based questions).

Candidates can upload their resume, confirm their skills, and the system builds a custom verification covering only THEIR declared skills plus any skills employers are actively looking for. A senior DevOps engineer with 8 years of experience doesn't sit through 40 random questions — they get 24 hard questions across their specific domains, completed in under 10 minutes.

### 2. Active Talent Marketplace

This is the feature that separates Hyr from every job board in Pakistan.

When an employer posts a hiring need (e.g., "Senior Backend Engineer who knows Databases, API Design, Caching, and Security"), Hyr doesn't just search the existing pool. It:

- **Instantly matches** verified candidates who already qualify (Ready Now tier)
- **Identifies near-matches** — candidates who match 70-89% of the requirements but are missing 1-2 skills
- **Notifies those near-match candidates** with a personalized message: "TechCorp is hiring a Senior Backend Engineer. You match 82%. Complete Security and Caching assessments to become a top candidate."
- **The employer sees their pipeline grow in real time** as notified candidates complete targeted assessments

No platform in Pakistan does this. Traditional hiring is passive — post a job, wait for applications, filter manually. Hyr actively develops candidates for specific roles.

### 3. Talent Intelligence

Hyr provides market-level intelligence that doesn't exist anywhere else in Pakistan:

- **Public Talent Market Report** (`/talent-market`): Real-time data on Pakistan's verified tech talent pool — skill distribution by track, average scores by domain, level distribution, top 10% thresholds, assessment integrity metrics.
- **Percentile Rankings**: Employers see "This candidate is in the top 8% of Backend engineers" — a competitive intelligence signal far more powerful than a resume.
- **Readiness Tiers**: Candidates are categorized as Interview-Ready, Rising Talent, Growth Track, or Building Foundation based on their scores and trust signals.

This data positions Hyr as the authoritative source on Pakistan's tech talent — not just another job board.

---

## Vision

**Short-term (6 months):** Become the default platform for verified tech hiring in Pakistan's major tech hubs (Lahore, Karachi, Islamabad). Target companies with offshore C-levels who need remote skill verification.

**Medium-term (1-2 years):** Expand to all tech roles (Data Science, AI/ML, Product Management, Design). Introduce practical task verification alongside assessments. Build employer API integrations for ATS systems.

**Long-term:** The "credit score for tech skills" — a universal, portable skill credential that any engineer in South Asia carries and any employer trusts. One link replaces every resume, every cover letter, every screening round.

---

## Business Model

### Revenue Streams

**Employers pay. Candidates are free.**

| Feature | Pricing Model |
|---------|---------------|
| Candidate profiles and assessments | Free forever |
| Employer browsing verified profiles | Free (see everything) |
| Employer posting hiring needs + matching | Free during beta |
| Employer direct messaging to candidates | Paid (per-seat or subscription) |
| Priority matching + talent pipeline alerts | Premium tier |
| Bulk hiring / dedicated account support | Enterprise tier |

### Why Employers Will Pay

The "See Everything, Pay to Connect" model. Employers can browse all candidate profiles, see detailed skill breakdowns, percentile rankings, and trust signals for free. But to message a candidate directly or get notified when new matching candidates appear, they pay. This model works because:

1. They've already seen the value (verified skills, domain scores, trust signals)
2. The cost is a fraction of traditional recruiting (150K+ PKR per hire via agencies)
3. The active talent marketplace feature (near-match candidates preparing for their role) is something no recruiter can offer
4. One subscription gives access to the entire verified talent pool — not per-job pricing

### Candidate Acquisition Strategy

Juniors come for the Career Passport — a verified credential that replaces their resume.

Seniors come for market intelligence and opportunities — "See your market position" and "Companies are looking for your exact stack." The resume-driven smart verification flow respects their time (5-10 minutes, only questions relevant to their declared skills) and gives them a credential worth having.

---

## Target Market

**Primary:** Pakistani tech companies with 50-500 employees, especially those with C-level leadership based abroad (UAE, UK, US) who manage Pakistan-based engineering teams remotely.

**Secondary:** Multinational companies hiring remote engineers from Pakistan. Startups scaling their engineering teams quickly.

**Candidate pool:** Software engineers across 4 tracks — DevOps, Frontend, Backend, and QA — ranging from fresh graduates to 10+ year veterans.

---

## Competitive Landscape

| Platform | What It Does | Where It Falls Short |
|----------|-------------|---------------------|
| **Rozee.pk** | Pakistan's largest job board | No skill verification. 500+ unqualified applications per posting. |
| **LinkedIn** | Professional networking + jobs | No verification. Candidates self-declare skills. Recruiter spam. |
| **Recruiter agencies** | Manual sourcing + screening | 150K+ PKR per hire. 30-45 day cycles. No skill data. |
| **HackerRank/Codility** | Technical screening tools | Employer-side tools, not candidate-facing. No marketplace. |
| **Hyr** | Verified talent marketplace | Two-sided: candidates get discovered, employers get pre-screened matches with active pipeline development. |

**Defensible moat:** As more candidates verify, the data becomes richer. As data becomes richer, employers get better matches. As employers get better matches, more post hiring needs. As more hiring needs exist, more candidates are motivated to verify. This is a network effects flywheel.

---

## How It Works

### For Candidates

```
Upload Resume + Confirm Skills (60 sec)
    |
    v
See Market Position + Employer Matches + Gap Analysis
    |
    v
Smart Verification (custom test: only YOUR skills + employer gaps, ~8-12 min)
    |
    v
Career Passport (per-skill verified badges, percentile, readiness tier)
    |
    v
Discoverable by Employers + Opportunity Notifications
```

**Assessment integrity:** Every verification is monitored — timed questions (12-20 seconds each), tab-switch tracking (shared with employers), copy/paste disabled, right-click disabled. Questions are scenario-based, requiring reasoning, not memorization. This makes scores trustworthy.

**Career Passport vs resume:** A candidate's Career Passport shows exactly what they can do: "Kubernetes: 90% Verified, Docker: 75% Verified, Security: 45% Needs Work." This is infinitely more useful to an employer than a resume that says "5 years Kubernetes experience."

### For Employers

```
Post Hiring Need (select track, skills, level, urgency)
    |
    v
Instant Matches (Ready Now / Almost There / Growing tiers)
    |
    v
Near-match candidates notified to prepare (pipeline grows automatically)
    |
    v
Browse profiles with percentile rankings + trust signals
    |
    v
Message candidates directly → Final interview only
```

**Time savings:** Traditional hiring takes 45 days. With Hyr, employers see verified matches in seconds and can go straight to a final culture-fit interview. The technical screening is already done.

### For the Platform

```
More employer hiring needs
    → More candidate notifications
    → More assessments taken
    → Richer profiles + data
    → Better matches
    → More employers
    → (flywheel repeats)
```

---

## Platform Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict mode) |
| UI | Tailwind CSS + shadcn/ui |
| Animations | Framer Motion |
| Auth | Supabase Auth (email/password, password reset) |
| Database | Supabase PostgreSQL with Row Level Security |
| Storage | Supabase Storage (resume PDFs) |
| Realtime | Supabase Realtime (chat messaging) |
| Hosting | Vercel (auto-deploy from GitHub) |
| Email | Resend (transactional emails) |
| Domain | hyr.pk (planned) |

### Database Schema

| Table | Purpose |
|-------|---------|
| `assessments` | Stores every assessment result (scores, domains, personality, trust signals) |
| `assessment_answers` | Individual question-level answers for detailed analysis |
| `candidate_profiles` | Resume-driven profiles (skills, resume URL, verified status) |
| `employer_profiles` | Company information, hiring tracks, activation status |
| `hiring_needs` | Employer job requirements with required skills |
| `candidate_notifications` | Opportunity alerts sent to candidates |
| `conversations` | Employer-candidate conversation threads |
| `messages` | Real-time chat messages (Supabase Realtime) |
| `employer_interests` | Legacy employer interest records |
| `profile_views` | Tracks when employers view candidate profiles |
| `support_tickets` | User support requests |
| `support_messages` | Support conversation threads |
| `waitlist` | Early access signups |

All tables use Row Level Security (RLS) to ensure users can only access their own data. Admin operations use the service role key server-side.

### Role-Based Access

| Role | What They Can Do |
|------|------------------|
| **Candidate** | Take assessments, manage profile, view opportunities, message employers |
| **Employer** | Browse candidates, post hiring needs, view matches, message candidates |
| **Admin** | Full platform analytics, employer activation, support tickets, conversation oversight |

Roles are stored in `auth.users.user_metadata.role` and enforced at both UI and API levels. Admin access is controlled via `NEXT_PUBLIC_ADMIN_EMAILS` environment variable.

---

## Assessment System

### Question Banks

516 scenario-based questions across 4 tracks:

| Track | Domains | Questions | Difficulty Split |
|-------|---------|-----------|-----------------|
| DevOps | 13 (Linux, Kubernetes, Docker, Cloud, CI/CD, Terraform, Monitoring, Security, Git, Scripting, Networking, SRE, FinOps) | 156 | 4 easy + 5 medium + 3 hard per domain |
| Frontend | 10 (HTML/CSS, JavaScript, TypeScript, React, Performance, Accessibility, Testing, State Mgmt, APIs, Build Tools) | 120 | Same |
| Backend | 10 (Databases, API Design, Architecture, Caching, Messaging, Concurrency, Observability, Deployment, Security, Testing) | 120 | Same |
| QA | 10 (Test Strategy, Manual Testing, Automation, API Testing, Perf Testing, Mobile Testing, Security Testing, Test Data, Bug Tracking, CI/CD Testing) | 120 | Same |

### Smart Verification (Resume-Driven)

Instead of a generic 40-question test, smart verification builds a custom test from the candidate's declared skills plus employer-required gap skills:

- **Per-skill question count based on experience:**
  - 0-1 years: 3 questions per skill (2 easy + 1 medium)
  - 1-3 years: 4 questions per skill (1 easy + 2 medium + 1 hard)
  - 3-5 years: 4 questions per skill (2 medium + 2 hard)
  - 5+ years: 3 questions per skill (1 medium + 2 hard)
- **Cap:** 35 questions maximum
- **Result:** Per-skill verified badges instead of a single overall score

### Scoring

- **Per-domain scores** calculated from correct/total answers within each domain
- **Domain levels:** Expert (80%+ with hard correct), Proficient (70%+), Developing (55%+), Basic (35%+), Needs Work
- **Overall level:** Senior (75%+ avg), Mid-Level (60%+), Junior (45%+), Entry-Level (25%+), Beginner
- **Engineering personality type:** Computed from top-scoring domain clusters (e.g., "The Infrastructure Architect", "The API Artisan")
- **Percentile ranking:** Calculated against all verified candidates in the same track
- **Readiness tiers:** Interview-Ready, Rising Talent, Growth Track, Building Foundation

### Anti-Cheat

- Timed questions (12-20 seconds each, auto-advance on timeout)
- Tab-switch detection and counting (shared with employers)
- Copy/paste disabled during assessment
- Right-click disabled
- Duplicate submission prevention (useRef guard)
- Assessment auto-save for interrupted sessions

---

## Key Pages

| Page | URL | Who Sees It | Purpose |
|------|-----|-------------|---------|
| Landing | `/` | Everyone | Two CTAs: "I'm a Candidate" / "I'm Hiring" |
| For Employers | `/for-employers` | Everyone | Employer-focused landing with Pakistan pain points, live stats, ROI story |
| Talent Market | `/talent-market` | Everyone (public) | Pakistan's Tech Talent Report with live data |
| Profile Create | `/profile/create` | Candidates | Resume upload + skill confirmation + market position |
| Assessment | `/assessment` | Candidates | Skill verification flow (onboarding, rules, quiz) |
| Results | `/results/[id]` | Candidates | Career Passport with per-skill badges |
| Dashboard | `/dashboard` | Candidates | Career profile, opportunities, progress |
| Public Profile | `/profile/[id]` | Everyone | Shareable verified profile |
| Employer Browse | `/employers` | Employers | Browse and filter verified candidates |
| Hiring Needs | `/employers/hiring-needs` | Employers | Post requirements, view matches |
| Post Need | `/employers/hiring-needs/new` | Employers | Structured hiring need form |
| View Matches | `/employers/hiring-needs/[id]` | Employers | Matched candidates in tiers |
| Messages | `/messages` | Candidates + Employers | Real-time chat |
| Admin | `/admin` | Admins | Platform analytics, KPIs |
| Admin Employers | `/admin/employers` | Admins | Employer account management |
| Admin Support | `/admin/support` | Admins | Support tickets + conversation oversight |

---

## Development Setup

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ (LTS) | https://nodejs.org or `nvm install 20` |
| npm | 10+ | Comes with Node.js |
| Git | 2.30+ | `sudo apt install git` (Ubuntu) or https://git-scm.com |

### 1. Clone the Repository

```bash
git clone https://github.com/swahaj12/hyr.git
cd hyr
```

If using HTTPS, use your GitHub username and a Personal Access Token as password. Generate at https://github.com/settings/tokens (select `repo` scope).

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment File

Create `.env.local` in the project root:

```env
# Supabase (from Supabase Dashboard → Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://reclztpfcloyhpbrhjqn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# App Config
NEXT_PUBLIC_ADMIN_EMAILS=admin@hyr.pk,chkk@hyr.pk
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Email (optional)
RESEND_API_KEY=<your-resend-api-key>
```

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

### 5. Production Build

```bash
npm run build
npm start
```

---

## Database Setup (Fresh Supabase Project)

Run these SQL migrations **in order** in Supabase SQL Editor:

| # | File | Purpose |
|---|------|---------|
| 1 | `supabase-schema.sql` | Core assessments + answers tables |
| 2 | `supabase-add-candidate-name.sql` | candidate_name column |
| 3 | `supabase-add-tab-switches.sql` | tab_switches column |
| 4 | `supabase-add-assessed-level.sql` | assessed_level column |
| 5 | `supabase-add-onboarding.sql` | self_track, self_experience, self_strengths, profile_visible |
| 6 | `supabase-add-personality.sql` | personality_type column |
| 7 | `supabase-add-waitlist.sql` | waitlist table |
| 8 | `supabase-employer-interests.sql` | employer_interests + profile_views |
| 9 | `supabase-messaging-paywall.sql` | employer_profiles, conversations, messages + Realtime |
| 10 | `supabase-fix-toggle.sql` | RLS for visibility toggle |
| 11 | `supabase-rls-audit.sql` | RLS hardening |
| 12 | `supabase-support-tickets.sql` | support_tickets + support_messages |
| 13 | `supabase-hiring-needs.sql` | hiring_needs + candidate_notifications |
| 14 | `supabase-candidate-profiles.sql` | candidate_profiles for resume-driven flow |

**Storage:** Create a `resumes` bucket in Supabase Storage (private, PDF only, 5MB max).

**Test data:** Run `supabase-seed-dummy-candidates.sql` for 15 dummy candidates.

---

## Deployment (Vercel)

Auto-deploys on every push to `main`.

### First-Time Setup

1. Import `swahaj12/hyr` on https://vercel.com
2. Add environment variables (Settings → Environment Variables)
3. Set `NEXT_PUBLIC_SITE_URL` to your Vercel domain

### Deploy

```bash
git add -A && git commit -m "message" && git push origin main
```

---

## Project Structure

```
hyr/
├── src/
│   ├── app/                      # Pages and API routes
│   │   ├── page.tsx              # Landing page
│   │   ├── for-employers/        # Employer landing page
│   │   ├── talent-market/        # Public talent report
│   │   ├── profile/create/       # Resume + skill profile creation
│   │   ├── assessment/           # Verification flow
│   │   ├── results/[id]/         # Career Passport results
│   │   ├── dashboard/            # Candidate dashboard
│   │   ├── profile/[id]/         # Public profile
│   │   ├── employers/            # Employer browse + hiring needs
│   │   ├── admin/                # Admin dashboard
│   │   ├── messages/             # Real-time messaging
│   │   ├── auth/                 # Authentication
│   │   └── api/                  # Server-side API routes
│   ├── components/               # Shared UI components
│   ├── data/                     # Question banks (4 JSON files, 516 questions)
│   └── lib/                      # Core utilities
│       ├── scoring.ts            # Domain scoring + personality engine
│       ├── questions.ts          # Session generation (standard + smart)
│       ├── talent-matching.ts    # Matching engine + readiness tiers
│       ├── supabase.ts           # Database client
│       └── utils.ts              # Tailwind utilities
├── supabase-*.sql                # Database migrations (14 files)
├── .env.local                    # Environment variables (git-ignored)
└── package.json
```

---

## Founder

Solo-founded by a DevOps engineer based in Pakistan, built entirely with AI-assisted development tools. Hyr was born from firsthand frustration with Pakistan's broken tech hiring — the same problem experienced on both sides, as a candidate being overlooked and as a hiring manager drowning in unqualified applications.

---

## License

Private. All rights reserved.
