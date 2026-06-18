/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

// Retrieve keys from environment variables or custom local storage connection
export const getSupabaseConfig = () => {
  const url = (import.meta as any).env?.VITE_SUPABASE_URL || localStorage.getItem('BASELAB_SUPABASE_URL') || '';
  const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || localStorage.getItem('BASELAB_SUPABASE_ANON_KEY') || '';
  return { url, anonKey };
};

const { url, anonKey } = getSupabaseConfig();

// Initialize client if credential elements are provided. If blank, we fall back gracefully to localStorage state syncing.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

// Handy database SQL setup code that users can copy to create tables in Supabase SQL editor:
export const SUPABASE_SQL_SETUP = `-- Copy and paste this SQL into the Supabase SQL Editor to create the tables:

-- 1. Create table for user settings
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  modal_awal NUMERIC DEFAULT 10000000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_settings UNIQUE(user_id)
);

-- Establish Row Level Security (RLS)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Create table for expenses
CREATE TABLE IF NOT EXISTS operating_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  biaya_event NUMERIC DEFAULT 0,
  biaya_transportasi NUMERIC DEFAULT 0,
  detail_perlengkapan JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE operating_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own expenses" ON operating_expenses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Create table for consumables
CREATE TABLE IF NOT EXISTS consumable_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  stok NUMERIC DEFAULT 0,
  harga_beli_unit NUMERIC DEFAULT 0,
  min_stok NUMERIC DEFAULT 3,
  kategori TEXT DEFAULT 'sekali_pakai',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE consumable_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own consumables" ON consumable_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Create table for filaments
CREATE TABLE IF NOT EXISTS filament_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  stok NUMERIC DEFAULT 0,
  harga_beli_grams NUMERIC DEFAULT 0,
  min_stok NUMERIC DEFAULT 100,
  kategori TEXT DEFAULT 'bahan_baku',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE filament_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own filaments" ON filament_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Create table for product items
CREATE TABLE IF NOT EXISTS product_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  foto TEXT,
  sku TEXT NOT NULL,
  stok NUMERIC DEFAULT 0,
  hpp NUMERIC DEFAULT 0,
  harga_jual NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own products" ON product_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. Create table for sale transactions
CREATE TABLE IF NOT EXISTS sales_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  invoice_pelanggan TEXT NOT NULL,
  item_id UUID NOT NULL,
  qty NUMERIC DEFAULT 1,
  harga_jual NUMERIC DEFAULT 0,
  bahan_packing_id UUID,
  bahan_packing_qty NUMERIC DEFAULT 0,
  bahan_packing_items JSONB DEFAULT '[]'::jsonb,
  bahan_baku_id UUID,
  bahan_baku_qty_grams NUMERIC DEFAULT 0,
  bahan_baku_items JSONB DEFAULT '[]'::jsonb,
  biaya_operasional_luar NUMERIC DEFAULT 0,
  platform_name TEXT NOT NULL,
  platform_fee_type TEXT NOT NULL,
  platform_fee_value NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'lunas',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own sales" ON sales_transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Run these migrations as well when sales_transactions already exists.
ALTER TABLE sales_transactions
  ADD COLUMN IF NOT EXISTS bahan_packing_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sales_transactions
  ADD COLUMN IF NOT EXISTS bahan_baku_items JSONB DEFAULT '[]'::jsonb;
`;
