import type { ScrapedCircular } from "../types";

export async function scrapeSEBI(): Promise<ScrapedCircular[]> {
  const RSSParser = (await import("rss-parser")).default;
  const parser = new RSSParser();

  try {
    const feed = await parser.parseURL("https://www.sebi.gov.in/sebirss.xml");
    const circulars: ScrapedCircular[] = [];

    for (const item of feed.items.slice(0, 20)) {
      if (!item.title || !item.link) continue;

      circulars.push({
        source: "SEBI",
        title: item.title.trim(),
        url: item.link,
        publishedDate: (() => {
          if (!item.pubDate) return new Date().toISOString();
          try {
            const d = new Date(item.pubDate);
            return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
          } catch {
            return new Date().toISOString();
          }
        })(),
        guid: item.guid || item.link,
        pdfUrl: item.link.endsWith(".pdf") ? item.link : undefined,
      });
    }

    return circulars;
  } catch (error) {
    console.error("SEBI scraper error:", error);
    throw new Error(`SEBI scraper failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
