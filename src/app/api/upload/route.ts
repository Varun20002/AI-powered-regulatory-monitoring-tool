import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { text, title, source } = await request.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Circular text is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: circular, error: insertError } = await supabase
      .from("circulars")
      .insert({
        source: source || "CUSTOM",
        title: title || "Untitled Circular",
        full_text: text.trim(),
        guid: `custom-${Date.now()}`,
        published_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !circular) {
      return NextResponse.json(
        { error: "Failed to create circular record" },
        { status: 500 }
      );
    }

    let analysisResult = null;
    try {
      const analyzeResponse = await fetch(
        new URL("/api/analyze", request.url).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ circular_id: circular.id }),
        }
      );
      analysisResult = await analyzeResponse.json();
    } catch (e) {
      console.error("Auto-analysis failed:", e);
    }

    return NextResponse.json({
      circular,
      analysis: analysisResult,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Submission failed",
      },
      { status: 500 }
    );
  }
}
