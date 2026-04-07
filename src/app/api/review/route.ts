import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { circular_id, reviewed, baseline_changed, notes } =
      await request.json();

    if (!circular_id) {
      return NextResponse.json(
        { error: "circular_id is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: existing } = await supabase
      .from("review_status")
      .select("id")
      .eq("circular_id", circular_id)
      .limit(1);

    if (existing && existing.length > 0) {
      const { data, error } = await supabase
        .from("review_status")
        .update({
          reviewed: reviewed ?? true,
          reviewed_at: new Date().toISOString(),
          baseline_changed: baseline_changed ?? false,
          notes: notes || null,
        })
        .eq("circular_id", circular_id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json(data);
    }

    const { data, error } = await supabase
      .from("review_status")
      .insert({
        circular_id,
        reviewed: reviewed ?? true,
        reviewed_at: new Date().toISOString(),
        baseline_changed: baseline_changed ?? false,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Review failed",
      },
      { status: 500 }
    );
  }
}
