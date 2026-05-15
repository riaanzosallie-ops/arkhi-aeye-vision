
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS width_m numeric,
  ADD COLUMN IF NOT EXISTS length_m numeric,
  ADD COLUMN IF NOT EXISTS rating jsonb,
  ADD COLUMN IF NOT EXISTS warmth_score integer,
  ADD COLUMN IF NOT EXISTS style_category text,
  ADD COLUMN IF NOT EXISTS analysis text;
