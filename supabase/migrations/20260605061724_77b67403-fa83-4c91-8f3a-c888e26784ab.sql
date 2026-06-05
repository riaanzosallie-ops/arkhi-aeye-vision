
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;

-- Backfill username for existing rows
UPDATE public.profiles p
SET username = sub.candidate
FROM (
  SELECT id, lower(regexp_replace(split_part(email, '@', 1), '[^A-Za-z0-9_.-]', '', 'g')) || '_' || substr(id::text, 1, 4) AS candidate
  FROM public.profiles
  WHERE username IS NULL
) sub
WHERE p.id = sub.id;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_lower ON public.profiles (lower(username));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_format_chk;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_format_chk
  CHECK (username IS NULL OR (username ~ '^[A-Za-z0-9_.-]{2,32}$'));

-- Update handle_new_user to write username from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_username text;
BEGIN
  v_username := COALESCE(NEW.raw_user_meta_data->>'username',
                         lower(regexp_replace(split_part(NEW.email, '@', 1), '[^A-Za-z0-9_.-]', '', 'g')) || '_' || substr(NEW.id::text, 1, 4));
  INSERT INTO public.profiles (id, email, display_name, username)
  VALUES (NEW.id, NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
          v_username);
  RETURN NEW;
END; $function$;
