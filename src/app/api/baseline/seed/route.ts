import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import baselineData from "@/lib/baseline/glomopay-baseline.json";

export async function POST() {
  const supabase = createServerClient();

  const { data: existing } = await supabase
    .from("baseline_rules")
    .select("id")
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({
      message: "Baseline already seeded",
      count: existing.length,
    });
  }

  const { data, error } = await supabase
    .from("baseline_rules")
    .insert(baselineData)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Baseline seeded successfully",
    count: data?.length || 0,
  });
}
