import { createServerClient } from "@/lib/supabase/server";
import { scrapeRBI } from "@/lib/scrapers/rbi";
import { scrapeSEBI } from "@/lib/scrapers/sebi";
import { scrapeIFSCA } from "@/lib/scrapers/ifsca";
import { extractTextFromPdfUrl } from "@/lib/scrapers/pdf-extractor";
import { extractTextFromUrl } from "@/lib/scrapers/html-extractor";
import type { ScrapedCircular, Source } from "@/lib/types";

async function runScraper(
  name: Source,
  fn: () => Promise<ScrapedCircular[]>
): Promise<{ source: Source; items: ScrapedCircular[]; error?: string }> {
  try {
    const items = await fn();
    return { source: name, items };
  } catch (error) {
    return {
      source: name,
      items: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Runs all scrapers, saves new circulars, triggers analysis.
 * @param analyzeBaseUrl - Origin for internal POST /api/analyze (e.g. https://your-app.vercel.app)
 */
export async function runRegulatoryFetch(
  analyzeBaseUrl: string
): Promise<Record<string, { found: number; processed: number; error?: string }>> {
  const supabase = createServerClient();
  const analyzeUrl = new URL("/api/analyze", analyzeBaseUrl).toString();

  const results = await Promise.allSettled([
    runScraper("RBI", scrapeRBI),
    runScraper("SEBI", scrapeSEBI),
    runScraper("IFSCA", scrapeIFSCA),
  ]);

  const summary: Record<string, { found: number; processed: number; error?: string }> = {};

  for (const result of results) {
    if (result.status === "rejected") continue;

    const { source, items, error } = result.value;
    let processed = 0;

    for (const item of items) {
      const { data: existing } = await supabase
        .from("circulars")
        .select("id")
        .eq("guid", item.guid)
        .limit(1);

      if (existing && existing.length > 0) continue;

      let fullText: string | null = null;
      let pdfStoragePath: string | null = null;

      if (item.pdfUrl) {
        try {
          fullText = await extractTextFromPdfUrl(item.pdfUrl);

          const pdfResponse = await fetch(item.pdfUrl);
          const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
          const fileName = `${source}/${Date.now()}-${item.guid.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 50)}.pdf`;

          const { error: uploadError } = await supabase.storage
            .from("circular-pdfs")
            .upload(fileName, pdfBuffer, {
              contentType: "application/pdf",
            });

          if (!uploadError) {
            pdfStoragePath = fileName;
          }
        } catch (e) {
          console.error(`PDF extraction failed for ${item.url}:`, e);
        }
      }

      if (!fullText && item.url) {
        try {
          fullText = await extractTextFromUrl(item.url);
        } catch (e) {
          console.error(`HTML extraction failed for ${item.url}:`, e);
        }
      }

      const { data: inserted, error: insertError } = await supabase
        .from("circulars")
        .insert({
          source: item.source,
          title: item.title,
          published_date: item.publishedDate,
          url: item.url,
          pdf_storage_path: pdfStoragePath,
          full_text: fullText,
          guid: item.guid,
        })
        .select()
        .single();

      if (!insertError && inserted && fullText) {
        try {
          await fetch(analyzeUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ circular_id: inserted.id }),
          });
        } catch (e) {
          console.error(`Analysis trigger failed for ${inserted.id}:`, e);
        }
      }

      if (!insertError) processed++;
    }

    summary[source] = {
      found: items.length,
      processed,
      error,
    };

    await supabase.from("scraper_logs").insert({
      source,
      status: error ? "FAILED" : processed > 0 ? "SUCCESS" : "PARTIAL",
      items_found: items.length,
      items_processed: processed,
      error_message: error || null,
    });
  }

  return summary;
}
