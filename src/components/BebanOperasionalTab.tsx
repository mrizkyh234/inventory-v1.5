/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Car, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  ShoppingBag, 
  Sparkles, 
  DollarSign, 
  Info 
} from 'lucide-react';
import { OperatingExpense, PeriodType } from '../types';
import { formatIDR } from '../utils';

interface BebanOperasionalTabProps {
  expenses: OperatingExpense[];
  onAddExpense: (expense: Omit<OperatingExpense, 'id'>) => void;
  onUpdateExpense: (id: string, expense: Omit<OperatingExpense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
  selectedPeriod: PeriodType;
  setSelectedPeriod: (period: PeriodType) => void;
}

export default function BebanOperasionalTab({
  expenses,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  selectedPeriod,
  setSelectedPeriod,
}: BebanOperasionalTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  // Form states
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [biayaEvent, setBiayaEvent] = useState('0');
  const [biayaTransportasi, setBiayaTransportasi] = useState('0');
  const [detailPerlengkapan, setDetailPerlengkapan] = useState<{ nama: string; qty: number; harga?: number }[]>([]);
  const [jenis, setJenis] = useState<'operasional' | 'reject'>('operasional');

  // Temp detail states
  const [tempNama, setTempNama] = useState('');
  const [tempQty, setTempQty] = useState('1');
  const [tempHarga, setTempHarga] = useState('0');

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>((today.getMonth() + 1).toString().padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState<string>(today.getFullYear().toString());
  const [selectedYearOnly, setSelectedYearOnly] = useState<string>(today.getFullYear().toString());

  useEffect(() => {
    const freshToday = new Date();
    const freshTodayStr = freshToday.toISOString().split('T')[0];
    setSelectedDate(freshTodayStr);
    setSelectedMonth((freshToday.getMonth() + 1).toString().padStart(2, '0'));
    setSelectedYear(freshToday.getFullYear().toString());
    setSelectedYearOnly(freshToday.getFullYear().toString());
  }, [selectedPeriod]);

  const monthsList = [
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  const yearsList = ['2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035'];

  const getPeriodLabel = () => {
    if (selectedPeriod === 'hari') {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts;
        const monthLabel = monthsList.find(item => item.value === m)?.label || m;
        return `${d} ${monthLabel} ${y}`;
      }
      return selectedDate;
    } else if (selectedPeriod === 'bulan') {
      const monthLabel = monthsList.find(item => item.value === selectedMonth)?.label || '';
      return `${monthLabel} ${selectedYear}`;
    } else {
      return `Tahun ${selectedYearOnly}`;
    }
  };

  // Filter logic
  const filterByPeriod = (items: OperatingExpense[]): OperatingExpense[] => {
    return items.filter(item => {
      if (!item.tanggal) return false;
      if (selectedPeriod === 'hari') {
        return item.tanggal === selectedDate;
      } else if (selectedPeriod === 'bulan') {
        const targetPrefix = `${selectedYear}-${selectedMonth}`;
        return item.tanggal.startsWith(targetPrefix);
      } else {
        const targetPrefix = `${selectedYearOnly}-`;
        return item.tanggal.startsWith(targetPrefix);
      }
    });
  };

  const filteredExpenses = filterByPeriod(expenses).sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  // Add a detail accessory to the temp item lists
  const handleAddDetail = () => {
    if (!tempNama.trim()) return;
    const qty = parseInt(tempQty);
    if (isNaN(qty) || qty <= 0) return;
    const price = parseFloat(tempHarga) || 0;

    setDetailPerlengkapan([...detailPerlengkapan, { nama: tempNama.trim(), qty, harga: price }]);
    setTempNama('');
    setTempQty('1');
    setTempHarga('0');
  };

  const handleRemoveDetail = (index: number) => {
    setDetailPerlengkapan(detailPerlengkapan.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setTanggal(new Date().toISOString().split('T')[0]);
    setBiayaEvent('0');
    setBiayaTransportasi('0');
    setDetailPerlengkapan([]);
    setJenis('operasional');
    setTempNama('');
    setTempQty('1');
    setTempHarga('0');
    setEditingId(null);
    setShowForm(false);
  };

  const handleEditClick = (expense: OperatingExpense) => {
    setEditingId(expense.id);
    setTanggal(expense.tanggal);
    setBiayaEvent(expense.biayaEvent.toString());
    setBiayaTransportasi(expense.biayaTransportasi.toString());
    setDetailPerlengkapan(expense.detailPerlengkapan || []);
    setJenis(expense.jenis || 'operasional');
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const eventCost = parseFloat(biayaEvent);
    const transportCost = parseFloat(biayaTransportasi);

    if (isNaN(eventCost) || isNaN(transportCost)) {
      alert('Mohon masukkan angka biaya yang valid');
      return;
    }

    const existingExpense = editingId ? expenses.find(item => item.id === editingId) : undefined;
    const payload = {
      tanggal,
      biayaEvent: eventCost,
      biayaTransportasi: transportCost,
      detailPerlengkapan,
      jenis,
      rejectMeta: jenis === 'reject' ? existingExpense?.rejectMeta : undefined,
    };

    if (editingId) {
      onUpdateExpense(editingId, payload);
    } else {
      onAddExpense(payload);
    }

    resetForm();
  };

  const getExpenseDetailTotal = (expense: OperatingExpense) => {
    return (expense.detailPerlengkapan || []).reduce((sum, item) => sum + (item.harga || 0), 0);
  };

  const grandTotal = filteredExpenses.reduce((acc, curr) => acc + curr.biayaEvent + curr.biayaTransportasi + getExpenseDetailTotal(curr), 0);

  return (
    <div className="space-y-6">
      {/* Tab Header with Period filter */}
      <div className="flex flex-col gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Car className="w-5 h-5 text-indigo-600 animate-bounce" />
              Beban Operasional Workshop
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Pantau dan catat seluruh pengeluaran bulanan, seperti pameran/event, logistik transportasi, dan pembelian perlengkapan habis pakai.
            </p>
          </div>
          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-start">
            <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-xl shadow-inner">
              {(['hari', 'bulan', 'tahun'] as PeriodType[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg uppercase transition-all duration-200 ${
                    selectedPeriod === p
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-650 hover:text-slate-850'
                  }`}
                >
                  {p === 'hari' ? 'Harian' : p === 'bulan' ? 'Bulanan' : 'Tahunan'}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                if (showForm) {
                  resetForm();
                } else {
                  setShowForm(true);
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-md cursor-pointer active:scale-[0.98]"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? 'Kembali' : 'Tambah Pengeluaran'}
            </button>
          </div>
        </div>

        {/* Dynamic Filter Controls */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50/50 -mx-5 -mb-5 p-5 rounded-b-2xl">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            🔍 Filter Periode Aktif:
          </span>
          
          {selectedPeriod === 'hari' && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                  }
                }}
                className="bg-white border border-slate-200 hover:border-indigo-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-mono font-medium transition-all shadow-xs"
              />
              <span className="text-[10px] text-slate-400 font-medium">
                Pilih tanggal spesifik untuk meninjau operational expenses harian
              </span>
            </div>
          )}

          {selectedPeriod === 'bulan' && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full">
              <div className="flex gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-white border border-slate-200 hover:border-indigo-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium transition-all shadow-xs cursor-pointer"
                >
                  {monthsList.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-white border border-slate-200 hover:border-indigo-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-mono font-medium transition-all shadow-xs cursor-pointer"
                >
                  {yearsList.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Saring data beban operasional untuk bulan &amp; tahun terpilih
              </span>
            </div>
          )}

          {selectedPeriod === 'tahun' && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full">
              <select
                value={selectedYearOnly}
                onChange={(e) => setSelectedYearOnly(e.target.value)}
                className="bg-white border border-slate-200 hover:border-indigo-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-mono font-medium transition-all shadow-xs cursor-pointer"
              >
                {yearsList.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 font-medium">
                Evaluasi performa beban operasional sepanjang tahun mulai 2026 dan seterusnya
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Expansion Form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md animate-fadeIn">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            {editingId ? 'Edit Catatan Pengeluaran' : 'Catat Pengeluaran Operasional Baru'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Date Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-500">Tanggal Transaksi</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-500">Status Beban</label>
                <select
                  value={jenis}
                  onChange={(e) => setJenis(e.target.value as 'operasional' | 'reject')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner"
                >
                  <option value="operasional">Operasional</option>
                  <option value="reject">Reject</option>
                </select>
              </div>

              {/* Event Fee */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-500">Biaya Event / Pameran (IDR)</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 shadow-inner">
                  <span className="text-xs text-slate-400 font-bold mr-1">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={biayaEvent}
                    onChange={(e) => setBiayaEvent(e.target.value)}
                    className="w-full bg-transparent text-slate-800 py-2 font-mono text-xs focus:outline-none"
                    placeholder="Contoh: 150000"
                  />
                </div>
              </div>

              {/* Transportation */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-500">Biaya Transportasi & Tol (IDR)</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 shadow-inner">
                  <span className="text-xs text-slate-400 font-bold mr-1">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={biayaTransportasi}
                    onChange={(e) => setBiayaTransportasi(e.target.value)}
                    className="w-full bg-transparent text-slate-800 py-2 font-mono text-xs focus:outline-none"
                    placeholder="Contoh: 50000"
                  />
                </div>
              </div>
            </div>

            {/* Nested Detail Perlengkapan Habis Pakai Builder */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
                  Rincian Perlengkapan Habis Pakai Yang Dibeli
                </span>
                <span className="text-[10px] text-slate-500 italic">Membantu mencatat item seperti bubble wrap, kardus, dll.</span>
              </div>

              {/* Dynamic Inputs */}
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 space-y-1">
                  <label className="block text-[10px] text-slate-500 font-medium">Nama Barang / Deskripsi</label>
                  <input
                    type="text"
                    placeholder="Contoh: Lakban Cokelat"
                    value={tempNama}
                    onChange={(e) => setTempNama(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
                  />
                </div>
                <div className="w-full sm:w-24 space-y-1">
                  <label className="block text-[10px] text-slate-500 font-medium">Jumlah (Pcs)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={tempQty}
                    onChange={(e) => setTempQty(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner font-mono"
                  />
                </div>
                <div className="w-full sm:w-36 space-y-1">
                  <label className="block text-[10px] text-slate-500 font-medium">Total Harga (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 15000"
                    value={tempHarga}
                    onChange={(e) => setTempHarga(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddDetail}
                  className="bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1 border border-slate-300 h-[38px] justify-center cursor-pointer shadow-xs active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-600" /> Tambah Detail Item
                </button>
              </div>

              {/* Active Temporary List */}
              {detailPerlengkapan.length === 0 ? (
                <div className="text-center py-4 text-[11px] text-slate-400 italic">
                  Belum ada detail barang habis pakai yang ditambahkan untuk pengeluaran ini.
                </div>
              ) : (
                <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-xs">
                  <table className="min-w-full divide-y divide-slate-100 text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-semibold">
                        <th className="px-4 py-2.5 text-left">No.</th>
                        <th className="px-4 py-2.5 text-left">Nama Barang Habis Pakai / Perlengkapan</th>
                        <th className="px-4 py-2.5 text-center">Jumlah (Pcs)</th>
                        <th className="px-4 py-2.5 text-right">Harga Total</th>
                        <th className="px-4 py-2.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailPerlengkapan.map((item, index) => (
                        <tr key={index} className="text-slate-705">
                          <td className="px-4 py-2.5">{index + 1}</td>
                          <td className="px-4 py-2.5 font-medium">{item.nama}</td>
                          <td className="px-4 py-2.5 text-center font-mono font-bold text-indigo-600 bg-indigo-50/30">{item.qty} pcs</td>
                          <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-800">{formatIDR(item.harga || 0)}</td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveDetail(index)}
                              className="text-red-500 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 border border-slate-300 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                {editingId ? 'Simpan Perubahan' : 'Catat Pengeluaran'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Aggregate stats banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Pengeluaran Sesi ({getPeriodLabel()})</span>
          <span className="text-2xl font-bold font-mono text-red-600 block mt-1">{formatIDR(grandTotal)}</span>
          <span className="text-[10px] text-slate-500 mt-1 block">Akumulasi biaya Event dan Transportasi.</span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Event / Exhibition</span>
          <span className="text-xl font-bold font-mono text-indigo-600 block mt-1">
            {formatIDR(filteredExpenses.reduce((acc, curr) => acc + curr.biayaEvent, 0))}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Jumlah biaya retribusi/sewa stand event.</span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Kurir & Transportasi</span>
          <span className="text-xl font-bold font-mono text-cyan-600 block mt-1">
            {formatIDR(filteredExpenses.reduce((acc, curr) => acc + curr.biayaTransportasi, 0))}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Bahan bakar, tol, logistik pengantaran.</span>
        </div>
      </div>

      {/* Main Expenses Logs list */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4.5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <span className="text-sm font-bold text-slate-850">Log Pengeluaran Operasional ({getPeriodLabel()})</span>
          <span className="text-xs text-slate-500 font-mono">{filteredExpenses.length} transaksi tercatat</span>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 italic">
            Belum ada pengeluaran operasional yang tercatat dalam periode {getPeriodLabel()}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-105 text-xs">
              <thead className="bg-slate-50 text-slate-500 text-left font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Tanggal</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Biaya Event</th>
                  <th className="px-5 py-3.5">Biaya Transportasi</th>
                  <th className="px-5 py-3.5">Detail Perlengkapan Habis Pakai</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {expense.tanggal}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        expense.jenis === 'reject'
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      }`}>
                        {expense.jenis === 'reject' ? 'Reject' : 'Operasional'}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-mono text-indigo-650 font-semibold">
                      {formatIDR(expense.biayaEvent)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-mono text-cyan-650 font-semibold">
                      {formatIDR(expense.biayaTransportasi)}
                    </td>
                    <td className="px-5 py-4">
                      {expense.detailPerlengkapan && expense.detailPerlengkapan.length > 0 ? (
                        <div className="flex flex-col gap-1 max-w-xs">
                          {expense.detailPerlengkapan.map((item, idx) => (
                            <div 
                              key={idx} 
                              className="flex justify-between items-center text-[10px] bg-slate-50 border border-slate-200/60 rounded-lg px-2 py-0.5 gap-4"
                            >
                              <span className="font-semibold text-slate-700">{item.nama}</span>
                              <span className="font-mono text-slate-500 font-medium shrink-0">
                                {item.qty} pcs {item.harga ? `• ${formatIDR(item.harga)}` : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-450 italic text-[11px]">- tidak ada barang habis pakai -</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right text-slate-500">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleEditClick(expense)}
                          className="hover:text-indigo-600 p-1.5 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                          title="Suntik Data"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpenseToDelete(expense.id)}
                          className="hover:text-red-600 p-1.5 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full p-6 shadow-xl animate-in fade-in duration-200">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">Konfirmasi Hapus</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Apakah Anda yakin ingin menghapus catatan pengeluaran operasional ini secara permanen dari database?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={() => {
                  if (expenseToDelete) {
                    onDeleteExpense(expenseToDelete);
                    setExpenseToDelete(null);
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
