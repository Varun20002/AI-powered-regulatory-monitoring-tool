"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { RelevanceBadge } from "./RelevanceBadge";
import { SourceBadge } from "./SourceBadge";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import type { CircularWithAnalysis } from "@/lib/types";

export function CircularCard({
  circular,
}: {
  circular: CircularWithAnalysis;
}) {
  const analysis = circular.analyses?.[0];
  const review = circular.review_status?.[0];
  const isReviewed = review?.reviewed;

  return (
    <Link href={`/circular/${circular.id}`}>
      <Card className="transition-all hover:shadow-md hover:border-primary/20 cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <SourceBadge source={circular.source} />
                {analysis && (
                  <RelevanceBadge score={analysis.relevance_score} />
                )}
                {isReviewed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                )}
              </div>
              <h3 className="font-medium text-sm leading-snug line-clamp-2 mb-1.5">
                {circular.title}
              </h3>
              {analysis?.summary && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {analysis.summary}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {circular.published_date && (
                  <span>
                    {formatDistanceToNow(new Date(circular.published_date), {
                      addSuffix: true,
                    })}
                  </span>
                )}
                {circular.url && (
                  <ExternalLink className="h-3 w-3" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
