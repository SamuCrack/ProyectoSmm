-- Add description column to provider_services_cache table to store service descriptions from provider APIs
ALTER TABLE public.provider_services_cache
ADD COLUMN IF NOT EXISTS description text;