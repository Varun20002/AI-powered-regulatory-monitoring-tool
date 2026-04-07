import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("scraper_logs")
    .select("*")
    .order("run_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const latestBySource: Record<string, (typeof data)[0]> = {};
  for (const log of data || []) {
    if (!latestBySource[log.source]) {
      latestBySource[log.source] = log;
    }
  }

  return NextResponse.json(Object.values(latestBySource));
}
