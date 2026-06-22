/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  ShoppingBag, 
  TrendingUp, 
  DollarSign, 
  Truck, 
  Percent, 
  Info,
  Clock,
  Layers,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { 
  ProductItem, 
  ConsumableItem, 
  SaleTransaction,
  MaterialUsage
} from '../types';
import { formatIDR, getPlatformFeeAmount } from '../utils';

interface SalesTabProps {
  sales: SaleTransaction[];
  products: ProductItem[];
  consumables: ConsumableItem[];
  onAddSale: (sale: Omit<SaleTransaction, 'id'>) => void;
  onUpdateSale: (id: string, sale: Omit<SaleTransaction, 'id'>) => void;
  onDeleteSale: (id: string) => void;
}

export default function SalesTab({
  sales,
  products,
  consumables,
  onAddSale,
  onUpdateSale,
  onDeleteSale,
}: SalesTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [invoicePelanggan, setInvoicePelanggan] = useState('');
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('1');
  const [hargaJual, setHargaJual] = useState('0');
  const [hargaJualManual, setHargaJualManual] = useState(false);
  
  // Fulfillment components
  const [bahanPackingItems, setBahanPackingItems] = useState<{ itemId: string; qty: string }[]>([
    { itemId: '', qty: '0' }
  ]);

  // External logistics & platforms
  const [biayaOperasionalLuar, setBiayaOperasionalLuar] = useState('0');
  const [platformName, setPlatformName] = useState('Shopee');
  const [platformFeeType, setPlatformFeeType] = useState<'rupiah' | 'persen'>('persen');
  const [platformFeeValue, setPlatformFeeValue] = useState('0');
  const [status, setStatus] = useState<'lunas' | 'pending'>('lunas');

  const selectedProduct = products.find(p => p.id === itemId);
  const qtyVal = parseInt(qty) || 0;
  const hppUnit = selectedProduct?.hpp || 0;
  const normalizedPackingItems: MaterialUsage[] = bahanPackingItems
    .filter(item => item.itemId && parseFloat(item.qty) > 0)
    .map(item => ({ itemId: item.itemId, qty: parseFloat(item.qty) }));
  const packingTotalCost = normalizedPackingItems.reduce((total, item) => {
    const packing = consumables.find(c => c.id === item.itemId);
    return total + ((packing?.hargaBeliUnit || 0) * item.qty);
  }, 0);
  const extraCost = parseFloat(biayaOperasionalLuar) || 0;
  const platformValue = parseFloat(platformFeeValue) || 0;
  const baseCostTotal = (hppUnit * qtyVal) + packingTotalCost + extraCost;
  const suggestedTotalPrice = platformFeeType === 'persen'
    ? baseCostTotal / Math.max(0.01, 1 - (platformValue / 100))
    : baseCostTotal + platformValue;
  const suggestedHargaJualUnit = qtyVal > 0 ? suggestedTotalPrice / qtyVal : 0;

  useEffect(() => {
    if (!editingId && !hargaJualManual) {
      setHargaJual(Math.ceil(suggestedHargaJualUnit).toString());
    }
  }, [editingId, hargaJualManual, suggestedHargaJualUnit]);

  const resetForm = () => {
    setTanggal(new Date().toISOString().split('T')[0]);
    setInvoicePelanggan('');
    setItemId('');
    setQty('1');
    setHargaJual('0');
    setHargaJualManual(false);
    setBahanPackingItems([{ itemId: '', qty: '0' }]);
    setBiayaOperasionalLuar('0');
    setPlatformName('Shopee');
    setPlatformFeeType('persen');
    setPlatformFeeValue('0');
    setStatus('lunas');
    setEditingId(null);
    setShowForm(false);
  };

  const handleEditClick = (sale: SaleTransaction) => {
    setEditingId(sale.id);
    setTanggal(sale.tanggal);
    setInvoicePelanggan(sale.invoicePelanggan);
    setItemId(sale.itemId);
    setQty(sale.qty.toString());
    setHargaJual(sale.hargaJual.toString());
    setHargaJualManual(true);
    const packingItems = sale.bahanPackingItems?.length
      ? sale.bahanPackingItems
      : sale.bahanPackingId
        ? [{ itemId: sale.bahanPackingId, qty: sale.bahanPackingQty || 0 }]
        : [];
    setBahanPackingItems(packingItems.length ? packingItems.map(item => ({ itemId: item.itemId, qty: item.qty.toString() })) : [{ itemId: '', qty: '0' }]);
    setBiayaOperasionalLuar((sale.biayaOperasionalLuar || 0).toString());
    setPlatformName(sale.platformName);
    setPlatformFeeType(sale.platformFeeType);
    setPlatformFeeValue(sale.platformFeeValue.toString());
    setStatus(sale.status);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemId) {
      alert('Mohon pilih produk yang terjual');
      return;
    }

    const qtyVal = parseInt(qty);
    const hargaVal = parseFloat(hargaJual);
    const extraExp = parseFloat(biayaOperasionalLuar);
    const feeVal = parseFloat(platformFeeValue);

    if (
      isNaN(qtyVal) || qtyVal <= 0 ||
      isNaN(hargaVal) ||
      isNaN(extraExp) ||
      isNaN(feeVal)
    ) {
      alert('Mohon periksa kembali input angka Anda. Kuantitas harus valid.');
      return;
    }

    const payload: Omit<SaleTransaction, 'id'> = {
      tanggal,
      invoicePelanggan: invoicePelanggan.trim() || 'Pelanggan Umum',
      itemId,
      qty: qtyVal,
      hargaJual: hargaVal,
      bahanPackingId: normalizedPackingItems[0]?.itemId || '',
      bahanPackingQty: normalizedPackingItems[0]?.qty || 0,
      bahanBakuId: '',
      bahanBakuQtyGrams: 0,
      bahanPackingItems: normalizedPackingItems,
      bahanBakuItems: [],
      biayaOperasionalLuar: extraExp,
      platformName,
      platformFeeType,
      platformFeeValue: feeVal,
      status,
    };

    if (editingId) {
      onUpdateSale(editingId, payload);
    } else {
      // Alert potential packaging/filament issues
      if (selectedProduct && selectedProduct.stok < qtyVal) {
        if (!confirm(`Perhatian: Stok produk '${selectedProduct.sku}' hanya ${selectedProduct.stok} pcs (pesanan: ${qtyVal} pcs). Tetap lanjutkan?`)) {
          return;
        }
      }
      onAddSale(payload);
    }

    resetForm();
  };

  // Live calculator computed stats selector
  const getLiveMarginCalculations = () => {
    const defaultRes = { totalOmset: 0, totalHPP: 0, feeAmount: 0, extra: 0, marginRupiah: 0, marginPercent: 0 };
    if (!itemId) return defaultRes;

    const qtyVal = parseInt(qty) || 0;
    const priceVal = parseFloat(hargaJual) || 0;
    const extraVal = parseFloat(biayaOperasionalLuar) || 0;
    const valueFee = parseFloat(platformFeeValue) || 0;

    const totalOmset = priceVal * qtyVal;
    
    // Product HPP already includes raw material. Sales only adds disposable packing cost.
    let materialHPP = hppUnit * qtyVal;
    
    bahanPackingItems.forEach(item => {
      const itemQty = parseFloat(item.qty) || 0;
      const packingMat = consumables.find(c => c.id === item.itemId);
      if (packingMat) {
        materialHPP += packingMat.hargaBeliUnit * itemQty;
      }
    });

    const feeAmount = getPlatformFeeAmount(totalOmset, platformFeeType, valueFee);
    const rawMargin = totalOmset - materialHPP - feeAmount - extraVal;
    const percent = totalOmset > 0 ? (rawMargin / totalOmset) * 105 - 5 : 0; // Adjusted normalization

    return {
      totalOmset,
      totalHPP: materialHPP,
      feeAmount,
      extra: extraVal,
      marginRupiah: rawMargin,
      marginPercent: Math.min(100, Math.max(-100, percent))
    };
  };

  const liveStats = getLiveMarginCalculations();

  // Quick payment status change action
  const handleToggleStatus = (sale: SaleTransaction) => {
    const updatedStatus = sale.status === 'lunas' ? 'pending' : 'lunas';
    onUpdateSale(sale.id, { ...sale, status: updatedStatus });
  };

  // Sorted latest transactions first representation
  const sortedSales = [...sales].sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  return (
    <div className="space-y-6">
      {/* Tab Header Widgets */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fadeIn">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600 animate-pulse" />
            Penjualan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Input seluruh rincian transaksi pembeli dan pesanan e-commerce. Dilengkapi kalkulator HPP logistik kemasan & platform admin-fees otomatis.
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4.5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Kembali' : 'Input Transaksi Penjualan'}
        </button>
      </div>

      {/* Sale Creator Form with live margins */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md animate-fadeIn">
          <h3 className="text-sm font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            {editingId ? 'Edit Catatan Penjualan' : 'Form Catat Transaksi Baru'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Main transaction fields */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500">Tanggal Penjualan</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500">Kode Invoice / Nama Pelanggan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: INV-0913 atau Budi Santosa"
                  value={invoicePelanggan}
                  onChange={(e) => setInvoicePelanggan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500">Pilih Model Terjual</label>
                <select
                  required
                  value={itemId}
                  onChange={(e) => {
                    setItemId(e.target.value);
                    setHargaJualManual(false);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- Pilih Katalog Siap Jual --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.sku} (Tersedia: {p.stok} pcs)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 font-mono">Qty (Pcs)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500">HPP Produk / Unit</label>
                  <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-2">
                    <span className="text-[10px] text-slate-400 font-bold mr-1">Rp</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={Math.round(hppUnit).toString()}
                      readOnly
                      className="w-full bg-transparent text-slate-700 font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* FULFILLMENT: Packing material logs */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 pb-2 border-b border-slate-150">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Pemakaian Bahan Habis Pakai (Packing Pengiriman)
              </span>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-500">Bahan Packaging</label>
                    <button
                      type="button"
                      onClick={() => setBahanPackingItems([...bahanPackingItems, { itemId: '', qty: '0' }])}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Bahan
                    </button>
                  </div>
                  {bahanPackingItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_90px_110px_30px] gap-2">
                      <select
                        value={item.itemId}
                        onChange={(e) => setBahanPackingItems(bahanPackingItems.map((row, rowIndex) => rowIndex === index ? { ...row, itemId: e.target.value } : row))}
                        className="min-w-0 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">-- Pilih Bahan Packing --</option>
                        {consumables.map(c => (
                          <option key={c.id} value={c.id}>{c.nama} (stok: {c.stok})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        aria-label="Jumlah bahan packing"
                        value={item.qty}
                        onChange={(e) => setBahanPackingItems(bahanPackingItems.map((row, rowIndex) => rowIndex === index ? { ...row, qty: e.target.value } : row))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Pcs"
                      />
                      <div className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-right text-xs font-mono font-semibold text-slate-600">
                        {(() => {
                          const packing = consumables.find(c => c.id === item.itemId);
                          const rowQty = parseFloat(item.qty) || 0;
                          return formatIDR((packing?.hargaBeliUnit || 0) * rowQty);
                        })()}
                      </div>
                      <button
                        type="button"
                        title="Hapus bahan packing"
                        onClick={() => setBahanPackingItems(bahanPackingItems.length === 1 ? [{ itemId: '', qty: '0' }] : bahanPackingItems.filter((_, rowIndex) => rowIndex !== index))}
                        className="flex items-center justify-center text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* E-Commerce Logistical Adjustments */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500">Biaya Kurir pick-up / Tips / Lain-lain</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:bg-white focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                  <span className="text-xs text-slate-400 font-bold mr-1">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={biayaOperasionalLuar}
                    onChange={(e) => setBiayaOperasionalLuar(e.target.value)}
                    className="w-full bg-transparent text-slate-800 font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-505">Nama Toko Platform / Layanan</label>
                <input
                  type="text"
                  placeholder="Shopee, Tokopedia, Custom, dll."
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-505">Sistem Potongan Admin Platform</label>
                <div className="flex bg-slate-50 border border-slate-200 p-0.5 rounded-xl h-[38px] items-center">
                  <button
                    type="button"
                    onClick={() => setPlatformFeeType('persen')}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      platformFeeType === 'persen' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Persentase (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlatformFeeType('rupiah')}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      platformFeeType === 'rupiah' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Rupiah (IDR)
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-505">Nilai Admin Platform</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:bg-white focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                  {platformFeeType === 'rupiah' && <span className="text-xs text-slate-400 font-bold mr-1">Rp</span>}
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={platformFeeValue}
                    onChange={(e) => setPlatformFeeValue(e.target.value)}
                    className="w-full bg-transparent text-slate-800 font-mono text-xs focus:outline-none"
                  />
                  {platformFeeType === 'persen' && <span className="text-xs text-slate-400 font-bold ml-1">%</span>}
                </div>
              </div>
            </div>

            {/* Dynamic Status bar checkbox */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 border border-slate-200 rounded-2xl gap-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-slate-500">Status Transaksi:</span>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={status === 'lunas'}
                    onChange={() => setStatus('lunas')}
                    className="rounded bg-white border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Lunas (Stok Dikurangi)
                  </span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={status === 'pending'}
                    onChange={() => setStatus('pending')}
                    className="rounded bg-white border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-amber-600 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Pending / Menunggu
                  </span>
                </label>
              </div>

              {/* LIVE MARGIN CALCULATOR PREVIEW */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 w-full sm:w-auto">
                <div className="space-y-1.5 min-w-[190px]">
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">Harga Jual / Unit</label>
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                    <span className="text-xs text-slate-400 font-bold mr-1">Rp</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={hargaJual}
                      onChange={(e) => {
                        setHargaJualManual(true);
                        setHargaJual(e.target.value);
                      }}
                      className="w-full bg-transparent text-slate-800 font-mono text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      title="Gunakan harga otomatis"
                      onClick={() => {
                        setHargaJualManual(false);
                        setHargaJual(Math.ceil(suggestedHargaJualUnit).toString());
                      }}
                      className="ml-2 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Kalkulator Margin Live</span>
                  <div className="flex items-baseline gap-2.5 mt-0.5 justify-end">
                    <span className={`text-sm font-mono font-bold ${liveStats.marginRupiah >= 0 ? 'text-emerald-600' : 'text-red-650'}`}>
                      {liveStats.marginRupiah >= 0 ? '+' : ''}{formatIDR(liveStats.marginRupiah)}
                    </span>
                    <span className={`text-xs font-mono font-bold ${liveStats.marginRupiah >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {liveStats.marginPercent.toFixed(1)}%
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 block">
                    Auto: {formatIDR(Math.ceil(suggestedHargaJualUnit))} / unit | Omset: {formatIDR(liveStats.totalOmset)} | HPP: {formatIDR(liveStats.totalHPP)} | Admin: {formatIDR(liveStats.feeAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit bar */}
            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl transition-all cursor-pointer hover:bg-slate-50"
              >
                Batalkan
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {editingId ? 'Simpan Transaksi' : 'Masukkan Penjualan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sales log tables */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <span className="text-sm font-bold text-slate-800 block">Log Riwayat Penjualan (Terbaru Dahulu)</span>
            <span className="text-[11px] text-slate-500 block">Menekan penanda status lunas/pending untuk memperbarui status transaksi secara langsung.</span>
          </div>
          <span className="text-xs font-mono text-slate-509 font-medium bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">{sales.length} transaksi</span>
        </div>

        {sortedSales.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 italic">
            Belum ada log pesanan penjualan yang terekam. Klik "Input Transaksi Penjualan" di atas untuk menambahkan data.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50 text-slate-500 text-left font-bold">
                <tr>
                  <th className="px-5 py-3.5">Tanggal</th>
                  <th className="px-5 py-3.5">Invoice / Customer</th>
                  <th className="px-5 py-3.5">Produk Jadi</th>
                  <th className="px-5 py-3.5">Qty</th>
                  <th className="px-5 py-3.5">Total Penjualan</th>
                  <th className="px-5 py-3.5">Platform & Biaya</th>
                  <th className="px-5 py-3.5">Margin Bersih</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {sortedSales.map((sale) => {
                  const targetProd = products.find(p => p.id === sale.itemId);
                  const prodName = targetProd ? targetProd.sku : 'Model Tidak Terjangkau / Dihapus';
                  const defaultHPP = targetProd ? targetProd.hpp : 0;
                  
                  // Compute HPP from finished product plus disposable packing materials.
                  let totalProdHPP = defaultHPP * sale.qty;
                  
                  const packingUsages = sale.bahanPackingItems?.length
                    ? sale.bahanPackingItems
                    : sale.bahanPackingId
                      ? [{ itemId: sale.bahanPackingId, qty: sale.bahanPackingQty }]
                      : [];
                  packingUsages.forEach(usage => {
                    const packing = consumables.find(c => c.id === usage.itemId);
                    if (packing) totalProdHPP += packing.hargaBeliUnit * usage.qty;
                  });

                  const totalOmset = sale.hargaJual * sale.qty;
                  const feeValue = getPlatformFeeAmount(totalOmset, sale.platformFeeType, sale.platformFeeValue);
                  const externalCost = sale.biayaOperasionalLuar || 0;
                  const totalOutlay = feeValue + externalCost;
                  const cleanMargin = totalOmset - totalProdHPP - totalOutlay;
                  const cleanMarginPercent = totalOmset > 0 ? (cleanMargin / totalOmset) * 105 - 5 : 0; // Adjusted normalization

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap font-medium text-slate-600">
                        {sale.tanggal}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-800">
                        {sale.invoicePelanggan}
                      </td>
                      <td className="px-5 py-4 truncate max-w-[140px] text-slate-600" title={prodName}>
                        {prodName}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-mono font-bold text-slate-700">
                        {sale.qty}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-mono text-cyan-700 font-bold">
                        {formatIDR(totalOmset)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-mono text-red-600 font-semibold">-{formatIDR(totalOutlay)}</div>
                        <div className="text-[9px] text-slate-500 font-sans font-semibold leading-4">
                          <span className="block">{sale.platformName}: -{formatIDR(feeValue)}</span>
                          <span className="block">Kurir/lain: -{formatIDR(externalCost)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className={`font-mono font-bold ${cleanMargin >= 0 ? 'text-emerald-600' : 'text-red-650'}`}>
                            {cleanMargin >= 0 ? '+' : ''}{formatIDR(cleanMargin)}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            ({Math.min(100, Math.max(-100, cleanMarginPercent)).toFixed(1)}%)
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleToggleStatus(sale)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer transition-all hover:scale-105 select-none ${
                            sale.status === 'lunas'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-amber-50 border-amber-200 text-amber-700'
                          }`}
                        >
                          {sale.status === 'lunas' ? 'Lunas / Posted' : 'Draft / Pending'}
                        </button>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right text-slate-400">
                        <div className="flex items-center justify-end gap-2 text-slate-500">
                          <button
                            onClick={() => handleEditClick(sale)}
                            className="hover:text-indigo-600 hover:bg-slate-100 p-1.5 rounded-lg transition-all cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Apakah Anda yakin ingin menghapus transaksi penjualan ini?')) {
                                onDeleteSale(sale.id);
                              }
                            }}
                            className="hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
