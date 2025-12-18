-- Create table for category-user access control
CREATE TABLE public.category_user_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id INTEGER NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(category_id, user_id)
);

-- Enable RLS
ALTER TABLE public.category_user_access ENABLE ROW LEVEL SECURITY;

-- Admins can manage all access rules
CREATE POLICY "Admins can manage category access"
ON public.category_user_access
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own access rules
CREATE POLICY "Users can view their own category access"
ON public.category_user_access
FOR SELECT
USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_category_user_access_category ON public.category_user_access(category_id);
CREATE INDEX idx_category_user_access_user ON public.category_user_access(user_id);