-- Add whatsapp field to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);

-- Add last_auth and last_ip fields for tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_auth TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_ip VARCHAR(45);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp ON public.profiles(whatsapp);

-- Update handle_new_user function to prevent users from being both admin and client
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, balance)
  VALUES (NEW.id, NEW.email, 0.00000);
  
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
$function$;