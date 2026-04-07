"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { RelevanceBadge } from "@/components/RelevanceBadge";
import { SourceBadge } from "@/components/SourceBadge";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  CheckCircle2,
  Loader2,
  Quote,
  AlertTriangle,
} from "lucide-react";
import type {
  Circular,
  Analysis,
  ActionItem,
  Citation,
  ConceptMapping,
  ReviewStatus,
} from "@/lib/types";

interface CircularDetail extends Circular {
  analysis: Analysis | null;
  action_items: ActionItem[] | null;
  citations: Citation[] | null;
  concept_mappings: ConceptMapping[] | null;
  review: ReviewStatus | null;
}

const priorityColors: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-800 border-red-200",
  HIGH: "bg-orange-100 text-orange-800 border-orange-200",
  MEDIUM: "bg-amber-100 text-amber-800 border-amber-200",
  LOW: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function CircularDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<CircularDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState("");
  const [baselineChanged, setBaselineChanged] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    fetch(`/api/circulars/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setReviewNotes(d.review?.notes || "");
        setBaselineChanged(d.review?.baseline_changed || false);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleReview() {
    setReviewing(true);
    try {
      await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          circular_id: id,
          reviewed: true,
          baseline_changed: baselineChanged,
          notes: reviewNotes,
        }),
      });
      const res = await fetch(`/api/circulars/${id}`);
      const updated = await res.json();
      setData(updated);
    } finally {
      setReviewing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Circular not found</p>
      </div>
    );
  }

  const { analysis, action_items, citations } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <Card className="mb-4">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <SourceBadge source={data.source} />
              {analysis && (
                <RelevanceBadge score={analysis.relevance_score} />
              )}
              {data.review?.reviewed && (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Reviewed
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {data.url && (
                <a
                  href={data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Source
                </a>
              )}
              {data.pdf_storage_path && (
                <a
                  href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/circular-pdfs/${data.pdf_storage_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  PDF
                </a>
              )}
            </div>
          </div>
          <h1 className="text-xl font-bold leading-tight mb-2">
            {data.title}
          </h1>
          {data.published_date && (
            <p className="text-sm text-muted-foreground">
              Published{" "}
              {format(new Date(data.published_date), "MMMM d, yyyy")}
            </p>
          )}
        </CardContent>
      </Card>

      {!analysis ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No analysis available</p>
            <p className="text-sm mt-1">
              {data.full_text
                ? "Analysis has not been run yet"
                : "No text extracted from this circular"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{analysis.summary}</p>
            </CardContent>
          </Card>

          {/* Why It Matters */}
          {analysis.why_it_matters && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Why It Matters to Glomopay
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">
                  {analysis.why_it_matters}
                </p>
                {analysis.affected_areas &&
                  Array.isArray(analysis.affected_areas) &&
                  analysis.affected_areas.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {analysis.affected_areas.map((area, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-sm bg-muted/50 rounded-md p-2.5"
                        >
                          <Badge variant="secondary" className="shrink-0 mt-0.5">
                            {area.team}
                          </Badge>
                          <div>
                            <span className="font-medium">{area.area}</span>
                            <span className="text-muted-foreground">
                              {" — "}
                              {area.impact}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

          {/* What Changed */}
          {analysis.what_changed && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">What Changed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">
                  {analysis.what_changed}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Action Items */}
          {action_items && action_items.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Action Items ({action_items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {action_items.map((item) => (
                    <div
                      key={item.id}
                      className="border rounded-lg p-3 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="font-medium leading-snug">
                          {item.action}
                        </p>
                        {item.priority && (
                          <Badge
                            variant="outline"
                            className={`shrink-0 ${priorityColors[item.priority] || ""}`}
                          >
                            {item.priority}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {item.team && (
                          <span>
                            <span className="font-medium">Team:</span>{" "}
                            {item.team}
                          </span>
                        )}
                        {item.deadline && (
                          <span>
                            <span className="font-medium">Deadline:</span>{" "}
                            {item.deadline}
                          </span>
                        )}
                        {item.source_reference && (
                          <span className="italic">
                            Ref: {item.source_reference}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Citations */}
          {citations && citations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Citations ({citations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {citations.map((citation) => (
                    <div
                      key={citation.id}
                      className="border rounded-lg p-3 text-sm"
                    >
                      <p className="font-medium mb-1.5">{citation.claim}</p>
                      {citation.quoted_text && (
                        <div className="flex gap-2 bg-muted/50 rounded p-2.5 mb-1.5">
                          <Quote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <p className="text-xs italic text-muted-foreground leading-relaxed">
                            &ldquo;{citation.quoted_text}&rdquo;
                          </p>
                        </div>
                      )}
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        {citation.section && <span>{citation.section}</span>}
                        {citation.page && <span>{citation.page}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Section */}
          <Separator />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={baselineChanged}
                    onChange={(e) => setBaselineChanged(e.target.checked)}
                    className="rounded"
                  />
                  This circular changes an existing baseline rule
                </label>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Notes
                  </label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add review notes..."
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleReview}
                  disabled={reviewing}
                >
                  {reviewing ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  )}
                  {data.review?.reviewed
                    ? "Update Review"
                    : "Mark as Reviewed"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
