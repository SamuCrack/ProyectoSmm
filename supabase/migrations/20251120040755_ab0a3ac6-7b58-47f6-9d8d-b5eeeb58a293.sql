-- Create refills table to track refill requests
CREATE TABLE IF NOT EXISTS public.refills (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  provider_id INTEGER NOT NULL REFERENCES public.providers(id),
  service_id INTEGER NOT NULL REFERENCES public.services(id),
  external_refill_id TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  link TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  start_count INTEGER,
  current_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.refills ENABLE ROW LEVEL SECURITY;

-- Admins can view all refills
CREATE POLICY "Admins can view all refills"
ON public.refills
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage all refills
CREATE POLICY "Admins can manage all refills"
ON public.refills
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own refills
CREATE POLICY "Users can view their own refills"
ON public.refills
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own refills
CREATE POLICY "Users can create their own refills"
ON public.refills
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_refills_updated_at
BEFORE UPDATE ON public.refills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_refills_user_id ON public.refills(user_id);
CREATE INDEX idx_refills_order_id ON public.refills(order_id);
CREATE INDEX idx_refills_status ON public.refills(status);