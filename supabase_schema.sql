-- ================================================================
-- PickViet (픽비엣) Supabase Database Schema DDL & Seed Data (Phase 5.0)
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

-- 2. Create ss_config Table (Global App Settings e.g. show_naver_products)
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

CREATE POLICY "Allow public read access on ss_products" ON public.ss_products FOR SELECT USING (true);
CREATE POLICY "Allow public read access on ss_config" ON public.ss_config FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on ss_clicks" ON public.ss_clicks FOR INSERT WITH CHECK (true);

-- 5. Insert Initial Config
INSERT INTO public.ss_config (key, value)
VALUES ('show_naver_products', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 6. Insert Initial Seed Sample Data (PickViet G7 Coffee)
INSERT INTO public.ss_products (
  name_kr, name_vn, category, 
  coupang_price, coupang_link, is_rocket, 
  naver_price, naver_link, naver_point_back, 
  lowest_price_30days, price_history_trend, 
  features_kr, features_vn, image_url
) VALUES (
  'G7 블랙 커피 200g (100포)', 
  'Cà phê đen G7 Gu mạnh (100 gói)', 
  '식자재',
  12500, 'https://link.coupang.com/a/fG7gl6twuO', true,
  12100, 'https://search.shopping.naver.com', 360,
  12500, 'lowest',
  ARRAY['무료배송', '베트남 진한 원두', '당일발송'],
  ARRAY['Miễn phí vận chuyển', 'Hương vị đậm đà', 'Giao hàng trong ngày'],
  'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400'
);
