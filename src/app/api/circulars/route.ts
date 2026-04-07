import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);

  const source = searchParams.get("source");
  const relevance = searchParams.get("relevance");
  const reviewed = searchParams.get("reviewed");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = supabase
    .from("circulars")
    .select(
      `
      *,
      analyses (*),
      review_status (*)
    `
    )
    .order("published_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (source && source !== "ALL") {
    query = query.eq("source", source);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let filtered = data || [];

  if (relevance && relevance !== "ALL") {
    filtered = filtered.filter((c) =>
      c.analyses?.some(
        (a: { relevance_score: string }) => a.relevance_score === relevance
      )
    );
  }

  if (reviewed === "true") {
    filtered = filtered.filter((c) =>
      c.review_status?.some((r: { reviewed: boolean }) => r.reviewed)
    );
  } else if (reviewed === "false") {
    filtered = filtered.filter(
      (c) =>
        !c.review_status?.length ||
        c.review_status.every((r: { reviewed: boolean }) => !r.reviewed)
    );
  }

  return NextResponse.json(filtered);
}
