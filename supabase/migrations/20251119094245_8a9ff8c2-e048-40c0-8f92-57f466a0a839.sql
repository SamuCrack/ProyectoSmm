-- Create a security definer function that returns category IDs that have access restrictions
-- This allows any authenticated user to see which categories are restricted
CREATE OR REPLACE FUNCTION public.get_restricted_category_ids()
RETURNS TABLE(category_id integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT category_id
  FROM public.category_user_access
$$;