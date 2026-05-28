-- Migration: Add status column to jobs table
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS status text DEFAULT 'Active';
