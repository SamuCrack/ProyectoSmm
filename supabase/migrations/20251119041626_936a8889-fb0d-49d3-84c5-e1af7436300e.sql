-- Add api_type column to providers table
ALTER TABLE providers
ADD COLUMN IF NOT EXISTS api_type VARCHAR(50) DEFAULT 'generic';

COMMENT ON COLUMN providers.api_type IS 'Tipo de API del proveedor: marketfollowers, generic, etc.';