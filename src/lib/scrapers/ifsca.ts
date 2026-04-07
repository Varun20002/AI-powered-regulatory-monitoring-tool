import * as cheerio from "cheerio";
import type { ScrapedCircular } from "../types";

export async function scrapeIFSCA(): Promise<ScrapedCircular[]> {
  try {
    // IFSCA doesn't have RSS. The circulars table is JS-rendered.
    // The home page "What's New" section lists recent items with links
    // to detail pages that contain the PDF.
    const response = await fetch("https://ifsca.gov.in/home", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`IFSCA returned ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const circulars: ScrapedCircular[] = [];

    const seen = new Set<string>();

    $("a[href*='Legal/Index']").each((_, el) => {
      const title = $(el).text().replace(/\s+/g, " ").trim();
      const href = $(el).attr("href") || "";

      // Skip short category links like "Regulation", "Act", "Rules"
      if (title.length < 20 || href.includes("/Legal/Index/")) return;

      const url = href.startsWith("http")
        ? href
        : `https://ifsca.gov.in${href}`;

      if (seen.has(url)) return;
      seen.add(url);

      circulars.push({
        source: "IFSCA",
        title,
        url,
        publishedDate: new Date().toISOString(),
        guid: url,
      });
    });

    // For each circular, fetch the detail page to find the PDF link
    for (const circular of circulars) {
      try {
        const detailRes = await fetch(circular.url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });
        if (!detailRes.ok) continue;

        const detailHtml = await detailRes.text();
        const $d = cheerio.load(detailHtml);

        // DownloadFile returns the raw PDF binary;
        // GetFileView returns an HTML wrapper page
        const pdfHref =
          $d("a[href*='DownloadFile']").first().attr("href") ||
          $d("a[href$='.pdf']").first().attr("href") ||
          "";

        if (pdfHref) {
          circular.pdfUrl = pdfHref.startsWith("http")
            ? pdfHref
            : `https://ifsca.gov.in${pdfHref}`;
        }

        // Try to extract date from the detail page
        const dateMatch = detailHtml.match(
          /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/
        );
        if (dateMatch) {
          const parsed = new Date(
            `${dateMatch[3]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[1].padStart(2, "0")}`
          );
          if (!isNaN(parsed.getTime())) {
            circular.publishedDate = parsed.toISOString();
          }
        }
      } catch {
        // Continue without PDF for this circular
      }
    }

    return circulars.slice(0, 20);
  } catch (error) {
    console.error("IFSCA scraper error:", error);
    throw new Error(
      `IFSCA scraper failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
