-- ================================================================
-- Smart Store (Coupang & Naver Dual Affiliate) Supabase DDL Schema
-- Repository: smart_store (weegoodojb)
-- Prefix: ss_ (All tables prefixed with ss_ to prevent collisions)
-- ================================================================

-- 1. Create ss_products Table
CREATE TABLE IF NOT EXISTS public.ss_products (
  id TEXT PRIMARY KEY,
  name_kr TEXT NOT NULL,
  name_vn TEXT NOT NULL,
  category TEXT NOT NULL,
  coupang_price NUMERIC NOT NULL,
  coupang_link TEXT NOT NULL,
  is_rocket BOOLEAN DEFAULT TRUE,
  naver_price NUMERIC,
  naver_link TEXT,
  naver_point_back NUMERIC DEFAULT 0,
  original_price NUMERIC,
  discount_rate NUMERIC,
  lowest_price_30days NUMERIC NOT NULL,
  price_history_trend TEXT,
  image_url TEXT NOT NULL,
  badge TEXT,
  rating NUMERIC DEFAULT 4.9,
  review_count NUMERIC DEFAULT 1000,
  features_kr TEXT[] NOT NULL,
  features_vn TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create ss_config Table (Global App Settings e.g. show_naver_products)
CREATE TABLE IF NOT EXISTS public.ss_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create ss_clicks Table (Outlink Click Tracker Logs)
CREATE TABLE IF NOT EXISTS public.ss_clicks (
  id BIGSERIAL PRIMARY KEY,
  product_id TEXT REFERENCES public.ss_products(id) ON DELETE SET NULL,
  platform TEXT NOT NULL, -- 'coupang' or 'naver'
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) & Public Read Access
ALTER TABLE public.ss_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ss_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ss_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on ss_products" ON public.ss_products FOR SELECT USING (true);
CREATE POLICY "Allow public read access on ss_config" ON public.ss_config FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on ss_clicks" ON public.ss_clicks FOR INSERT WITH CHECK (true);

-- Insert Default Config
INSERT INTO public.ss_config (key, value)
VALUES ('show_naver_products', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Sample Seed Data for ss_products
INSERT INTO public.ss_products (
  id, name_kr, name_vn, category, coupang_price, coupang_link, is_rocket,
  naver_price, naver_link, naver_point_back, original_price, discount_rate,
  lowest_price_30days, price_history_trend, image_url, badge, rating, review_count,
  features_kr, features_vn
) VALUES
(
  'prod-1',
  '비비고 베트남 쌀국수 & 칠리소스 기획 세트',
  'Bộ gia vị Phở & Nước tương ớt Bibigo (Kèm sốt)',
  '🇻🇳 베트남 식자재/생필품',
  18900, 'https://link.coupang.com/a/example_pho_set', true,
  17900, 'https://smartstore.naver.com/example/products/pho_set', 500,
  24000, 21, 17500, '🔥 지난달 대비 21% 할인 (네이버 최저가)',
  'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80',
  '베트남 인기 1위', 4.9, 3240,
  ARRAY['현지 스타일 진한 육수', '칠리소스 포함', '5분 간편 조리', '로켓배송 가능'],
  ARRAY['Hương vị phở chuẩn vị', 'Kèm nước tương ớt', 'Nấu nhanh 5 phút', 'Giao hỏa tốc']
),
(
  'prod-2',
  '정관장 홍삼정 에브리타임 뗏(Tết) 명절 선물세트',
  'Hộp quà Tết Hồng sâm Cheong Kwan Jang Everytime',
  '🎁 기념일/뗏(Tết) 선물',
  92000, 'https://link.coupang.com/a/example_redginseng', true,
  95000, 'https://smartstore.naver.com/example/products/redginseng', 2800,
  102000, 10, 91500, '🔥 지난달 대비 10% 할인 (쿠팡 로켓 최저가)',
  'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80',
  '🎁 Tết 선물 추천', 4.9, 12450,
  ARRAY['100% 6년근 홍삼농축액', '스틱형 파우치', '고급 선물 포장', '쇼핑백 증정'],
  ARRAY['100% Hồng sâm 6 năm', 'Gói nước tiện lợi', 'Đóng hộp sang trọng', 'Tặng túi quà biếu']
) ON CONFLICT (id) DO NOTHING;
