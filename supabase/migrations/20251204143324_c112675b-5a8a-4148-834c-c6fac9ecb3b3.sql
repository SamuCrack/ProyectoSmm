-- Add cancel_requested_at column to track when cancellation was requested
ALTER TABLE public.orders ADD COLUMN cancel_requested_at timestamptz DEFAULT NULL;