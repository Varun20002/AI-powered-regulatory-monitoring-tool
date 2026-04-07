"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import type { ScraperLog } from "@/lib/types";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

const statusIcons = {
  SUCCESS: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
  FAILED: <XCircle className="h-3.5 w-3.5 text-red-500" />,
  PARTIAL: <AlertCircle className="h-3.5 w-3.5 text-amber-500" />,
};

export function ScraperStatus() {
  const [logs, setLogs] = useState<ScraperLog[]>([]);

  useEffect(() => {
    fetch("/api/scraper-status")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setLogs(data);
      })
      .catch(() => {});
  }, []);

  if (logs.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      {logs.map((log) => (
        <div key={log.id} className="flex items-center gap-1.5">
          {statusIcons[log.status]}
          <span className="font-medium">{log.source}</span>
          <span>
            {formatDistanceToNow(new Date(log.run_at), { addSuffix: true })}
          </span>
        </div>
      ))}
    </div>
  );
}
