"use client";

import { Badge } from "@/components/ui/badge";
import type { Source } from "@/lib/types";

const sourceColors: Record<Source, string> = {
  IFSCA: "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100",
  RBI: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
  SEBI: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
  CUSTOM: "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-100",
};

export function SourceBadge({ source }: { source: Source }) {
  return (
    <Badge variant="outline" className={sourceColors[source] || sourceColors.CUSTOM}>
      {source}
    </Badge>
  );
}
