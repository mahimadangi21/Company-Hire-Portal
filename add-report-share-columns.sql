-- =================================================
-- Migration: Add report share token columns to candidates table
-- Run this in the Supabase SQL Editor
-- =================================================

ALTER TABLE public.candidates 
  ADD COLUMN IF NOT EXISTS report_share_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS report_share_expires_at timestamp with time zone;

-- Create an index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_candidates_report_share_token 
  ON public.candidates(report_share_token) 
  WHERE report_share_token IS NOT NULL;
