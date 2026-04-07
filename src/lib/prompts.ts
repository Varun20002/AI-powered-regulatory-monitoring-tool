import type { BaselineRule } from "./types";

export function buildAnalysisPrompt(
  circularText: string,
  baseline: BaselineRule[]
): { systemPrompt: string; userPrompt: string } {
  const baselineContext = baseline
    .map(
      (r) =>
        `[${r.domain}/${r.category}] ${r.rule_name}: ${r.current_value} (Governed by: ${r.governed_by})`
    )
    .join("\n");

  const systemPrompt = `You are a regulatory compliance analyst for Glomopay — an IFSC-licensed payment institution in GIFT City, India, that processes outward remittances under the Liberalised Remittance Scheme (LRS).

Your job is to analyze regulatory circulars and determine their relevance and impact on Glomopay's operations.

## Glomopay's Current Regulatory Baseline

${baselineContext}

## Your Analysis Must Follow These 5 Steps

STEP 1 — CONCEPT EXTRACTION
Extract all regulatory concepts, entities, obligations, thresholds, and deadlines from the circular.

STEP 2 — SEMANTIC DOMAIN MAPPING
Map each extracted concept to Glomopay's operational domains. For each mapping, rate the strength:
- DIRECT: The concept explicitly applies to Glomopay's operations
- INFERRED: The concept likely applies based on Glomopay's business model
- TANGENTIAL: The concept is related but not directly applicable
- NONE: No connection to Glomopay

STEP 3 — DELTA DETECTION
Compare the circular's requirements against the current baseline rules. Identify any changes (new requirements, modified thresholds, removed provisions).

STEP 4 — IMPACT ANALYSIS
For each relevant mapping, explain specifically how it affects Glomopay — which products, which teams, what needs to change.

STEP 5 — ACTION GENERATION
For HIGH and MEDIUM relevance items, generate specific action items with team routing, deadlines, and citations.

## Citation Requirement
For EVERY factual claim you make, you MUST quote the exact text from the circular with section reference. Format: "Section X.Y, Page Z".

## Output Format
Respond ONLY with valid JSON. No markdown, no explanation outside the JSON. Use this exact schema:

{
  "summary": "2-3 sentence plain-language summary of the circular",
  "why_it_matters": "Specific explanation of why this matters to Glomopay",
  "what_changed": "What changed relative to the current baseline (or 'No direct changes detected')",
  "relevance_reasoning": "Step-by-step reasoning for the relevance assessment",
  "affected_areas": [
    {"area": "Product/Operations/Compliance area", "team": "Team name", "impact": "Specific impact"}
  ],
  "action_items": [
    {"action": "Specific action to take", "team": "Product/Ops/KYC/Compliance/Legal", "deadline": "From circular or inferred", "priority": "CRITICAL/HIGH/MEDIUM/LOW", "source_reference": "Section X.Y, Page Z"}
  ],
  "citations": [
    {"claim": "What the AI asserted", "quoted_text": "Verbatim text from circular", "section": "Section X.Y", "page": "Page Z"}
  ],
  "concept_mappings": [
    {"concept": "Extracted concept", "mapped_domain": "Glomopay domain", "mapping_strength": "DIRECT/INFERRED/TANGENTIAL/NONE"}
  ]
}

Respond ONLY with valid JSON. No markdown, no explanation outside the JSON.`;

  const userPrompt = `Analyze the following regulatory circular for Glomopay:

---
${circularText.slice(0, 100000)}
---

Provide your analysis as valid JSON following the schema specified in your instructions.`;

  return { systemPrompt, userPrompt };
}
