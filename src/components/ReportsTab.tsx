/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  DollarSign, 
  Box,
  Truck,
  Layers,
  Sparkles,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { 
  ProductItem, 
  OperatingExpense, 
  SaleTransaction, 
  ConsumableItem, 
  FilamentItem 
} from '../types';
import { formatIDR } from '../utils';

interface ReportsTabProps {
  sales: SaleTransaction[];
  expenses: OperatingExpense[];
  products: ProductItem[];
  consumables: ConsumableItem[];
  filaments: FilamentItem[];
}

export default function ReportsTab({
  sales,
  expenses,
  products,
  consumables,
  filaments,
}: ReportsTabProps) {
  const currentYear = new Date().getFullYear().toString();
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterMonth, setFilterMonth] = useState('ALL'); // 'ALL' or '01' through '12'

  const yearsList = ['2030', '2029', '2028', '2027', '2026'];
  const monthsList = [
    { value: 'ALL', label: 'Semua Bulan' },
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

  // Filtering lists based on month and year
  const getFilteredData = () => {
    const sFiltered = sales.filter(item => {
      if (!item.tanggal) return false;
      const [year, month] = item.tanggal.split('-');
      const yearMatch = year === filterYear;
      const monthMatch = filterMonth === 'ALL' || month === filterMonth;
      return yearMatch && monthMatch;
    });

    const eFiltered = expenses.filter(item => {
      if (!item.tanggal) return false;
      const [year, month] = item.tanggal.split('-');
      const yearMatch = year === filterYear;
      const monthMatch = filterMonth === 'ALL' || month === filterMonth;
      return yearMatch && monthMatch;
    });

    return { sFiltered, eFiltered };
  };

  const { sFiltered, eFiltered } = getFilteredData();

  // Financial aggregates setup
  const totalOmsetInflow = sFiltered.reduce((acc, curr) => acc + (curr.hargaJual * curr.qty), 0);
  const totalLunasInflow = sFiltered.filter(s => s.status === 'lunas').reduce((acc, curr) => acc + (curr.hargaJual * curr.qty), 0);
  const totalPendingInflow = sFiltered.filter(s => s.status === 'pending').reduce((acc, curr) => acc + (curr.hargaJual * curr.qty), 0);

  // Total HPP from products sold
  const totalHPP = sFiltered.reduce((acc, curr) => {
    const pMatched = products.find(p => p.id === curr.itemId);
    const cost = pMatched ? pMatched.hpp : 0;
    return acc + (cost * curr.qty);
  }, 0);

  // Platform admin commissions
  const totalPlatformFees = sFiltered.reduce((acc, curr) => {
    const totalSale = curr.hargaJual * curr.qty;
    let fee = 0;
    if (curr.platformFeeType === 'persen') {
      fee = (totalSale * curr.platformFeeValue) / 100;
    } else {
      fee = curr.platformFeeValue;
    }
    return acc + fee;
  }, 0);

  // Other extra costs
  const totalExtraOutExpenses = sFiltered.reduce((acc, curr) => acc + (curr.biayaOperasionalLuar || 0), 0);

  // Total operational budgets
  const totalOperationalCosts = eFiltered.reduce((acc, curr) => {
    const equipmentCost = (curr.detailPerlengkapan || []).reduce(
      (total, item) => total + (item.harga || 0),
      0
    );
    return acc + curr.biayaEvent + curr.biayaTransportasi + equipmentCost;
  }, 0);

  // Grand Cash Outflow (HPP + platform fees + external logistics + operational event/travel rules)
  const totalCashOutflow = totalHPP + totalPlatformFees + totalExtraOutExpenses + totalOperationalCosts;

  // Real margin computations
  const labaKotor = totalOmsetInflow - totalHPP;
  const labaTemp = labaKotor - totalOperationalCosts;
  const bebanBalikModal = labaTemp > 0 ? labaTemp * 0.5 : 0;
  const labaBersih = labaTemp - bebanBalikModal;

  const handleExportPDF = async () => {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);
    const monthLabel = monthsList.find(m => m.value === filterMonth)?.label || 'Semua-Bulan';
    const filename = `Laporan_Baselab_${filterYear}_${monthLabel.replace(/\s+/g, '_')}.pdf`;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const generatedAt = new Date().toLocaleString('id-ID', {
      dateStyle: 'long',
      timeStyle: 'short'
    });

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.text('BASELAB INVENTORY SYSTEM', margin, 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Laporan Keuangan dan Operasional Workshop 3D Printing', margin, 20);
    doc.text(`Periode: ${monthLabel} ${filterYear}`, pageWidth - margin, 13, { align: 'right' });
    doc.text(`Dibuat: ${generatedAt}`, pageWidth - margin, 20, { align: 'right' });

    const summaryItems = [
      { label: 'TOTAL OMZET', value: totalOmsetInflow, color: [8, 145, 178] },
      { label: 'PEMBAYARAN LUNAS', value: totalLunasInflow, color: [5, 150, 105] },
      { label: 'PIUTANG PENDING', value: totalPendingInflow, color: [217, 119, 6] },
      { label: 'TOTAL PENGELUARAN', value: totalCashOutflow, color: [220, 38, 38] },
      { label: 'LABA KOTOR', value: labaKotor, color: [79, 70, 229] },
      { label: 'LABA BERSIH', value: labaBersih, color: labaBersih >= 0 ? [5, 150, 105] : [220, 38, 38] }
    ];
    const cardGap = 4;
    const cardWidth = (pageWidth - (margin * 2) - (cardGap * 5)) / 6;

    summaryItems.forEach((item, index) => {
      const x = margin + index * (cardWidth + cardGap);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, 36, cardWidth, 24, 2, 2, 'FD');
      doc.setFillColor(item.color[0], item.color[1], item.color[2]);
      doc.rect(x, 36, 1.8, 24, 'F');
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.text(item.label, x + 5, 43);
      doc.setTextColor(item.color[0], item.color[1], item.color[2]);
      doc.setFontSize(10);
      doc.text(formatIDR(item.value), x + 5, 53);
    });

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Rincian Keuangan', margin, 69);

    autoTable(doc, {
      startY: 73,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [['Komponen', 'Nilai', 'Komponen', 'Nilai']],
      body: [
        ['HPP Produk', formatIDR(totalHPP), 'Biaya Platform', formatIDR(totalPlatformFees)],
        ['Beban Operasional', formatIDR(totalOperationalCosts), 'Biaya Kurir/Lainnya', formatIDR(totalExtraOutExpenses)],
        ['Laba Sebelum Balik Modal', formatIDR(labaTemp), 'Balik Modal (50%)', formatIDR(bebanBalikModal)]
      ],
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.5, textColor: [51, 65, 85] },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    const inventoryY = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Ringkasan Persediaan', margin, inventoryY);
    autoTable(doc, {
      startY: inventoryY + 4,
      margin: { left: margin, right: margin },
      theme: 'striped',
      head: [['Kategori', 'Jumlah Jenis', 'Total Stok', 'Nilai Persediaan']],
      body: [
        ['Produk Jadi', products.length, `${products.reduce((sum, item) => sum + item.stok, 0)} pcs`, formatIDR(products.reduce((sum, item) => sum + (item.hpp * item.stok), 0))],
        ['Bahan Packing', consumables.length, `${consumables.reduce((sum, item) => sum + item.stok, 0)} pcs`, formatIDR(consumables.reduce((sum, item) => sum + (item.hargaBeliUnit * item.stok), 0))],
        ['Bahan Baku', filaments.length, `${filaments.reduce((sum, item) => sum + item.stok, 0)} gram`, formatIDR(filaments.reduce((sum, item) => sum + (item.hargaBeliGrams * item.stok), 0))]
      ],
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.5, textColor: [51, 65, 85] },
      headStyles: { fillColor: [8, 145, 178], textColor: 255, fontStyle: 'bold' }
    });

    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Riwayat Penjualan (${sFiltered.length} transaksi)`, margin, 18);
    autoTable(doc, {
      startY: 23,
      margin: { left: margin, right: margin, bottom: 14 },
      theme: 'striped',
      head: [['Tanggal', 'Invoice / Pelanggan', 'Produk', 'Qty', 'Platform', 'Status', 'Harga Satuan', 'Total']],
      body: sFiltered.map(sale => {
        const product = products.find(item => item.id === sale.itemId);
        return [
          sale.tanggal,
          sale.invoicePelanggan,
          product?.sku || 'Produk tidak ditemukan',
          `${sale.qty} pcs`,
          sale.platformName,
          sale.status === 'lunas' ? 'Lunas' : 'Pending',
          formatIDR(sale.hargaJual),
          formatIDR(sale.hargaJual * sale.qty)
        ];
      }),
      styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2.2, overflow: 'linebreak', textColor: [51, 65, 85] },
      headStyles: { fillColor: [8, 145, 178], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 21 },
        1: { cellWidth: 38 },
        2: { cellWidth: 57 },
        3: { cellWidth: 16, halign: 'center' },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 29, halign: 'right' },
        7: { cellWidth: 31, halign: 'right' }
      }
    });

    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Beban Operasional (${eFiltered.length} catatan)`, margin, 18);
    autoTable(doc, {
      startY: 23,
      margin: { left: margin, right: margin, bottom: 14 },
      theme: 'striped',
      head: [['Tanggal', 'Event', 'Transportasi', 'Detail Perlengkapan', 'Biaya Perlengkapan', 'Total']],
      body: eFiltered.map(expense => {
        const equipmentCost = (expense.detailPerlengkapan || []).reduce((sum, item) => sum + (item.harga || 0), 0);
        const details = (expense.detailPerlengkapan || [])
          .map(item => `${item.nama} (${item.qty} pcs)`)
          .join(', ') || '-';
        return [
          expense.tanggal,
          formatIDR(expense.biayaEvent),
          formatIDR(expense.biayaTransportasi),
          details,
          formatIDR(equipmentCost),
          formatIDR(expense.biayaEvent + expense.biayaTransportasi + equipmentCost)
        ];
      }),
      styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2.4, overflow: 'linebreak', textColor: [51, 65, 85] },
      headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 32, halign: 'right' },
        2: { cellWidth: 32, halign: 'right' },
        3: { cellWidth: 91 },
        4: { cellWidth: 38, halign: 'right' },
        5: { cellWidth: 38, halign: 'right' }
      }
    });

    const pageCount = doc.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Baselab Inventory System - Dokumen dibuat otomatis', margin, pageHeight - 5);
      doc.text(`Halaman ${page} dari ${pageCount}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
    }

    doc.save(filename);
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fadeIn">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 animate-pulse" />
            Laporan Keuangan & Analitik Rugi Laba
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ekspor laporan keuangan resmi workshop, saring transaksi, serta lakukan evaluasi margin kinerja profitabilitas bulanan.
          </p>
        </div>

        {/* Dynamic Filters */}
        <div className="flex flex-wrap gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200">
          {/* Year selector */}
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="bg-white border border-slate-250 rounded-lg px-3 py-1.5 text-xs text-slate-705 outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {yearsList.map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
          {/* Month selector */}
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="bg-white border border-slate-250 rounded-lg px-3 py-1.5 text-xs text-slate-705 outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {monthsList.map(mo => (
              <option key={mo.value} value={mo.value}>{mo.label}</option>
            ))}
          </select>

          {/* Direct PDF downloader button */}
          <button
            onClick={handleExportPDF}
            className="bg-red-600 hover:bg-red-500 text-white font-semibold text-xs px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <Download className="w-3.5 h-3.5" /> Ekspor PDF
          </button>
        </div>
      </div>

      {/* Cash In & Out Aggregates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Cash Inflow Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-cyan-50/60 rounded-full blur-xl animate-pulse"></div>
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Total Arus Kas Masuk (Omset)</span>
              <span className="text-2xl font-bold font-mono text-cyan-600 mt-1 block">{formatIDR(totalOmsetInflow)}</span>
            </div>
            <div className="p-2 bg-cyan-50 text-cyan-650 rounded-xl border border-cyan-100">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-500 flex justify-between pt-2 border-t border-slate-100 mt-4">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              Lunas: {formatIDR(totalLunasInflow)}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Piutang: {formatIDR(totalPendingInflow)}
            </span>
          </div>
        </div>

        {/* Cash Outflow Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-red-50/60 rounded-full blur-xl"></div>
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Total Arus Kas Keluar (Pengeluaran)</span>
              <span className="text-2xl font-bold font-mono text-red-655 mt-1 block">{formatIDR(totalCashOutflow)}</span>
            </div>
            <div className="p-2 bg-red-50 text-red-600 rounded-xl border border-red-100">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-500 flex justify-between pt-2 border-t border-slate-100 mt-4">
            <span>Prod HPP: {formatIDR(totalHPP)}</span>
            <span>Beban Ops: {formatIDR(totalOperationalCosts)}</span>
            <span>Admin & Ongk: {formatIDR(totalPlatformFees + totalExtraOutExpenses)}</span>
          </div>
        </div>

        {/* Laba Bersih Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50/60 rounded-full blur-xl"></div>
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Laba Bersih Workshop</span>
              <span className={`text-2xl font-bold font-mono mt-1 block ${labaBersih >= 0 ? 'text-emerald-600' : 'text-red-650'}`}>
                {labaBersih >= 0 ? '+' : ''}{formatIDR(labaBersih)}
              </span>
            </div>
            <div className={`p-2 rounded-xl border ${labaBersih >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-500 flex justify-between pt-2 border-t border-slate-100 mt-4">
            <span>Rincian Laba Kotor: {formatIDR(labaKotor)}</span>
            <span>Uang Balik Modal (50%): {formatIDR(bebanBalikModal)}</span>
          </div>
        </div>
      </div>

      {/* Side-by-side transaction log review */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Filtered Outflow table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs animate-fadeIn">
          <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <ArrowDownRight className="w-4 h-4 text-red-600" />
              Saringan Arus Kas Keluar ({eFiltered.length} Data)
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {eFiltered.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 italic">
                Tidak ada pengeluaran operasional terdaftar pada saringan ini.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-100 text-[11px] text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Tanggal</th>
                    <th className="px-4 py-2.5">Rincian Acara</th>
                    <th className="px-4 py-2.5">Logistik</th>
                    <th className="px-4 py-2.5">Perlengkapan Belanja</th>
                    <th className="px-4 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {eFiltered.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/40">
                      <td className="px-4 py-2.5 whitespace-nowrap font-medium text-slate-800">{exp.tanggal}</td>
                      <td className="px-4 py-2.5 font-mono text-indigo-650 font-semibold">{formatIDR(exp.biayaEvent)}</td>
                      <td className="px-4 py-2.5 font-mono text-cyan-650 font-semibold">{formatIDR(exp.biayaTransportasi)}</td>
                      <td className="px-4 py-2.5">
                        {exp.detailPerlengkapan && exp.detailPerlengkapan.length > 0 ? (
                          <div className="flex flex-col gap-0.5 max-w-[120px] truncate">
                            {exp.detailPerlengkapan.map((d, i) => (
                              <span key={i} className="text-[9px] text-slate-505">• {d.nama} ({d.qty}pcs)</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap font-mono font-bold text-right text-red-600">
                        {formatIDR(
                          exp.biayaEvent +
                          exp.biayaTransportasi +
                          (exp.detailPerlengkapan || []).reduce((sum, item) => sum + (item.harga || 0), 0)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Filtered Inflows table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs animate-fadeIn">
          <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-cyan-600" />
              Saringan Arus Kas Masuk ({sFiltered.length} Data)
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {sFiltered.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 italic">
                Tidak ada pesanan penjualan terdaftar pada saringan ini.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-100 text-[11px] text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Tanggal</th>
                    <th className="px-4 py-2.5">Invoice</th>
                    <th className="px-4 py-2.5 text-center">Qty</th>
                    <th className="px-4 py-2.5">Platform</th>
                    <th className="px-4 py-2.5 text-right">Harga Jual</th>
                    <th className="px-4 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {sFiltered.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/40">
                      <td className="px-4 py-2.5 whitespace-nowrap font-medium text-slate-800">{sale.tanggal}</td>
                      <td className="px-4 py-2.5 truncate max-w-[100px] text-slate-500 font-mono">{sale.invoicePelanggan}</td>
                      <td className="px-4 py-2.5 font-mono text-center text-slate-705 font-medium">{sale.qty} pcs</td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-cyan-700 font-semibold">{sale.platformName}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-450 text-right">{formatIDR(sale.hargaJual)}</td>
                      <td className="px-4 py-2.5 font-mono font-bold text-right text-emerald-600">
                        {formatIDR(sale.hargaJual * sale.qty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
