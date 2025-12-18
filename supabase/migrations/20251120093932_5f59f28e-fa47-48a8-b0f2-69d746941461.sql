-- Fix 1: Add INSERT policy to logs table for better audit trails
CREATE POLICY "Users can insert their own logs" 
ON public.logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Fix 2: Remove unused api_token field from profiles table
ALTER TABLE public.profiles DROP COLUMN api_token;

-- Fix 3: Enable leaked password protection
-- This is configured via Supabase Auth settings