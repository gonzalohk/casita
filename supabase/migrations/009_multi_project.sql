-- ============================================================
-- Migration 009: Allow multiple projects per user
-- Run in Supabase → SQL Editor
-- ============================================================

-- Remove the unique constraint that limited each user to one project
ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_user_id_unique;
