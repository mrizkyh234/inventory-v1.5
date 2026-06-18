/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PeriodType = 'hari' | 'bulan' | 'tahun';

export interface ConsumableItem {
  id: string;
  nama: string;
  stok: number; // in pcs / units
  hargaBeliUnit: number;
  minStok: number; // limit for color alerts: 1-2 red, 3-5 yellow, >= 6 green
  kategori: 'sekali_pakai'; // packaging wrap, boxes, etc.
  created_at?: string;
  user_id?: string;
}

export interface FilamentItem {
  id: string;
  nama: string;
  stok: number; // in unit/grams
  hargaBeliGrams: number; // price per gram
  minStok: number; // limit for color alerts
  kategori: 'bahan_baku'; // filament
  created_at?: string;
  user_id?: string;
}

export interface ProductItem {
  id: string;
  foto: string; // Base64 or URL
  sku: string; // SKU or Name
  stok: number;
  hpp: number; // cost price (bahan baku + packing)
  hargaJual: number;
  created_at?: string;
  user_id?: string;
}

export interface OperatingExpense {
  id: string;
  tanggal: string; // YYYY-MM-DD
  biayaEvent: number;
  biayaTransportasi: number;
  detailPerlengkapan: { nama: string; qty: number; harga?: number }[]; // array of consumable items bought
  created_at?: string;
  user_id?: string;
}

export interface MaterialUsage {
  itemId: string;
  qty: number;
}

export interface SaleTransaction {
  id: string;
  tanggal: string; // YYYY-MM-DD
  invoicePelanggan: string; // Invoice Code or Customer Name
  itemId: string; // reference to ProductItem
  qty: number;
  hargaJual: number; // price per item sold in this txn
  bahanPackingId: string; // optional: reference to ConsumableItem used for packaging
  bahanPackingQty: number;
  bahanBakuId: string; // optional: reference to FilamentItem used
  bahanBakuQtyGrams: number;
  bahanPackingItems?: MaterialUsage[]; // supports multiple packaging materials
  bahanBakuItems?: MaterialUsage[]; // supports multiple filament materials
  biayaOperasionalLuar: number; // kurir, tips to courier etc.
  platformName: string; // e.g., Shopee, Tokopedia, Custom
  platformFeeType: 'rupiah' | 'persen';
  platformFeeValue: number; // in IDR or %
  status: 'lunas' | 'pending';
  created_at?: string;
  user_id?: string;
}

export interface UserSettings {
  id: string;
  modalAwal: number;
  created_at?: string;
  user_id?: string;
}
