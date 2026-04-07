import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { callMiniMax, parseJSONFromLLM } from "@/lib/minimax";
import { buildAnalysisPrompt } from "@/lib/prompts";
import { computeRelevanceScore } from "@/lib/scoring";
import type { LLMAnalysisResponse } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { circular_id } = await request.json();
    if (!circular_id) {
      return NextResponse.json(
        { error: "circular_id is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: circular, error: circularError } = await supabase
      .from("circulars")
      .select("*")
      .eq("id", circular_id)
      .single();

    if (circularError || !circular) {
      return NextResponse.json(
        { error: "Circular not found" },
        { status: 404 }
      );
    }

    if (!circular.full_text) {
      return NextResponse.json(
        { error: "Circular has no extracted text" },
        { status: 400 }
      );
    }

    const { data: baseline } = await supabase
      .from("baseline_rules")
      .select("*");

    const { systemPrompt, userPrompt } = buildAnalysisPrompt(
      circular.full_text,
      baseline || []
    );

    const rawResponse = await callMiniMax(systemPrompt, userPrompt);
    const parsed = parseJSONFromLLM(rawResponse) as unknown as LLMAnalysisResponse;

    const relevanceScore = computeRelevanceScore(
      parsed.concept_mappings || [],
      parsed.what_changed &&
        !parsed.what_changed.toLowerCase().startsWith("no direct changes") &&
        !parsed.what_changed.toLowerCase().startsWith("no changes") &&
        !parsed.what_changed.toLowerCase().includes("no direct changes detected")
        ? [
            {
              current_rule: "baseline",
              new_rule: parsed.what_changed,
              change_type: "modification",
            },
          ]
        : []
    );

    const { data: analysis, error: analysisError } = await supabase
      .from("analyses")
      .insert({
        circular_id,
        relevance_score: relevanceScore,
        relevance_reasoning: parsed.relevance_reasoning,
        summary: parsed.summary,
        what_changed: parsed.what_changed,
        why_it_matters: parsed.why_it_matters,
        affected_areas: parsed.affected_areas,
        prompt_version: "v1.0",
        raw_response: rawResponse,
      })
      .select()
      .single();

    if (analysisError || !analysis) {
      return NextResponse.json(
        { error: "Failed to save analysis" },
        { status: 500 }
      );
    }

    if (parsed.action_items?.length) {
      await supabase.from("action_items").insert(
        parsed.action_items.map((item) => ({
          analysis_id: analysis.id,
          circular_id,
          action: item.action,
          team: item.team,
          deadline: item.deadline,
          priority: item.priority,
          source_reference: item.source_reference,
        }))
      );
    }

    if (parsed.citations?.length) {
      await supabase.from("citations").insert(
        parsed.citations.map((c) => ({
          analysis_id: analysis.id,
          circular_id,
          claim: c.claim,
          quoted_text: c.quoted_text,
          section: c.section,
          page: c.page,
        }))
      );
    }

    if (parsed.concept_mappings?.length) {
      await supabase.from("concept_mappings").insert(
        parsed.concept_mappings.map((m) => ({
          circular_id,
          concept: m.concept,
          mapped_domain: m.mapped_domain,
          mapping_strength: m.mapping_strength,
        }))
      );
    }

    return NextResponse.json({
      analysis_id: analysis.id,
      relevance_score: relevanceScore,
      summary: parsed.summary,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Analysis failed",
      },
      { status: 500 }
    );
  }
}
