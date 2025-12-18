-- Add deleted_at column for soft delete functionality
ALTER TABLE public.services ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for efficient filtering of non-deleted services
CREATE INDEX idx_services_deleted_at ON public.services(deleted_at) WHERE deleted_at IS NULL;