-- Tabla para usuarios pendientes de migración (sin contraseña aún)
CREATE TABLE public.pending_migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  username VARCHAR(50),
  whatsapp VARCHAR(50),
  balance NUMERIC(15,5) NOT NULL DEFAULT 0,
  custom_discount NUMERIC(5,2) DEFAULT 0,
  original_created_at TIMESTAMP WITH TIME ZONE,
  migrated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  claimed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.pending_migrations ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can check if their email exists (for login flow)
CREATE POLICY "Anyone can check pending migrations by email"
ON public.pending_migrations
FOR SELECT
USING (true);

-- Policy: Only admins can insert/update/delete
CREATE POLICY "Admins can manage pending migrations"
ON public.pending_migrations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for faster email lookups
CREATE INDEX idx_pending_migrations_email ON public.pending_migrations(email);