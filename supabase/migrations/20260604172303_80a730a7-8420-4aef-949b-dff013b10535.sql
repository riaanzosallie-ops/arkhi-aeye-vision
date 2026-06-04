-- AI usage logging
CREATE TABLE IF NOT EXISTS public.arkhi_ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  kind text,
  duration_ms integer,
  success boolean,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.arkhi_ai_usage TO authenticated;
GRANT INSERT ON public.arkhi_ai_usage TO anon;
GRANT ALL ON public.arkhi_ai_usage TO service_role;
ALTER TABLE public.arkhi_ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads all ai_usage" ON public.arkhi_ai_usage FOR SELECT
  USING ((auth.jwt() ->> 'email') = 'riaanzosallie@gmail.com');
CREATE POLICY "Users insert own ai_usage" ON public.arkhi_ai_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Page view logging
CREATE TABLE IF NOT EXISTS public.arkhi_page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page text,
  user_id uuid,
  session_id text,
  device_type text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.arkhi_page_views TO authenticated;
GRANT INSERT ON public.arkhi_page_views TO anon;
GRANT ALL ON public.arkhi_page_views TO service_role;
ALTER TABLE public.arkhi_page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads all page_views" ON public.arkhi_page_views FOR SELECT
  USING ((auth.jwt() ->> 'email') = 'riaanzosallie@gmail.com');
CREATE POLICY "Anyone inserts page_views" ON public.arkhi_page_views FOR INSERT
  WITH CHECK (true);

-- Owner-editable business metrics
CREATE TABLE IF NOT EXISTS public.arkhi_business_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key text UNIQUE NOT NULL,
  metric_label text,
  metric_value text,
  metric_unit text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.arkhi_business_metrics TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arkhi_business_metrics TO authenticated;
GRANT ALL ON public.arkhi_business_metrics TO service_role;
ALTER TABLE public.arkhi_business_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read business_metrics" ON public.arkhi_business_metrics FOR SELECT
  USING (true);
CREATE POLICY "Owner writes business_metrics" ON public.arkhi_business_metrics FOR ALL
  USING ((auth.jwt() ->> 'email') = 'riaanzosallie@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'riaanzosallie@gmail.com');

CREATE TRIGGER update_arkhi_business_metrics_updated_at
  BEFORE UPDATE ON public.arkhi_business_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();