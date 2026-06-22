/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Briefcase, 
  ShoppingBag, 
  Settings, 
  Layers, 
  AlertCircle, 
  ArrowUpRight, 
  FileText, 
  Edit2, 
  Check, 
  Activity 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  ConsumableItem,
  ProductItem, 
  OperatingExpense, 
  SaleTransaction, 
  PeriodType 
} from '../types';
import { formatIDR } from '../utils';

interface DashboardTabProps {
  modalAwal: number;
  onUpdateModalAwal: (value: number) => void;
  expenses: OperatingExpense[];
  consumables: ConsumableItem[];
  products: ProductItem[];
  sales: SaleTransaction[];
  selectedPeriod: PeriodType;
  setSelectedPeriod: (period: PeriodType) => void;
}

export default function DashboardTab({
  modalAwal,
  onUpdateModalAwal,
  expenses,
  consumables,
  products,
  sales,
  selectedPeriod,
  setSelectedPeriod,
}: DashboardTabProps) {
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [modalInput, setModalInput] = useState(modalAwal.toString());

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

  // Function to filter items based on the selected period
  const filterByPeriod = <T extends { tanggal: string }>(items: T[]): T[] => {
    return items.filter(item => {
      if (!item.tanggal) return false;
      const t = item.tanggal;
      if (selectedPeriod === 'hari') {
        return t === selectedDate;
      } else if (selectedPeriod === 'bulan') {
        const targetPrefix = `${selectedYear}-${selectedMonth}`;
        return t.startsWith(targetPrefix);
      } else {
        const targetPrefix = `${selectedYearOnly}-`;
        return t.startsWith(targetPrefix);
      }
    });
  };

  const filteredSales = filterByPeriod(sales).filter(sale => sale.status === 'lunas');
  const filteredExpenses = filterByPeriod(expenses);

  // 1. Calculate Omset (Total Pendapatan Penjualan)
  const omset = filteredSales.reduce((acc, curr) => acc + (curr.hargaJual * curr.qty), 0);

  const platformFees = filteredSales.reduce((acc, curr) => {
    const totalSale = curr.hargaJual * curr.qty;
    let fee = 0;
    if (curr.platformFeeType === 'persen') {
      fee = (totalSale * curr.platformFeeValue) / 100;
    } else {
      fee = curr.platformFeeValue;
    }
    return acc + fee;
  }, 0);

  const extraOutExpenses = filteredSales.reduce((acc, curr) => acc + (curr.biayaOperasionalLuar || 0), 0);

  // 2. Calculate HPP total: product HPP + packing usage + courier/other + platform admin
  const productAndPackingHPP = filteredSales.reduce((acc, curr) => {
    const associatedProduct = products.find(p => p.id === curr.itemId);
    const hppValue = associatedProduct ? associatedProduct.hpp : 0;
    const packingUsages = curr.bahanPackingItems?.length
      ? curr.bahanPackingItems
      : curr.bahanPackingId
        ? [{ itemId: curr.bahanPackingId, qty: curr.bahanPackingQty }]
        : [];
    const packingHPP = packingUsages.reduce((total, usage) => {
      const packing = consumables.find(item => item.id === usage.itemId);
      return total + ((packing?.hargaBeliUnit || 0) * usage.qty);
    }, 0);

    return acc + (hppValue * curr.qty) + packingHPP;
  }, 0);

  const totalHPP = productAndPackingHPP + platformFees + extraOutExpenses;

  // 3. Calculate Laba Kotor (Omset - HPP)
  const labaKotor = omset - totalHPP;

  // 4. Calculate Operational Expenses from Beban Operasional: Event, Transportasi, and purchased consumables details
  const opExpensesTotal = filteredExpenses.reduce((acc, curr) => {
    const perlengkapanTotal = (curr.detailPerlengkapan || []).reduce(
      (total, item) => total + (item.harga || 0),
      0
    );

    return acc + curr.biayaEvent + curr.biayaTransportasi + perlengkapanTotal;
  }, 0);

  // 5. Calculate Laba Temp (Laba Kotor - biaya operasional)
  const labaTemp = labaKotor - opExpensesTotal;

  // 6. Return capital repayment (50% dari Laba Temp jika Laba Temp > 0)
  const bebanBalikModal = labaTemp > 0 ? labaTemp * 0.5 : 0;

  // 7. Balik Modal Awal Progress
  // Total hasil laba temp dikurangi biaya beban balik modal sebesar 50%
  // This means the returned amount accumulated is the "bebanBalikModal"
  const totalReturnedCapital = bebanBalikModal; 
  const remainingCapital = Math.max(0, modalAwal - totalReturnedCapital);
  const paybackPercentage = modalAwal > 0 ? Math.min(100, (totalReturnedCapital / modalAwal) * 100) : 0;

  // 8. Laba Bersih (Laba Temp - 50% beban balik modal)
  const labaBersih = labaTemp - bebanBalikModal;

  // 9. Total Pengeluaran (HPP total + Operational)
  const totalPengeluaran = totalHPP + opExpensesTotal;

  // 10. Top 10 Sales by Products
  const salesByProduct: { [sku: string]: { qty: number; total: number } } = {};
  filteredSales.forEach(sale => {
    const associatedProduct = products.find(p => p.id === sale.itemId);
    const sku = associatedProduct ? associatedProduct.sku : 'Produk Tidak Ditemukan';
    if (!salesByProduct[sku]) {
      salesByProduct[sku] = { qty: 0, total: 0 };
    }
    salesByProduct[sku].qty += sale.qty;
    salesByProduct[sku].total += sale.hargaJual * sale.qty;
  });

  const top10Sales = Object.entries(salesByProduct)
    .map(([sku, data]) => ({ sku, qty: data.qty, total: data.total }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  // Save Modal Awal Action
  const handleSaveModal = () => {
    const val = parseFloat(modalInput);
    if (!isNaN(val) && val >= 0) {
      onUpdateModalAwal(val);
      setIsEditingModal(false);
    }
  };

  // Recharts Data Setup
  const ratioData = [
    { name: 'Omset', nilai: omset, fill: '#06b6d4' }, // Cyan
    { name: 'Laba Kotor', nilai: Math.max(0, labaKotor), fill: '#14b8a6' }, // Teal
    { name: 'Laba Temp', nilai: Math.max(0, labaTemp), fill: '#f59e0b' }, // Amber
    { name: 'Laba Bersih', nilai: Math.max(0, labaBersih), fill: '#10b981' }, // Emerald
  ];

  const breakdownPieData = [
    { name: 'HPP Total', value: totalHPP, fill: '#f87171' }, // Red-400
    { name: 'Beban Operasional', value: opExpensesTotal, fill: '#fb923c' }, // Orange-400
    { name: 'Laba Bersih Tetap', value: Math.max(0, labaBersih), fill: '#34d399' }, // Green-400
    { name: 'Uang Balik Modal (50%)', value: Math.max(0, totalReturnedCapital), fill: '#60a5fa' }, // Blue-400
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Time Frame Controls */}
      <div className="flex flex-col gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-500 animate-pulse" />
              Ringkasan Bisnis
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Analisis kas masuk, profitabilitas kotor, beban operasional, dan laba bersih tercatat.
            </p>
          </div>
          <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-xl shadow-inner self-stretch sm:self-auto">
            {(['hari', 'bulan', 'tahun'] as PeriodType[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setSelectedPeriod(p);
                  // Reset edit state just in case
                  setModalInput(modalAwal.toString());
                }}
                className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-lg uppercase transition-all duration-200 ${
                  selectedPeriod === p
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {p === 'hari' ? 'Harian' : p === 'bulan' ? 'Bulanan' : 'Tahunan'}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Filter Controls */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50/50 -mx-5 -mb-5 p-5 rounded-b-2xl border-t">
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
                className="bg-white border border-slate-200 hover:border-cyan-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-mono font-medium transition-all shadow-xs"
              />
              <span className="text-[10px] text-slate-400 font-medium">
                Pilih tanggal spesifik untuk meninjau laporan harian
              </span>
            </div>
          )}

          {selectedPeriod === 'bulan' && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full">
              <div className="flex gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-white border border-slate-200 hover:border-cyan-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium transition-all shadow-xs cursor-pointer"
                >
                  {monthsList.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-white border border-slate-200 hover:border-cyan-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-mono font-medium transition-all shadow-xs cursor-pointer"
                >
                  {yearsList.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Saring data transaksi untuk bulan &amp; tahun terpilih
              </span>
            </div>
          )}

          {selectedPeriod === 'tahun' && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full">
              <select
                value={selectedYearOnly}
                onChange={(e) => setSelectedYearOnly(e.target.value)}
                className="bg-white border border-slate-200 hover:border-cyan-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-mono font-medium transition-all shadow-xs cursor-pointer"
              >
                {yearsList.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 font-medium">
                Evaluasi performa usaha sepanjang tahun mulai 2026 dan seterusnya
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CORE FRAME: Modal Awal & Balik Modal Progress Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Modal Awal Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Modal Awal Investasi</span>
              </div>
              <div className="relative">
                {isEditingModal ? (
                  <button 
                    onClick={handleSaveModal}
                    className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" /> Simpan
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setModalInput(modalAwal.toString());
                      setIsEditingModal(true);
                    }}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 rounded-lg transition-colors border border-slate-200"
                    title="Edit Modal Awal"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {isEditingModal ? (
              <div className="mt-2 space-y-2">
                <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3 py-1">
                  <span className="text-sm text-slate-500 font-bold mr-1">Rp</span>
                  <input
                    type="number"
                    value={modalInput}
                    onChange={(e) => setModalInput(e.target.value)}
                    className="w-full bg-transparent text-slate-800 py-1.5 px-1 font-mono text-lg focus:outline-none focus:ring-0"
                    placeholder="Masukkan modal awal..."
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Masukkan nilai nominal modal awal yang Anda gelontorkan untuk workshop ini.
                </p>
              </div>
            ) : (
              <div className="mt-2">
                <div className="text-3xl font-bold font-mono text-indigo-600 tracking-tight">
                  {formatIDR(modalAwal)}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Basis acuan likuiditas yang diinvestasikan pada fasilitas workshop Baselab.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <span>Sisa Modal Belum Balik:</span>
            <span className="font-mono font-bold text-red-600">{formatIDR(remainingCapital)}</span>
          </div>
        </div>

        {/* Balik Modal Progress */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-600" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Balik Modal Investasi</span>
              </div>
              <span className="text-xs font-bold font-mono px-2.5 py-1 bg-cyan-50 text-cyan-700 rounded-full border border-cyan-100 shadow-xs">
                {paybackPercentage.toFixed(1)}% Terpenuhi
              </span>
            </div>

            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-slate-800">
                  {formatIDR(totalReturnedCapital)}
                </span>
                <span className="text-xs text-slate-500">terkumpul dari 50% Laba Temp</span>
              </div>
              
              {/* Progressive Visual Bar */}
              <div className="mt-4 w-full bg-slate-100 rounded-full h-3 border border-slate-200 overflow-hidden shadow-inner">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-550"
                  style={{ width: `${paybackPercentage}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-5 leading-normal">
            Sesuai aturan operasional, <b>50% dari Laba Temp</b> dialokasikan langsung untuk mengembalikan modal awal investasi (Balik Modal), dan 50% sisanya dihitung sebagai Laba Bersih murni.
          </p>
        </div>
      </div>

      {/* SUB METRICS PANE 1: Omset, Laba Kotor, Laba Temp, Laba Bersih */}
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-6">Margin & Kas Bersih ({getPeriodLabel()})</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Omset */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all hover:shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium text-slate-500">Total Omset</span>
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl border border-cyan-100 shadow-xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-700">
            {formatIDR(omset)}
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            Hasil akumulasi total nilai order penjualan.
          </p>
        </div>

        {/* Laba Kotor */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all hover:shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium text-slate-500">Laba Kotor</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl border border-teal-100 shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-teal-700">
            {formatIDR(labaKotor)}
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            Omset dikurangi HPP (Modal Utama Filament & Packing).
          </p>
        </div>

        {/* Laba Temp */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all hover:shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium text-slate-500">Laba Temp</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shadow-xs">
              <Settings className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700">
            {formatIDR(labaTemp)}
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            Laba Kotor dikurangi pengeluaran operasional (Event + Logistik).
          </p>
        </div>

        {/* Laba Bersih */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all hover:shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium text-slate-500">Laba Bersih</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-xs">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            {formatIDR(labaBersih)}
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            Laba Temp dikurangi 50% cicilan balik modal awal.
          </p>
        </div>
      </div>

      {/* METRICS LEVEL 2: Visual Charts & Top Sales / Total Spend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
        
        {/* Chart Comparison */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-1">Rasio Keuangan ({getPeriodLabel()})</h4>
            <p className="text-xs text-slate-500 mb-4">Grafik tingkat kelayakan dari omset kotor hingga laba bersih pembukuan</p>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                   data={ratioData}
                   margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                >
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false}
                    tickFormatter={(v) => `Rp ${v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                    labelStyle={{ color: '#0f172a', fontWeight: 'bold', fontSize: '12px' }}
                    itemStyle={{ color: '#0ea5e9', fontSize: '11px' }}
                    formatter={(v: any) => [formatIDR(v), '']}
                  />
                  <Bar dataKey="nilai" radius={[6, 6, 0, 0]}>
                    {ratioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex justify-between items-center mt-3 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500">HPP + Operasional Terbayar:</span>
            <span className="font-mono text-xs font-bold text-red-600">{formatIDR(totalPengeluaran)}</span>
          </div>
        </div>

        {/* Top 10 Sales & Total Expend Sub-Metric 2 */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-1">Profil & Pengeluaran</h4>
            <p className="text-xs text-slate-500 mb-4">Total pengeluaran & distribusi unit model paling diminati.</p>
            
            {/* Total Spend Stat Block */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 mb-5 shadow-inner">
              <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">Total Pengeluaran Sesi ({getPeriodLabel()})</div>
              <div className="text-2xl font-bold font-mono text-red-600 tracking-tight">{formatIDR(totalPengeluaran)}</div>
              <div className="text-[10px] text-slate-500 mt-2 flex flex-wrap gap-x-2 gap-y-1">
                <span>• HPP: {formatIDR(totalHPP)}</span>
                <span>• Operasional: {formatIDR(opExpensesTotal)}</span>
                <span>• Admin & Ongkir: {formatIDR(platformFees + extraOutExpenses)}</span>
              </div>
            </div>

            {/* Top 10 Sales Products Progress Bars */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Produk Terlaris (Top 10 Pcs)</span>
              
              {top10Sales.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl text-xs text-slate-400 italic border border-dashed border-slate-250">
                  Belum ada produk yang terjual dalam periode ini.
                </div>
              ) : (
                <div className="space-y-3.5 max-h-44 overflow-y-auto pr-1">
                  {top10Sales.map((item, index) => {
                    const maxQty = Math.max(...top10Sales.map(t => t.qty));
                    const widthPercent = maxQty > 0 ? (item.qty / maxQty) * 100 : 0;
                    
                    return (
                      <div key={item.sku} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-700 truncate max-w-[180px]">{index + 1}. {item.sku}</span>
                          <span className="font-mono text-cyan-600 font-bold">{item.qty} pcs <span className="text-slate-400 text-[10px] font-normal">({formatIDR(item.total)})</span></span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-cyan-500 h-full rounded-full transition-all"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
