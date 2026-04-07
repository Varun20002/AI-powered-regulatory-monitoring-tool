-- RegMonitor Database Schema
-- Run this in Supabase SQL Editor to set up all tables

CREATE TABLE IF NOT EXISTS circulars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('IFSCA','RBI','SEBI','MCA','FATF','CUSTOM')),
  title text NOT NULL,
  published_date timestamptz,
  url text,
  pdf_storage_path text,
  full_text text,
  guid text UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circular_id uuid NOT NULL REFERENCES circulars(id) ON DELETE CASCADE,
  relevance_score text NOT NULL CHECK (relevance_score IN ('HIGH','MEDIUM','LOW','NOT_RELEVANT')),
  relevance_reasoning text,
  summary text,
  what_changed text,
  why_it_matters text,
  affected_areas jsonb,
  prompt_version text DEFAULT 'v1.0',
  raw_response text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  circular_id uuid NOT NULL REFERENCES circulars(id) ON DELETE CASCADE,
  action text NOT NULL,
  team text,
  deadline text,
  priority text CHECK (priority IN ('CRITICAL','HIGH','MEDIUM','LOW')),
  source_reference text
);

CREATE TABLE IF NOT EXISTS citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  circular_id uuid NOT NULL REFERENCES circulars(id) ON DELETE CASCADE,
  claim text,
  quoted_text text,
  section text,
  page text
);

CREATE TABLE IF NOT EXISTS concept_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circular_id uuid NOT NULL REFERENCES circulars(id) ON DELETE CASCADE,
  concept text,
  mapped_domain text,
  mapping_strength text CHECK (mapping_strength IN ('DIRECT','INFERRED','TANGENTIAL','NONE'))
);

CREATE TABLE IF NOT EXISTS baseline_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  category text NOT NULL,
  rule_name text NOT NULL,
  current_value text,
  governed_by text,
  source_circular text,
  last_updated timestamptz DEFAULT now(),
  updated_by text DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS review_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circular_id uuid UNIQUE NOT NULL REFERENCES circulars(id) ON DELETE CASCADE,
  reviewed boolean DEFAULT false,
  reviewed_at timestamptz,
  baseline_changed boolean DEFAULT false,
  notes text
);

CREATE TABLE IF NOT EXISTS scraper_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  status text NOT NULL CHECK (status IN ('SUCCESS','FAILED','PARTIAL')),
  items_found integer DEFAULT 0,
  items_processed integer DEFAULT 0,
  error_message text,
  run_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_circulars_source ON circulars(source);
CREATE INDEX IF NOT EXISTS idx_circulars_published_date ON circulars(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_circular_id ON analyses(circular_id);
CREATE INDEX IF NOT EXISTS idx_analyses_relevance ON analyses(relevance_score);
CREATE INDEX IF NOT EXISTS idx_action_items_analysis ON action_items(analysis_id);
CREATE INDEX IF NOT EXISTS idx_action_items_circular ON action_items(circular_id);
CREATE INDEX IF NOT EXISTS idx_citations_analysis ON citations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_concept_mappings_circular ON concept_mappings(circular_id);
CREATE INDEX IF NOT EXISTS idx_review_status_circular ON review_status(circular_id);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_source ON scraper_logs(source);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_run_at ON scraper_logs(run_at DESC);

-- RLS Policies
ALTER TABLE circulars ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE baseline_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on circulars" ON circulars FOR SELECT USING (true);
CREATE POLICY "Allow public insert on circulars" ON circulars FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on circulars" ON circulars FOR UPDATE USING (true);

CREATE POLICY "Allow public read on analyses" ON analyses FOR SELECT USING (true);
CREATE POLICY "Allow public insert on analyses" ON analyses FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on action_items" ON action_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on action_items" ON action_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on citations" ON citations FOR SELECT USING (true);
CREATE POLICY "Allow public insert on citations" ON citations FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on concept_mappings" ON concept_mappings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on concept_mappings" ON concept_mappings FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on baseline_rules" ON baseline_rules FOR SELECT USING (true);
CREATE POLICY "Allow public insert on baseline_rules" ON baseline_rules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on baseline_rules" ON baseline_rules FOR UPDATE USING (true);

CREATE POLICY "Allow public read on review_status" ON review_status FOR SELECT USING (true);
CREATE POLICY "Allow public insert on review_status" ON review_status FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on review_status" ON review_status FOR UPDATE USING (true);

CREATE POLICY "Allow public read on scraper_logs" ON scraper_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on scraper_logs" ON scraper_logs FOR INSERT WITH CHECK (true);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('circular-pdfs', 'circular-pdfs', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read on storage" ON storage.objects FOR SELECT USING (bucket_id = 'circular-pdfs');
CREATE POLICY "Allow public insert on storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'circular-pdfs');
