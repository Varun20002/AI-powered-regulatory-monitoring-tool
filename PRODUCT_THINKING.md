# How I Thought About This — and What I Built

This is the thinking behind the regulatory monitoring tool. Not a spec written after the fact — this is how the problem actually unfolded for me, the choices I made, the things I cut, and why.

---

## 1. Problem Scoping

### Who is the user?

A compliance officer at Glomopay — an IFSC-licensed payment institution in GIFT City that processes outward remittances under LRS. This person sits at the intersection of five regulatory bodies and a fast-moving fintech product. Their job isn't just to know the rules — it's to catch when the rules change, figure out if it affects Glomopay, and make sure the right team acts on it before it becomes a compliance risk.

### What's the actual pain?

It's not finding circulars. RBI publishes an RSS feed. SEBI has one too. The circulars are out there. The pain is what happens *after* you find one — you open a 40-page PDF and try to answer: "Does this change anything for us?" That question requires holding Glomopay's entire regulatory reality in your head — LRS limits, KYC thresholds, AML screening rules, IFSC license conditions — and comparing it against dense legal language. That mental comparison is where things get missed. And when something gets missed, it's not a bug — it's a compliance violation.

### What I'm not building

No Slack integration, no Jira tickets, no user roles, no audit trail, no automated compliance actions. These are production concerns. The prototype needs to prove one thing: can the system read a circular, understand what it means for Glomopay specifically, and tell the officer what to do about it — with citations they can actually verify?

### Assumptions I'd validate first

1. That triage speed is the real bottleneck (not circular discovery or filing)
2. That the baseline I've constructed reflects Glomopay's actual regulatory reality
3. That the compliance team trusts AI output enough to use it as a starting point
4. That three sources — RBI, SEBI, IFSCA — cover the critical regulatory surface area

---

## 2. How I Decided What to Build

### The assignment says "you define the scope." So here's how I scoped it.

I started by listing everything the assignment mentions: monitoring, summarisation, relevance scoring, action items, citation chips, review tracking, cross-circular Q&A, per-circular Q&A, manual upload, fetch trigger, and a filterable feed. That's a lot. Building all of it badly would be worse than building the core loop well.

So I asked: what's the one workflow that, if it works, proves the tool is useful?

**Monday morning. Three new circulars. The officer opens the dashboard, sees one marked HIGH with a summary that says "LRS limit changed — your transaction engine needs updating." They click in, see the action items, check the citations against the original text, mark it reviewed. Done in five minutes instead of forty-five.**

That workflow told me what to build and what to skip.

### What I doubled down on

**The analysis engine.** This is the whole point. Not a fancy UI, not a chatbot — the thing that reads a circular and produces a structured, actionable, citable analysis tied to Glomopay's specific context. I spent the most time here: the prompt design, the 5-step reasoning chain, the deterministic scoring that doesn't trust the LLM's judgment, and the baseline that gives the AI context about what Glomopay actually does today.

**The scrapers.** If the tool can't reliably fetch circulars, nothing downstream works. I built three scrapers — RBI (RSS), SEBI (RSS), IFSCA (HTML scraping with PDF download) — and handled the real-world messiness: RBI links to HTML pages not PDFs, IFSCA's table is JavaScript-rendered so you have to scrape the home page, and pdf-parse v2 wants Uint8Array not Buffer.

**The baseline.** 29 rules across three domains (Products, Operations, Compliance) — covering LRS limits, KYC requirements, AML screening, IFSC license conditions, reporting obligations, and more. Without this, the AI can only say "this circular is about KYC." With it, the AI can say "this circular changes the PEP screening threshold that Glomopay currently enforces under Rule 7 of the KYC Master Direction."

### What I deliberately cut

**Cross-circular Q&A and per-circular Q&A.** These are valuable but they're a different product surface. The core problem is triage, not research. The officer needs to know "should I care about this?" before they need to ask "what does Section 4.2 mean?"

**PDF upload.** I replaced it with a text paste interface. Here's why: compliance officers frequently encounter circulars as forwarded emails, copied text from legal advisors, or excerpts from internal reviews — not just downloadable PDFs. A paste box is lower friction and more flexible. It also simplifies the backend (no file storage, no PDF parsing edge cases) without losing any analytical capability.

**MCA and FATF scrapers.** I started with five sources, then cut to three. MCA's circular page is fully JavaScript-rendered with no API endpoint — scraping it requires a headless browser, which adds significant complexity for marginal value. FATF's website blocks server-side requests with Cloudflare protection. Rather than building brittle workarounds for two sources that might break any day, I focused on making RBI, SEBI, and IFSCA rock-solid. The text paste feature covers anything from MCA or FATF that the team encounters manually.

---

## 3. How the Analysis Engine Works

This is the core of the tool — and where most of the thinking went.

### Why keyword matching doesn't work

A circular might say: *"All authorized persons facilitating cross-border fund transfers under the scheme shall implement enhanced verification."*

A keyword search for "LRS", "KYC", "Glomopay" returns nothing. But semantically: "authorized persons" = Glomopay (a licensed PSP). "Cross-border fund transfers under the scheme" = LRS. "Enhanced verification" = KYC/EDD. This is HIGH relevance.

### The 5-step chain

Every circular goes through a structured reasoning pipeline. The LLM (MiniMax M2.7) handles Steps 1–3 and 5. Step 4 is deterministic code.

**Step 1 — Concept Extraction.** Pull out every regulatory concept, entity, obligation, threshold, and deadline from the circular text.

**Step 2 — Semantic Domain Mapping.** Map each extracted concept to Glomopay's operational domains and rate the connection strength: DIRECT (explicitly applies), INFERRED (likely applies based on business model), TANGENTIAL (related but not directly applicable), or NONE.

**Step 3 — Delta Detection.** Compare the circular's requirements against Glomopay's 29 baseline rules. Did anything actually change? A new threshold, a modified obligation, a removed provision?

**Step 4 — Deterministic Scoring (code, not AI).** Count the mappings. Apply fixed rules:

- Any delta detected OR 3+ DIRECT mappings → **HIGH**
- 1–2 DIRECT OR 3+ INFERRED → **MEDIUM**
- 1–2 INFERRED OR 2+ TANGENTIAL → **LOW**
- Everything else → **NOT_RELEVANT**

This is deliberately not the LLM's decision. LLMs are generous scorers — they'll call everything "potentially relevant" to be safe. The deterministic rubric is auditable, consistent, and explainable to a board.

**Step 5 — Action Generation.** For relevant circulars, generate specific action items with team routing (Product / Ops / Compliance / Legal), deadlines, priority levels, and citations back to the source text.

### Why the scoring is split this way

The LLM is good at understanding language. It's bad at making consistent categorical judgments. By having the LLM do extraction (what it's good at) and code do scoring (what needs to be consistent), we get the best of both. The officer can look at any score and trace exactly why it was assigned — "7 DIRECT concept mappings and 1 detected delta" — without trusting a black box.

### Citations

Every factual claim the AI makes must cite the exact section, page, and quoted text from the circular. This isn't optional polish — it's the difference between a tool the compliance team trusts and one they ignore. In a board meeting or regulatory audit, "the AI said so" doesn't fly. "Section 4.2, page 8: 'All authorized dealers shall ensure compliance by March 31, 2026'" does.

---

## 4. The Glomopay Baseline

### What it is

A structured description of Glomopay's current regulatory reality — 29 rules across Products, Operations, and Compliance. Each rule has a domain, category, name, current value, governing body, and source circular.

Examples:
- **LRS Transaction Limit:** $250,000 per person per financial year (governed by RBI)
- **Sanctions Screening:** Real-time screening against UN, OFAC, EU, and India's UAPA lists (governed by RBI/IFSCA)
- **STR Filing:** No fixed threshold — file based on risk indicators (governed by FIU-IND)

### Why it matters

Without context, the AI produces generic analysis: "This circular discusses KYC requirements." With Glomopay's baseline injected into the prompt, the AI produces specific analysis: "This circular raises the periodic KYC update frequency for high-risk customers from every 2 years to annually. Glomopay currently enforces 2-year cycles under the RBI KYC Master Direction. The KYC team needs to update the review schedule and notify affected customers."

The difference is the difference between a news alert and a compliance briefing.

### How it evolves

The baseline ships as a static JSON seed. But it's designed to grow. When the officer reviews a circular and marks it "Reviewed," the system asks: "Did this change any existing baseline rule?" If yes, the officer confirms the change, and the baseline updates. Over time, the baseline becomes a living document — part written by me, part validated by the compliance team through actual use.

---

## 5. Design Decisions

### How I source regulatory updates

| Considered | Chose | Why |
|---|---|---|
| RSS only | | Not all regulators have RSS (IFSCA doesn't) |
| Web scraping only | | Brittle — breaks when sites redesign |
| **RSS where available + HTML scraping as fallback** | **Yes** | Reliable where possible, resilient everywhere |
| Third-party API | | No known API aggregating Indian regulatory circulars |

In practice: RBI and SEBI both have RSS feeds — `rbi.org.in/notifications_rss.xml` and `sebi.gov.in/sebirss.xml`. IFSCA has no RSS and its circular table is JavaScript-rendered, so I scrape the home page "What's New" section, follow each link to the detail page, and pull the `DownloadFile` URL (not `GetFileView`, which returns an HTML wrapper, not the actual PDF binary). This was one of the trickier debugging sessions — the kind of real-world messiness that only shows up when you actually hit the endpoint.

*With more time:* Add monitoring that alerts when a scraper hasn't returned results in 48 hours.

### How I determine relevance

| Considered | Chose | Why |
|---|---|---|
| Keyword matching | | Misses semantic meaning — high false negatives |
| Pure LLM scoring | | Inconsistent, unexplainable, hallucination-prone |
| **Semantic extraction (LLM) + deterministic scoring (code)** | **Yes** | Accurate, auditable, consistent |

The key insight: let the LLM do what it's good at (understanding regulatory language) and let code do what it's good at (applying consistent rules). The LLM never decides the score — it provides structured evidence, and a simple function counts DIRECT/INFERRED/TANGENTIAL mappings against a fixed rubric.

*With more time:* Build a knowledge graph from accumulated concept mappings. The `concept_mappings` table already stores every analysis — over time, this becomes training data for hop-based scoring that works without the LLM.

### How I structure the Glomopay context

| Considered | Chose | Why |
|---|---|---|
| Hardcoded static document | | Goes stale as rules change |
| AI-built from ingested circulars | | Can hallucinate, no human validation |
| **Hybrid: static seed + officer-confirmed updates** | **Yes** | Starts reliable, evolves with human validation |

The baseline is injected into the system prompt alongside the 5-step analysis framework. Each rule is formatted as: `[Domain/Category] Rule Name: Current Value (Governed by: Authority)`. This gives the LLM rich context without overwhelming the prompt.

*With more time:* Add baseline versioning with full diff history so the team can see how their regulatory reality has evolved over time.

### How I handle citation accuracy

| Considered | Chose | Why |
|---|---|---|
| No citations | | Officer must re-read the entire circular to verify — defeats the purpose |
| Page-level citations ("See page 8") | | Not specific enough for a board meeting or audit response |
| **Section + page + verbatim quoted text** | **Yes** | Verifiable in seconds, usable in formal reports |

The prompt explicitly requires: *"For EVERY factual claim you make, you MUST quote the exact text from the circular with section reference."* The LLM sometimes gets page numbers wrong (especially with scanned PDFs), but the quoted text is almost always traceable. The officer can Ctrl+F the quote in the source document.

*With more time:* Implement PDF page-anchor links so clicking a citation opens the document at the exact location.

### Tech stack

| Considered | Chose | Why |
|---|---|---|
| Python (FastAPI) + React + Docker | | Two codebases, Docker complexity, harder to evaluate |
| Ruby on Rails + React | | Assignment says "use what you're fastest with" |
| **Next.js 15 + Supabase + Vercel + MiniMax M2.7** | **Yes** | One codebase, one deploy, evaluator can see it live |

Everything runs in a single Next.js app — scrapers, analysis, API routes, and frontend. Supabase handles the database (PostgreSQL) and storage. MiniMax M2.7 is the LLM, accessed through the OpenAI SDK. The whole thing is deployable to Vercel with `vercel deploy`.

### Why paste instead of PDF upload

| Considered | Chose | Why |
|---|---|---|
| PDF drag-and-drop upload | | Requires file storage, PDF parsing, more failure modes |
| **Text paste interface** | **Yes** | Lower friction, handles forwarded text/emails, simpler backend |

Compliance officers don't always have a clean PDF. They get forwarded emails, copied text from legal advisors, excerpts shared in meetings. A text paste box accepts all of these. And it eliminates an entire class of bugs — PDF parsing failures, storage upload errors, scanned-PDF OCR issues — without losing any analytical capability. The analysis engine works on text, so give it text.

---

## 6. What's Next

### Three risks I'd resolve before production

1. **Scraper reliability.** Government websites are unpredictable. RBI returned a 406 during testing (rate limiting). IFSCA's page structure could change any time. The tool needs retry logic with exponential backoff, health monitoring per source, and alerts when a scraper hasn't succeeded in 48 hours. The compliance team should never be silently unprotected.

2. **Scoring accuracy on edge cases.** The engine handles clear-cut circulars well. But multi-hop relevance — a circular that amends a 2019 regulation that indirectly affects a provision Glomopay relies on — is where it may under-score. The fix is a feedback loop: let the officer override scores, and use those overrides to calibrate the system over time.

3. **Baseline completeness.** The 29-rule baseline is built from public information. Glomopay's internal compliance policies, specific license conditions, and contractual obligations with correspondent banks aren't reflected. The baseline has blind spots until the compliance team validates and extends it through the review workflow.

### How I'd measure if it's working

| Metric | What it tells us | Target |
|---|---|---|
| **Triage time per circular** | Is the tool actually saving time? | < 5 min for HIGH, < 1 min for LOW |
| **False negative rate** | Are relevant circulars being missed? | < 5% (a miss = compliance risk) |
| **Action item completion rate** | Are the generated actions specific enough to act on? | > 70% acted upon |

### Three-month roadmap

**Month 1 — Validate the core loop.** Ship to the compliance team. Watch what they actually use. Collect feedback on scoring accuracy — are we missing things? Over-flagging? Refine the baseline with their input.

**Month 2 — Build trust.** Add officer score override with feedback loop. Harden scrapers with retry logic and monitoring. Start building the knowledge graph from accumulated concept mappings. Add per-circular Q&A for deeper drill-down.

**Month 3 — Scale.** Integrate with internal tools (Slack/Teams alerts, Jira ticket creation). Add cross-circular Q&A. Build an audit trail for regulatory compliance. Expand sources if the team identifies gaps.

---

## 7. Architecture

```
┌────────────────────────────────────────────────────────────┐
│                  VERCEL (Next.js 15 App)                    │
│  ├── Dashboard (filterable feed, relevance badges)          │
│  ├── Analysis Card (summary + score + actions + citations)  │
│  ├── Baseline Editor (view/edit regulatory rules by domain) │
│  ├── Paste Interface (submit circular text for analysis)    │
│  └── API Routes (fetch, analyze, review, CRUD)              │
└──────────────────────────┬─────────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────┐
│                  SUPABASE (PostgreSQL + Storage)             │
│  ├── circulars         (source, title, date, url, text)     │
│  ├── analyses          (score, summary, why_it_matters)     │
│  ├── action_items      (action, team, deadline, priority)   │
│  ├── citations         (quoted_text, section, page)         │
│  ├── concept_mappings  (concept → domain, strength)         │
│  ├── baseline_rules    (domain, rule, current_value)        │
│  ├── review_status     (reviewed, baseline_changed)         │
│  └── scraper_logs      (source, status, errors)             │
└──────────────────────────▲─────────────────────────────────┘
                           │
┌──────────────────────────┴─────────────────────────────────┐
│              SCRAPERS (Next.js API Routes)                   │
│  ├── RBI    — RSS feed → HTML text extraction               │
│  ├── SEBI   — RSS feed → PDF/HTML extraction                │
│  ├── IFSCA  — Home page scrape → detail page → PDF download │
│  └── Triggered by cron (daily) or manual "Fetch Now" button │
└────────────────────────────────────────────────────────────┘
```

---

*I started by understanding the problem. The compliance officer's pain isn't finding circulars — it's the 45-minute mental comparison against every rule Glomopay operates under, repeated 20 times a week, with no margin for error. Everything I built traces back to making that comparison fast, structured, and verifiable. The things I cut — MCA, FATF, PDF upload, Q&A chatbot — aren't missing features. They're deliberate choices to go deep on the thing that matters instead of wide on things that don't.*
