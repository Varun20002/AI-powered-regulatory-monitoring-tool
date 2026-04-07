"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterBarProps {
  source: string;
  onSourceChange: (value: string) => void;
  relevance: string;
  onRelevanceChange: (value: string) => void;
  reviewed: string;
  onReviewedChange: (value: string) => void;
}

export function FilterBar({
  source,
  onSourceChange,
  relevance,
  onRelevanceChange,
  reviewed,
  onReviewedChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Select value={source} onValueChange={(v) => v && onSourceChange(v)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Sources</SelectItem>
          <SelectItem value="RBI">RBI</SelectItem>
          <SelectItem value="SEBI">SEBI</SelectItem>
          <SelectItem value="IFSCA">IFSCA</SelectItem>
          <SelectItem value="CUSTOM">Custom</SelectItem>
        </SelectContent>
      </Select>

      <Select value={relevance} onValueChange={(v) => v && onRelevanceChange(v)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Relevance" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Relevance</SelectItem>
          <SelectItem value="HIGH">High</SelectItem>
          <SelectItem value="MEDIUM">Medium</SelectItem>
          <SelectItem value="LOW">Low</SelectItem>
          <SelectItem value="NOT_RELEVANT">Not Relevant</SelectItem>
        </SelectContent>
      </Select>

      <Select value={reviewed} onValueChange={(v) => v && onReviewedChange(v)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Review Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="false">Unreviewed</SelectItem>
          <SelectItem value="true">Reviewed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
