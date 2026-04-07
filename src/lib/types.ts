export type Source = "IFSCA" | "RBI" | "SEBI" | "CUSTOM";
export type RelevanceScore = "HIGH" | "MEDIUM" | "LOW" | "NOT_RELEVANT";
export type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type MappingStrength = "DIRECT" | "INFERRED" | "TANGENTIAL" | "NONE";
export type ScraperStatus = "SUCCESS" | "FAILED" | "PARTIAL";

export interface Circular {
  id: string;
  source: Source;
  title: string;
  published_date: string | null;
  url: string | null;
  pdf_storage_path: string | null;
  full_text: string | null;
  guid: string | null;
  created_at: string;
}

export interface Analysis {
  id: string;
  circular_id: string;
  relevance_score: RelevanceScore;
  relevance_reasoning: string | null;
  summary: string | null;
  what_changed: string | null;
  why_it_matters: string | null;
  affected_areas: AffectedArea[] | null;
  prompt_version: string;
  raw_response: string | null;
  created_at: string;
}

export interface AffectedArea {
  area: string;
  team: string;
  impact: string;
}

export interface ActionItem {
  id: string;
  analysis_id: string;
  circular_id: string;
  action: string;
  team: string | null;
  deadline: string | null;
  priority: Priority | null;
  source_reference: string | null;
}

export interface Citation {
  id: string;
  analysis_id: string;
  circular_id: string;
  claim: string | null;
  quoted_text: string | null;
  section: string | null;
  page: string | null;
}

export interface ConceptMapping {
  id: string;
  circular_id: string;
  concept: string | null;
  mapped_domain: string | null;
  mapping_strength: MappingStrength | null;
}

export interface BaselineRule {
  id: string;
  domain: string;
  category: string;
  rule_name: string;
  current_value: string | null;
  governed_by: string | null;
  source_circular: string | null;
  last_updated: string;
  updated_by: string;
}

export interface ReviewStatus {
  id: string;
  circular_id: string;
  reviewed: boolean;
  reviewed_at: string | null;
  baseline_changed: boolean;
  notes: string | null;
}

export interface ScraperLog {
  id: string;
  source: string;
  status: ScraperStatus;
  items_found: number;
  items_processed: number;
  error_message: string | null;
  run_at: string;
}

export interface ScrapedCircular {
  source: Source;
  title: string;
  url: string;
  publishedDate: string;
  guid: string;
  pdfUrl?: string;
}

export interface CircularWithAnalysis extends Circular {
  analyses: Analysis[];
  review_status: ReviewStatus[];
}

export interface LLMAnalysisResponse {
  summary: string;
  why_it_matters: string;
  what_changed: string;
  relevance_reasoning: string;
  affected_areas: AffectedArea[];
  action_items: {
    action: string;
    team: string;
    deadline: string;
    priority: Priority;
    source_reference: string;
  }[];
  citations: {
    claim: string;
    quoted_text: string;
    section: string;
    page: string;
  }[];
  concept_mappings: {
    concept: string;
    mapped_domain: string;
    mapping_strength: MappingStrength;
  }[];
}
