'use client';

import React, { useState, useEffect } from 'react';
import GajiDashboard from '@/components/GajiDashboard';
import { useApp } from '@/lib/auth-context';
import { Role } from '@/types';
import * as api from '@/lib/api';
import {
  LogOut,
  TrendingUp,
  Box,
  Building,
  History,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Loader,
  DollarSign,
  Calendar,
  MapPin,
  Tag,
  AlertCircle,
  Clock,
  Sparkles,
  ClipboardList,
  MoreVertical,
  UserIcon,
  BarChart2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Star,
  UserCheck
} from 'lucide-react';

type FinanceTab = 'OVERVIEW' | 'BERGERAK' | 'TETAP' | 'RIWAYAT' | 'STAFF_PERFORMANCE' | 'PROFIL';

export default function KeuanganDashboard() {
  const { activeUser, logout, regions, showAlert, appSettings, users, orders } = useApp();
  const [activeTab, setActiveTab] = useState<FinanceTab>('OVERVIEW');
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const [performanceSubTab, setPerformanceSubTab] = useState<'STATISTICS' | 'PAYROLL'>('STATISTICS');
  const [performanceDate, setPerformanceDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [performanceEndDate, setPerformanceEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expandedPerformanceStaffId, setExpandedPerformanceStaffId] = useState<string | null>(null);

  // Helper functions
  const getLocalDateOnly = (dateString: string | Date | undefined) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
  };
  const formatRupiah = (num: any) => {
    if (!num || isNaN(num)) return 'Rp 0';
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  };

  const staffList = users.filter(u => u.role === Role.STAFF && u.status === 'active');


  // Data States
  const [addons, setAddons] = useState<any[]>([]);
  const [fixedAssets, setFixedAssets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Asset region info
  const userRegionName = regions.find(r => r.id === activeUser?.region_id)?.name || 'Seluruh Wilayah';

  // Modal / Form States
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any | null>(null);
  const [assetName, setAssetName] = useState('');
  const [assetPurchaseDate, setAssetPurchaseDate] = useState('');
  const [assetPurchasePrice, setAssetPurchasePrice] = useState(0);
  const [assetDescription, setAssetDescription] = useState('');

  // Moving Asset Modals
  const [showAddAddonModal, setShowAddAddonModal] = useState(false);
  const [editingAddon, setEditingAddon] = useState<any | null>(null);
  const [addonName, setAddonName] = useState('');
  const [addonPrice, setAddonPrice] = useState(0);
  const [addonHpp, setAddonHpp] = useState(0);
  const [addonDescription, setAddonDescription] = useState('');

  // Stock-in / Purchase Modal
  const [purchaseModalAddon, setPurchaseModalAddon] = useState<any | null>(null);
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [purchaseNotes, setPurchaseNotes] = useState('');

  // Submitting States
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch initial dashboard data
  const loadDashboardData = async () => {
    setIsLoadingData(true);
    try {
      const [fetchedAddons, fetchedAssets, fetchedTx] = await Promise.all([
        api.fetchAddons(activeUser?.region_id),
        api.fetchFixedAssets(activeUser?.region_id),
        api.fetchAddonTransactions(),
      ]);
      setAddons(fetchedAddons);
      setFixedAssets(fetchedAssets);
      setTransactions(fetchedTx);
    } catch (error) {
      console.error('Failed to load finance data:', error);
      showAlert('Gagal memuat data keuangan.');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeUser]);

  // Asset Totals
  const totalMovingAssetValue = addons.reduce((sum, item) => sum + (Number(item.hpp) || 0) * (Number(item.stock) || 0), 0);
  const totalFixedAssetValue = fixedAssets.reduce((sum, item) => sum + (Number(item.purchase_price) || 0), 0);

  // Fixed Asset CRUD handlers
  const handleSaveFixedAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim() || !assetPurchaseDate || assetPurchasePrice <= 0) {
      showAlert('Mohon isi semua data aset tetap dengan benar.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        name: assetName.trim(),
        purchase_date: assetPurchaseDate,
        purchase_price: assetPurchasePrice,
        description: assetDescription.trim() || null,
        region_id: activeUser?.region_id,
      };

      if (editingAsset) {
        await api.updateFixedAsset(editingAsset.id, payload);
        showAlert('Aset tetap berhasil diperbarui!');
      } else {
        await api.createFixedAsset(payload);
        showAlert('Aset tetap baru berhasil ditambahkan!');
      }
      setShowAddAssetModal(false);
      setEditingAsset(null);
      resetAssetForm();
      loadDashboardData();
    } catch (err: any) {
      showAlert(err.message || 'Gagal menyimpan aset tetap.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditFixedAssetClick = (asset: any) => {
    setEditingAsset(asset);
    setAssetName(asset.name);
    // Format date to YYYY-MM-DD
    const dateObj = new Date(asset.purchase_date);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    setAssetPurchaseDate(`${yyyy}-${mm}-${dd}`);
    setAssetPurchasePrice(Number(asset.purchase_price));
    setAssetDescription(asset.description || '');
    setShowAddAssetModal(true);
  };

  const handleDeleteFixedAsset = async (assetId: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus aset tetap ini?')) return;
    try {
      await api.deleteFixedAsset(assetId);
      showAlert('Aset tetap berhasil dihapus.');
      loadDashboardData();
    } catch (err: any) {
      showAlert(err.message || 'Gagal menghapus aset tetap.');
    }
  };

  const resetAssetForm = () => {
    setAssetName('');
    setAssetPurchaseDate('');
    setAssetPurchasePrice(0);
    setAssetDescription('');
  };

  // Moving Asset (Addons) CRUD handlers
  const handleSaveAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addonName.trim() || addonPrice <= 0 || addonHpp < 0) {
      showAlert('Mohon isi nama, harga jual, dan harga beli (HPP) dengan benar.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        name: addonName.trim(),
        price: addonPrice,
        hpp: addonHpp,
        description: addonDescription.trim() || null,
        region_id: activeUser?.region_id,
      };

      if (editingAddon) {
        await api.updateAddon(editingAddon.id, payload);
        showAlert('Barang add-on berhasil diperbarui!');
      } else {
        await api.createAddon(payload);
        showAlert('Barang add-on baru berhasil didaftarkan!');
      }
      setShowAddAddonModal(false);
      setEditingAddon(null);
      resetAddonForm();
      loadDashboardData();
    } catch (err: any) {
      showAlert(err.message || 'Gagal menyimpan barang add-on.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAddonClick = (addon: any) => {
    setEditingAddon(addon);
    setAddonName(addon.name);
    setAddonPrice(Number(addon.price));
    setAddonHpp(Number(addon.hpp || 0));
    setAddonDescription(addon.description || '');
    setShowAddAddonModal(true);
  };

  const handleDeleteAddon = async (addonId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus barang add-on ini?')) return;
    try {
      await api.deleteAddon(addonId);
      showAlert('Barang add-on berhasil dihapus.');
      loadDashboardData();
    } catch (err: any) {
      showAlert(err.message || 'Gagal menghapus barang.');
    }
  };

  const resetAddonForm = () => {
    setAddonName('');
    setAddonPrice(0);
    setAddonHpp(0);
    setAddonDescription('');
  };

  // Stock-in (Purchase Addon) handler
  const handleRecordPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseQty <= 0 || purchasePrice < 0) {
      showAlert('Kuantitas dan harga pembelian harus valid.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.purchaseAddon(purchaseModalAddon.id, {
        qty: purchaseQty,
        price: purchasePrice,
        notes: purchaseNotes.trim() || 'Restock Aset Bergerak Keuangan',
      });
      showAlert(`Stok masuk berhasil dicatat untuk ${purchaseModalAddon.name}!`);
      setPurchaseModalAddon(null);
      setPurchaseQty(1);
      setPurchasePrice(0);
      setPurchaseNotes('');
      loadDashboardData();
    } catch (err: any) {
      showAlert(err.message || 'Gagal mencatat pembelian stok.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] text-slate-800 text-left min-h-0 h-full overflow-hidden">
      {/* GLOBAL HEADER BAR WITH THREE-DOTS MENU */}
      <div className="bg-slate-900 text-white px-5 py-4 shrink-0 shadow-md flex justify-between items-center z-30 relative">
        {/* Logo, Business Name & Slogan */}
        <div className="flex items-center gap-3">
          <a href="/" className="w-14 h-14 bg-gradient-to-tr from-rose-500 to-orange-400 rounded-2xl shadow-xl shadow-rose-900/20 flex items-center justify-center text-white mb-3 transform -rotate-6 hover:rotate-0 transition duration-300 relative z-10 overflow-hidden border-2 border-white/50 cursor-pointer block">
            {appSettings?.['GLOBAL']?.business_logo ? (
              <img src={appSettings['GLOBAL'].business_logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </a>
          <div className="text-left">
            <h1 className="text-sm font-black leading-none">{appSettings?.['GLOBAL']?.business_name || 'CoolAir Pro'}</h1>
            <p className="text-[9px] text-blue-200 mt-1">Sistem Layanan AC Profesional | Keuangan</p>
          </div>
        </div>

        {/* Three-dots menu button */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMoreMenu(prev => !prev);
            }}
            className="p-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer text-blue-200 hover:text-white"
          >
            <MoreVertical size={18} />
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 text-slate-800 text-left text-xs font-bold">
              <button
                onClick={() => {
                  setActiveTab('OVERVIEW');
                  setShowMoreMenu(false);
                }}
                className={`w-full px-4 py-2 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer text-slate-700 ${activeTab !== 'PROFIL' ? 'text-indigo-600 bg-indigo-50/20 font-black' : ''}`}
              >
                <ClipboardList size={14} className={activeTab !== 'PROFIL' ? 'text-indigo-600' : 'text-slate-400'} />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('PROFIL');
                  setShowMoreMenu(false);
                }}
                className={`w-full px-4 py-2 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer text-slate-700 ${activeTab === 'PROFIL' ? 'text-indigo-600 bg-indigo-50/20 font-black' : ''}`}
              >
                <UserIcon size={14} className={activeTab === 'PROFIL' ? 'text-indigo-600' : 'text-slate-400'} />
                <span>Profile</span>
              </button>
              <hr className="my-1 border-slate-100" />
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  logout();
                }}
                className="w-full px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer text-rose-600"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===================== CONTROL TABS SYSTEM ===================== */}
      {activeTab !== 'PROFIL' && (
        <div className="bg-white border-b border-slate-200 px-4 py-0 sticky top-0 z-20 shrink-0 flex items-center justify-between gap-1 overflow-x-auto flex-nowrap">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'OVERVIEW'
                ? 'text-slate-900 border-slate-900'
                : 'text-slate-600 border-transparent hover:text-slate-800'
                }`}
            >
              <span className="flex items-center gap-2">
                <TrendingUp size={15} />
                <span>Ringkasan Keuangan</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('BERGERAK')}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'BERGERAK'
                ? 'text-slate-900 border-slate-900'
                : 'text-slate-600 border-transparent hover:text-slate-800'
                }`}
            >
              <span className="flex items-center gap-2">
                <Box size={15} />
                <span>Aset Bergerak</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('TETAP')}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'TETAP'
                ? 'text-slate-900 border-slate-900'
                : 'text-slate-600 border-transparent hover:text-slate-800'
                }`}
            >
              <span className="flex items-center gap-2">
                <Building size={15} />
                <span>Aset Tetap</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('RIWAYAT')}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'RIWAYAT'
                ? 'text-slate-900 border-slate-900'
                : 'text-slate-600 border-transparent hover:text-slate-800'
                }`}
            >
              <span className="flex items-center gap-2">
                <History size={15} />
                <span>Riwayat Mutasi</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('STAFF_PERFORMANCE')}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'STAFF_PERFORMANCE'
                ? 'text-slate-900 border-slate-900'
                : 'text-slate-600 border-transparent hover:text-slate-800'
                }`}
            >
              <span className="flex items-center gap-2">
                <UserCheck size={15} />
                <span>Kinerja Staff</span>
              </span>
            </button>

          </div>

          <button
            onClick={loadDashboardData}
            className="mr-2 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors whitespace-nowrap flex items-center gap-2"
          >
            🔄 Refresh
          </button>
        </div>
      )}

      {/* Workspace Area */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
          {isLoadingData ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader className="w-10 h-10 animate-spin text-cyan-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Memuat data keuangan wilayah...</span>
            </div>
          ) : (
            <>
              {/* ================= TAB 1: OVERVIEW ================= */}
              {activeTab === 'OVERVIEW' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Financial Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-3xl border border-indigo-400/30 shadow-lg shadow-indigo-200/50 relative overflow-hidden group hover:-translate-y-1 transition duration-300"><div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition duration-500"></div>
                      <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Total Nilai Aset Bergerak (Inventaris)</p>
                      <h2 className="text-2xl font-black text-white mt-1 relative z-10">Rp {totalMovingAssetValue.toLocaleString('id-ID')}</h2>
                      <p className="text-[9.5px] text-white/70 mt-2 font-medium">Berdasarkan stok terdaftar dikali HPP per barang.</p>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl border border-emerald-400/30 shadow-lg shadow-emerald-200/50 relative overflow-hidden group hover:-translate-y-1 transition duration-300"><div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition duration-500"></div>
                      <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Total Pembelian Aset Tetap</p>
                      <h2 className="text-2xl font-black text-white mt-1 relative z-10">Rp {totalFixedAssetValue.toLocaleString('id-ID')}</h2>
                      <p className="text-[9.5px] text-white/70 mt-2 font-medium">Nilai akumulasi total pengeluaran belanja aset fisik.</p>
                    </div>

                    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-6 rounded-3xl border border-cyan-400/30 shadow-lg shadow-cyan-200/50 relative overflow-hidden group hover:-translate-y-1 transition duration-300"><div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition duration-500"></div>
                      <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Jumlah Jenis Inventaris / Aset Tetap</p>
                      <h2 className="text-2xl font-black text-white mt-1 relative z-10">
                        {addons.length} <span className="text-xs font-bold text-white/70 uppercase">Barang</span> / {fixedAssets.length} <span className="text-xs font-bold text-white/70 uppercase">Unit</span>
                      </h2>
                      <p className="text-[9.5px] text-white/70 mt-2 font-medium">Jenis aset yang aktif tercatat di Cabang {userRegionName}.</p>
                    </div>
                  </div>

                  {/* Overview Lists / Activity info */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Fixed Assets Summary List */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40 relative">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Aset Tetap Terakhir</h4>
                        <button onClick={() => setActiveTab('TETAP')} className="text-[10px] font-bold text-cyan-400 hover:underline">Lihat Semua →</button>
                      </div>
                      {fixedAssets.length === 0 ? (
                        <p className="text-slate-500 text-xs py-4 text-center">Belum ada aset tetap terdaftar.</p>
                      ) : (
                        <div className="space-y-3">
                          {fixedAssets.slice(0, 4).map(asset => (
                            <div key={asset.id} className="flex justify-between items-center p-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition hover:-translate-y-0.5">
                              <div>
                                <span className="text-xs font-bold text-slate-800 block">{asset.name}</span>
                                <span className="text-[10px] text-slate-500 block font-medium mt-0.5">Beli: {new Date(asset.purchase_date).toLocaleDateString('id-ID')}</span>
                              </div>
                              <span className="text-xs font-black text-emerald-400">Rp {Number(asset.purchase_price).toLocaleString('id-ID')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Inventory Low Stock warnings */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40 relative">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Inventaris Kritis (Stok &lt; 20)</h4>
                        <button onClick={() => setActiveTab('BERGERAK')} className="text-[10px] font-bold text-cyan-400 hover:underline">Kelola Stok →</button>
                      </div>
                      {addons.filter(a => (a.stock || 0) < 20).length === 0 ? (
                        <p className="text-emerald-400 text-xs py-4 text-center font-bold">🎉 Semua stok inventaris cabang dalam batas aman!</p>
                      ) : (
                        <div className="space-y-3">
                          {addons.filter(a => (a.stock || 0) < 20).slice(0, 4).map(addon => (
                            <div key={addon.id} className="flex justify-between items-center p-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition hover:-translate-y-0.5">
                              <div>
                                <span className="text-xs font-bold text-slate-800 block">{addon.name}</span>
                                <span className="text-[10px] text-slate-500 block font-medium mt-0.5">HPP: Rp {Number(addon.hpp || 0).toLocaleString('id-ID')}</span>
                              </div>
                              <span className="text-xs font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                                Sisa {addon.stock || 0} unit
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= TAB 2: ASET BERGERAK (ADD-ONS) ================= */}
              {activeTab === 'BERGERAK' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black text-slate-800">Inventaris Aset Bergerak (Add-ons)</h2>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Kelola stok sparepart, freon, dan material pelengkap jasa AC wilayah Anda.</p>
                    </div>
                    <button
                      onClick={() => { resetAddonForm(); setEditingAddon(null); setShowAddAddonModal(true); }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 transition active:scale-[0.98]"
                    >
                      <Plus size={14} /> Daftar Add-on Baru
                    </button>
                  </div>

                  {/* Addon Inventory Table */}
                  <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/80 backdrop-blur-md">
                            <th className="py-4 px-6">Nama & Keterangan</th>
                            <th className="py-4 px-4 text-center">Stok Fisik</th>
                            <th className="py-4 px-4">HPP (Harga Beli)</th>
                            <th className="py-4 px-4">Harga Jual</th>
                            <th className="py-4 px-6 text-center">Aksi / Tindakan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                          {addons.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 px-6 text-center text-slate-500">Belum ada barang add-on terdaftar di wilayah ini.</td>
                            </tr>
                          ) : (
                            addons.map(addon => (
                              <tr key={addon.id} className="hover:bg-slate-50 transition duration-200">
                                <td className="py-4 px-6">
                                  <span className="text-sm font-bold text-slate-800 block">{addon.name}</span>
                                  <span className="text-[10px] text-slate-500 block font-medium mt-1">{addon.description || 'Tidak ada catatan.'}</span>
                                </td>
                                <td className="py-4 px-4 text-center">
                                  <span className={`px-3 py-1 rounded-full font-bold border ${addon.stock < 20 ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                    {addon.stock || 0} unit
                                  </span>
                                </td>
                                <td className="py-4 px-4">
                                  <span className="font-mono text-slate-500">Rp {Number(addon.hpp || 0).toLocaleString('id-ID')}</span>
                                </td>
                                <td className="py-4 px-4">
                                  <span className="font-mono text-emerald-400">Rp {Number(addon.price).toLocaleString('id-ID')}</span>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="flex justify-center items-center gap-2">
                                    <button
                                      onClick={() => { setPurchaseModalAddon(addon); setPurchasePrice(Number(addon.hpp || 0)); setShowAddAddonModal(false); }}
                                      className="bg-cyan-50 hover:bg-cyan-500 hover:text-white text-cyan-700 font-extrabold text-[10px] px-3 py-1.5 rounded-lg border border-slate-200 transition uppercase"
                                    >
                                      📥 Stok Masuk
                                    </button>
                                    <button
                                      onClick={() => handleEditAddon(addon)}
                                      className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200 transition"
                                    >
                                      <Edit size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteAddon(addon.id)}
                                      className="p-1.5 bg-slate-50 text-slate-400 hover:bg-rose-100 hover:text-rose-600 rounded-lg border border-slate-200 transition"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= TAB 3: ASET TETAP ================= */}
              {activeTab === 'TETAP' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black text-slate-800">Kelola Aset Tetap</h2>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Catat dan audit aset tetap seperti bangunan kantor, kendaraan operasional, tangki air steam, dll.</p>
                    </div>
                    <button
                      onClick={() => { resetAssetForm(); setEditingAsset(null); setShowAddAssetModal(true); }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 transition active:scale-[0.98]"
                    >
                      <Plus size={14} /> Tambah Aset Tetap
                    </button>
                  </div>

                  {/* Fixed Assets List Table */}
                  <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/80 backdrop-blur-md">
                            <th className="py-4 px-6">Nama Aset & Deskripsi</th>
                            <th className="py-4 px-4">Tanggal Pembelian</th>
                            <th className="py-4 px-4">Harga Pembelian</th>
                            <th className="py-4 px-6 text-center">Tindakan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                          {fixedAssets.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-8 px-6 text-center text-slate-500">Belum ada aset tetap tercatat di wilayah ini.</td>
                            </tr>
                          ) : (
                            fixedAssets.map(asset => (
                              <tr key={asset.id} className="hover:bg-slate-50 transition duration-200">
                                <td className="py-4 px-6">
                                  <span className="text-sm font-bold text-slate-800 block">{asset.name}</span>
                                  <span className="text-[10px] text-slate-500 block font-medium mt-1">{asset.description || 'Tidak ada catatan.'}</span>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-1.5 text-slate-500">
                                    <Calendar size={13} />
                                    <span>{new Date(asset.purchase_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-sm font-black text-emerald-400">
                                  Rp {Number(asset.purchase_price).toLocaleString('id-ID')}
                                </td>
                                <td className="py-4 px-6">
                                  <div className="flex justify-center items-center gap-1.5">
                                    <button
                                      onClick={() => handleEditFixedAssetClick(asset)}
                                      className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200 transition"
                                    >
                                      <Edit size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFixedAsset(asset.id)}
                                      className="p-1.5 bg-slate-50 text-slate-400 hover:bg-rose-100 hover:text-rose-600 rounded-lg border border-slate-200 transition"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= TAB 4: RIWAYAT TRANSAKSI ================= */}
              {activeTab === 'RIWAYAT' && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-lg font-black text-slate-800">Riwayat Mutasi Stok (Aset Bergerak)</h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Log aktivitas masuk dan keluarnya material pelengkap / sparepart cabang.</p>
                  </div>

                  {/* Transaction Log Table */}
                  <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/80 backdrop-blur-md">
                            <th className="py-4 px-6">Tanggal & Waktu</th>
                            <th className="py-4 px-4">Nama Barang</th>
                            <th className="py-4 px-4 text-center">Jenis Mutasi</th>
                            <th className="py-4 px-4 text-center">Kuantitas</th>
                            <th className="py-4 px-4">Nominal</th>
                            <th className="py-4 px-6">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                          {transactions.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 px-6 text-center text-slate-500">Belum ada catatan transaksi masuk/keluar.</td>
                            </tr>
                          ) : (
                            transactions.map(tx => (
                              <tr key={tx.id} className="hover:bg-slate-50 transition duration-200">
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-1.5 text-slate-500">
                                    <Clock size={12} />
                                    <span>{new Date(tx.createdAt).toLocaleString('id-ID')}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <span className="font-bold text-slate-800 block">{tx.addonName || `ID: ${tx.addonId}`}</span>
                                </td>
                                <td className="py-4 px-4 text-center">
                                  <span className={`px-2.5 py-0.5 rounded-full border text-[9.5px] font-black uppercase ${tx.type === 'masuk' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>
                                    {tx.type}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-center font-mono">
                                  {tx.qty} unit
                                </td>
                                <td className="py-4 px-4 font-mono text-slate-500">
                                  Rp {Number(tx.price).toLocaleString('id-ID')}
                                </td>
                                <td className="py-4 px-6 text-slate-500 max-w-xs truncate">
                                  {tx.notes || '-'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== TAB KINERJA STAFF ===================== */}
              {activeTab === 'STAFF_PERFORMANCE' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex border-b border-slate-200 mb-2 gap-2">
                    <button
                      onClick={() => setPerformanceSubTab('STATISTICS')}
                      className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                        performanceSubTab === 'STATISTICS'
                          ? 'text-indigo-600 border-indigo-600 font-black'
                          : 'text-slate-500 border-transparent hover:text-slate-700'
                      }`}
                    >
                      <BarChart2 size={14} />
                      <span>Statistik Kinerja (Daftar Karyawan)</span>
                    </button>
                    <button
                      onClick={() => setPerformanceSubTab('PAYROLL')}
                      className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                        performanceSubTab === 'PAYROLL'
                          ? 'text-indigo-600 border-indigo-600 font-black'
                          : 'text-slate-500 border-transparent hover:text-slate-700'
                      }`}
                    >
                      <DollarSign size={14} />
                      <span>Kelola Gaji Karyawan</span>
                    </button>
                  </div>

                  {performanceSubTab === 'STATISTICS' && (
                    <>
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h3 className="font-black text-slate-800 uppercase tracking-wide flex items-center gap-2"><BarChart2 size={18} className="text-indigo-600" /> Laporan Kinerja Staff</h3>
                          <p className="text-[11px] text-slate-500 font-medium mt-1">Pantau jumlah pesanan selesai, rating rata-rata, dan pemakaian sparepart / addons</p>
                        </div>
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 shrink-0">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Rentang Tanggal:</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={performanceDate}
                              onChange={(e) => setPerformanceDate(e.target.value)}
                              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                            />
                            <span className="text-[10px] font-bold text-slate-400">S/D</span>
                            <input
                              type="date"
                              value={performanceEndDate}
                              onChange={(e) => setPerformanceEndDate(e.target.value)}
                              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-5">
                        {users.filter(u => u.role === Role.STAFF && u.status === 'active').map(staff => {
                          const staffOrders = orders.filter(o => {
                            if (o.assignedTo !== staff.id || o.status !== 'SELESAI') return false;
                            const orderDateStr = o.completedAt || o.scheduledDate || o.createdAt;
                            const orderDate = getLocalDateOnly(orderDateStr);
                            return orderDate >= performanceDate && orderDate <= performanceEndDate;
                          });

                          const completedCount = staffOrders.length;
                          const ratings = staffOrders.filter(o => typeof o.rating === 'number' && o.rating > 0).map(o => o.rating as number);
                          const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '-';

                          const addonsUsed = new Map<string, { name: string, qty: number, totalPrice: number }>();
                          staffOrders.forEach(order => {
                            if (order.addonsUsed && Array.isArray(order.addonsUsed)) {
                              order.addonsUsed.forEach(addon => {
                                const existing = addonsUsed.get(addon.id || addon.name) || { name: addon.name, qty: 0, totalPrice: 0 };
                                existing.qty += addon.quantity;
                                existing.totalPrice += addon.price * addon.quantity;
                                addonsUsed.set(addon.id || addon.name, existing);
                              });
                            }
                          });

                          const addonsList = Array.from(addonsUsed.values());
                          const isExpanded = expandedPerformanceStaffId === staff.id;

                          return (
                            <div key={staff.id} className="bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden relative group transition duration-300">
                              <div
                                className="p-6 bg-white border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition duration-200"
                                onClick={() => setExpandedPerformanceStaffId(isExpanded ? null : staff.id)}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200 overflow-hidden shrink-0">
                                    {(staff.photoUrl || staff.photo) ? (
                                      <img src={staff.photoUrl || staff.photo} alt={staff.name} className="w-full h-full object-cover" />
                                    ) : (
                                      staff.name.charAt(0).toUpperCase()
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-black text-slate-800 text-base">{staff.name}</h4>
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase border border-slate-200 bg-slate-50 px-2.5 py-0.5 rounded-full">{staff.phone || 'No HP Belum Diset'}</span>
                                      <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">STAFF TEKNISI</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-center bg-white border border-slate-100 rounded-2xl px-5 py-3 shadow-sm hidden md:block">
                                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pesanan Selesai</span>
                                    <span className="font-black text-2xl text-indigo-600">{completedCount}</span>
                                  </div>
                                  <div className="text-center bg-white border border-slate-100 rounded-2xl px-5 py-3 shadow-sm min-w-[120px] hidden md:block">
                                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Rating</span>
                                    <span className="font-black text-2xl text-amber-500 flex items-center justify-center gap-1.5">
                                      {avgRating !== '-' && <Star size={18} className="fill-amber-500 text-amber-500" />}
                                      {avgRating}
                                    </span>
                                  </div>

                                  {/* Mobile view metrics */}
                                  <div className="md:hidden flex flex-col gap-1 items-end">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">Selesai: <span className="text-indigo-600 font-black">{completedCount}</span></div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">Rating: <span className="text-amber-500 font-black">{avgRating}</span></div>
                                  </div>

                                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 transition md:ml-2">
                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                  </div>
                                </div>
                              </div>
                              {isExpanded && addonsList.length > 0 && (
                                <div className="p-6 bg-slate-50 animate-in slide-in-from-top-2">
                                  <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Rincian Penggunaan Add-ons / Sparepart</h5>
                                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                                    <table className="w-full text-xs text-left">
                                      <thead className="bg-slate-50/80 backdrop-blur-md text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                                        <tr>
                                          <th className="p-4">Nama Barang</th>
                                          <th className="p-4 text-center">Jumlah Dipakai</th>
                                          <th className="p-4 text-right">Total Penjualan Barang</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 font-medium">
                                        {addonsList.map((addon, idx) => (
                                          <tr key={idx} className="hover:bg-slate-50 transition duration-200">
                                            <td className="p-4 font-bold text-slate-800">{addon.name}</td>
                                            <td className="p-4 text-center font-black text-indigo-600">
                                              <span className="bg-indigo-50 px-2.5 py-1 rounded-lg">{addon.qty}x</span>
                                            </td>
                                            <td className="p-4 text-right font-mono font-bold text-emerald-600">{formatRupiah(addon.totalPrice)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                              {isExpanded && addonsList.length === 0 && (
                                <div className="p-6 bg-slate-50 text-center border-t border-slate-100 animate-in slide-in-from-top-2">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tidak ada add-ons atau sparepart yang dicatat.</span>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {users.filter(u => u.role === Role.STAFF && u.status === 'active').length === 0 && (
                          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40 p-10 text-center text-slate-500 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                              <UserIcon size={28} className="text-slate-300" />
                            </div>
                            <h4 className="font-black text-slate-700 uppercase mb-1">Belum ada staff/teknisi</h4>
                            <p className="font-medium text-[11px] max-w-sm">Anda belum memiliki akun dengan peran STAFF.</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {performanceSubTab === 'PAYROLL' && (
                    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden">
                      <GajiDashboard activeUser={activeUser!} embedded={true} />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>


      {/* ================= MODAL: FIXED ASSET ADD/EDIT ================= */}
      {showAddAssetModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                {editingAsset ? 'Edit Aset Tetap' : 'Tambah Aset Tetap Baru'}
              </h3>
              <button onClick={() => setShowAddAssetModal(false)} className="p-1 rounded-full hover:bg-slate-100 transition text-slate-500 hover:text-slate-800">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveFixedAsset} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Nama Aset / Barang</label>
                <input
                  type="text"
                  placeholder="Misal: Mesin Steam Jet, Gedung Ruko"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 outline-none transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Tanggal Beli</label>
                  <input
                    type="date"
                    value={assetPurchaseDate}
                    onChange={(e) => setAssetPurchaseDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 outline-none transition"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Harga Beli (Rp)</label>
                  <input
                    type="number"
                    value={assetPurchasePrice || ''}
                    onChange={(e) => setAssetPurchasePrice(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 outline-none transition"
                    placeholder="2500000"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Deskripsi / Keterangan</label>
                <textarea
                  placeholder="Masukkan spesifikasi, masa garansi, atau catatan penting lainnya."
                  value={assetDescription}
                  onChange={(e) => setAssetDescription(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 outline-none transition h-20 resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAssetModal(false)}
                  className="flex-1 bg-white hover:bg-slate-100 text-slate-500 text-xs font-bold py-2.5 rounded-xl border border-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Aset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADDON ADD/EDIT ================= */}
      {showAddAddonModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                {editingAddon ? 'Edit Barang Add-on' : 'Daftarkan Barang Add-on Baru'}
              </h3>
              <button onClick={() => setShowAddAddonModal(false)} className="p-1 rounded-full hover:bg-slate-100 transition text-slate-500 hover:text-slate-800">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveAddon} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Nama Barang</label>
                <input
                  type="text"
                  placeholder="Misal: Pipa Tembaga PK, Freon R32"
                  value={addonName}
                  onChange={(e) => setAddonName(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 outline-none transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    value={addonPrice || ''}
                    onChange={(e) => setAddonPrice(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 outline-none transition"
                    placeholder="95000"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Harga Beli / HPP (Rp)</label>
                  <input
                    type="number"
                    value={addonHpp || ''}
                    onChange={(e) => setAddonHpp(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 outline-none transition"
                    placeholder="60000"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Deskripsi / Keterangan</label>
                <textarea
                  placeholder="Isi deskripsi produk jika diperlukan."
                  value={addonDescription}
                  onChange={(e) => setAddonDescription(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 outline-none transition h-20 resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAddonModal(false)}
                  className="flex-1 bg-white hover:bg-slate-100 text-slate-500 text-xs font-bold py-2.5 rounded-xl border border-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Barang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: RECORD STOCK-IN (PURCHASE ADDON) ================= */}
      {purchaseModalAddon && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">📥 Catat Stok Masuk</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{purchaseModalAddon.name}</p>
              </div>
              <button onClick={() => setPurchaseModalAddon(null)} className="p-1 rounded-full hover:bg-slate-100 transition text-slate-500 hover:text-slate-800">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRecordPurchase} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Kuantitas Baru (Qty)</label>
                  <input
                    type="number"
                    min={1}
                    value={purchaseQty}
                    onChange={(e) => setPurchaseQty(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 outline-none transition"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Harga Beli per Unit (Rp)</label>
                  <input
                    type="number"
                    value={purchasePrice || ''}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 outline-none transition"
                    placeholder="HPP Baru"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Catatan / Keterangan Pembelian</label>
                <textarea
                  placeholder="Misal: Restock dari Supplier AC Jaya, Invoice #12345"
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 outline-none transition h-20 resize-none"
                />
              </div>

              {/* HPP calculation visual guidance */}
              <div className="bg-white border border-indigo-950/60 p-3.5 rounded-2xl text-[10.5px] text-slate-500 space-y-1.5">
                <span className="text-[9.5px] text-indigo-400 font-black uppercase block tracking-wider">💡 Simulasi Kalkulasi HPP Baru</span>
                <div className="flex justify-between">
                  <span>Stok Saat Ini:</span>
                  <span className="font-bold text-slate-800">{purchaseModalAddon.stock || 0} unit</span>
                </div>
                <div className="flex justify-between">
                  <span>HPP Saat Ini:</span>
                  <span className="font-bold text-slate-800">Rp {Number(purchaseModalAddon.hpp || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="border-t border-slate-300 my-1"></div>
                <div className="flex justify-between font-bold text-cyan-400">
                  <span>Estimasi HPP Gabungan:</span>
                  <span>
                    Rp {
                      Math.round(
                        (
                          ((purchaseModalAddon.stock || 0) * (purchaseModalAddon.hpp || 0)) +
                          (purchaseQty * purchasePrice)
                        ) / ((purchaseModalAddon.stock || 0) + purchaseQty)
                      ).toLocaleString('id-ID')
                    }
                  </span>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPurchaseModalAddon(null)}
                  className="flex-1 bg-white hover:bg-slate-100 text-slate-500 text-xs font-bold py-2.5 rounded-xl border border-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Catat & Update HPP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  function handleEditAddon(addon: any) {
    handleEditAddonClick(addon);
  }
}
