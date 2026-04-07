"use client";

import { useEffect, useState, useCallback } from "react";
import { CircularCard } from "@/components/CircularCard";
import { FilterBar } from "@/components/FilterBar";
import { FetchButton } from "@/components/FetchButton";
import { ScraperStatus } from "@/components/ScraperStatus";
import type { CircularWithAnalysis } from "@/lib/types";
import { Loader2, Inbox } from "lucide-react";

export default function DashboardPage() {
  const [circulars, setCirculars] = useState<CircularWithAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("ALL");
  const [relevance, setRelevance] = useState("ALL");
  const [reviewed, setReviewed] = useState("false");

  const fetchCirculars = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (source !== "ALL") params.set("source", source);
      if (relevance !== "ALL") params.set("relevance", relevance);
      if (reviewed !== "all") params.set("reviewed", reviewed);

      const res = await fetch(`/api/circulars?${params}`);
      const data = await res.json();
      setCirculars(Array.isArray(data) ? data : []);
    } catch {
      setCirculars([]);
    } finally {
      setLoading(false);
    }
  }, [source, relevance, reviewed]);

  useEffect(() => {
    fetchCirculars();
  }, [fetchCirculars]);

  const sortedCirculars = [...circulars].sort((a, b) => {
    const scoreOrder = { HIGH: 0, MEDIUM: 1, LOW: 2, NOT_RELEVANT: 3 };
    const aScore = a.analyses?.[0]?.relevance_score || "NOT_RELEVANT";
    const bScore = b.analyses?.[0]?.relevance_score || "NOT_RELEVANT";
    const scoreDiff =
      (scoreOrder[aScore as keyof typeof scoreOrder] ?? 3) -
      (scoreOrder[bScore as keyof typeof scoreOrder] ?? 3);
    if (scoreDiff !== 0) return scoreDiff;
    return (
      new Date(b.published_date || b.created_at).getTime() -
      new Date(a.published_date || a.created_at).getTime()
    );
  });

  const highCount = circulars.filter(
    (c) => c.analyses?.[0]?.relevance_score === "HIGH"
  ).length;
  const mediumCount = circulars.filter(
    (c) => c.analyses?.[0]?.relevance_score === "MEDIUM"
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Regulatory Monitor
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {highCount > 0 && (
                <span className="text-red-600 font-medium">
                  {highCount} HIGH relevance
                </span>
              )}
              {highCount > 0 && mediumCount > 0 && " · "}
              {mediumCount > 0 && (
                <span className="text-amber-600 font-medium">
                  {mediumCount} MEDIUM relevance
                </span>
              )}
              {highCount === 0 && mediumCount === 0 && "No high-priority items"}
              {" · "}
              {circulars.length} total circular(s)
            </p>
          </div>
          <FetchButton onComplete={fetchCirculars} />
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <FilterBar
            source={source}
            onSourceChange={setSource}
            relevance={relevance}
            onRelevanceChange={setRelevance}
            reviewed={reviewed}
            onReviewedChange={setReviewed}
          />
          <ScraperStatus />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : sortedCirculars.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Inbox className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">No circulars found</p>
          <p className="text-xs mt-1">
            Click &quot;Fetch Now&quot; to pull latest circulars or upload a PDF
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {sortedCirculars.map((circular) => (
            <CircularCard key={circular.id} circular={circular} />
          ))}
        </div>
      )}
    </div>
  );
}
