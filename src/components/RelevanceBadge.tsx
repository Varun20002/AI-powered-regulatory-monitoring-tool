"use client";

import { Badge } from "@/components/ui/badge";
import type { RelevanceScore } from "@/lib/types";

const config: Record<
  RelevanceScore,
  { label: string; className: string }
> = {
  HIGH: {
    label: "HIGH",
    className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
  },
  MEDIUM: {
    label: "MEDIUM",
    className:
      "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
  },
  LOW: {
    label: "LOW",
    className: "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100",
  },
  NOT_RELEVANT: {
    label: "NOT RELEVANT",
    className: "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-50",
  },
};

export function RelevanceBadge({ score }: { score: RelevanceScore }) {
  const { label, className } = config[score] || config.NOT_RELEVANT;
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
