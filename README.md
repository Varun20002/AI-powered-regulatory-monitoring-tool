# RegMonitor — AI-Powered Regulatory Monitoring Tool

An intelligent compliance monitoring system built for Glomopay, an IFSC-licensed payment institution in GIFT City. The tool automatically fetches regulatory circulars from RBI, SEBI, and IFSCA, analyzes them using AI (MiniMax M2.7), and generates actionable compliance insights with citations.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  VERCEL (Next.js 15 App)                  │
│  ├── Dashboard (feed with filters, Monday morning view)   │
│  ├── Analysis Card (summary + score + actions + citations)│
│  ├── Baseline Editor (view/edit regulatory reality)       │
│  ├── Paste (submit circular text for analysis)              │
│  └── API Routes (CRUD, analysis trigger, review, fetch)   │
└─────────────────────────┬────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────┐
│                  SUPABASE                                 │
│  ├── circulars, analyses, action_items, citations         │
│  ├── concept_mappings, baseline_rules, review_status      │
│  ├── scraper_logs                                         │
│  └── Storage: circular-pdfs/                              │
└──────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend + API | Next.js 15 (App Router) |
| UI Components | shadcn/ui + Tailwind CSS v4 |
| Database | Supabase (hosted PostgreSQL) |
| PDF Storage | Supabase Storage |
| LLM | MiniMax M2.7 via OpenAI SDK |
| PDF Parsing | pdf-parse v2 |
| RSS Parsing | rss-parser |
| Web Scraping | cheerio |
| Deployment | Vercel |

## Features

- **Auto-fetch** from 3 regulatory sources (RBI, SEBI, IFSCA)
- **Paste circular text** for ad-hoc analysis (no file upload)
- **AI analysis** with 5-step chain-of-thought reasoning
- **Semantic relevance scoring** (LLM extraction + deterministic scoring)
- **Glomopay baseline** — structured regulatory reality for accurate delta detection
- **Action items** with team routing, deadlines, and priority
- **Citations** — exact quoted text with section and page references
- **Review flow** — mark reviewed, confirm baseline changes
- **Baseline editor** — view and update regulatory rules by domain

## Local Development

### Prerequisites

- Node.js 18+
- A Supabase project
- MiniMax API key

### Setup

1. **Clone and install:**

```bash
git clone <repo-url>
cd AI-powered-regulatory-monitoring-tool
npm install
```

2. **Set up Supabase:**

   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Run the SQL schema in `supabase/schema.sql` in the Supabase SQL Editor
   - Copy your project URL, anon key, and service role key

3. **Configure environment:**

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your keys:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
MINIMAX_API_KEY=your-minimax-api-key
CRON_SECRET=any-random-string
```

4. **Seed the baseline:**

   Visit `/baseline` in the app and click "Seed Baseline", or call:

```bash
curl -X POST http://localhost:3000/api/baseline/seed
```

5. **Run the dev server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Dashboard
│   ├── circular/[id]/page.tsx      # Analysis card detail
│   ├── baseline/page.tsx           # Baseline viewer/editor
│   ├── upload/page.tsx             # Paste circular text
│   └── api/
│       ├── circulars/route.ts      # GET (list+filter)
│       ├── circulars/[id]/route.ts # GET single circular
│       ├── analyze/route.ts        # POST: trigger LLM analysis
│       ├── upload/route.ts         # POST: pasted text → analyze
│       ├── baseline/route.ts       # GET, PUT
│       ├── baseline/seed/route.ts  # POST: seed baseline
│       ├── review/route.ts         # POST: mark reviewed
│       ├── fetch/route.ts          # POST: trigger scrapers
│       └── scraper-status/route.ts # GET: latest scraper logs
├── lib/
│   ├── supabase/
│   │   ├── server.ts               # Server-side Supabase client
│   │   └── client.ts               # Browser-side Supabase client
│   ├── minimax.ts                  # MiniMax LLM client + JSON parser
│   ├── scoring.ts                  # Deterministic relevance scoring
│   ├── prompts.ts                  # LLM prompt templates
│   ├── types.ts                    # TypeScript types
│   ├── scrapers/
│   │   ├── rbi.ts                  # RBI RSS scraper
│   │   ├── sebi.ts                 # SEBI RSS scraper
│   │   ├── ifsca.ts                # IFSCA HTML scraper
│   │   ├── html-extractor.ts        # HTML text extraction
│   │   └── pdf-extractor.ts        # PDF text extraction
│   └── baseline/
│       └── glomopay-baseline.json  # Static seed baseline (29 rules)
└── components/
    ├── Navbar.tsx
    ├── CircularCard.tsx
    ├── RelevanceBadge.tsx
    ├── SourceBadge.tsx
    ├── FilterBar.tsx
    ├── FetchButton.tsx
    └── ScraperStatus.tsx
```

## How It Works

1. **Fetch**: Scrapers pull circulars from 3 regulatory websites (RSS + HTML scraping)
2. **Extract**: PDFs are downloaded and text is extracted using pdf-parse
3. **Analyze**: MiniMax M2.7 performs 5-step chain-of-thought analysis against the Glomopay baseline
4. **Score**: Deterministic code (not LLM) computes relevance: HIGH / MEDIUM / LOW / NOT_RELEVANT
5. **Display**: Dashboard shows circulars sorted by relevance with analysis cards
6. **Review**: Compliance officer reviews, confirms baseline changes, adds notes

## Deployment (Vercel)

### 1. Supabase

- Run `supabase/schema.sql` in the Supabase SQL Editor.
- Create a storage bucket named `circular-pdfs` (public or signed URLs per your policy) if you use PDF ingestion from scrapers.

### 2. Import the repo in Vercel

Connect the GitHub repo and use the default Next.js framework preset.

### 3. Environment variables

In **Vercel → Project → Settings → Environment Variables**, add (Production + Preview as needed):

| Name | Notes |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — **server only** |
| `MINIMAX_API_KEY` | Your MiniMax API key |
| `CRON_SECRET` | Long random string. Protects `POST /api/fetch` from anonymous abuse. |

`MINIMAX_API_KEY` is read only on the server (`callMiniMax`); it is never prefixed with `NEXT_PUBLIC_`.

### 4. Cron job

`vercel.json` schedules **GET `/api/fetch` daily at 06:00 UTC**. Vercel sends the header `x-vercel-cron: 1` on that request. If you set `CRON_SECRET`, Vercel also sends `Authorization: Bearer <CRON_SECRET>` for cron invocations when configured in the dashboard.

- **Fetch Now** on the dashboard runs a **server action** (`triggerRegulatoryFetch`) and does not expose `CRON_SECRET` to the browser.
- **Manual POST** to `/api/fetch` requires `CRON_SECRET` as query `?secret=` or header `x-cron-secret` when that env var is set.

### 5. Function duration

`vercel.json` sets **60s** `maxDuration` for `/api/analyze`, `/api/fetch`, and `/api/upload`. On the **Hobby** plan, serverless timeouts are shorter; use **Pro** (or equivalent) if analyses or full scrapes hit time limits.

### 6. Deploy

Push to `main` (or merge a PR). Vercel builds with `npm run build`.

After deploy, open the production URL, seed the baseline (`POST /api/baseline/seed` or the Baseline page), then use **Fetch Now** or wait for the cron run.

## Design Decisions

See [PRODUCT_THINKING.md](./PRODUCT_THINKING.md) for the full product thinking document covering problem scoping, first principles analysis, feature prioritization, and architectural decisions.
