-- ========================================================
-- AS İNŞAAT YAPSAT KONUT SATIŞ SİSTEMİ
-- SUPABASE VERİTABANI KURULUM ŞEMASI (SQL MIGRATION)
-- ========================================================
-- Bu kodu Supabase Dashboard -> SQL Editor kısmına yapıştırıp "Run" butonuna basınız.

-- 1. Satış Kayıtları Tablosu
CREATE TABLE IF NOT EXISTS public.yapsat_sales (
    id TEXT PRIMARY KEY,
    apt_no TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT,
    date TEXT,
    sale_price_k BIGINT NOT NULL,
    payment_type TEXT NOT NULL,
    down_payment_k BIGINT DEFAULT 0,
    installment_monthly_k BIGINT DEFAULT 0,
    installment_count INT DEFAULT 0,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sistem Ayarları Tablosu (Baz Fiyatlar)
CREATE TABLE IF NOT EXISTS public.yapsat_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Varsayılan Baz Fiyatları Ekleyelim (Eğer yoksa)
INSERT INTO public.yapsat_settings (key, value)
VALUES ('base_prices', '{"2+1": 6000000, "3+1": 8500000}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 3. Row Level Security (RLS) ve Anonim Erişim İzinleri
ALTER TABLE public.yapsat_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yapsat_settings ENABLE ROW LEVEL SECURITY;

-- Anonim Okuma/Yazma Politikaları (Teklif ve Satış Sistemi İçin)
CREATE POLICY "Public Read/Write Sales"
ON public.yapsat_sales
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Public Read/Write Settings"
ON public.yapsat_settings
FOR ALL
USING (true)
WITH CHECK (true);

-- 4. Realtime (Canlı Değişiklik Yayını) Etkinleştirme
ALTER PUBLICATION supabase_realtime ADD TABLE public.yapsat_sales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.yapsat_settings;
