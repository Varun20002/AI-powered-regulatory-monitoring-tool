import type { ScrapedCircular } from "../types";

export async function scrapeRBI(): Promise<ScrapedCircular[]> {
  const RSSParser = (await import("rss-parser")).default;
  const parser = new RSSParser();

  try {
    const feed = await parser.parseURL("https://rbi.org.in/notifications_rss.xml");
    const circulars: ScrapedCircular[] = [];

    for (const item of feed.items.slice(0, 20)) {
      if (!item.title || !item.link) continue;

      circulars.push({
        source: "RBI",
        title: item.title.trim(),
        url: item.link,
        publishedDate: item.pubDate
          ? new Date(item.pubDate).toISOString()
          : new Date().toISOString(),
        guid: item.guid || item.link,
        pdfUrl: item.link.endsWith(".pdf") ? item.link : undefined,
      });
    }

    return circulars;
  } catch (error) {
    console.error("RBI scraper error:", error);
    throw new Error(`RBI scraper failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
