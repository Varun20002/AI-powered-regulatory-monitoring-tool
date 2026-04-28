# RegMonitor — AI-Powered Regulatory Monitoring

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

> Stop drowning in regulator PDFs. RegMonitor pulls every new circular from your regulators, scores it against **your** company's regulatory baseline, and tells you exactly what changed, why it matters, and who needs to act — with citations to the exact paragraph.

Built originally for an IFSC-licensed payment institution in GIFT City (Glomopay) and now released as an open-source starter you can fork for any company in any jurisdiction.

---

## Table of Contents

- [What you get](#what-you-get)
- [Demo video](#demo-video)
- [How it works](#how-it-works)
- [Quick start (5 min)](#quick-start-5-min)
- [Configuration](#configuration)
- [Make it yours](#make-it-yours) — the section to read if you're forking
- [Project structure](#project-structure)
- [Deployment (Vercel)](#deployment-vercel)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## What you get

- **Auto-fetch** from regulator websites (RSS + HTML scraping). Ships with **RBI**, **SEBI**, **IFSCA** scrapers as reference implementations — easy to adapt for any regulator.
- **Paste-and-analyse** for ad-hoc circulars (no file upload required).
- **AI analysis** with a 5-step chain-of-thought reasoning prompt.
- **Semantic relevance scoring** — LLM extracts signals, deterministic code computes the final `HIGH / MEDIUM / LOW / NOT_RELEVANT` score (no hallucinated rankings).
- **Company baseline** — a structured JSON of your regulatory reality, used to compute deltas instead of generic "is this important?" guesses.
- **Action items** with team routing, deadlines, and priority.
- **Citations** with exact quoted text + section/page references.
- **Review flow** — compliance officer marks reviewed, confirms baseline changes, adds notes.

## Demo video

[![Watch the RegMonitor demo on YouTube](https://img.youtube.com/vi/lEjbVrRsUYQ/hqdefault.jpg)](https://youtu.be/lEjbVrRsUYQ)

If the preview image does not render in your viewer, use the direct link: [https://youtu.be/lEjbVrRsUYQ](https://youtu.be/lEjbVrRsUYQ).

## How it works

```
┌──────────────────────────────────────────────────────────┐
│                  VERCEL (Next.js 16 App)                  │
│  ├── Dashboard (feed with filters, Monday morning view)   │
│  ├── Analysis Card (summary + score + actions + citations)│
│  ├── Baseline Editor (view/edit regulatory reality)       │
│  ├── Paste (submit circular text for analysis)            │
│  └── API Routes (CRUD, analysis trigger, review, fetch)   │
└─────────────────────────┬────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────┐
│                       SUPABASE                            │
│  ├── circulars, analyses, action_items, citations         │
│  ├── concept_mappings, baseline_rules, review_status      │
│  ├── scraper_logs                                         │
│  └── Storage: circular-pdfs/                              │
└──────────────────────────────────────────────────────────┘
```

Per circular:

1. **Fetch** — scrapers pull new circulars (RSS or HTML).
2. **Extract** — PDFs are downloaded and text is extracted with `pdf-parse`.
3. **Analyse** — the LLM performs a 5-step chain-of-thought against your baseline.
4. **Score** — deterministic code computes `HIGH / MEDIUM / LOW / NOT_RELEVANT` from LLM-extracted signals.
5. **Display** — sorted feed with filters; click a card for full analysis + citations.
6. **Review** — mark reviewed, confirm baseline changes, add notes.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend + API | Next.js 16 (App Router) |
| UI | shadcn/ui + Tailwind CSS v4 |
| Database | Supabase (hosted PostgreSQL) |
| PDF Storage | Supabase Storage |
| LLM | MiniMax M2.7 via OpenAI SDK (any OpenAI-compatible endpoint works) |
| PDF Parsing | pdf-parse v2 |
| RSS Parsing | rss-parser |
| Web Scraping | cheerio |
| Deployment | Vercel |

## Quick start (5 min)

### Prerequisites

- **Node.js 18+** ([install](https://nodejs.org))
- **A Supabase project** — free tier works ([create one](https://supabase.com/dashboard))
- **An LLM API key** — MiniMax by default ([signup](https://www.minimax.io/)), but any OpenAI-compatible provider works (OpenAI, Groq, Anthropic via gateway, Ollama, etc.) — see [Make it yours](#make-it-yours).

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/AI-powered-regulatory-monitoring-tool
cd AI-powered-regulatory-monitoring-tool
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. In the SQL Editor, paste and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
3. (Optional, only if you want to ingest PDFs from scrapers) In **Storage**, create a bucket named `circular-pdfs`.
4. From **Project Settings → API**, copy your **Project URL**, **anon key**, and **service role key**.

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` — see the [Configuration](#configuration) table below.

### 4. Seed the baseline

The repo ships with a 29-rule example baseline for an IFSC-licensed payments company. Either:

- Visit [http://localhost:3000/baseline](http://localhost:3000/baseline) → click **"Seed Baseline"**, or
- ```bash
  curl -X POST http://localhost:3000/api/baseline/seed
  ```

You'll replace this with your own rules in [Make it yours](#make-it-yours).

### 5. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then click **"Fetch Now"** on the dashboard to pull live circulars.

## Configuration

All variables live in `.env.local` (local) or **Vercel → Settings → Environment Variables** (deployed).

| Name | Required? | Where to get it | Notes |
|------|-----------|-----------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase → Project Settings → API | Public URL of your Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase → Project Settings → API | Public anon key — safe in browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase → Project Settings → API | **Server only.** Never expose to client. |
| `MINIMAX_API_KEY` | Yes | [minimax.io](https://www.minimax.io/) (or any OpenAI-compatible provider) | Server-only. See [Swap the LLM provider](#swap-the-llm-provider) below. |
| `CRON_SECRET` | Recommended | Generate any long random string | Protects `POST /api/fetch` from anonymous abuse. The dashboard "Fetch Now" button uses a server action and doesn't need this in the browser. |
| `NEXT_PUBLIC_SITE_URL` | Optional | Your deployed URL | Stable origin, useful if you wire up webhooks later. |

## Make it yours

This is the section to read if you're forking. There are four things to customize.

### 1. Replace the baseline

Your baseline is the structured "current state of regulation as it applies to my company." It's what the LLM diffs every new circular against.

Edit [`src/lib/baseline/glomopay-baseline.json`](src/lib/baseline/glomopay-baseline.json). Each rule has this shape:

```json
{
  "domain": "Products",
  "category": "Outward Remittance (LRS)",
  "rule_name": "LRS Transaction Limit",
  "current_value": "$250,000 per person per financial year",
  "governed_by": "RBI",
  "source_circular": "RBI Master Direction on LRS"
}
```

After editing, re-seed:

```bash
curl -X POST http://localhost:3000/api/baseline/seed
```

> Tip: rename the file to `<your-company>-baseline.json` and update the import in [`src/app/api/baseline/seed/route.ts`](src/app/api/baseline/seed/route.ts).

### 2. Rebrand

The string `Glomopay` is hardcoded as the example company name in a handful of files. Find them in one shot:

```bash
rg -l 'Glomopay'
```

Then search-and-replace with your company name. Files to expect:

- [`src/lib/prompts.ts`](src/lib/prompts.ts) — used in the LLM system prompt
- [`src/app/layout.tsx`](src/app/layout.tsx) — page title / branding
- [`src/app/baseline/page.tsx`](src/app/baseline/page.tsx)
- [`src/app/circular/[id]/page.tsx`](src/app/circular/[id]/page.tsx)
- [`src/app/upload/page.tsx`](src/app/upload/page.tsx)
- [`src/app/api/baseline/seed/route.ts`](src/app/api/baseline/seed/route.ts)

### 3. Add your own regulator scrapers

The `'CUSTOM'` source is already in the schema enum — adding a new regulator is a small file. Use the existing scrapers as templates:

- **RSS-based** — copy [`src/lib/scrapers/rbi.ts`](src/lib/scrapers/rbi.ts) or [`src/lib/scrapers/sebi.ts`](src/lib/scrapers/sebi.ts).
- **HTML-based** — copy [`src/lib/scrapers/ifsca.ts`](src/lib/scrapers/ifsca.ts) (uses `cheerio`).

Every scraper returns `ScrapedCircular[]` — see the type in [`src/lib/types.ts`](src/lib/types.ts).

Then register it in [`src/lib/regulatory-fetch.ts`](src/lib/regulatory-fetch.ts) alongside the existing three. If you're scraping a regulator outside India, also add its name to the `source` enum check in [`supabase/schema.sql`](supabase/schema.sql) and rerun the migration (or just use `'CUSTOM'` and label rows in the UI).

### 4. Tune the prompts

The LLM prompt template lives in [`src/lib/prompts.ts`](src/lib/prompts.ts). It encodes a 5-step chain-of-thought specific to financial regulation in India. If you're in another jurisdiction or industry, edit:

- The system role's company description
- Domain vocabulary (e.g. "LRS", "PA/PG", "AML/CFT" → your equivalents)
- The 5 reasoning steps if your team thinks about deltas differently

### Swap the LLM provider

The MiniMax client in [`src/lib/minimax.ts`](src/lib/minimax.ts) uses the OpenAI SDK, so any OpenAI-compatible provider plugs in by changing the `baseURL` and model name:

- **OpenAI** — drop `baseURL`, set model to `gpt-4o-mini` or similar
- **Groq** — `baseURL: "https://api.groq.com/openai/v1"`
- **Ollama (local)** — `baseURL: "http://localhost:11434/v1"`
- **Anthropic** — via an OpenAI-compatible gateway like LiteLLM

## Project structure

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
│       ├── upload/route.ts         # POST: pasted text → analyse
│       ├── baseline/route.ts       # GET, PUT
│       ├── baseline/seed/route.ts  # POST: seed baseline
│       ├── review/route.ts         # POST: mark reviewed
│       ├── fetch/route.ts          # POST: trigger scrapers
│       └── scraper-status/route.ts # GET: latest scraper logs
├── lib/
│   ├── supabase/                   # Server + browser clients
│   ├── minimax.ts                  # LLM client + JSON parser
│   ├── scoring.ts                  # Deterministic relevance scoring
│   ├── prompts.ts                  # LLM prompt templates
│   ├── types.ts                    # Shared TypeScript types
│   ├── scrapers/                   # rbi.ts, sebi.ts, ifsca.ts, html-extractor, pdf-extractor
│   └── baseline/
│       └── glomopay-baseline.json  # Static seed baseline (29 rules)
└── components/                     # Navbar, CircularCard, RelevanceBadge, FilterBar, …
```

## Deployment (Vercel)

1. **Supabase** — run [`supabase/schema.sql`](supabase/schema.sql); create the `circular-pdfs` bucket if you ingest PDFs.
2. **Import the repo** in Vercel using the default Next.js preset.
3. **Environment variables** — copy every key from the [Configuration](#configuration) table into **Settings → Environment Variables** (Production + Preview).
4. **Cron** — [`vercel.json`](vercel.json) schedules `GET /api/fetch` daily at 06:00 UTC. Vercel sends `x-vercel-cron: 1` and (when configured) `Authorization: Bearer <CRON_SECRET>`. Manual `POST /api/fetch` requires `CRON_SECRET` as `?secret=` or `x-cron-secret` header.
5. **Function duration** — `vercel.json` sets `maxDuration: 60` for `/api/analyze`, `/api/fetch`, and `/api/upload`. Vercel **Hobby** caps lower; use **Pro** if analyses or full scrapes hit limits.
6. **Deploy** — push to `main`. After the first deploy, seed the baseline (`POST /api/baseline/seed` or the Baseline page) and click **Fetch Now**.

## Troubleshooting

<details>
<summary><strong>Scraper returns 0 items</strong></summary>

Regulator RSS/HTML markup changes occasionally. Check `/api/scraper-status` for the last error message, then update the selector or feed URL in the relevant scraper under [`src/lib/scrapers/`](src/lib/scrapers/).
</details>

<details>
<summary><strong>Analysis times out (504 / "function exceeded duration")</strong></summary>

Large circulars + LLM latency can exceed the 60s `maxDuration`. On Vercel **Hobby** the hard cap is even lower. Either upgrade to Pro, or increase chunking in [`src/lib/scrapers/pdf-extractor.ts`](src/lib/scrapers/pdf-extractor.ts) and process per-section.
</details>

<details>
<summary><strong>POST /api/fetch returns 401</strong></summary>

Manual fetches require `CRON_SECRET`. Either send it as `?secret=<value>` or as the `x-cron-secret` header. The dashboard "Fetch Now" button uses a server action and doesn't hit this gate.
</details>

<details>
<summary><strong>MiniMax (or other LLM) returns 401 / 403</strong></summary>

Confirm `MINIMAX_API_KEY` is set on the **server** (not `NEXT_PUBLIC_…`). For non-MiniMax providers, also confirm the `baseURL` matches your provider — see [Swap the LLM provider](#swap-the-llm-provider).
</details>

<details>
<summary><strong>Baseline page is empty</strong></summary>

You haven't seeded yet. Click **"Seed Baseline"** on `/baseline` or `curl -X POST /api/baseline/seed`. The seed reads from [`src/lib/baseline/glomopay-baseline.json`](src/lib/baseline/glomopay-baseline.json) — replace this file first if you want your own rules.
</details>

## Roadmap

Contributions welcome on any of these — see [CONTRIBUTING.md](./CONTRIBUTING.md):

- [ ] **Pluggable scrapers** — register scrapers via a config file instead of editing `regulatory-fetch.ts`
- [ ] **More LLM providers** out of the box (OpenAI, Anthropic, Groq, Ollama presets)
- [ ] **Sample baselines** for other jurisdictions (US — SEC/FinCEN, EU — ESMA/EBA, UK — FCA)
- [ ] **Multi-tenant** mode with per-org baselines
- [ ] **Slack / email digest** of new HIGH-relevance circulars
- [ ] **Tests** — currently none; integration tests for the analyse pipeline would be the highest-value addition

## Contributing

PRs welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) for the short version (issues, branching, secret hygiene). Particularly looking for new regulator scrapers and baseline templates for jurisdictions outside India.

## License

[MIT](./LICENSE).

## Acknowledgements

- [Next.js](https://nextjs.org) and [Vercel](https://vercel.com)
- [Supabase](https://supabase.com)
- [shadcn/ui](https://ui.shadcn.com)
- [MiniMax](https://www.minimax.io/) for the default LLM
- See [PRODUCT_THINKING.md](./PRODUCT_THINKING.md) for the original problem framing and design decisions.
