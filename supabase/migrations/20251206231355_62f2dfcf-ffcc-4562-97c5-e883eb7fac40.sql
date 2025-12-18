-- Create tutorial_videos table
CREATE TABLE public.tutorial_videos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  video_url VARCHAR(500) NOT NULL,
  platform VARCHAR(20) NOT NULL DEFAULT 'youtube',
  sort_order INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tutorial_videos ENABLE ROW LEVEL SECURITY;

-- Allow public read for enabled videos
CREATE POLICY "Anyone can view enabled tutorials" 
ON public.tutorial_videos 
FOR SELECT 
USING (enabled = true OR has_role(auth.uid(), 'admin'::app_role));

-- Allow admin full access
CREATE POLICY "Admins can manage tutorials" 
ON public.tutorial_videos 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_tutorial_videos_updated_at
BEFORE UPDATE ON public.tutorial_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add "Tutoriales" to client menu (after Blog which typically has sort_order around 9)
INSERT INTO public.client_menu_config (menu_key, label, icon_name, sort_order, enabled)
VALUES ('tutoriales', 'Tutoriales', 'Video', 10, true);