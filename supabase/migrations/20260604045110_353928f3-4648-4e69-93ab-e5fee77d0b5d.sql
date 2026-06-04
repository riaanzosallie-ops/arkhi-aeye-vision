
CREATE TABLE public.arkhi_valuation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid,
  room_name text NOT NULL DEFAULT 'Untitled Space',
  currency text NOT NULL DEFAULT 'AED',
  total_low_estimate numeric NOT NULL DEFAULT 0,
  total_mid_estimate numeric NOT NULL DEFAULT 0,
  total_high_estimate numeric NOT NULL DEFAULT 0,
  detected_item_count integer NOT NULL DEFAULT 0,
  confidence_summary jsonb,
  report_status text NOT NULL DEFAULT 'draft',
  image_paths jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arkhi_valuation_reports TO authenticated;
GRANT ALL ON public.arkhi_valuation_reports TO service_role;
ALTER TABLE public.arkhi_valuation_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own valuation reports" ON public.arkhi_valuation_reports FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.arkhi_valuation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.arkhi_valuation_reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  category text,
  quantity integer NOT NULL DEFAULT 1,
  description text,
  estimated_low_value numeric NOT NULL DEFAULT 0,
  estimated_mid_value numeric NOT NULL DEFAULT 0,
  estimated_high_value numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'AED',
  condition_assumption text,
  confidence_score integer NOT NULL DEFAULT 0,
  image_reference text,
  comparable_replacement_used boolean NOT NULL DEFAULT false,
  replacement_notes text,
  requires_user_review boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arkhi_valuation_items TO authenticated;
GRANT ALL ON public.arkhi_valuation_items TO service_role;
ALTER TABLE public.arkhi_valuation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own valuation items" ON public.arkhi_valuation_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.arkhi_valuation_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.arkhi_valuation_reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_type text NOT NULL,
  export_url text,
  share_token text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arkhi_valuation_exports TO authenticated;
GRANT ALL ON public.arkhi_valuation_exports TO service_role;
ALTER TABLE public.arkhi_valuation_exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own valuation exports" ON public.arkhi_valuation_exports FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_arkhi_valuation_reports_updated_at
BEFORE UPDATE ON public.arkhi_valuation_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
