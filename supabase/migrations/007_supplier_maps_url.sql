-- Migration 007: Add maps_url column to suppliers
-- Stores an optional Google Maps URL for quick navigation to the supplier's location.

alter table public.suppliers
  add column if not exists maps_url text default null;
