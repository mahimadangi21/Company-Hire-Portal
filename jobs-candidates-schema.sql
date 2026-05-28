-- =================================================
-- Jobs and Candidates Schemas - Supabase Database
-- Run this in the Supabase SQL Editor
-- =================================================

-- 1. Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  department text NOT NULL,
  status text DEFAULT 'Active' CHECK (status IN ('Active', 'Archived')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create candidates table
CREATE TABLE IF NOT EXISTS public.candidates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  skills text[] DEFAULT '{}'::text[],
  job_applied text,
  resume_status text DEFAULT 'Pending',
  form_status text DEFAULT 'Pending',
  video_status text DEFAULT 'Pending',
  tech_status text DEFAULT 'Pending',
  report_status text DEFAULT 'Not Shared',
  stage text DEFAULT 'Resume Upload',
  resume_score integer,
  video_score integer,
  tech_score integer,
  final_recommendation text DEFAULT 'Under Review',
  extracted_data jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow all for simplicity in the portal prototype)
CREATE POLICY "Allow all operations for jobs" 
  ON public.jobs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for candidates" 
  ON public.candidates FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
