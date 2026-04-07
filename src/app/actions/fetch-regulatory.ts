"use server";

import { headers } from "next/headers";
import { runRegulatoryFetch } from "@/lib/regulatory-fetch";

/**
 * Runs the regulatory fetch pipeline on the server (dashboard "Fetch Now").
 * Uses the incoming request host so internal /api/analyze calls hit this deployment.
 */
export async function triggerRegulatoryFetch(): Promise<{
  ok: boolean;
  summary?: Record<string, { found: number; processed: number; error?: string }>;
  error?: string;
}> {
  try {
    const h = await headers();
    const forwardedHost = h.get("x-forwarded-host");
    const host = forwardedHost || h.get("host");
    const proto = h.get("x-forwarded-proto") || "https";
    const origin =
      host && !host.includes("localhost")
        ? `${proto}://${host}`
        : host
          ? `http://${host}`
          : process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : "http://localhost:3000";

    const summary = await runRegulatoryFetch(origin);
    return { ok: true, summary };
  } catch (e) {
    console.error("triggerRegulatoryFetch:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Fetch failed",
    };
  }
}
