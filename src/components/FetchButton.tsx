"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { triggerRegulatoryFetch } from "@/app/actions/fetch-regulatory";

export function FetchButton({ onComplete }: { onComplete?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleFetch() {
    setLoading(true);
    setResult(null);

    try {
      const data = await triggerRegulatoryFetch();

      if (data.ok && data.summary) {
        const total = Object.values(data.summary).reduce(
          (sum, s) => sum + (s.processed || 0),
          0
        );
        setResult(`Fetched ${total} new circular(s)`);
      } else {
        setResult(data.error || "Fetch failed");
      }

      onComplete?.();
    } catch {
      setResult("Fetch failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleFetch}
        disabled={loading}
        variant="outline"
        size="sm"
      >
        <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Fetching..." : "Fetch Now"}
      </Button>
      {result && (
        <span className="text-xs text-muted-foreground">{result}</span>
      )}
    </div>
  );
}
