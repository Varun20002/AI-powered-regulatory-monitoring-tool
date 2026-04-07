import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("baseline_rules")
    .select("*")
    .order("domain")
    .order("category")
    .order("rule_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  try {
    const { id, current_value, updated_by } = await request.json();

    if (!id || !current_value) {
      return NextResponse.json(
        { error: "id and current_value are required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("baseline_rules")
      .update({
        current_value,
        updated_by: updated_by || "officer",
        last_updated: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Update failed",
      },
      { status: 500 }
    );
  }
}
