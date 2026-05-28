-- Migration: Add jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  department text,
  sub_department text,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  status text DEFAULT 'Active'
);

-- Enable Row Level Security
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Ensure policy is idempotent
DROP POLICY IF EXISTS "Admins have full access to jobs" ON public.jobs;
CREATE POLICY "Admins have full access to jobs"
  ON public.jobs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
