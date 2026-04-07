import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: circular, error: circularError } = await supabase
    .from("circulars")
    .select("*")
    .eq("id", id)
    .single();

  if (circularError || !circular) {
    return NextResponse.json(
      { error: "Circular not found" },
      { status: 404 }
    );
  }

  const [analysesRes, reviewRes] = await Promise.all([
    supabase.from("analyses").select("*").eq("circular_id", id).limit(1),
    supabase.from("review_status").select("*").eq("circular_id", id).limit(1),
  ]);

  const analysis = analysesRes.data?.[0] || null;
  let actionItems = null;
  let citations = null;
  let conceptMappings = null;

  if (analysis) {
    const [actionsRes, citationsRes, mappingsRes] = await Promise.all([
      supabase
        .from("action_items")
        .select("*")
        .eq("analysis_id", analysis.id),
      supabase.from("citations").select("*").eq("analysis_id", analysis.id),
      supabase
        .from("concept_mappings")
        .select("*")
        .eq("circular_id", id),
    ]);
    actionItems = actionsRes.data;
    citations = citationsRes.data;
    conceptMappings = mappingsRes.data;
  }

  return NextResponse.json({
    ...circular,
    analysis,
    action_items: actionItems,
    citations,
    concept_mappings: conceptMappings,
    review: reviewRes.data?.[0] || null,
  });
}
