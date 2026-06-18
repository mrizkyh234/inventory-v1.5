/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Layers, 
  Car, 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  FileText, 
  LogOut, 
  User, 
  Lock, 
  Mail, 
  AlertCircle, 
  Cpu, 
  Settings, 
  Database,
  CloudLightning,
  Sparkles,
  RefreshCw,
  HardDrive,
  Upload,
  Camera,
  X
} from 'lucide-react';
import { supabase, getSupabaseConfig } from './lib/supabase';
import { 
  ConsumableItem, 
  FilamentItem, 
  ProductItem, 
  OperatingExpense, 
  SaleTransaction, 
  PeriodType 
} from './types';

// Tab components
import DashboardTab from './components/DashboardTab';
import BebanOperasionalTab from './components/BebanOperasionalTab';
import StokBahanTab from './components/StokBahanTab';
import StokProdukTab from './components/StokProdukTab';
import SalesTab from './components/SalesTab';
import ReportsTab from './components/ReportsTab';

// --- INITIAL REALISTIC MOCK DATA (For instant visual appeal) ---
const INITIAL_MODAL_AWAL = 15000000; // Rp 15.000.000

const INITIAL_CONSUMABLES: ConsumableItem[] = [
  { id: 'c1', nama: 'Kardus Packing Baselab 15x15x15', stok: 45, hargaBeliUnit: 3500, minStok: 5, kategori: 'sekali_pakai' },
  { id: 'c2', nama: 'Bubble Wrap Premium Roll 50m', stok: 6, hargaBeliUnit: 42000, minStok: 3, kategori: 'sekali_pakai' },
  { id: 'c3', nama: 'Plastik Stretch Film Wrap', stok: 20, hargaBeliUnit: 12000, minStok: 6, kategori: 'sekali_pakai' },
];

const INITIAL_FILAMENTS: FilamentItem[] = [
  { id: 'f1', nama: 'PLA Prime Jet Black (eSun)', stok: 1250, hargaBeliGrams: 280, minStok: 500, kategori: 'bahan_baku' },
  { id: 'f2', nama: 'PETG Space Grey (SUNLU)', stok: 800, hargaBeliGrams: 320, minStok: 250, kategori: 'bahan_baku' },
  { id: 'f3', nama: 'PLA Silk Gold (Creality)', stok: 450, hargaBeliGrams: 350, minStok: 100, kategori: 'bahan_baku' },
];

const INITIAL_PRODUCTS: ProductItem[] = [
  { id: 'p1', sku: 'Skull Head Pen Container (Medium)', stok: 14, hpp: 16500, hargaJual: 45000, foto: '' },
  { id: 'p2', sku: 'Pegboard Modular Baselab 20x20', stok: 8, hpp: 22000, hargaJual: 55000, foto: '' },
  { id: 'p3', sku: 'Articulated Dragon Jointed Toy', stok: 5, hpp: 14500, hargaJual: 35000, foto: '' },
];

const INITIAL_EXPENSES: OperatingExpense[] = [
  { id: 'e1', tanggal: '2026-06-10', biayaEvent: 250000, biayaTransportasi: 45000, detailPerlengkapan: [{ nama: 'Lakban Cokelat 2 Pcs', qty: 2 }] },
  { id: 'e2', tanggal: '2026-06-15', biayaEvent: 0, biayaTransportasi: 25000, detailPerlengkapan: [{ nama: 'Isolatip Kertas', qty: 1 }] },
];

const INITIAL_SALES: SaleTransaction[] = [
  {
    id: 's1',
    tanggal: '2026-06-12',
    invoicePelanggan: 'BUDI-TOKOPEDIA99',
    itemId: 'p1',
    qty: 2,
    hargaJual: 45000,
    bahanPackingId: 'c1',
    bahanPackingQty: 2,
    bahanBakuId: 'f1',
    bahanBakuQtyGrams: 180,
    biayaOperasionalLuar: 10000,
    platformName: 'Tokopedia',
    platformFeeType: 'persen',
    platformFeeValue: 3.5,
    status: 'lunas'
  },
  {
    id: 's2',
    tanggal: '2026-06-16',
    invoicePelanggan: 'INV-88126_SHOPEE',
    itemId: 'p2',
    qty: 1,
    hargaJual: 55000,
    bahanPackingId: 'c1',
    bahanPackingQty: 1,
    bahanBakuId: 'f2',
    bahanBakuQtyGrams: 350,
    biayaOperasionalLuar: 5000,
    platformName: 'Shopee',
    platformFeeType: 'persen',
    platformFeeValue: 5,
    status: 'lunas'
  },
  {
    id: 's3',
    tanggal: '2026-06-17',
    invoicePelanggan: 'SUTAN-OFFLINE',
    itemId: 'p3',
    qty: 3,
    hargaJual: 35000,
    bahanPackingId: 'c3',
    bahanPackingQty: 1,
    bahanBakuId: 'f3',
    bahanBakuQtyGrams: 140,
    biayaOperasionalLuar: 0,
    platformName: 'Direct',
    platformFeeType: 'rupiah',
    platformFeeValue: 0,
    status: 'pending'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'beban' | 'stok_bahan' | 'stok_produk' | 'sales' | 'reports'>('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('bulan');

  // User Profile Custom States (URL and Base64 supported)
  const [profileName, setProfileName] = useState<string>(() => {
    return localStorage.getItem('baselab_profile_name') || 'Operator Baselab';
  });
  const [profileImage, setProfileImage] = useState<string>(() => {
    return localStorage.getItem('baselab_profile_image') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80';
  });
  const [loginLogo, setLoginLogo] = useState<string>(() => {
    return localStorage.getItem('baselab_login_logo') || '';
  });
  const [loginHeader, setLoginHeader] = useState<string>(() => {
    return localStorage.getItem('baselab_login_header') || '';
  });
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [activeModalTab, setActiveModalTab] = useState<'profile' | 'branding'>('profile');

  // Supabase states
  const [{ url, anonKey }, setConfig] = useState(getSupabaseConfig());
  const isSupabaseConfigured = !!(url && anonKey && supabase);
  const [userSession, setUserSession] = useState<any>(null);
  const [runSandboxMode, setRunSandboxMode] = useState(!isSupabaseConfigured);

  // Auth states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);

  // Core application database tables
  const [modalAwal, setModalAwal] = useState<number>(INITIAL_MODAL_AWAL);
  const [consumables, setConsumables] = useState<ConsumableItem[]>(INITIAL_CONSUMABLES);
  const [filaments, setFilaments] = useState<FilamentItem[]>(INITIAL_FILAMENTS);
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [expenses, setExpenses] = useState<OperatingExpense[]>(INITIAL_EXPENSES);
  const [sales, setSales] = useState<SaleTransaction[]>(INITIAL_SALES);

  // Toast Alerts & Notification states
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'failed'>('idle');
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // -------------------------------------------------------------
  // LIFE CYCLE: Handle Auth Status & Dynamic States Initialization
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isSupabaseConfigured) {
      loadLocalStateFallback();
      return;
    }

    // Capture initial session
    supabase!.auth.getSession().then(({ data: { session } }) => {
      setUserSession(session);
      if (session) {
        setRunSandboxMode(false);
        fetchSupabaseData(session.user.id);
      } else {
        loadLocalStateFallback();
      }
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      setUserSession(session);
      if (session) {
        setRunSandboxMode(false);
        fetchSupabaseData(session.user.id);
      } else {
        loadLocalStateFallback();
      }
    });

    return () => subscription.unsubscribe();
  }, [url, anonKey]);

  // Load state fallback from localStorage
  const loadLocalStateFallback = () => {
    const localModal = localStorage.getItem('baselab_modal_awal');
    const localConsumables = localStorage.getItem('baselab_consumables');
    const localFilaments = localStorage.getItem('baselab_filaments');
    const localProducts = localStorage.getItem('baselab_products');
    const localExpenses = localStorage.getItem('baselab_expenses');
    const localSales = localStorage.getItem('baselab_sales');

    if (localModal) setModalAwal(Number(localModal));
    if (localConsumables) setConsumables(JSON.parse(localConsumables));
    if (localFilaments) setFilaments(JSON.parse(localFilaments));
    if (localProducts) setProducts(JSON.parse(localProducts));
    if (localExpenses) setExpenses(JSON.parse(localExpenses));
    if (localSales) setSales(JSON.parse(localSales));
  };

  // Save changes locally (always runs, providing immediate persistence)
  const saveLocalStateFallback = (
    updatedModal: number,
    updatedCons: ConsumableItem[],
    updatedFils: FilamentItem[],
    updatedProds: ProductItem[],
    updatedExps: OperatingExpense[],
    updatedSales: SaleTransaction[]
  ) => {
    localStorage.setItem('baselab_modal_awal', updatedModal.toString());
    localStorage.setItem('baselab_consumables', JSON.stringify(updatedCons));
    localStorage.setItem('baselab_filaments', JSON.stringify(updatedFils));
    localStorage.setItem('baselab_products', JSON.stringify(updatedProds));
    localStorage.setItem('baselab_expenses', JSON.stringify(updatedExps));
    localStorage.setItem('baselab_sales', JSON.stringify(updatedSales));
  };

  const handleConfigChanged = () => {
    const rawConfig = getSupabaseConfig();
    setConfig(rawConfig);
    if (!rawConfig.url || !rawConfig.anonKey) {
      setRunSandboxMode(true);
      setUserSession(null);
      loadLocalStateFallback();
      showToast('Database diputuskan. Menggunakan Penyimpanan Lokal.', 'warning');
    } else {
      showToast('Konfigurasi Supabase disimpan! Silakan masuk/buat akun.', 'success');
    }
  };

  // -------------------------------------------------------------
  // SUPABASE DATA SYNC FETCH / SAVE METHODS
  // -------------------------------------------------------------
  const fetchSupabaseData = async (userId: string) => {
    if (!supabase) return;
    setSyncStatus('syncing');
    try {
      // 1. Fetch user settings (Modal Awal)
      const { data: setts, error: errSet } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      const remoteModal = setts ? Number(setts.modal_awal) : INITIAL_MODAL_AWAL;
      setModalAwal(remoteModal);

      // If user settings don't exist yet, insert them
      if (errSet && errSet.code === 'PGRST116') {
        await supabase.from('user_settings').insert({ user_id: userId, modal_awal: INITIAL_MODAL_AWAL });
      }

      // 2. Fetch consumables
      const { data: cons, error: errCons } = await supabase
        .from('consumable_items')
        .select('*')
        .eq('user_id', userId);
      if (!errCons && cons) {
        // Map keys if needed
        setConsumables(cons.map((c: any) => ({
          id: c.id,
          nama: c.nama,
          stok: Number(c.stok),
          hargaBeliUnit: Number(c.harga_beli_unit),
          minStok: Number(c.min_stok),
          kategori: 'sekali_pakai',
        })));
      }

      // 3. Fetch filaments
      const { data: fils, error: errFils } = await supabase
        .from('filament_items')
        .select('*')
        .eq('user_id', userId);
      if (!errFils && fils) {
        setFilaments(fils.map((f: any) => ({
          id: f.id,
          nama: f.nama,
          stok: Number(f.stok),
          hargaBeliGrams: Number(f.harga_beli_grams),
          minStok: Number(f.min_stok),
          kategori: 'bahan_baku'
        })));
      }

      // 4. Fetch Products
      const { data: prods, error: errProds } = await supabase
        .from('product_items')
        .select('*')
        .eq('user_id', userId);
      if (!errProds && prods) {
        setProducts(prods.map((p: any) => ({
          id: p.id,
          foto: p.foto,
          sku: p.sku,
          stok: Number(p.stok),
          hpp: Number(p.hpp),
          hargaJual: Number(p.harga_jual)
        })));
      }

      // 5. Fetch expenses
      const { data: exps, error: errExps } = await supabase
        .from('operating_expenses')
        .select('*')
        .eq('user_id', userId);
      if (!errExps && exps) {
        setExpenses(exps.map((e: any) => ({
          id: e.id,
          tanggal: e.tanggal,
          biayaEvent: Number(e.biaya_event),
          biayaTransportasi: Number(e.biaya_transportasi),
          detailPerlengkapan: e.detail_perlengkapan || []
        })));
      }

      // 6. Fetch Sales
      const { data: sles, error: errSles } = await supabase
        .from('sales_transactions')
        .select('*')
        .eq('user_id', userId);
      if (!errSles && sles) {
        setSales(sles.map((s: any) => ({
          id: s.id,
          tanggal: s.tanggal,
          invoicePelanggan: s.invoice_pelanggan,
          itemId: s.item_id,
          qty: Number(s.qty),
          hargaJual: Number(s.harga_jual),
          bahanPackingId: s.bahan_packing_id || '',
          bahanPackingQty: Number(s.bahan_packing_qty || 0),
          bahanPackingItems: Array.isArray(s.bahan_packing_items)
            ? s.bahan_packing_items.map((item: any) => ({ itemId: item.itemId, qty: Number(item.qty || 0) }))
            : [],
          bahanBakuId: s.bahan_baku_id || '',
          bahanBakuQtyGrams: Number(s.bahan_baku_qty_grams || 0),
          bahanBakuItems: Array.isArray(s.bahan_baku_items)
            ? s.bahan_baku_items.map((item: any) => ({ itemId: item.itemId, qty: Number(item.qty || 0) }))
            : [],
          biayaOperasionalLuar: Number(s.biaya_operasional_luar || 0),
          platformName: s.platform_name,
          platformFeeType: s.platform_fee_type as 'rupiah' | 'persen',
          platformFeeValue: Number(s.platform_fee_value || 0),
          status: s.status as 'lunas' | 'pending'
        })));
      }

      setSyncStatus('synced');
    } catch (e: any) {
      console.error('Fetch error: Tables might not have been created yet on your Supabase cluster.', e);
      setSyncStatus('failed');
      showToast('Gagal memuat awalan tabel. Coba jalankan skema SQL di atas!', 'error');
    }
  };

  // -------------------------------------------------------------
  // CRUD ACTIONS (Offline Local & Supabase cloud parallel execution)
  // -------------------------------------------------------------

  // Helper inside auth
  const getUserId = () => userSession?.user?.id || null;

  // 1. UPDATE INITIAL CAPITAL (Modal Awal)
  const updateModalAwalAction = async (value: number) => {
    const updatedModal = Math.max(0, value);
    setModalAwal(updatedModal);
    saveLocalStateFallback(updatedModal, consumables, filaments, products, expenses, sales);

    const uid = getUserId();
    if (supabase && uid) {
      try {
        await supabase
          .from('user_settings')
          .upsert({ user_id: uid, modal_awal: updatedModal }, { onConflict: 'user_id' });
        showToast('Modal awal berhasil diperbarui online!', 'success');
      } catch (err) {
        console.error(err);
      }
    } else {
      showToast('Modal awal disimpan lokal.', 'success');
    }
  };

  // 2. BEBAN OPERASIONAL CRUD
  const addExpenseAction = async (item: Omit<OperatingExpense, 'id'>) => {
    const newId = crypto.randomUUID();
    const newExpense: OperatingExpense = { id: newId, ...item };
    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    saveLocalStateFallback(modalAwal, consumables, filaments, products, updated, sales);

    const uid = getUserId();
    if (supabase && uid) {
      try {
        await supabase.from('operating_expenses').insert({
          id: newId,
          user_id: uid,
          tanggal: item.tanggal,
          biaya_event: item.biayaEvent,
          biaya_transportasi: item.biayaTransportasi,
          detail_perlengkapan: item.detailPerlengkapan
        });
        showToast('Pengeluaran berhasil disimpan online!', 'success');
      } catch (err) {
        showToast('Gagal menyimpan online. Menggunakan penyimpanan lokal.', 'warning');
      }
    } else {
      showToast('Pengeluaran ditambahkan ke kas lokal.', 'success');
    }
  };

  const updateExpenseAction = async (id: string, item: Omit<OperatingExpense, 'id'>) => {
    const updated = expenses.map(e => e.id === id ? { ...e, ...item } : e);
    setExpenses(updated);
    saveLocalStateFallback(modalAwal, consumables, filaments, products, updated, sales);

    const uid = getUserId();
    if (supabase && uid) {
      try {
        await supabase.from('operating_expenses').update({
          tanggal: item.tanggal,
          biaya_event: item.biayaEvent,
          biaya_transportasi: item.biayaTransportasi,
          detail_perlengkapan: item.detailPerlengkapan
        }).eq('id', id);
        showToast('Pengeluaran diperbarui online!', 'success');
      } catch (err) {
        showToast('Gagal sinkron.', 'warning');
      }
    } else {
      showToast('Pengeluaran disimpan.', 'success');
    }
  };

  const deleteExpenseAction = async (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    saveLocalStateFallback(modalAwal, consumables, filaments, products, updated, sales);

    if (supabase && getUserId()) {
      try {
        await supabase.from('operating_expenses').delete().eq('id', id);
        showToast('Pengeluaran terhapus online!', 'success');
      } catch (err) {
        showToast('Terhapus lokal.', 'warning');
      }
    } else {
      showToast('Pengeluaran terhapus.', 'success');
    }
  };

  // 3. STOK BAHAN - PACKING & WRAPPING CRUD
  const addConsumableAction = async (item: Omit<ConsumableItem, 'id'>) => {
    const newId = crypto.randomUUID();
    const newItem: ConsumableItem = { id: newId, ...item };
    const updated = [...consumables, newItem];
    setConsumables(updated);
    saveLocalStateFallback(modalAwal, updated, filaments, products, expenses, sales);

    const uid = getUserId();
    if (supabase && uid) {
      try {
        await supabase.from('consumable_items').insert({
          id: newId,
          user_id: uid,
          nama: item.nama,
          stok: item.stok,
          harga_beli_unit: item.hargaBeliUnit,
          min_stok: item.minStok,
          kategori: 'sekali_pakai'
        });
        showToast('Bahan kemasan baru terdaftar online!', 'success');
      } catch (err) {
        console.error(err);
      }
    } else {
      showToast('Bahan berhasil terdaftar.', 'success');
    }
  };

  const updateConsumableAction = async (id: string, item: Omit<ConsumableItem, 'id'>) => {
    const updated = consumables.map(c => c.id === id ? { ...c, ...item } : c);
    setConsumables(updated);
    saveLocalStateFallback(modalAwal, updated, filaments, products, expenses, sales);

    if (supabase && getUserId()) {
      try {
        await supabase.from('consumable_items').update({
          nama: item.nama,
          stok: item.stok,
          harga_beli_unit: item.hargaBeliUnit,
          min_stok: item.minStok,
        }).eq('id', id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const deleteConsumableAction = async (id: string) => {
    const updated = consumables.filter(c => c.id !== id);
    setConsumables(updated);
    saveLocalStateFallback(modalAwal, updated, filaments, products, expenses, sales);

    if (supabase && getUserId()) {
      try {
        await supabase.from('consumable_items').delete().eq('id', id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // 4. STOK BAHAN - FILAMENT CRUD
  const addFilamentAction = async (item: Omit<FilamentItem, 'id'>) => {
    const newId = crypto.randomUUID();
    const newItem: FilamentItem = { id: newId, ...item };
    const updated = [...filaments, newItem];
    setFilaments(updated);
    saveLocalStateFallback(modalAwal, consumables, updated, products, expenses, sales);

    const uid = getUserId();
    if (supabase && uid) {
      try {
        await supabase.from('filament_items').insert({
          id: newId,
          user_id: uid,
          nama: item.nama,
          stok: item.stok,
          harga_beli_grams: item.hargaBeliGrams,
          min_stok: item.minStok,
          kategori: 'bahan_baku'
        });
        showToast('Filament baru terdaftar online!', 'success');
      } catch (err) {
        console.error(err);
      }
    } else {
      showToast('Filament terdaftar.', 'success');
    }
  };

  const updateFilamentAction = async (id: string, item: Omit<FilamentItem, 'id'>) => {
    const updated = filaments.map(f => f.id === id ? { ...f, ...item } : f);
    setFilaments(updated);
    saveLocalStateFallback(modalAwal, consumables, updated, products, expenses, sales);

    if (supabase && getUserId()) {
      try {
        await supabase.from('filament_items').update({
          nama: item.nama,
          stok: item.stok,
          harga_beli_grams: item.hargaBeliGrams,
          min_stok: item.minStok,
        }).eq('id', id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const deleteFilamentAction = async (id: string) => {
    const updated = filaments.filter(f => f.id !== id);
    setFilaments(updated);
    saveLocalStateFallback(modalAwal, consumables, updated, products, expenses, sales);

    if (supabase && getUserId()) {
      try {
        await supabase.from('filament_items').delete().eq('id', id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // 5. STOK PRODUK CATALOGUE CRUD
  const addProductAction = async (item: Omit<ProductItem, 'id'>) => {
    const newId = crypto.randomUUID();
    const newItem: ProductItem = { id: newId, ...item };
    const updated = [...products, newItem];
    setProducts(updated);
    saveLocalStateFallback(modalAwal, consumables, filaments, updated, expenses, sales);

    const uid = getUserId();
    if (supabase && uid) {
      try {
        await supabase.from('product_items').insert({
          id: newId,
          user_id: uid,
          foto: item.foto,
          sku: item.sku,
          stok: item.stok,
          hpp: item.hpp,
          harga_jual: item.hargaJual
        });
        showToast('Produk baru berhasil didaftarkan!', 'success');
      } catch (err) {
        console.error(err);
      }
    } else {
      showToast('Produk dicatat lokal.', 'success');
    }
  };

  const updateProductAction = async (id: string, item: Omit<ProductItem, 'id'>) => {
    const updated = products.map(p => p.id === id ? { ...p, ...item } : p);
    setProducts(updated);
    saveLocalStateFallback(modalAwal, consumables, filaments, updated, expenses, sales);

    if (supabase && getUserId()) {
      try {
        await supabase.from('product_items').update({
          foto: item.foto,
          sku: item.sku,
          stok: item.stok,
          hpp: item.hpp,
          harga_jual: item.hargaJual
        }).eq('id', id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const deleteProductAction = async (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    saveLocalStateFallback(modalAwal, consumables, filaments, updated, expenses, sales);

    if (supabase && getUserId()) {
      try {
        await supabase.from('product_items').delete().eq('id', id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // 6. SALES TRANSACTIONS CRUD (With trigger for automatic stock reductions)
  const addSaleAction = async (item: Omit<SaleTransaction, 'id'>) => {
    const newId = crypto.randomUUID();
    const newSale: SaleTransaction = { id: newId, ...item };
    const updatedSales = [newSale, ...sales];

    // AUTOMATIC STOCK REDUCTION IF 'lunas':
    // Deduct products, packaging consumables, and filament grams
    let updatedProds = [...products];
    let updatedCons = [...consumables];
    let updatedFils = [...filaments];
    const packingUsages = item.bahanPackingItems?.length
      ? item.bahanPackingItems
      : item.bahanPackingId
        ? [{ itemId: item.bahanPackingId, qty: item.bahanPackingQty }]
        : [];
    const bakuUsages = item.bahanBakuItems?.length
      ? item.bahanBakuItems
      : item.bahanBakuId
        ? [{ itemId: item.bahanBakuId, qty: item.bahanBakuQtyGrams }]
        : [];

    if (item.status === 'lunas') {
      // 1. Deduct Product catalog Stock
      updatedProds = products.map(p => {
        if (p.id === item.itemId) {
          return { ...p, stok: Math.max(0, p.stok - item.qty) };
        }
        return p;
      });

      // 2. Deduct packing wrap
      updatedCons = consumables.map(c => {
        const totalUsed = packingUsages
          .filter(usage => usage.itemId === c.id)
          .reduce((total, usage) => total + usage.qty, 0);
        return totalUsed > 0 ? { ...c, stok: Math.max(0, c.stok - totalUsed) } : c;
      });

      // 3. Deduct filament weight grams
      updatedFils = filaments.map(f => {
        const totalUsed = bakuUsages
          .filter(usage => usage.itemId === f.id)
          .reduce((total, usage) => total + usage.qty, 0);
        return totalUsed > 0 ? { ...f, stok: Math.max(0, f.stok - totalUsed) } : f;
      });
    }

    setSales(updatedSales);
    setProducts(updatedProds);
    setConsumables(updatedCons);
    setFilaments(updatedFils);
    
    saveLocalStateFallback(modalAwal, updatedCons, updatedFils, updatedProds, expenses, updatedSales);

    // Parallel offline / online execution
    const uid = getUserId();
    if (supabase && uid) {
      try {
        // Post transaction online
        await supabase.from('sales_transactions').insert({
          id: newId,
          user_id: uid,
          tanggal: item.tanggal,
          invoice_pelanggan: item.invoicePelanggan,
          item_id: item.itemId,
          qty: item.qty,
          harga_jual: item.hargaJual,
          bahan_packing_id: item.bahanPackingId || null,
          bahan_packing_qty: item.bahanPackingQty,
          bahan_packing_items: packingUsages,
          bahan_baku_id: item.bahanBakuId || null,
          bahan_baku_qty_grams: item.bahanBakuQtyGrams,
          bahan_baku_items: bakuUsages,
          biaya_operasional_luar: item.biayaOperasionalLuar,
          platform_name: item.platformName,
          platform_fee_type: item.platformFeeType,
          platform_fee_value: item.platformFeeValue,
          status: item.status
        });

        // Parallel update stock online
        if (item.status === 'lunas') {
          const matchedProd = products.find(p => p.id === item.itemId);
          if (matchedProd) {
            await supabase.from('product_items').update({ stok: Math.max(0, matchedProd.stok - item.qty) }).eq('id', item.itemId);
          }
          await Promise.all(updatedCons.map(async material => {
            const original = consumables.find(c => c.id === material.id);
            if (original && original.stok !== material.stok) {
              await supabase.from('consumable_items').update({ stok: material.stok }).eq('id', material.id);
            }
          }));
          await Promise.all(updatedFils.map(async material => {
            const original = filaments.find(f => f.id === material.id);
            if (original && original.stok !== material.stok) {
              await supabase.from('filament_items').update({ stok: material.stok }).eq('id', material.id);
            }
          }));
        }

        showToast('Transaksi tercatat & disinkronisasi online!', 'success');
      } catch (err) {
        showToast('Disimpan lokal.', 'warning');
      }
    } else {
      showToast(item.status === 'lunas' ? 'Transaksi lunas: Stok & bahan otomatis dikurangi!' : 'Transaksi pending disimpan!', 'success');
    }
  };

  const updateSaleAction = async (id: string, item: Omit<SaleTransaction, 'id'>) => {
    // If updating transaction, we compute what is modified. Simple complete sync.
    const updatedSales = sales.map(s => s.id === id ? { ...s, ...item } : s);
    setSales(updatedSales);
    saveLocalStateFallback(modalAwal, consumables, filaments, products, expenses, updatedSales);

    const uid = getUserId();
    if (supabase && uid) {
      try {
        await supabase.from('sales_transactions').update({
          tanggal: item.tanggal,
          invoice_pelanggan: item.invoicePelanggan,
          item_id: item.itemId,
          qty: item.qty,
          harga_jual: item.hargaJual,
          bahan_packing_id: item.bahanPackingId || null,
          bahan_packing_qty: item.bahanPackingQty,
          bahan_packing_items: item.bahanPackingItems || [],
          bahan_baku_id: item.bahanBakuId || null,
          bahan_baku_qty_grams: item.bahanBakuQtyGrams,
          bahan_baku_items: item.bahanBakuItems || [],
          biaya_operasional_luar: item.biayaOperasionalLuar,
          platform_name: item.platformName,
          platform_fee_type: item.platformFeeType,
          platform_fee_value: item.platformFeeValue,
          status: item.status
        }).eq('id', id);
        showToast('Transaksi diperbarui online!', 'success');
      } catch (err) {
        console.error(err);
      }
    } else {
      showToast('Transaksi diperbarui!', 'success');
    }
  };

  const deleteSaleAction = async (id: string) => {
    const updatedSales = sales.filter(s => s.id !== id);
    setSales(updatedSales);
    saveLocalStateFallback(modalAwal, consumables, filaments, products, expenses, updatedSales);

    if (supabase && getUserId()) {
      try {
        await supabase.from('sales_transactions').delete().eq('id', id);
        showToast('Penjualan terhapus online!', 'success');
      } catch (err) {
        console.error(err);
      }
    } else {
      showToast('Penjualan terhapus.', 'success');
    }
  };

  // -------------------------------------------------------------
  // CLOUD AUTH FLOWS (Login, Signup, Bypass Demo)
  // -------------------------------------------------------------
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoadingAuth(true);
    setAuthError(null);

    try {
      if (authMode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showToast('Masuk berhasil!', 'success');
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        // Cek jika sesi kosong (butuh verifikasi email di setelan default Supabase)
        if (data && data.user && !data.session) {
          setAuthError('Akun berhasil terdaftar! Tetapi Supabase mewajibkan VERIFIKASI EMAIL secara default. Silakan periksa email Anda, atau nonaktifkan fitur "Confirm Email" di dashboard Supabase -> Authentication -> Providers.');
          showToast('Butuh konfirmasi verifikasi email!', 'warning');
        } else {
          showToast('Pendaftaran sukses! Anda otomatis masuk.', 'success');
        }
      }
    } catch (err: any) {
      let isUnconfirmed = err.message?.toLowerCase().includes('confirm') || err.message?.toLowerCase().includes('verified');
      if (isUnconfirmed) {
        setAuthError('Email belum terkonfirmasi! Silakan verifikasi email Anda atau matikan pengaturan "Confirm Email" di dashboard Supabase (Authentication -> Providers -> Email -> nonaktifkan "Confirm Email").');
      } else {
        setAuthError(err.message || 'Terjadi hambatan otentikasi');
      }
      showToast(err.message, 'error');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setUserSession(null);
      showToast('Keluar dari sesi.', 'warning');
    }
  };

  // Render correct panel
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardTab
            modalAwal={modalAwal}
            onUpdateModalAwal={updateModalAwalAction}
            expenses={expenses}
            products={products}
            sales={sales}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
          />
        );
      case 'beban':
        return (
          <BebanOperasionalTab
            expenses={expenses}
            onAddExpense={addExpenseAction}
            onUpdateExpense={updateExpenseAction}
            onDeleteExpense={deleteExpenseAction}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
          />
        );
      case 'stok_bahan':
        return (
          <StokBahanTab
            consumables={consumables}
            filaments={filaments}
            onAddConsumable={addConsumableAction}
            onUpdateConsumable={updateConsumableAction}
            onDeleteConsumable={deleteConsumableAction}
            onAddFilament={addFilamentAction}
            onUpdateFilament={updateFilamentAction}
            onDeleteFilament={deleteFilamentAction}
          />
        );
      case 'stok_produk':
        return (
          <StokProdukTab
            products={products}
            onAddProduct={addProductAction}
            onUpdateProduct={updateProductAction}
            onDeleteProduct={deleteProductAction}
          />
        );
      case 'sales':
        return (
          <SalesTab
            sales={sales}
            products={products}
            consumables={consumables}
            filaments={filaments}
            onAddSale={addSaleAction}
            onUpdateSale={updateSaleAction}
            onDeleteSale={deleteSaleAction}
          />
        );
      case 'reports':
        return (
          <ReportsTab
            sales={sales}
            expenses={expenses}
            products={products}
            consumables={consumables}
            filaments={filaments}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-cyan-100">
      
      {/* Toast Alert Notifications */}
      {alertMsg && (
        <div className="fixed top-5 right-5 z-55 animate-fadeIn max-w-sm">
          <div className={`p-4 rounded-xl border-2 shadow-xl flex items-start gap-3 backdrop-blur-md ${
            alertMsg.type === 'error' 
              ? 'bg-red-50/95 border-red-200 text-red-800' 
              : alertMsg.type === 'warning'
                ? 'bg-amber-50/95 border-amber-200 text-amber-800'
                : 'bg-emerald-50/95 border-emerald-200 text-emerald-800'
          }`}>
            <AlertCircle className="w-5 h-5 shrink-0 animate-bounce mt-0.5 text-current" />
            <div>
              <p className="text-xs font-semibold">{alertMsg.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* --- MASTER NAVIGATION BANNER & WORKSPACE METADATA --- */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200 backdrop-blur-md px-6 py-4.5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          {profileImage ? (
            <img 
              src={profileImage} 
              alt={profileName} 
              className="max-w-[100px] max-h-14 w-auto h-auto rounded-xl object-contain border border-slate-200 shadow-xs hover:scale-105 transition-all cursor-pointer"
              title="Ubah Profil Operator"
              onClick={() => {
                if (isSupabaseConfigured && !userSession) {
                  showToast('Wajib login/masuk terlebih dahulu guna mengubah profil!', 'error');
                } else {
                  setShowProfileModal(true);
                }
              }}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80';
              }}
            />
          ) : (
            <div 
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white border border-cyan-400 shadow-sm cursor-pointer" 
              onClick={() => {
                if (isSupabaseConfigured && !userSession) {
                  showToast('Wajib login/masuk terlebih dahulu guna mengubah profil!', 'error');
                } else {
                  setShowProfileModal(true);
                }
              }}
            >
              <Cpu className="w-5 h-5 animate-pulse text-cyan-200" />
            </div>
          )}

        </div>

        {/* Dynamic header stats / syncing badges for premium UI */}
        <div className="flex items-center gap-3">
          {/* User Profile Info Badge with Click to Edit */}
          {(!isSupabaseConfigured || userSession) && (
            <div className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs flex items-center gap-2.5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all">
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-2 cursor-pointer group focus:outline-none"
                title="Ubah Profil Operator"
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={profileName}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200 group-hover:scale-105 transition-all"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80';
                    }}
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center font-bold text-[10px] uppercase">
                    {profileName.substring(0, 2)}
                  </div>
                )}
                <div className="text-left">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block leading-none">Petugas Sesi</span>
                  <span className="font-bold text-slate-800 text-[11px] truncate max-w-[130px] block mt-0.5">{profileName}</span>
                </div>
              </button>

              {isSupabaseConfigured && userSession && (
                <button 
                  onClick={handleSignOut}
                  className="text-red-650 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg ml-1 border-l border-slate-100 pl-2 cursor-pointer transition-colors"
                  title="Selesaikan Sesi (Keluar)"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}

              {!isSupabaseConfigured && (
                <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 rounded px-1.5 py-0.5 font-bold font-mono">Lokal</span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* --- LOGIN SCREEN BLOCK (IF Supabase is configured but not logged in) --- */}
      {isSupabaseConfigured && !userSession ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-100/50">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            {loginHeader ? (
              <div className="w-full h-32 relative -mt-6 -mx-6 mb-5 border-b border-slate-100 overflow-hidden" style={{ width: 'calc(100% + 3rem)' }}>
                <img 
                  src={loginHeader} 
                  alt="Branding Header" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?auto=format&fit=crop&w=800&q=80';
                  }}
                />
              </div>
            ) : (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-indigo-600"></div>
            )}
            
            <div className="text-center mb-6">
              <div className="relative inline-block group">
                {loginLogo ? (
                  <img 
                    src={loginLogo} 
                    alt="Logo Login" 
                    onClick={() => {
                      if (!userSession) {
                        showToast('Harus masuk/login terlebih dahulu untuk mengunggah logo atau banner!', 'error');
                      } else {
                        setShowProfileModal(true);
                      }
                    }}
                    className="max-w-[150px] max-h-20 w-auto h-auto rounded-xl object-contain border border-slate-200 shadow-xs mx-auto mb-1 hover:scale-105 transition-all cursor-pointer"
                    title="Logo Login (Harus login untuk mengunggah)"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = profileImage;
                    }}
                  />
                ) : profileImage ? (
                  <img 
                    src={profileImage} 
                    alt={profileName} 
                    onClick={() => {
                      if (!userSession) {
                        showToast('Harus masuk/login terlebih dahulu untuk mengunggah logo atau banner!', 'error');
                      } else {
                        setShowProfileModal(true);
                      }
                    }}
                    className="max-w-[150px] max-h-20 w-auto h-auto rounded-xl object-contain border border-slate-200 shadow-xs mx-auto mb-1 hover:scale-105 transition-all cursor-pointer"
                    title="Profil Operator (Harus login untuk mengunggah)"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80';
                    }}
                  />
                ) : (
                  <div 
                    onClick={() => {
                      if (!userSession) {
                        showToast('Harus masuk/login terlebih dahulu untuk mengunggah logo atau banner!', 'error');
                      } else {
                        setShowProfileModal(true);
                      }
                    }}
                    className="w-12 h-12 bg-cyan-100/50 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-1 border border-cyan-200 animate-pulse cursor-pointer"
                    title="Ubah Profil Operator (Harus login)"
                  >
                    <Database className="w-6 h-6" />
                  </div>
                )}
              </div>
              <h2 
                className="text-xl font-bold text-slate-900 mt-2 flex items-center justify-center gap-1.5 cursor-pointer hover:text-cyan-600 transition-colors" 
                onClick={() => {
                  if (!userSession) {
                    showToast('Harus masuk/login terlebih dahulu untuk mengubah profil!', 'error');
                  } else {
                    setShowProfileModal(true);
                  }
                }} 
                title="Nama Operator (Harus login)"
              >
                {profileName}
                <Sparkles className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
              </h2>
            </div>

            {authError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-xs flex items-start gap-2.5 mb-4 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 block">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="nama@baselab.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 block">Kata Sandi</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingAuth}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs py-2.5 rounded-lg transition-all shadow-md p-2 text-center flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                {loadingAuth ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Mengotentikasi...
                  </>
                ) : (
                  'Masuk ke Dashboard'
                )}
              </button>
            </form>
          </div>
        </div>
      ) : (

        /* --- ACTIVE DASHBOARD ROOT ENVIRONMENT --- */
        <div className="flex-1 flex flex-col lg:flex-row">
          
          {/* LEFT COMMAND NAVIGATION MENU */}
          <nav className="w-full lg:w-64 border-r border-slate-200 p-4.5 bg-white space-y-2">
            
            <div className="pb-3 border-b border-slate-100 mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Sistem Navigasi</span>
            </div>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-cyan-50 to-indigo-50 text-cyan-700 border-l-4 border-cyan-500 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Cpu className="w-4 h-4 shrink-0" />
              <span>Ringkasan Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('beban')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'beban'
                  ? 'bg-gradient-to-r from-cyan-50 to-indigo-50 text-cyan-700 border-l-4 border-cyan-500 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Car className="w-4 h-4 shrink-0" />
              <span>Beban Operasional</span>
            </button>

            <button
              onClick={() => setActiveTab('stok_bahan')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'stok_bahan'
                  ? 'bg-gradient-to-r from-cyan-50 to-indigo-50 text-cyan-700 border-l-4 border-cyan-500 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Package className="w-4 h-4 shrink-0" />
              <span>Gudang Stok Bahan</span>
            </button>

            <button
              onClick={() => setActiveTab('stok_produk')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'stok_produk'
                  ? 'bg-gradient-to-r from-cyan-50 to-indigo-50 text-cyan-700 border-l-4 border-cyan-500 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>Stok Produk Jadi</span>
            </button>

            <button
              onClick={() => setActiveTab('sales')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'sales'
                  ? 'bg-gradient-to-r from-cyan-50 to-indigo-50 text-cyan-700 border-l-4 border-cyan-500 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>Sirkulasi Penjualan</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'reports'
                  ? 'bg-gradient-to-r from-cyan-50 to-indigo-50 text-cyan-700 border-l-4 border-cyan-500 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Arus & Ekspor Laporan</span>
            </button>

            {/* Quick action buttons block */}
            <div className="pt-6 border-t border-slate-100 mt-6 space-y-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Panduan Basis</span>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-[11px] text-slate-600 leading-normal">
                <span className="font-semibold block text-slate-700">💡 Tip Otomatis</span>
                Menyimpan transaksi lunas akan otomatis mendepositkan unit stock product jadi, bahan packing sekali-pakai, dan filament kotor secara instan sesuai ketersediaan.
              </div>
            </div>

          </nav>

          {/* MAIN TABS OUTPUT WRAPPER */}
          <main className="flex-1 p-5 md:p-7 space-y-6 max-w-7xl mx-auto w-full overflow-x-hidden">
            
            {/* Selected Tab Content Rendering */}
            <div className="animate-fadeIn">
              {renderTabContent()}
            </div>

          </main>
        </div>
      )}

      {/* --- SITE LOWER FOOTER META --- */}
      <footer className="bg-white py-4.5 px-6 border-t border-slate-200 flex flex-col items-center justify-center text-center text-[10px] text-slate-400 gap-1.5 shadow-inner">
        <span>© Baselab Works.</span>
        <span className="font-mono text-cyan-600/80 select-all">Local Time: 2026-06-17 • v1.02</span>
      </footer>

      {/* --- USER PROFILE SETTINGS MODAL (HIGHLY DETAILED & POLISHED & SCROLLABLE) --- */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs z-55 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleUp relative flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-600 animate-spin-slow" />
                <span className="text-sm font-bold text-slate-800">Personalisasi Sistem & Tampilan</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProfileName(localStorage.getItem('baselab_profile_name') || 'Operator Baselab');
                  setProfileImage(localStorage.getItem('baselab_profile_image') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80');
                  setLoginLogo(localStorage.getItem('baselab_login_logo') || '');
                  setLoginHeader(localStorage.getItem('baselab_login_header') || '');
                  setShowProfileModal(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Mini Tabs Selector */}
            <div className="flex border-b border-slate-100 shrink-0 bg-slate-50/20">
              <button
                type="button"
                onClick={() => setActiveModalTab('profile')}
                className={`flex-1 py-2.5 text-center text-[10px] uppercase tracking-wider font-bold border-b-2 transition-all ${
                  activeModalTab === 'profile'
                    ? 'border-cyan-500 text-cyan-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                👤 Profil Operator
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('branding')}
                className={`flex-1 py-2.5 text-center text-[10px] uppercase tracking-wider font-bold border-b-2 transition-all ${
                  activeModalTab === 'branding'
                    ? 'border-cyan-500 text-cyan-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                🎨 Branding Login & Logo
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
              
              {activeModalTab === 'profile' ? (
                <div className="space-y-4">
                  {/* Dynamic Live Preview */}
                  <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-150">
                    <div className="relative group">
                      <img
                        src={profileImage}
                        alt={profileName}
                        className="w-20 h-20 rounded-full object-cover border-2 border-cyan-500 shadow-md transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-[10px] font-bold">
                        Pratinjau
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-800 mt-2.5">{profileName}</span>
                    <span className="text-[10px] text-slate-400">Pemberi Otorisasi Baselab</span>
                  </div>

                  {/* Action Fields (Profile) */}
                  <div className="space-y-3">
                    {/* 1. Name Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-550 uppercase tracking-wide">Nama Operator</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
                        placeholder="Contoh: Sultan 3D"
                      />
                    </div>

                    {/* 2. Custom Image URL Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-550 uppercase tracking-wide">Tautan Gambar Custom (.jpg / .png)</label>
                      <input
                        type="text"
                        value={profileImage.startsWith('data:') ? '' : profileImage}
                        onChange={(e) => {
                          if (e.target.value.trim() !== '') {
                            setProfileImage(e.target.value);
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
                        placeholder="https://tautan-gambar.com/foto.jpg"
                      />
                      <p className="text-[9px] text-slate-400 leading-relaxed">
                        Tempel tautan eksternal gambar apa pun, atau gunakan uploader manual di bawah.
                      </p>
                    </div>

                    {/* 3. Manual Local File Upload */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-550 uppercase tracking-wide">Unggah Manual Foto Lokal</label>
                      <div 
                        onClick={() => {
                          const fileInput = document.getElementById('avatar-file-input');
                          if (fileInput) fileInput.click();
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (reader.result) {
                                setProfileImage(reader.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="border border-dashed border-slate-200 hover:border-cyan-400 bg-slate-50 hover:bg-cyan-50/20 active:bg-cyan-50/40 rounded-xl p-3 text-center cursor-pointer transition-all group flex flex-col items-center gap-1.5"
                      >
                        <Upload className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 group-hover:scale-110 transition-all" />
                        <span className="text-[10px] text-slate-500 font-bold group-hover:text-cyan-600 transition-all">Pilih berkas foto atau Seret ke sini</span>
                        <span className="text-[8px] text-slate-400">PNG, JPG, WEBP • Otomatis dikonversi aman</span>
                        <input
                          id="avatar-file-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (reader.result) {
                                  setProfileImage(reader.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* 4. Elegant Avatar Presets Grid */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-550 uppercase tracking-wide block">Preset Avatar Baselab AI</span>
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
                          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
                          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
                          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80'
                        ].map((preset, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => setProfileImage(preset)}
                            className={`w-10 h-10 rounded-full overflow-hidden border-2 cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                              profileImage === preset ? 'border-cyan-500 scale-105 shadow-md shadow-cyan-100' : 'border-transparent hover:border-slate-300'
                            }`}
                          >
                            <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Dynamic Live Preview for Login Page */}
                  <div className="flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-150 rounded-xl relative overflow-hidden">
                    {loginHeader ? (
                      <div className="w-full h-24 overflow-hidden relative rounded-t-lg -mt-5 -mx-5 mb-4 border-b border-slate-200" style={{ width: 'calc(100% + 2.5rem)' }}>
                        <img src={loginHeader} alt="Live Header View" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full h-1 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-t-lg -mt-5 mb-4" style={{ width: 'calc(100% + 2.5rem)' }}></div>
                    )}
                    
                    <div className="relative mb-2">
                      {loginLogo ? (
                        <img src={loginLogo} alt="Live Logo View" className="max-w-[120px] max-h-16 w-auto h-auto rounded-xl object-contain border-2 border-cyan-500 shadow-sm" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-cyan-100/50 text-cyan-600 border border-cyan-200 flex items-center justify-center font-bold text-xs">
                          LOGO
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 tracking-wide">Live Preview Branding Halaman Login</span>
                  </div>

                  {/* 1. Login Logo Custom Settings */}
                  <div className="space-y-3 pt-1 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-550 uppercase tracking-wide block">1. LOGO HALAMAN LOGIN</span>
                    
                    {/* Logo URL Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tautan Logo Online (.jpg / .png)</label>
                      <input
                        type="text"
                        value={loginLogo.startsWith('data:') ? '' : loginLogo}
                        onChange={(e) => setLoginLogo(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
                        placeholder="https://tautan-gambar.com/logo-login.png"
                      />
                    </div>

                    {/* Logo Manual File Drag/Upload */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Atau Unggah Logo Lokal</label>
                      <div 
                        onClick={() => {
                          const fileInput = document.getElementById('login-logo-file-input');
                          if (fileInput) fileInput.click();
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (reader.result) {
                                setLoginLogo(reader.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="border border-dashed border-slate-200 hover:border-cyan-400 bg-slate-50 hover:bg-cyan-50/20 active:bg-cyan-50/40 rounded-xl p-2.5 text-center cursor-pointer transition-all group flex flex-col items-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-600 transition-all" />
                        <span className="text-[10px] text-slate-500 font-bold">Pilih berkas Logo atau Seret ke sini</span>
                        <input
                          id="login-logo-file-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (reader.result) {
                                  setLoginLogo(reader.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Login Header Banner Custom Settings */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-550 uppercase tracking-wide block">2. BANNER HEADER HALAMAN LOGIN</span>
                    
                    {/* Header Banner URL Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tautan Banner Online (.jpg / .png)</label>
                      <input
                        type="text"
                        value={loginHeader.startsWith('data:') ? '' : loginHeader}
                        onChange={(e) => setLoginHeader(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
                        placeholder="https://tautan-gambar.com/banner.jpg"
                      />
                    </div>

                    {/* Header Banner Manual File Drag/Upload */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Atau Unggah Banner Lokal</label>
                      <div 
                        onClick={() => {
                          const fileInput = document.getElementById('login-header-file-input');
                          if (fileInput) fileInput.click();
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (reader.result) {
                                setLoginHeader(reader.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="border border-dashed border-slate-200 hover:border-cyan-400 bg-slate-50 hover:bg-cyan-50/20 active:bg-cyan-50/40 rounded-xl p-2.5 text-center cursor-pointer transition-all group flex flex-col items-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-600 transition-all" />
                        <span className="text-[10px] text-slate-500 font-bold">Pilih berkas Banner atau Seret ke sini</span>
                        <input
                          id="login-header-file-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (reader.result) {
                                  setLoginHeader(reader.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  // Restore values from localStorage on cancel
                  setProfileName(localStorage.getItem('baselab_profile_name') || 'Operator Baselab');
                  setProfileImage(localStorage.getItem('baselab_profile_image') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80');
                  setLoginLogo(localStorage.getItem('baselab_login_logo') || '');
                  setLoginHeader(localStorage.getItem('baselab_login_header') || '');
                  setShowProfileModal(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-white rounded-xl transition-all cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('baselab_profile_name', profileName);
                  localStorage.setItem('baselab_profile_image', profileImage);
                  localStorage.setItem('baselab_login_logo', loginLogo);
                  localStorage.setItem('baselab_login_header', loginHeader);
                  setShowProfileModal(false);
                  showToast('Profil & branding halaman login berhasil disimpan!', 'success');
                }}
                className="px-4.5 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
              >
                Simpan Perubahan
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
