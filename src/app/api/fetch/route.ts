import { NextRequest, NextResponse } from "next/server";
import { runRegulatoryFetch } from "@/lib/regulatory-fetch";

export const maxDuration = 60;

function resolveAnalyzeBaseUrl(request: NextRequest): string {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const proto = forwardedProto || "https";
    return `${proto}://${forwardedHost}`;
  }
  const host = request.headers.get("host");
  if (host) {
    const proto = forwardedProto || (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return new URL(request.url).origin;
}

/**
 * Vercel Cron sends GET with `x-vercel-cron: 1`.
 * If CRON_SECRET is set, Vercel also sends `Authorization: Bearer <CRON_SECRET>`.
 * Manual GET (curl) can use the same Bearer token.
 */
function isCronGetAuthorized(request: NextRequest): boolean {
  if (request.headers.get("x-vercel-cron") === "1") return true;
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth === `Bearer ${secret}`) return true;
    if (request.headers.get("x-cron-secret") === secret) return true;
  }
  return false;
}

/** Vercel Cron invokes this path with GET (see vercel.json `crons`) */
export async function GET(request: NextRequest) {
  if (!isCronGetAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const base = resolveAnalyzeBaseUrl(request);
  const summary = await runRegulatoryFetch(base);
  return NextResponse.json({ summary });
}

/**
 * Manual trigger: requires CRON_SECRET via ?secret= or x-cron-secret when CRON_SECRET is set.
 * Prefer the dashboard "Fetch Now" button (server action) so the secret never hits the browser.
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const headerSecret = request.headers.get("x-cron-secret");

  if (
    process.env.CRON_SECRET &&
    secret !== process.env.CRON_SECRET &&
    headerSecret !== process.env.CRON_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const base = resolveAnalyzeBaseUrl(request);
  const summary = await runRegulatoryFetch(base);
  return NextResponse.json({ summary });
}
