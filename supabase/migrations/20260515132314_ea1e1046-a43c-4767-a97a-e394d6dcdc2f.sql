
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Rooms
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  photos INT NOT NULL DEFAULT 0,
  score INT NOT NULL DEFAULT 0,
  last_scanned TEXT DEFAULT '—',
  cover_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own rooms all" ON public.rooms FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'In progress',
  budget TEXT,
  rooms_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own projects all" ON public.projects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Scans (room scan, snap-compare, floor-plan)
CREATE TABLE public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  kind TEXT NOT NULL,
  image_path TEXT,
  secondary_path TEXT,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own scans all" ON public.scans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('room-photos','room-photos',false),
  ('item-photos','item-photos',false),
  ('floor-plans','floor-plans',false);

-- Storage policies: user folder = first path segment must equal user id
CREATE POLICY "own room-photos all" ON storage.objects FOR ALL
  USING (bucket_id = 'room-photos' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'room-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own item-photos all" ON storage.objects FOR ALL
  USING (bucket_id = 'item-photos' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'item-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own floor-plans all" ON storage.objects FOR ALL
  USING (bucket_id = 'floor-plans' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'floor-plans' AND auth.uid()::text = (storage.foldername(name))[1]);
