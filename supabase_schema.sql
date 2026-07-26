-- ================================================================
-- PickViet (픽비엣) Supabase Database Schema DDL & RLS Policies (Phase 5.0)
-- Repository: weegoodojb/smart_store
-- Table Prefix: ss_ (ss_products, ss_config, ss_clicks)
-- ================================================================

-- 1. Create ss_products Table
CREATE TABLE IF NOT EXISTS public.ss_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_kr TEXT NOT NULL,
  name_vn TEXT NOT NULL,
  category TEXT NOT NULL,
  coupang_price NUMERIC NOT NULL,
  coupang_link TEXT NOT NULL,
  is_rocket BOOLEAN DEFAULT false,
  naver_price NUMERIC,
  naver_link TEXT,
  naver_point_back NUMERIC DEFAULT 0,
  lowest_price_30days NUMERIC,
  price_history_trend TEXT,
  features_kr TEXT[],
  features_vn TEXT[],
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create ss_config Table (Global App Settings e.g. show_naver_products, mobile_grid_cols)
CREATE TABLE IF NOT EXISTS public.ss_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create ss_clicks Table (Outlink Click Log Tracker)
CREATE TABLE IF NOT EXISTS public.ss_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.ss_products(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS) & Public Policies
ALTER TABLE public.ss_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ss_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ss_clicks ENABLE ROW LEVEL SECURITY;

-- 4.1 ss_products RLS Policies (SELECT, INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Allow public read access on ss_products" ON public.ss_products;
DROP POLICY IF EXISTS "Allow public select access on ss_products" ON public.ss_products;
DROP POLICY IF EXISTS "Allow public insert access on ss_products" ON public.ss_products;
DROP POLICY IF EXISTS "Allow public update access on ss_products" ON public.ss_products;
DROP POLICY IF EXISTS "Allow public delete access on ss_products" ON public.ss_products;

CREATE POLICY "Allow public select access on ss_products" ON public.ss_products FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on ss_products" ON public.ss_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on ss_products" ON public.ss_products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on ss_products" ON public.ss_products FOR DELETE USING (true);

-- 4.2 ss_config RLS Policies
DROP POLICY IF EXISTS "Allow public read access on ss_config" ON public.ss_config;
DROP POLICY IF EXISTS "Allow public select access on ss_config" ON public.ss_config;
DROP POLICY IF EXISTS "Allow public insert access on ss_config" ON public.ss_config;
DROP POLICY IF EXISTS "Allow public update access on ss_config" ON public.ss_config;

CREATE POLICY "Allow public select access on ss_config" ON public.ss_config FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on ss_config" ON public.ss_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on ss_config" ON public.ss_config FOR UPDATE USING (true);

-- 4.3 ss_clicks RLS Policies
DROP POLICY IF EXISTS "Allow public insert access on ss_clicks" ON public.ss_clicks;
CREATE POLICY "Allow public insert access on ss_clicks" ON public.ss_clicks FOR INSERT WITH CHECK (true);

-- 5. Insert Initial Config Defaults
INSERT INTO public.ss_config (key, value)
VALUES ('show_naver_products', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.ss_config (key, value)
VALUES ('mobile_grid_cols', '2'::jsonb)
ON CONFLICT (key) DO NOTHING;
