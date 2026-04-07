import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { extractTextFromBuffer } from "@/lib/scrapers/pdf-extractor";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const source = (formData.get("source") as string) || "CUSTOM";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const supabase = createServerClient();

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileName = `CUSTOM/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { error: uploadError } = await supabase.storage
      .from("circular-pdfs")
      .upload(fileName, buffer, {
        contentType: "application/pdf",
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    let fullText: string | null = null;
    try {
      fullText = await extractTextFromBuffer(buffer);
    } catch (e) {
      console.error("PDF text extraction failed:", e);
    }

    const { data: circular, error: insertError } = await supabase
      .from("circulars")
      .insert({
        source,
        title: title || file.name.replace(/\.pdf$/i, ""),
        pdf_storage_path: fileName,
        full_text: fullText,
        guid: `custom-${Date.now()}-${file.name}`,
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
    if (fullText) {
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
    }

    return NextResponse.json({
      circular,
      analysis: analysisResult,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}
