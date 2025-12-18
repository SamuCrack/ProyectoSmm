-- Add username column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username VARCHAR(50);

-- Create unique index on username (allowing nulls for existing users)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique 
ON public.profiles (username) 
WHERE username IS NOT NULL AND username != '';

-- Update handle_new_user trigger to extract username and whatsapp from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, balance, username, whatsapp)
  VALUES (
    NEW.id, 
    NEW.email, 
    0.00000,
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'whatsapp'
  );
  
  -- Only assign admin role to admin2@gmail.com, all others get user role
  IF NEW.email = 'admin2@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- For all others, assign user role only if they don't already have admin role
    INSERT INTO public.user_roles (user_id, role)
    SELECT NEW.id, 'user'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = NEW.id AND role = 'admin'
    );
  END IF;
  
  RETURN NEW;
END;
$$;