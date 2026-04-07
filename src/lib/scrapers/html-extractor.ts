import * as cheerio from "cheerio";

export async function extractTextFromUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/pdf")) {
      const { extractTextFromBuffer } = await import("./pdf-extractor");
      const buffer = Buffer.from(await response.arrayBuffer());
      return extractTextFromBuffer(buffer);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    $("script, style, nav, header, footer, .breadcrumb, .menu, .sidebar").remove();

    const contentSelectors = [
      "#divContent",
      "#ContentPlaceHolder1_divContent",
      ".content-area",
      ".notification-content",
      "#maincontent",
      "article",
      ".main-content",
      "main",
    ];

    for (const selector of contentSelectors) {
      const el = $(selector);
      if (el.length && el.text().trim().length > 100) {
        return el.text().replace(/\s+/g, " ").trim();
      }
    }

    const bodyText = $("body").text().replace(/\s+/g, " ").trim();
    if (bodyText.length > 200) {
      return bodyText;
    }

    return null;
  } catch (error) {
    console.error(`HTML extraction failed for ${url}:`, error);
    return null;
  }
}
