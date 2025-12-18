-- Create unique index for upsert operations on provider_services_cache
CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_services_cache_provider_service 
ON provider_services_cache(provider_id, service_id);