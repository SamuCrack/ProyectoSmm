-- Create service_updates table to track service changes
CREATE TABLE public.service_updates (
  id BIGSERIAL PRIMARY KEY,
  service_id INTEGER NOT NULL,
  service_name TEXT NOT NULL,
  update_type VARCHAR(50) NOT NULL, -- 'created', 'enabled', 'disabled', 'rate_increased', 'rate_decreased', 'deleted'
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_updates ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view service updates
CREATE POLICY "Authenticated users can view service updates" 
ON public.service_updates 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Admins can manage service updates
CREATE POLICY "Admins can manage service updates" 
ON public.service_updates 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));