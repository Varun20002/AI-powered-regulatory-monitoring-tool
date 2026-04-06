# AI-Powered Regulatory Monitoring Tool — Product Thinking Document

## How We Built This: From Problem to Product

This document captures the full arc of thinking — from understanding the problem to shipping the solution. Every architectural decision traces back to a fundamental truth about the user's world.

---

## 1. Problem Scoping (300 words)

### Who is the user?

A **Senior Compliance Officer** at Glomopay — an IFSC-licensed payment institution in GIFT City processing outward remittances under LRS. This person is the last line of defense before Glomopay faces fines, license suspension, or processes an illegal transaction. They own regulatory watch across IFSCA, RBI, SEBI, MCA, and FATF — responsible for knowing every rule Glomopay operates under and catching every change the moment it's published.

### What is the highest-leverage pain?

The officer reads 20+ circulars per week across 5 regulatory websites. The pain isn't finding circulars — it's **assessing relevance from memory**. They must mentally compare each new circular against Glomopay's current regulatory reality (LRS limits, KYC thresholds, AML policies, IFSC license conditions) to decide: "Does this change anything for us?" This comparison happens in their head with no structured system. Things get missed. Context is lost between readings. Action items are communicated as informal emails that disappear.

### What are we explicitly NOT building?

- **No integrations** with Slack, Jira, or internal tools — we don't know Glomopay's internal stack, and wrong guesses create friction
- **No automated compliance actions** — compliance is a legal function; the tool recommends, the human executes
- **No user roles or permissions** — single-user prototype; multi-user is a production concern
- **No audit trail** — required for production, but adds no value to proving the core loop works
- **No legal opinions** — the tool is an assistant, not an authority
- **No real-time monitoring** — regulators publish a few times per week, not per minute

### What assumptions would we validate before production?

1. That the compliance officer's primary pain is triage speed (not discovery or filing)
2. That 5 sources (IFSCA, RBI, SEBI, MCA, FATF) cover 90%+ of relevant regulatory input
3. That the Glomopay baseline we've constructed accurately reflects their current regulatory reality
4. That the compliance team trusts AI-generated analysis enough to use it as a starting point (not ignore it)

---

## 2. Problem-First Thinking

### The Principle

Most builders read a problem statement and immediately jump to solutions. Problem-first thinking is the discipline of resisting that urge — spending disproportionate time understanding the problem before writing a single line of code. A well-defined problem contains its own solution.

### How We Applied It

**Solution-first framing (what most people would do):**
> "The compliance team needs a dashboard that shows regulatory circulars."

**Problem-first framing (what we did):**
> "Why do compliance officers miss relevant circulars, and what does that cost them?"

By asking this question, we discovered the real problem isn't about *finding* circulars. It's about:
1. **Triage speed** — reading 40 pages to decide "does this affect us?" takes 45 minutes per circular
2. **Context loss** — by the time you've read circular #5, you've forgotten the implications of circular #1
3. **Delta detection** — knowing what changed *relative to what you already operate under* requires perfect memory of every current rule

This reframing changed what we built. Instead of a "news feed of circulars" (which solves only discovery), we built an **analysis engine** that reads circulars on behalf of the officer, compares them against Glomopay's regulatory baseline, and outputs specific action items with citations.

---

## 3. First Principles Analysis

### The Method

Strip away all assumptions. No features. No tools. No AI. Just ask: what are the irreducible truths about this problem?

### The Seven Fundamental Truths

| # | Fundamental Truth | Why It's Irreducible | What It Demands |
|---|---|---|---|
| **FT1** | Regulatory bodies publish documents on websites | This is the input. We can't change it. | A system that checks those websites and pulls new documents. |
| **FT2** | Not all documents are relevant to Glomopay | Out of 100 circulars, maybe 10 matter. The rest are noise. | A relevance filter that understands Glomopay's specific context. |
| **FT3** | Relevance requires knowing what Glomopay does today | You need context to separate signal from noise. | A structured description of Glomopay's current regulatory reality (the "baseline"). |
| **FT4** | Documents are written in legal/regulatory language | A 40-page circular doesn't say "Glomopay, change your LRS limit." The implication is buried in Section 4.2(b)(iii). | A translator that explains what the document means in plain language — specifically what changed. |
| **FT5** | Awareness without action is useless | Knowing about a change doesn't matter if nobody acts on it. | The output must be actionable — who needs to do what, by when. |
| **FT6** | The human must remain the decision-maker | Compliance is a legal responsibility. No AI can sign off for a company. | A review/confirmation step where the officer validates and acts. |
| **FT7** | Every AI output must be verifiable against the source | The officer needs to cite exact sections in board meetings, audit responses, and regulatory filings. Unverifiable claims are worthless. | Citations — exact circular, section, paragraph, quoted text — for every claim the AI makes. |

### How Truths Became Features

```
FT1 → Fetcher (5 regulatory sources + custom PDF upload)
FT2 → Relevance Scoring Engine (semantic reasoning + deterministic scoring)
FT3 → Glomopay Baseline (hybrid: static seed + officer-confirmed updates)
FT4 → Plain-Language Analyzer (summary + "what changed" + "why it matters")
FT5 → Action Item Generator (specific, routed to teams, with deadlines)
FT6 → Review Layer (reviewed/unreviewed tracking, baseline confirmation flow)
FT7 → Citation System (exact section + page + quoted text for every claim)
```

Every feature in the system traces to a fundamental truth. Nothing is there because it "sounds cool" or because a feature list suggested it.

---

## 4. Feature Prioritization

### The Principle

Must-have = things the compliance officer already does manually today. If they're doing it by hand, the tool must do it. If they're NOT doing it today, it's a nice-to-have.

### Prioritization Scoring

We used three lenses:

| Lens | Question | Scale |
|---|---|---|
| **Replaces Manual Work** | Does the officer do this by hand today? | Yes (3) / Partially (2) / No (1) |
| **Cost of Not Having It** | What happens if this feature is missing? | Tool is useless (3) / Weaker (2) / Still works (1) |
| **Build Complexity** | How hard to build well? | Low (3) / Medium (2) / High (1) |

### The Priority Map

```
P0 — The Core (non-negotiable)
├── Auto-fetch from IFSCA, RBI, SEBI, MCA, FATF
├── Custom PDF upload
├── Glomopay Baseline (hybrid: static + officer-confirmed)
├── Analyzer: Summary + Relevance Score + "Why it matters"
├── Citations: Exact circular, section, paragraph for every claim
├── Action items with team routing + source references
├── Analysis card (combined view per circular)
├── Relevance feed with filters
└── Reviewed / unreviewed tracking

P1 — High Value (build right after core)
├── "Fetch Now" manual trigger
└── Baseline viewer/editor in UI

P2 — Future / V2
├── Cross-circular Q&A chatbot
├── Per-circular Q&A
├── Deadline extraction
└── Notifications
```

---

## 5. The User's Workflow (Before and After)

### Before (Manual)

```
Monday Morning:
1. Open browser → visit ifsca.gov.in, rbi.org.in, sebi.gov.in, mca.gov.in, fatf-gafi.org
2. Check for new circulars on each site (10 min)
3. Download PDFs of anything new (5 min)
4. Read each circular cover-to-cover (30-45 min EACH)
5. Mentally decide: "Does this affect us?" (requires perfect recall of all current rules)
6. If relevant: write informal email to product/ops/legal team with vague action items
7. Repeat 3-4x per week

Time: 8-15 hours/week
Error rate: High (memory-based relevance assessment)
Action tracking: None (emails get lost)
```

### After (With Our Tool)

```
Monday Morning:
1. Open dashboard → see "3 HIGH-relevance circulars this week" (instant)
2. Click first circular → read AI analysis card:
   - Plain-language summary (30 seconds)
   - "Why it matters to Glomopay" (30 seconds)
   - Specific action items with team routing (30 seconds)
   - Citations to verify (1-2 minutes spot-checking)
3. Mark as "Reviewed" → confirm if baseline changed
4. Repeat for remaining HIGH/MEDIUM items
5. Skim LOW items to confirm they're correctly scored

Time: 1-2 hours/week
Error rate: Low (AI never forgets, officer validates)
Action tracking: Structured, assigned, with deadlines
```

---

## 6. The Relevance Scoring Engine

### Why Keyword Matching Fails

A circular might say: *"All authorized persons facilitating cross-border fund transfers under the scheme shall implement enhanced verification."*

Keyword matching for "LRS", "KYC", "IFSCA" → no match → scores LOW.

But semantically: "authorized persons" = Glomopay (a licensed PSP). "Cross-border fund transfers under the scheme" = LRS. "Enhanced verification" = KYC/EDD. This is HIGH relevance.

### Our Approach: Semantic Reasoning with Deterministic Scoring

```
STEP 1 — CONCEPT EXTRACTION (LLM)
  Extract regulatory concepts, entities, obligations from the circular.
  Output: [{concept, type, context}]

STEP 2 — SEMANTIC DOMAIN MAPPING (LLM + Baseline)
  Map each concept to Glomopay's operational domains.
  Rate each mapping: DIRECT / INFERRED / TANGENTIAL / NONE
  Output: [{concept → domain, mapping_strength}]

STEP 3 — DELTA DETECTION (LLM + Baseline)
  Compare against current rules in the baseline.
  Output: [{current_rule, new_rule, change_type}]

STEP 4 — SCORING (Deterministic code, NOT LLM)
  Count DIRECT/INFERRED/TANGENTIAL mappings.
  Apply fixed rubric:
  - 3+ DIRECT mappings or any delta detected → HIGH
  - 1-2 DIRECT or 3+ INFERRED → MEDIUM
  - Only TANGENTIAL → LOW
  - All NONE → NOT_RELEVANT

STEP 5 — ACTION GENERATION (LLM, only for HIGH/MEDIUM)
  Generate specific action items with team routing, deadlines, citations.
```

### Why Step 4 Is Deterministic

The LLM extracts concepts and maps them (Steps 1-3). But the *scoring decision* is code, not AI. This prevents the LLM from being overly generous ("everything is HIGH!") or conservative. The rules are fixed, auditable, and explainable.

### Knowledge Graph — Designed For, Not Built Yet

We store concept-to-domain mappings from every analysis in a `concept_mappings` table. Over time, this becomes training data for a knowledge graph that can do hop-based scoring without the LLM. This is the v2 architecture — but the data collection starts in v1.

---

## 7. The Glomopay Baseline

### What It Is

A structured document describing Glomopay's current regulatory reality — what products they operate, what rules govern each, and what the current values are (thresholds, limits, requirements).

### Why It Matters

Without it, the AI can only say: *"This circular is about LRS."* (Generic, useless.)

With it, the AI can say: *"This circular raises the LRS limit from $250,000 to $300,000. Glomopay's Outward Remittance product currently enforces $250,000. You need to update the transaction engine."* (Specific, actionable.)

### The Hybrid Approach

| Phase | How it works |
|---|---|
| **Day 1** | Ship with a static baseline (JSON file) based on public knowledge of Glomopay's operations |
| **Week 1+** | Officer reviews circulars, marks them "Reviewed & Actioned" |
| **On review** | System asks: "Did this circular change any existing rule?" |
| **If yes** | Officer confirms what changed → baseline updates with changelog |
| **Month 3** | Baseline is a living document — part written by us, part validated by the officer |

### Baseline Structure (Three Domains)

**Products:** Outward Remittance (LRS), Checkout/Payment Links, Payouts, Subscriptions, Identity/KYC, Treasury — with the specific regulations governing each.

**Operations:** IFSC License conditions, Transaction Monitoring rules, Correspondent Banking requirements, Data & Reporting obligations, AML Screening requirements.

**Compliance:** AML/CFT Policy requirements, Risk Assessment framework, Audit requirements, Board Governance obligations, Record Keeping rules.

---

## 8. Design Decisions

### Decision 1: How We Source Regulatory Updates

| Alternative | Pros | Cons | Our choice |
|---|---|---|---|
| RSS feeds only | Standard, reliable, built-in dedup via GUID | Not all regulators have RSS (IFSCA, MCA may not) | |
| Web scraping only | Works for any site | Brittle, breaks when site redesigns | |
| **RSS where available + scraping as fallback** | Best of both — reliable where possible, resilient everywhere | Slightly more code | **Chosen** |
| Third-party API (if exists) | Easiest | No known API aggregating Indian regulatory circulars | Rejected |

*What we'd change with more time:* Add webhook support for real-time notification when new circulars are published.

### Decision 2: How We Determine Relevance

| Alternative | Pros | Cons | Our choice |
|---|---|---|---|
| Keyword matching | Fast, simple, no LLM cost | Misses semantic meaning, high false negatives | Rejected |
| Pure LLM scoring | Understands meaning | Inconsistent, unexplainable, can hallucinate scores | Rejected |
| **Semantic extraction (LLM) + deterministic scoring (code)** | Accurate, explainable, auditable, consistent | More complex prompt engineering | **Chosen** |
| Knowledge graph traversal | Most accurate, scales best | Significant build effort, overkill for 5 sources | Designed for v2 |

*What we'd change with more time:* Build the knowledge graph using accumulated concept mappings from v1 analyses.

### Decision 3: How We Structure the Glomopay Context

| Alternative | Pros | Cons | Our choice |
|---|---|---|---|
| Static document (hardcoded) | Simple, reliable | Goes stale as rules change | Rejected |
| Dynamic (AI-built from ingested circulars) | Always current | Can hallucinate, no human validation | Rejected |
| **Hybrid (static seed + officer-confirmed updates)** | Starts reliable, evolves with human validation | Slightly more complex UI flow | **Chosen** |

*What we'd change with more time:* Add baseline versioning with full diff history so the team can see how their regulatory reality has evolved over time.

### Decision 4: How We Handle Citation Accuracy

| Alternative | Pros | Cons | Our choice |
|---|---|---|---|
| No citations | Simplest | Officer must re-read entire circular to verify. Defeats the purpose. | Rejected |
| Page-level citations | Easy for LLM to produce | "See page 8" isn't specific enough for a board meeting | Rejected |
| **Section + paragraph + quoted text** | Verifiable in seconds, usable in formal reports | Requires structured prompt engineering, LLM may sometimes get page numbers wrong | **Chosen** |

*What we'd change with more time:* Implement PDF page-anchor links so clicking a citation opens the PDF at the exact location.

### Decision 5: Tech Stack

| Alternative | Pros | Cons | Our choice |
|---|---|---|---|
| Python (FastAPI) + React + PostgreSQL + Docker | Strongest scraping ecosystem, full control | Two codebases, Docker complexity, harder for evaluator to run | |
| **Next.js + Supabase + Vercel + Python scraper** | One deploy command, evaluator can see it live, modern React stack (matches Glomopay) | Scraper still needs Python separately | **Chosen** |
| Ruby on Rails + React (Glomopay's internal stack) | Matches their stack | Not our fastest build stack; assignment says "use what you're fastest with" | Rejected |

---

## 9. What's Next

### Three Biggest Risks to Resolve Before Production

1. **Scraper reliability** — Indian government websites are inconsistent. IFSCA may not have RSS. RBI's HTML structure may change without notice. We need robust fallback chains (RSS → scraping → manual alert) and monitoring that tells the team "we haven't been able to fetch from MCA in 48 hours."

2. **AI accuracy on edge cases** — The relevance engine works well for clear-cut circulars. But what about a circular that amends a regulation from 2019 that indirectly affects a provision that Glomopay relies on? These multi-hop relevance chains are where the AI may under-score. We need a feedback loop where the officer can override scores, and those overrides become training data.

3. **Baseline completeness** — Our initial baseline is constructed from public information. We don't have access to Glomopay's internal compliance policies, specific license conditions, or contractual obligations with correspondent banks. The baseline will have blind spots until the compliance team validates and extends it.

### Success Metrics

| Metric | What it measures | Target |
|---|---|---|
| **Triage time per circular** | How long the officer spends per circular (from "unread" to "reviewed") | < 5 minutes for HIGH relevance, < 1 minute for LOW |
| **False negative rate** | How often a relevant circular is scored LOW or NOT_RELEVANT | < 5% (critical — a miss = compliance risk) |
| **Action item completion rate** | What percentage of generated action items are actually acted on | > 70% (if lower, the actions aren't specific enough) |

### Three-Month Roadmap

**Month 1 — Core Loop + Validation**
- Ship the prototype to the compliance team
- Monitor: Are they using it? Which features get used first?
- Collect feedback on relevance scoring accuracy (false positives/negatives)
- Refine the Glomopay baseline with the team's input

**Month 2 — Reliability + Trust**
- Build the knowledge graph from accumulated concept mappings
- Add officer score override → feeds back into scoring calibration
- Harden scrapers with retry logic, monitoring, and alerts
- Add per-circular Q&A ("What is the penalty for non-compliance under this circular?")

**Month 3 — Scale + Integration**
- Integrate with Glomopay's internal tools (Slack/Teams notifications, Jira ticket creation)
- Add cross-circular Q&A ("What are all our current obligations under AML/CFT?")
- Build audit trail for regulatory compliance (timestamped, immutable log)
- Expand to additional regulatory sources if the team identifies gaps

---

## 10. Architecture Summary

```
┌──────────────────────────────────────────────────────────┐
│                  VERCEL (Next.js App)                      │
│  ├── Dashboard (feed with filters, Monday morning view)    │
│  ├── Analysis Card (summary + score + actions + citations) │
│  ├── Baseline Editor (view/edit regulatory reality)        │
│  ├── PDF Upload (custom document ingestion)                │
│  └── API Routes (CRUD, analysis trigger, review, fetch)    │
└─────────────────────────┬────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────┐
│                  SUPABASE                                 │
│  ├── circulars (source, title, date, url, full_text)      │
│  ├── analyses (score, summary, why_it_matters)             │
│  ├── action_items (action, team, deadline, citation)       │
│  ├── citations (quoted_text, section, page)                │
│  ├── concept_mappings (for future knowledge graph)         │
│  ├── baseline_rules (domain, rule, current_value)          │
│  ├── review_status (reviewed, baseline_changed)            │
│  ├── scraper_logs (source, status, errors)                 │
│  └── Storage: circular-pdfs/                               │
└─────────────────────────▲────────────────────────────────┘
                          │
┌─────────────────────────┴────────────────────────────────┐
│              PYTHON SCRAPER (scheduled)                    │
│  ├── IFSCA, RBI, SEBI, MCA, FATF scrapers                 │
│  ├── PDF download + text extraction                        │
│  └── Writes to Supabase → triggers analysis                │
└──────────────────────────────────────────────────────────┘
```

---

*This document was written before a single line of code. Every feature traces to a fundamental truth. Every cut was deliberate. The goal was never to build everything — it was to build the right thing.*
