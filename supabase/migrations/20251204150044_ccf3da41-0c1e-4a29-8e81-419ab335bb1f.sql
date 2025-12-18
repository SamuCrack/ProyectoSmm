-- Create storage bucket for appearance images
INSERT INTO storage.buckets (id, name, public)
VALUES ('appearance', 'appearance', true);

-- Create policies for appearance bucket
CREATE POLICY "Anyone can view appearance images"
ON storage.objects FOR SELECT
USING (bucket_id = 'appearance');

CREATE POLICY "Admins can upload appearance images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'appearance' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update appearance images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'appearance' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete appearance images"
ON storage.objects FOR DELETE
USING (bucket_id = 'appearance' AND has_role(auth.uid(), 'admin'::app_role));

-- Create table for appearance configuration
CREATE TABLE public.appearance_config (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR NOT NULL UNIQUE,
  config_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default values for payment images
INSERT INTO public.appearance_config (config_key, config_value) VALUES
('yape_qr_image', NULL),
('plin_qr_image', NULL),
('binance_qr_image', NULL),
('recargas_info_image', NULL);

-- Enable RLS
ALTER TABLE public.appearance_config ENABLE ROW LEVEL SECURITY;

-- Admins can manage appearance config
CREATE POLICY "Admins can manage appearance config"
ON public.appearance_config FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone authenticated can view appearance config
CREATE POLICY "Authenticated users can view appearance config"
ON public.appearance_config FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_appearance_config_updated_at
BEFORE UPDATE ON public.appearance_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();