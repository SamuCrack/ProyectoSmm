-- Create table for client menu configuration
CREATE TABLE public.client_menu_config (
  id SERIAL PRIMARY KEY,
  menu_key VARCHAR NOT NULL UNIQUE,
  label VARCHAR NOT NULL,
  icon_name VARCHAR NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial data with current order
INSERT INTO public.client_menu_config (menu_key, label, icon_name, sort_order, enabled) VALUES
('nueva-orden', 'Nueva Orden', 'ShoppingCart', 0, true),
('agregar-fondos', 'Agregar Fondos', 'CreditCard', 1, true),
('servicios', 'Servicios', 'ShoppingBag', 2, true),
('ordenes', 'Ordenes', 'Package', 3, true),
('api', 'API', 'Code', 4, true),
('afiliados', 'Afiliados', 'Users', 5, true),
('arrendar-panel', 'Arrendar Panel', 'Building', 6, true),
('tickets', 'Tickets', 'Ticket', 7, true),
('actualizaciones', 'Actualizaciones', 'RefreshCw', 8, true),
('blog', 'Blog', 'FileText', 9, true);

-- Enable RLS
ALTER TABLE public.client_menu_config ENABLE ROW LEVEL SECURITY;

-- Admins can manage menu config
CREATE POLICY "Admins can manage menu config" ON public.client_menu_config
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can view menu config
CREATE POLICY "Authenticated users can view menu config" ON public.client_menu_config
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_client_menu_config_updated_at
BEFORE UPDATE ON public.client_menu_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();