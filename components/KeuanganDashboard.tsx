'use client';

import React, { useState, useEffect } from 'react';
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
  ClipboardList
} from 'lucide-react';

type FinanceTab = 'OVERVIEW' | 'BERGERAK' | 'TETAP' | 'RIWAYAT';

export default function KeuanganDashboard() {
  const { activeUser, logout, regions, showAlert } = useApp();
  const [activeTab, setActiveTab] = useState<FinanceTab>('OVERVIEW');

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
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col md:flex-row antialiased">
      {/* ================= SIDEBAR NAV ================= */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-cyan-400 rounded-xl flex items-center justify-center text-white font-black shadow-md shadow-indigo-500/25">
            💰
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider text-white">SUGAR FINANCE</h1>
            <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Divisi Keuangan</p>
          </div>
        </div>

        {/* User Info Card */}
        <div className="p-4 mx-4 my-5 bg-slate-900/60 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Akun</p>
          <h3 className="text-xs font-bold text-white mt-0.5 truncate">{activeUser?.name}</h3>
          <div className="mt-2 flex items-center gap-1.5 text-[9.5px] font-extrabold text-cyan-400 uppercase">
            <MapPin size={10} /> Cabang: {userRegionName}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-4 space-y-1.5">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition duration-200 ${activeTab === 'OVERVIEW' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}
          >
            <TrendingUp size={16} /> Ringkasan Keuangan
          </button>

          <button
            onClick={() => setActiveTab('BERGERAK')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition duration-200 ${activeTab === 'BERGERAK' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}
          >
            <Box size={16} /> Aset Bergerak (Add-ons)
          </button>

          <button
            onClick={() => setActiveTab('TETAP')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition duration-200 ${activeTab === 'TETAP' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}
          >
            <Building size={16} /> Aset Tetap
          </button>

          <button
            onClick={() => setActiveTab('RIWAYAT')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition duration-200 ${activeTab === 'RIWAYAT' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}
          >
            <History size={16} /> Riwayat Mutasi
          </button>
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 font-bold py-2.5 rounded-xl text-xs border border-slate-800 hover:border-rose-900/40 transition duration-200"
          >
            <LogOut size={14} /> Keluar Aplikasi
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-900">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between px-6 md:px-8 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dashboard Keuangan</span>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-black text-cyan-400 uppercase tracking-wider bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              {activeTab}
            </span>
          </div>
          <button
            onClick={loadDashboardData}
            className="bg-slate-900 hover:bg-slate-800 text-cyan-400 font-bold text-[10.5px] px-3.5 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5 transition active:scale-[0.98]"
          >
            🔄 Refresh Data
          </button>
        </header>

        {/* Workspace Area */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
          {isLoadingData ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader className="w-10 h-10 animate-spin text-cyan-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat data keuangan wilayah...</span>
            </div>
          ) : (
            <>
              {/* ================= TAB 1: OVERVIEW ================= */}
              {activeTab === 'OVERVIEW' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Financial Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-gradient-to-tr from-slate-950 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-md">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Nilai Aset Bergerak (Inventaris)</p>
                      <h2 className="text-2xl font-black text-white mt-1">Rp {totalMovingAssetValue.toLocaleString('id-ID')}</h2>
                      <p className="text-[9.5px] text-slate-400 mt-2 font-medium">Berdasarkan stok terdaftar dikali HPP per barang.</p>
                    </div>

                    <div className="bg-gradient-to-tr from-slate-950 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-md">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Pembelian Aset Tetap</p>
                      <h2 className="text-2xl font-black text-white mt-1">Rp {totalFixedAssetValue.toLocaleString('id-ID')}</h2>
                      <p className="text-[9.5px] text-slate-400 mt-2 font-medium">Nilai akumulasi total pengeluaran belanja aset fisik.</p>
                    </div>

                    <div className="bg-gradient-to-tr from-slate-950 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-md">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jumlah Jenis Inventaris / Aset Tetap</p>
                      <h2 className="text-2xl font-black text-white mt-1">
                        {addons.length} <span className="text-xs font-bold text-slate-400 uppercase">Barang</span> / {fixedAssets.length} <span className="text-xs font-bold text-slate-400 uppercase">Unit</span>
                      </h2>
                      <p className="text-[9.5px] text-slate-400 mt-2 font-medium">Jenis aset yang aktif tercatat di Cabang {userRegionName}.</p>
                    </div>
                  </div>

                  {/* Overview Lists / Activity info */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Fixed Assets Summary List */}
                    <div className="bg-slate-950/40 p-6 rounded-3xl border border-slate-800/80">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">Aset Tetap Terakhir</h4>
                        <button onClick={() => setActiveTab('TETAP')} className="text-[10px] font-bold text-cyan-400 hover:underline">Lihat Semua →</button>
                      </div>
                      {fixedAssets.length === 0 ? (
                        <p className="text-slate-500 text-xs py-4 text-center">Belum ada aset tetap terdaftar.</p>
                      ) : (
                        <div className="space-y-3">
                          {fixedAssets.slice(0, 4).map(asset => (
                            <div key={asset.id} className="flex justify-between items-center p-3.5 bg-slate-900 border border-slate-800/60 rounded-2xl">
                              <div>
                                <span className="text-xs font-bold text-white block">{asset.name}</span>
                                <span className="text-[10px] text-slate-500 block font-medium mt-0.5">Beli: {new Date(asset.purchase_date).toLocaleDateString('id-ID')}</span>
                              </div>
                              <span className="text-xs font-black text-emerald-400">Rp {Number(asset.purchase_price).toLocaleString('id-ID')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Inventory Low Stock warnings */}
                    <div className="bg-slate-950/40 p-6 rounded-3xl border border-slate-800/80">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">Inventaris Kritis (Stok &lt; 20)</h4>
                        <button onClick={() => setActiveTab('BERGERAK')} className="text-[10px] font-bold text-cyan-400 hover:underline">Kelola Stok →</button>
                      </div>
                      {addons.filter(a => (a.stock || 0) < 20).length === 0 ? (
                        <p className="text-emerald-400 text-xs py-4 text-center font-bold">🎉 Semua stok inventaris cabang dalam batas aman!</p>
                      ) : (
                        <div className="space-y-3">
                          {addons.filter(a => (a.stock || 0) < 20).slice(0, 4).map(addon => (
                            <div key={addon.id} className="flex justify-between items-center p-3.5 bg-slate-900 border border-slate-800/60 rounded-2xl">
                              <div>
                                <span className="text-xs font-bold text-white block">{addon.name}</span>
                                <span className="text-[10px] text-slate-500 block font-medium mt-0.5">HPP: Rp {Number(addon.hpp || 0).toLocaleString('id-ID')}</span>
                              </div>
                              <span className="text-xs font-black text-rose-400 bg-rose-950/40 px-3 py-1 rounded-full border border-rose-900/30">
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
                      <h2 className="text-lg font-black text-white">Inventaris Aset Bergerak (Add-ons)</h2>
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
                  <div className="bg-slate-950/40 rounded-3xl border border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider bg-slate-950/70">
                            <th className="py-4 px-6">Nama & Keterangan</th>
                            <th className="py-4 px-4 text-center">Stok Fisik</th>
                            <th className="py-4 px-4">HPP (Harga Beli)</th>
                            <th className="py-4 px-4">Harga Jual</th>
                            <th className="py-4 px-6 text-center">Aksi / Tindakan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-xs font-semibold text-slate-300">
                          {addons.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 px-6 text-center text-slate-500">Belum ada barang add-on terdaftar di wilayah ini.</td>
                            </tr>
                          ) : (
                            addons.map(addon => (
                              <tr key={addon.id} className="hover:bg-slate-900/30 transition">
                                <td className="py-4 px-6">
                                  <span className="text-sm font-bold text-white block">{addon.name}</span>
                                  <span className="text-[10px] text-slate-500 block font-medium mt-1">{addon.description || 'Tidak ada catatan.'}</span>
                                </td>
                                <td className="py-4 px-4 text-center">
                                  <span className={`px-3 py-1 rounded-full font-bold border ${addon.stock < 20 ? 'bg-rose-950/40 text-rose-400 border-rose-900/30' : 'bg-slate-900 text-slate-300 border-slate-800'}`}>
                                    {addon.stock || 0} unit
                                  </span>
                                </td>
                                <td className="py-4 px-4">
                                  <span className="font-mono text-slate-400">Rp {Number(addon.hpp || 0).toLocaleString('id-ID')}</span>
                                </td>
                                <td className="py-4 px-4">
                                  <span className="font-mono text-emerald-400">Rp {Number(addon.price).toLocaleString('id-ID')}</span>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="flex justify-center items-center gap-2">
                                    <button
                                      onClick={() => { setPurchaseModalAddon(addon); setPurchasePrice(Number(addon.hpp || 0)); setShowAddAddonModal(false); }}
                                      className="bg-slate-900 hover:bg-cyan-950 hover:text-cyan-400 text-cyan-400/90 font-extrabold text-[10px] px-3 py-1.5 rounded-lg border border-slate-800 transition uppercase"
                                    >
                                      📥 Stok Masuk
                                    </button>
                                    <button
                                      onClick={() => handleEditAddon(addon)}
                                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition"
                                    >
                                      <Edit size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteAddon(addon.id)}
                                      className="p-1.5 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-800 transition"
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
                      <h2 className="text-lg font-black text-white">Kelola Aset Tetap</h2>
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
                  <div className="bg-slate-950/40 rounded-3xl border border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider bg-slate-950/70">
                            <th className="py-4 px-6">Nama Aset & Deskripsi</th>
                            <th className="py-4 px-4">Tanggal Pembelian</th>
                            <th className="py-4 px-4">Harga Pembelian</th>
                            <th className="py-4 px-6 text-center">Tindakan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-xs font-semibold text-slate-300">
                          {fixedAssets.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-8 px-6 text-center text-slate-500">Belum ada aset tetap tercatat di wilayah ini.</td>
                            </tr>
                          ) : (
                            fixedAssets.map(asset => (
                              <tr key={asset.id} className="hover:bg-slate-900/30 transition">
                                <td className="py-4 px-6">
                                  <span className="text-sm font-bold text-white block">{asset.name}</span>
                                  <span className="text-[10px] text-slate-500 block font-medium mt-1">{asset.description || 'Tidak ada catatan.'}</span>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-1.5 text-slate-400">
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
                                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition"
                                    >
                                      <Edit size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFixedAsset(asset.id)}
                                      className="p-1.5 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-800 transition"
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
                    <h2 className="text-lg font-black text-white">Riwayat Mutasi Stok (Aset Bergerak)</h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Log aktivitas masuk dan keluarnya material pelengkap / sparepart cabang.</p>
                  </div>

                  {/* Transaction Log Table */}
                  <div className="bg-slate-950/40 rounded-3xl border border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider bg-slate-950/70">
                            <th className="py-4 px-6">Tanggal & Waktu</th>
                            <th className="py-4 px-4">Nama Barang</th>
                            <th className="py-4 px-4 text-center">Jenis Mutasi</th>
                            <th className="py-4 px-4 text-center">Kuantitas</th>
                            <th className="py-4 px-4">Nominal</th>
                            <th className="py-4 px-6">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-xs font-semibold text-slate-300">
                          {transactions.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 px-6 text-center text-slate-500">Belum ada catatan transaksi masuk/keluar.</td>
                            </tr>
                          ) : (
                            transactions.map(tx => (
                              <tr key={tx.id} className="hover:bg-slate-900/30 transition">
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-1.5 text-slate-400">
                                    <Clock size={12} />
                                    <span>{new Date(tx.createdAt).toLocaleString('id-ID')}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <span className="font-bold text-white block">{tx.addonName || `ID: ${tx.addonId}`}</span>
                                </td>
                                <td className="py-4 px-4 text-center">
                                  <span className={`px-2.5 py-0.5 rounded-full border text-[9.5px] font-black uppercase ${tx.type === 'masuk' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/20' : 'bg-rose-950/40 text-rose-400 border-rose-900/20'}`}>
                                    {tx.type}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-center font-mono">
                                  {tx.qty} unit
                                </td>
                                <td className="py-4 px-4 font-mono text-slate-400">
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
            </>
          )}
        </div>
      </main>

      {/* ================= MODAL: FIXED ASSET ADD/EDIT ================= */}
      {showAddAssetModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {editingAsset ? 'Edit Aset Tetap' : 'Tambah Aset Tetap Baru'}
              </h3>
              <button onClick={() => setShowAddAssetModal(false)} className="p-1 rounded-full hover:bg-slate-800 transition text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveFixedAsset} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nama Aset / Barang</label>
                <input
                  type="text"
                  placeholder="Misal: Mesin Steam Jet, Gedung Ruko"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 outline-none transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tanggal Beli</label>
                  <input
                    type="date"
                    value={assetPurchaseDate}
                    onChange={(e) => setAssetPurchaseDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 outline-none transition"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Harga Beli (Rp)</label>
                  <input
                    type="number"
                    value={assetPurchasePrice || ''}
                    onChange={(e) => setAssetPurchasePrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 outline-none transition"
                    placeholder="2500000"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Deskripsi / Keterangan</label>
                <textarea
                  placeholder="Masukkan spesifikasi, masa garansi, atau catatan penting lainnya."
                  value={assetDescription}
                  onChange={(e) => setAssetDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 outline-none transition h-20 resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAssetModal(false)}
                  className="flex-1 bg-slate-950 hover:bg-slate-800 text-slate-400 text-xs font-bold py-2.5 rounded-xl border border-slate-800 transition"
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {editingAddon ? 'Edit Barang Add-on' : 'Daftarkan Barang Add-on Baru'}
              </h3>
              <button onClick={() => setShowAddAddonModal(false)} className="p-1 rounded-full hover:bg-slate-800 transition text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveAddon} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nama Barang</label>
                <input
                  type="text"
                  placeholder="Misal: Pipa Tembaga PK, Freon R32"
                  value={addonName}
                  onChange={(e) => setAddonName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 outline-none transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    value={addonPrice || ''}
                    onChange={(e) => setAddonPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 outline-none transition"
                    placeholder="95000"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Harga Beli / HPP (Rp)</label>
                  <input
                    type="number"
                    value={addonHpp || ''}
                    onChange={(e) => setAddonHpp(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 outline-none transition"
                    placeholder="60000"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Deskripsi / Keterangan</label>
                <textarea
                  placeholder="Isi deskripsi produk jika diperlukan."
                  value={addonDescription}
                  onChange={(e) => setAddonDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 outline-none transition h-20 resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAddonModal(false)}
                  className="flex-1 bg-slate-950 hover:bg-slate-800 text-slate-400 text-xs font-bold py-2.5 rounded-xl border border-slate-800 transition"
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">📥 Catat Stok Masuk</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{purchaseModalAddon.name}</p>
              </div>
              <button onClick={() => setPurchaseModalAddon(null)} className="p-1 rounded-full hover:bg-slate-800 transition text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRecordPurchase} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Kuantitas Baru (Qty)</label>
                  <input
                    type="number"
                    min={1}
                    value={purchaseQty}
                    onChange={(e) => setPurchaseQty(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 outline-none transition"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Harga Beli per Unit (Rp)</label>
                  <input
                    type="number"
                    value={purchasePrice || ''}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 outline-none transition"
                    placeholder="HPP Baru"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Catatan / Keterangan Pembelian</label>
                <textarea
                  placeholder="Misal: Restock dari Supplier AC Jaya, Invoice #12345"
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 outline-none transition h-20 resize-none"
                />
              </div>

              {/* HPP calculation visual guidance */}
              <div className="bg-slate-950 border border-indigo-950/60 p-3.5 rounded-2xl text-[10.5px] text-slate-400 space-y-1.5">
                <span className="text-[9.5px] text-indigo-400 font-black uppercase block tracking-wider">💡 Simulasi Kalkulasi HPP Baru</span>
                <div className="flex justify-between">
                  <span>Stok Saat Ini:</span>
                  <span className="font-bold text-white">{purchaseModalAddon.stock || 0} unit</span>
                </div>
                <div className="flex justify-between">
                  <span>HPP Saat Ini:</span>
                  <span className="font-bold text-white">Rp {Number(purchaseModalAddon.hpp || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="border-t border-slate-900 my-1"></div>
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
                  className="flex-1 bg-slate-950 hover:bg-slate-800 text-slate-400 text-xs font-bold py-2.5 rounded-xl border border-slate-800 transition"
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
