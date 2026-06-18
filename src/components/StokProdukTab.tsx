/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  TrendingUp, 
  DollarSign, 
  Image as ImageIcon,
  Camera,
  Percent,
  Minus
} from 'lucide-react';
import { ProductItem } from '../types';
import { formatIDR } from '../utils';

interface StokProdukTabProps {
  products: ProductItem[];
  onAddProduct: (product: Omit<ProductItem, 'id'>) => void;
  onUpdateProduct: (id: string, product: Omit<ProductItem, 'id'>) => void;
  onDeleteProduct: (id: string) => void;
}

export default function StokProdukTab({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}: StokProdukTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [sku, setSku] = useState('');
  const [stok, setStok] = useState('10');
  const [hpp, setHpp] = useState('12000');
  const [hargaJual, setHargaJual] = useState('25000');
  const [foto, setFoto] = useState(''); // Base64 or Preset Url

  const resetForm = () => {
    setSku('');
    setStok('10');
    setHpp('12000');
    setHargaJual('25000');
    setFoto('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleEditClick = (product: ProductItem) => {
    setEditingId(product.id);
    setSku(product.sku);
    setStok(product.stok.toString());
    setHpp(product.hpp.toString());
    setHargaJual(product.hargaJual.toString());
    setFoto(product.foto || '');
    setShowForm(true);
  };

  // Base64 file reader
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const stockVal = parseInt(stok);
    const hppVal = parseFloat(hpp);
    const sellVal = parseFloat(hargaJual);

    if (isNaN(stockVal) || isNaN(hppVal) || isNaN(sellVal)) {
      alert('Mohon masukkan rincian nominal yang valid');
      return;
    }

    const payload = {
      sku: sku.trim(),
      stok: stockVal,
      hpp: hppVal,
      hargaJual: sellVal,
      foto: foto || 'gradient_placeholder', // Fallback to custom generator
    };

    if (editingId) {
      onUpdateProduct(editingId, payload);
    } else {
      onAddProduct(payload);
    }

    resetForm();
  };

  // Adjust stock directly
  const adjustStock = (id: string, amt: number) => {
    const product = products.find(p => p.id === id);
    if (product) {
      const newStok = Math.max(0, product.stok + amt);
      onUpdateProduct(id, { ...product, stok: newStok });
    }
  };

  // Image Helper Card Generator
  const renderProductImage = (src: string, skuName: string) => {
    if (src && src !== 'gradient_placeholder') {
      return (
        <img 
          src={src} 
          alt={skuName} 
          className="w-12 h-12 rounded-xl object-cover border border-slate-200"
          referrerPolicy="no-referrer"
        />
      );
    }

    // Gorgeous fallback color gradient based on the words in SKU to look stunning
    const charCodeSum = skuName.split('').reduce((acc, curr) => acc + curr.charCodeAt(0), 0);
    const gradients = [
      'from-cyan-500 to-indigo-600',
      'from-emerald-400 to-teal-600',
      'from-purple-500 to-pink-600',
      'from-amber-400 to-orange-600',
    ];
    const gradClass = gradients[charCodeSum % gradients.length];

    return (
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradClass} flex items-center justify-center border border-slate-200 text-white font-bold text-xs uppercase shadow-xs tracking-tight`}>
        {skuName.substring(0, 2)}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4.5 rounded-2xl border border-slate-150 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-600" />
            Katalog & Stok Produk Jadi
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar hasil cetak 3D Baselab Workspace yang siap jual. Pantau modal HPP filament, penetapan harga jual, serta margin keuntungan.
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
          className="bg-indigo-600 hover:bg-indigo-550 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-xs hover:-translate-y-0.5 cursor-pointer"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Kembali' : 'Tambah Produk Jadi'}
        </button>
      </div>

      {/* Product Registration Form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm animate-fadeIn">
          <h3 className="text-sm font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-indigo-600" />
            {editingId ? 'Edit Rincian Cetak Produk' : 'Registrasi Produk Siap Jual Baru'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Image Input Container - left side */}
              <div className="md:col-span-3 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50 relative">
                {foto ? (
                  <div className="relative group animate-fadeIn">
                    <img 
                      src={foto} 
                      alt="Pratinjau" 
                      className={`w-24 h-24 rounded-2xl object-cover border border-slate-200 shadow-sm transition-all`}
                    />
                    <button
                      type="button"
                      onClick={() => setFoto('')}
                      className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-full border border-white shadow-sm transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-center cursor-pointer hover:text-indigo-600 transition-colors flex flex-col items-center gap-1.5 py-4 w-full group"
                  >
                    <div className="p-2.5 bg-white rounded-full text-slate-400 border border-slate-200 group-hover:text-indigo-600 group-hover:border-indigo-100 group-hover:shadow-2xs transition-all">
                      <Camera className="w-5 h-5 animate-pulse" />
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold group-hover:text-indigo-600 transition-all">Unggah Foto / Seret Ke Sini</span>
                    <span className="text-[9px] text-slate-450 font-semibold">Mendukung JPEG, PNG</span>
                  </div>
                )}
                <input
                  type="file"
                  id="foto-upload"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </div>

              {/* Input details - right side */}
              <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500">SKU / Nama Cetak Produk Jadi</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pegboard Modular 20x20 ATAU Skull Keyring"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-505">Stok Siap Jual (Pcs)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="10"
                    value={stok}
                    onChange={(e) => setStok(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-505">Harga Pokok Produksi - HPP (IDR)</label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:bg-white focus-within:ring-1 focus-within:ring-indigo-505 transition-all">
                    <span className="text-xs text-slate-400 font-bold mr-1">Rp</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={hpp}
                      onChange={(e) => setHpp(e.target.value)}
                      className="w-full bg-transparent text-slate-800 font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-505">Harga Jual Satuan (IDR)</label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:bg-white focus-within:ring-1 focus-within:ring-indigo-505 transition-all">
                    <span className="text-xs text-slate-400 font-bold mr-1">Rp</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={hargaJual}
                      onChange={(e) => setHargaJual(e.target.value)}
                      className="w-full bg-transparent text-slate-800 font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* Potensi Margin Live Indicator */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-wider text-slate-550 font-bold flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-cyan-600" /> Live Potensi Margin
                  </span>
                  {(() => {
                    const hVal = parseFloat(hpp) || 0;
                    const jVal = parseFloat(hargaJual) || 0;
                    const marginValue = jVal - hVal;
                    const marginPercent = jVal > 0 ? (marginValue / jVal) * 100 : 0;
                    return (
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-sm font-mono font-bold text-emerald-600">
                          +{formatIDR(marginValue)}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-600">
                          {marginPercent.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })()}
                </div>

              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={resetForm}
                className="px-4.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl transition-all cursor-pointer hover:bg-slate-50"
              >
                Batalkan
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-550 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {editingId ? 'Simpan Perubahan' : 'Daftarkan Produk'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Stock List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <span className="text-sm font-bold text-slate-800">Daftar Produk Jadi Siap Jual</span>
          <span className="text-xs font-mono text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">{products.length} model terdaftar</span>
        </div>

        {products.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 italic">
            Katalog siap jual masih kosong. Daftarkan model cetak yang sudah selesai diproduksi untuk mencatat penjualan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold">
                <tr>
                  <th className="px-5 py-3.5">Foto</th>
                  <th className="px-5 py-3.5">SKU / Nama Produk</th>
                  <th className="px-5 py-3.5">HPP (Modal)</th>
                  <th className="px-5 py-3.5">Harga Jual</th>
                  <th className="px-5 py-3.5">Potensi Margin IDR (%)</th>
                  <th className="px-5 py-3.5 text-center">Koreksi Stok Manual</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {products.map((item) => {
                  const potMargin = item.hargaJual - item.hpp;
                  const potMarginPercent = item.hargaJual > 0 ? (potMargin / item.hargaJual) * 100 : 0;
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-5 py-3">
                        {renderProductImage(item.foto, item.sku)}
                      </td>
                      <td className="px-5 py-3 font-bold text-slate-800">
                        <div>
                          <span>{item.sku}</span>
                          <span className={`block text-[10px] mt-0.5 font-bold ${item.stok === 0 ? 'text-red-650' : item.stok <= 5 ? 'text-amber-600' : 'text-slate-400'}`}>
                            Stok: {item.stok} pcs {item.stok === 0 ? '(Habis)' : item.stok <= 5 ? '(Menipis)' : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-500 font-semibold">
                        {formatIDR(item.hpp)}
                      </td>
                      <td className="px-5 py-3 font-mono text-cyan-705 font-bold">
                        {formatIDR(item.hargaJual)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-emerald-600">+{formatIDR(potMargin)}</span>
                          <span className="text-[10px] font-mono text-slate-400 font-semibold">({potMarginPercent.toFixed(1)}%)</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => adjustStock(item.id, -1)}
                            className="p-1 px-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-all cursor-pointer"
                            title="Kurangi stok"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-155">{item.stok}</span>
                          <button
                            onClick={() => adjustStock(item.id, 1)}
                            className="p-1 px-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-all cursor-pointer"
                            title="Tambah stok"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2 text-slate-500">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="hover:text-indigo-600 hover:bg-slate-100 p-1.5 rounded-lg transition-all cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Apakah Anda yakin ingin menghapus produk ini? Semua transaksi penjualan terkait masih akan tersimpan di riwayat.')) {
                                onDeleteProduct(item.id);
                              }
                            }}
                            className="hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all cursor-pointer"
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
