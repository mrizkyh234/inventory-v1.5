-- Baselab Inventory System - Supabase schema
-- Copy this entire file into Supabase SQL Editor and click Run.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  modal_awal NUMERIC NOT NULL DEFAULT 10000000 CHECK (modal_awal >= 0),
  profile_name TEXT NOT NULL DEFAULT 'Operator Baselab',
  profile_image TEXT NOT NULL DEFAULT '',
  login_logo TEXT NOT NULL DEFAULT '',
  login_header TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_settings UNIQUE(user_id)
);

ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS profile_name TEXT NOT NULL DEFAULT 'Operator Baselab';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS profile_image TEXT NOT NULL DEFAULT '';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS login_logo TEXT NOT NULL DEFAULT '';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS login_header TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS operating_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  biaya_event NUMERIC NOT NULL DEFAULT 0 CHECK (biaya_event >= 0),
  biaya_transportasi NUMERIC NOT NULL DEFAULT 0 CHECK (biaya_transportasi >= 0),
  detail_perlengkapan JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(detail_perlengkapan) = 'array'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consumable_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  stok NUMERIC NOT NULL DEFAULT 0 CHECK (stok >= 0),
  harga_beli_unit NUMERIC NOT NULL DEFAULT 0 CHECK (harga_beli_unit >= 0),
  min_stok NUMERIC NOT NULL DEFAULT 3 CHECK (min_stok >= 0),
  kategori TEXT NOT NULL DEFAULT 'sekali_pakai',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS filament_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  stok NUMERIC NOT NULL DEFAULT 0 CHECK (stok >= 0),
  harga_beli_grams NUMERIC NOT NULL DEFAULT 0 CHECK (harga_beli_grams >= 0),
  min_stok NUMERIC NOT NULL DEFAULT 100 CHECK (min_stok >= 0),
  kategori TEXT NOT NULL DEFAULT 'bahan_baku',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  foto TEXT,
  sku TEXT NOT NULL,
  stok NUMERIC NOT NULL DEFAULT 0 CHECK (stok >= 0),
  hpp NUMERIC NOT NULL DEFAULT 0 CHECK (hpp >= 0),
  harga_jual NUMERIC NOT NULL DEFAULT 0 CHECK (harga_jual >= 0),
  bahan_baku_items JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(bahan_baku_items) = 'array'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  invoice_pelanggan TEXT NOT NULL,
  item_id UUID NOT NULL,
  qty NUMERIC NOT NULL DEFAULT 1 CHECK (qty > 0),
  harga_jual NUMERIC NOT NULL DEFAULT 0 CHECK (harga_jual >= 0),
  bahan_packing_id UUID,
  bahan_packing_qty NUMERIC NOT NULL DEFAULT 0 CHECK (bahan_packing_qty >= 0),
  bahan_packing_items JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(bahan_packing_items) = 'array'),
  bahan_baku_id UUID,
  bahan_baku_qty_grams NUMERIC NOT NULL DEFAULT 0 CHECK (bahan_baku_qty_grams >= 0),
  bahan_baku_items JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(bahan_baku_items) = 'array'),
  biaya_operasional_luar NUMERIC NOT NULL DEFAULT 0 CHECK (biaya_operasional_luar >= 0),
  platform_name TEXT NOT NULL DEFAULT 'Direct',
  platform_fee_type TEXT NOT NULL DEFAULT 'rupiah' CHECK (platform_fee_type IN ('rupiah', 'persen')),
  platform_fee_value NUMERIC NOT NULL DEFAULT 0 CHECK (platform_fee_value >= 0),
  status TEXT NOT NULL DEFAULT 'lunas' CHECK (status IN ('lunas', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_items ADD COLUMN IF NOT EXISTS bahan_baku_items JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS bahan_packing_items JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS bahan_baku_items JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_operating_expenses_user_date ON operating_expenses(user_id, tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_user_date ON sales_transactions(user_id, tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_consumable_items_user ON consumable_items(user_id);
CREATE INDEX IF NOT EXISTS idx_filament_items_user ON filament_items(user_id);
CREATE INDEX IF NOT EXISTS idx_product_items_user ON product_items(user_id);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE operating_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumable_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE filament_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own settings" ON user_settings;
CREATE POLICY "Users can manage their own settings" ON user_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own expenses" ON operating_expenses;
CREATE POLICY "Users can manage their own expenses" ON operating_expenses FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own consumables" ON consumable_items;
CREATE POLICY "Users can manage their own consumables" ON consumable_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own filaments" ON filament_items;
CREATE POLICY "Users can manage their own filaments" ON filament_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own products" ON product_items;
CREATE POLICY "Users can manage their own products" ON product_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own sales" ON sales_transactions;
CREATE POLICY "Users can manage their own sales" ON sales_transactions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON
  user_settings,
  operating_expenses,
  consumable_items,
  filament_items,
  product_items,
  sales_transactions
TO authenticated;
