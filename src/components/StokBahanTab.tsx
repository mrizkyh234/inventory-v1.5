/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Package, 
  Layers, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  AlertTriangle, 
  Info, 
  Minus, 
  Database,
  Grid
} from 'lucide-react';
import { ConsumableItem, FilamentItem } from '../types';
import { formatIDR } from '../utils';

interface StokBahanTabProps {
  consumables: ConsumableItem[];
  filaments: FilamentItem[];
  onAddConsumable: (item: Omit<ConsumableItem, 'id'>) => void;
  onUpdateConsumable: (id: string, item: Omit<ConsumableItem, 'id'>) => void;
  onDeleteConsumable: (id: string) => void;
  onAddFilament: (item: Omit<FilamentItem, 'id'>) => void;
  onUpdateFilament: (id: string, item: Omit<FilamentItem, 'id'>) => void;
  onDeleteFilament: (id: string) => void;
}

export default function StokBahanTab({
  consumables,
  filaments,
  onAddConsumable,
  onUpdateConsumable,
  onDeleteConsumable,
  onAddFilament,
  onUpdateFilament,
  onDeleteFilament,
}: StokBahanTabProps) {
  // Navigation for active categorisations
  const [activeSubTab, setActiveSubTab] = useState<'sekali_pakai' | 'bahan_baku'>('sekali_pakai');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [consumableToDelete, setConsumableToDelete] = useState<string | null>(null);
  const [filamentToDelete, setFilamentToDelete] = useState<string | null>(null);

  // Form fields
  const [nama, setNama] = useState('');
  const [stok, setStok] = useState('10');
  const [harga, setHarga] = useState('1500');
  const [minStok, setMinStok] = useState('5');

  const resetForm = () => {
    setNama('');
    setStok('10');
    setHarga('1500');
    setMinStok('5');
    setEditingId(null);
    setShowForm(false);
  };

  const handleEditClick = (item: any) => {
    setEditingId(item.id);
    setNama(item.nama);
    setStok(item.stok.toString());
    setHarga(item.kategori === 'sekali_pakai' ? item.hargaBeliUnit.toString() : item.hargaBeliGrams.toString());
    setMinStok(item.minStok.toString());
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const stockVal = parseFloat(stok);
    const priceVal = parseFloat(harga);
    const minVal = parseFloat(minStok);

    if (isNaN(stockVal) || isNaN(priceVal) || isNaN(minVal)) {
      alert('Masukkan nilai kuantitas yang valid');
      return;
    }

    if (activeSubTab === 'sekali_pakai') {
      const payload: Omit<ConsumableItem, 'id'> = {
        nama: nama.trim(),
        stok: stockVal,
        hargaBeliUnit: priceVal,
        minStok: minVal,
        kategori: 'sekali_pakai',
      };
      if (editingId) {
        onUpdateConsumable(editingId, payload);
      } else {
        onAddConsumable(payload);
      }
    } else {
      const payload: Omit<FilamentItem, 'id'> = {
        nama: nama.trim(),
        stok: stockVal,
        hargaBeliGrams: priceVal,
        minStok: minVal,
        kategori: 'bahan_baku',
      };
      if (editingId) {
        onUpdateFilament(editingId, payload);
      } else {
        onAddFilament(payload);
      }
    }

    resetForm();
  };

  // Automated Alert indicators based on user boundaries:
  // - 1-2 unit/grams: Red
  // - 3-5 unit/grams: Yellow
  // - >= 6 unit/grams: Green
  const getStockAlert = (stock: number) => {
    if (stock <= 2) {
      return { 
        bg: 'bg-red-50 border-red-200 text-red-700', 
        label: 'Kritis', 
        color: 'text-red-600',
        dot: 'bg-red-500' 
      };
    } else if (stock >= 3 && stock <= 5) {
      return { 
        bg: 'bg-amber-50 border-amber-200 text-amber-700', 
        label: 'Menipis', 
        color: 'text-amber-600',
        dot: 'bg-amber-500' 
      };
    } else {
      return { 
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', 
        label: 'Aman', 
        color: 'text-emerald-600',
        dot: 'bg-emerald-500' 
      };
    }
  };

  // Adjust stock directly
  const adjustStock = (id: string, isConsumable: boolean, amt: number) => {
    if (isConsumable) {
      const target = consumables.find(c => c.id === id);
      if (target) {
        const newStok = Math.max(0, target.stok + amt);
        onUpdateConsumable(id, { ...target, stok: newStok });
      }
    } else {
      const target = filaments.find(f => f.id === id);
      if (target) {
        const newStok = Math.max(0, target.stok + amt);
        onUpdateFilament(id, { ...target, stok: newStok });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header widgets */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4.5 rounded-2xl border border-slate-150 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            Gudang & Stok Bahan Baselab
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pantau ketersediaan bahan pengemasan (sekali pakai) serta stok utama Filament PLA/PETG. Dilengkapi indikator kelayakan batas minimum.
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
          {showForm ? 'Kembali' : activeSubTab === 'sekali_pakai' ? 'Tambah Bahan Packing' : 'Tambah Bahan Baku'}
        </button>
      </div>

      {/* Form Section */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm animate-fadeIn">
          <h3 className="text-sm font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Grid className="w-4 h-4 text-indigo-600" />
            {editingId ? 'Edit Data Bahan' : 'Registrasi Bahan Baru'} 
            <span className="text-[11px] font-bold px-2.5 py-0.5 bg-slate-50 text-indigo-700 border border-slate-150 rounded-lg capitalize">
              {activeSubTab === 'sekali_pakai' ? 'Sekali Pakai (Packing)' : 'Filament (Bahan Baku)'}
            </span>
          </h3>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500">Nama Bahan / Material</label>
              <input
                type="text"
                required
                placeholder={activeSubTab === 'sekali_pakai' ? 'Contoh: Kardus Cokelat 10x10' : 'Contoh: Filament eSun PLA+ Black'}
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-505">
                {activeSubTab === 'sekali_pakai' ? 'Stok (Pcs)' : 'Stok Tersedia (Gram)'}
              </label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={stok}
                onChange={(e) => setStok(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-505">
                {activeSubTab === 'sekali_pakai' ? 'Harga Beli Unit' : 'Harga Beli per Gram'}
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:bg-white focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                <span className="text-xs text-slate-400 font-bold mr-1">Rp</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={harga}
                  onChange={(e) => setHarga(e.target.value)}
                  className="w-full bg-transparent text-slate-800 font-mono text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-505">Batas Minimum Notifikasi</label>
              <input
                type="number"
                required
                min="1"
                value={minStok}
                onChange={(e) => setMinStok(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-4 flex justify-end gap-3 mt-2">
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
                {editingId ? 'Simpan Perubahan' : 'Daftarkan Bahan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Toggle (Secondary Tab inside inventory) */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            setActiveSubTab('sekali_pakai');
            resetForm();
          }}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'sekali_pakai'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          Bahan Sekali Pakai (Packing wrapping / dus)
        </button>
        <button
          onClick={() => {
            setActiveSubTab('bahan_baku');
            resetForm();
          }}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'bahan_baku'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Bahan Baku Filament (3D Prints)
        </button>
      </div>

      {/* Alert Rule Tip panel based on explicit prompt */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2 shadow-2xs">
        <Info className="w-4 h-4 text-cyan-600 shrink-0" />
        <span>
          <b>Ketentuan Warna Batas Minimum:</b> 
          <span className="text-red-650 ml-2 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-100">1-2 Unit (Merah/Kritis)</span>, 
          <span className="text-amber-700 mx-2 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">3-5 Unit (Kuning/Menipis)</span>, dan 
          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">6 Unit ke atas (Hijau/Aman)</span>.
        </span>
      </div>

      {/* Materials List Tables */}
      {activeSubTab === 'sekali_pakai' ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800">Inventarisasi Bahan Sekali Pakai / Kemasan</span>
            <span className="text-xs font-mono text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">{consumables.length} item</span>
          </div>

          {consumables.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 italic">
              Gudang kargo pelindung masih kosong. Daftarkan bahan packing seperti Bubble Wrap, plastik stretch, atau kardus packing.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                <thead className="bg-slate-50 text-slate-500 text-left font-bold">
                  <tr>
                    <th className="px-5 py-3.5">Nama Bahan</th>
                    <th className="px-5 py-3.5">Stok Tersedia</th>
                    <th className="px-5 py-3.5">Batas Minimum</th>
                    <th className="px-5 py-3.5">Harga Beli / Unit</th>
                    <th className="px-5 py-3.5 text-center">Koreksi Stok Manual</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {consumables.map((item) => {
                    const alertDetails = getStockAlert(item.stok);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-800">
                          {item.nama}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${alertDetails.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${alertDetails.dot}`}></span>
                            <span className="font-mono text-slate-800">{item.stok}</span>&nbsp;pcs ({alertDetails.label})
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-mono text-slate-500 font-medium">
                          {item.minStok} pcs
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-mono text-cyan-700 font-bold">
                          {formatIDR(item.hargaBeliUnit)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => adjustStock(item.id, true, -1)}
                              className="p-1 px-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-all cursor-pointer"
                              title="Kurangi stok 1 pcs"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-mono font-bold text-indigo-600">{item.stok}</span>
                            <button
                              onClick={() => adjustStock(item.id, true, 1)}
                              className="p-1 px-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-all cursor-pointer"
                              title="Tambah stok 1 pcs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right text-slate-400">
                          <div className="flex items-center justify-end gap-2 text-slate-500">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="hover:text-indigo-600 hover:bg-slate-100 p-1.5 rounded-lg transition-all cursor-pointer"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConsumableToDelete(item.id)}
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
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800">Inventarisasi Bahan Baku Filament / Gulungan Polymer</span>
            <span className="text-xs font-mono text-slate-505 font-medium bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">{filaments.length} jenis</span>
          </div>

          {filaments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 italic">
              Tidak ada bahan baku utama filament yang terdaftar. Tambahkan item seperti PLA Prime, ABS Pro, dsb.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                <thead className="bg-slate-50 text-slate-500 text-left font-bold">
                  <tr>
                    <th className="px-5 py-3.5">Nama Filament</th>
                    <th className="px-5 py-3.5">Stok Tersedia</th>
                    <th className="px-5 py-3.5">Batas Minimum</th>
                    <th className="px-5 py-3.5">Harga Beli / Gram</th>
                    <th className="px-5 py-3.5 text-center">Koreksi Stok Manual</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {filaments.map((item) => {
                    const alertDetails = getStockAlert(item.stok);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-800">
                          {item.nama}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${alertDetails.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${alertDetails.dot}`}></span>
                            <span className="font-mono text-slate-800">{item.stok}</span>&nbsp;g ({alertDetails.label})
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-mono text-slate-550 font-medium">
                          {item.minStok} g
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-mono text-cyan-705 font-bold">
                          {formatIDR(item.hargaBeliGrams)} /g 
                          <span className="text-[10px] text-slate-400 block font-sans font-semibold">({formatIDR(item.hargaBeliGrams * 1000)} /kg)</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => adjustStock(item.id, false, -100)}
                              className="px-2 py-1 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-205 rounded-lg border border-slate-200 transition-all font-mono text-[10px] font-bold cursor-pointer"
                              title="Kurangi stok 100 gram"
                            >
                              -100g
                            </button>
                            <button
                              onClick={() => adjustStock(item.id, false, -10)}
                              className="p-1 px-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-all cursor-pointer"
                              title="Kurangi stok 10 gram"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-14 text-center text-xs font-mono font-bold text-indigo-600">{item.stok}g</span>
                            <button
                              onClick={() => adjustStock(item.id, false, 10)}
                              className="p-1 px-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-all cursor-pointer"
                              title="Tambah stok 10 gram"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => adjustStock(item.id, false, 100)}
                              className="px-2 py-1 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-all font-mono text-[10px] font-bold cursor-pointer"
                              title="Tambah stok 100 gram"
                            >
                              +100g
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right text-slate-400">
                          <div className="flex items-center justify-end gap-2 text-slate-500">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="hover:text-indigo-600 hover:bg-slate-100 p-1.5 rounded-lg transition-all cursor-pointer"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setFilamentToDelete(item.id)}
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
      )}

      {/* Custom Delete Confirmation Modal - Packing/Consumable */}
      {consumableToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full p-6 shadow-xl animate-in fade-in duration-200">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">Konfirmasi Hapus</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Apakah Anda yakin ingin menghapus perlengkapan packing/sekali pakai ini dari stok?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setConsumableToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={() => {
                  if (consumableToDelete) {
                    onDeleteConsumable(consumableToDelete);
                    setConsumableToDelete(null);
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal - Filament */}
      {filamentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full p-6 shadow-xl animate-in fade-in duration-200">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">Konfirmasi Hapus</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Apakah Anda yakin ingin menghapus filament ini dari stok?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setFilamentToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={() => {
                  if (filamentToDelete) {
                    onDeleteFilament(filamentToDelete);
                    setFilamentToDelete(null);
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
