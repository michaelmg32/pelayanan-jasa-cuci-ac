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
  UserCheck,
  Phone,
  ShieldCheck,
  Check
} from 'lucide-react';

type FinanceTab = 'OVERVIEW' | 'BERGERAK' | 'TETAP' | 'RIWAYAT' | 'STAFF_PERFORMANCE' | 'PROFIL';

export default function KeuanganDashboard() {
  const { activeUser, logout, regions, showAlert, appSettings, users, orders, setActiveUser } = useApp();
  const [activeTab, setActiveTab] = useState<FinanceTab>('OVERVIEW');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [performanceSubTab, setPerformanceSubTab] = useState<'STATISTICS' | 'PAYROLL'>('STATISTICS');
  const getFirstDayOfMonth = () => {
    const d = new Date();
    d.setDate(1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const getLastDayOfMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [filterStartDate, setFilterStartDate] = useState(getFirstDayOfMonth());
  const [filterEndDate, setFilterEndDate] = useState(getLastDayOfMonth());
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

  // Profile Form States
  const [profileViewMode, setProfileViewMode] = useState<'readonly' | 'edit-profile' | 'edit-password'>('readonly');
  const [editProfileName, setEditProfileName] = useState(activeUser?.name || '');
  const [editProfilePhone, setEditProfilePhone] = useState(activeUser?.phone || '');
  const [editProfileAddress, setEditProfileAddress] = useState(activeUser?.address || '');
  const [editProfilePhoto, setEditProfilePhoto] = useState(activeUser?.photo || '');
  const [editOldPassword, setEditOldPassword] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');
  const [saveProfileSuccess, setSaveProfileSuccess] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Synchronize state when activeUser changes
  useEffect(() => {
    if (activeUser) {
      setEditProfileName(activeUser.name || '');
      setEditProfilePhone(activeUser.phone || '');
      setEditProfileAddress(activeUser.address || '');
      setEditProfilePhoto(activeUser.photo || '');
    }
  }, [activeUser]);

  // Client-side image compression
  const compressImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 600, 600, 0.75);
        setEditProfilePhoto(compressedBase64);
      } catch (err) {
        console.error('Error compressing profile image:', err);
        showAlert('❌ Gagal memproses foto profil. Silakan coba lagi.');
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProfileName.trim()) {
      setProfileErrorMsg('Nama tidak boleh kosong');
      return;
    }
    try {
      setIsUpdatingProfile(true);
      setProfileErrorMsg('');
      const updatedUser = await api.updateUser(activeUser!.id, {
        name: editProfileName.trim(),
        email: activeUser!.email,
        phone: editProfilePhone.trim(),
        role: activeUser!.role,
        address: editProfileAddress.trim(),
        photo: editProfilePhoto,
      });
      setActiveUser(updatedUser);
      setEditProfilePhoto(updatedUser.photo || '');
      setSaveProfileSuccess(true);
      setProfileViewMode('readonly');
      setTimeout(() => setSaveProfileSuccess(false), 2500);
    } catch (error: any) {
      setProfileErrorMsg(error?.message || 'Gagal memperbarui profil');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editNewPassword !== editConfirmPassword) {
      setProfileErrorMsg('Konfirmasi password baru tidak cocok');
      return;
    }
    try {
      setIsUpdatingProfile(true);
      setProfileErrorMsg('');
      await api.updatePassword(activeUser!.id, { oldPassword: editOldPassword, newPassword: editNewPassword });
      setSaveProfileSuccess(true);
      setProfileViewMode('readonly');
      setEditOldPassword('');
      setEditNewPassword('');
      setEditConfirmPassword('');
      setTimeout(() => setSaveProfileSuccess(false), 2500);
    } catch (error: any) {
      setProfileErrorMsg(error?.message || 'Gagal mengubah password. Pastikan password lama benar.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

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

  // Stock Adjustment States
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentCounts, setAdjustmentCounts] = useState<{ [addonId: string]: string }>({});
  const [adjustmentNotes, setAdjustmentNotes] = useState<{ [addonId: string]: string }>({});
  const [isPostingAdjustment, setIsPostingAdjustment] = useState(false);

  const handleOpenAdjustmentModal = () => {
    const initialCounts: { [addonId: string]: string } = {};
    const initialNotes: { [addonId: string]: string } = {};
    addons.forEach(a => {
      initialCounts[a.id] = String(a.stock || 0);
      initialNotes[a.id] = '';
    });
    setAdjustmentCounts(initialCounts);
    setAdjustmentNotes(initialNotes);
    setShowAdjustmentModal(true);
  };

  const handlePostAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    const adjustmentsList = addons.map(a => {
      const physicalStock = Number(adjustmentCounts[a.id]);
      const systemStock = Number(a.stock || 0);
      const notes = adjustmentNotes[a.id]?.trim() || '';
      return {
        addonId: a.id,
        systemStock,
        physicalStock,
        notes: notes || `Penyesuaian Stok (${physicalStock - systemStock > 0 ? 'Kelebihan' : 'Kekurangan'} Fisik)`
      };
    }).filter(adj => adj.physicalStock !== adj.systemStock);

    if (adjustmentsList.length === 0) {
      showAlert('Tidak ada selisih stok yang diinputkan.');
      return;
    }

    try {
      setIsPostingAdjustment(true);
      await api.adjustAddons(adjustmentsList);
      showAlert(`✅ Berhasil memposting penyesuaian stok untuk ${adjustmentsList.length} barang.`);
      setShowAdjustmentModal(false);
      loadDashboardData();
    } catch (err: any) {
      console.error('Error posting adjustments:', err);
      showAlert(`❌ Gagal memposting penyesuaian stok: ${err.message}`);
    } finally {
      setIsPostingAdjustment(false);
    }
  };

  // Stock-in / Purchase Modal
  const [activeDetailModal, setActiveDetailModal] = useState<'BERGERAK' | 'TETAP' | 'PENDAPATAN' | 'LABA' | 'KINERJA' | 'GAJI' | null>(null);
  const [purchaseModalAddon, setPurchaseModalAddon] = useState<any | null>(null);
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [purchaseNotes, setPurchaseNotes] = useState('');

  // Submitting States
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch initial dashboard data
  
  const [claimsList, setClaimsList] = useState<any[]>([]);
  const loadClaims = async () => {
    try {
      const res = await fetch('/api/claims', { headers: api.getAuthHeaders() });
      if (res.ok) setClaimsList(await res.json());
    } catch(e) {}
  };
  const handleApproveClaim = async (id: string, status: string) => {
    if (!window.confirm(`Tandai klaim ini sebagai ${status}?`)) return;
    try {
      const res = await fetch(`/api/claims/${id}`, { 
        method: 'PUT', 
        headers: api.getAuthHeaders(), 
        body: JSON.stringify({ status }) 
      });
      if (res.ok) { showAlert('Klaim berhasil diperbarui'); loadClaims(); }
      else showAlert('Gagal memproses klaim');
    } catch(e) { showAlert('Error memproses klaim'); }
  };

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
    loadClaims();
  }, [activeUser]);

  // Asset Totals
  const totalMovingAssetValue = addons.reduce((sum, item) => sum + (Number(item.hpp) || 0) * (Number(item.stock) || 0), 0);
  const totalFixedAssetValue = fixedAssets.reduce((sum, item) => sum + (Number(item.purchase_price) || 0), 0);

  // Claimed Salary Calculation
  const approvedClaims = claimsList.filter(c => ['DISETUJUI', 'DIBAYAR', 'SELESAI', 'APPROVED'].includes(c.status?.toUpperCase()));
  const totalClaimedPoints = approvedClaims.filter(c => c.type === 'points').reduce((sum, c) => sum + (Number(c.amount) || Number(c.points_claimed) || 0), 0);
  const totalClaimedSalary = approvedClaims.filter(c => c.type === 'daily_salary' || c.type === 'salary').reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const totalStaffSalaryExpense = (totalClaimedPoints * 1000) + totalClaimedSalary;

  // Regional Branch Performance
  const regionalOrders = (orders || []).filter((o: any) => 
    !activeUser?.region_id || o.region_id === activeUser.region_id
  );
  const completedRegionalOrders = regionalOrders.filter((o: any) => o.status === 'SELESAI');
  const totalRevenue = completedRegionalOrders.reduce((sum, o: any) => sum + (Number(o.finalPrice) || Number(o.totalCost) || 0), 0);
  const totalMargin = completedRegionalOrders.reduce((sum, o: any) => sum + (Number(o.margin) || 0), 0);
  const completionRate = regionalOrders.length > 0 
    ? Math.round((completedRegionalOrders.length / regionalOrders.length) * 100) 
    : 0;
  
  const ratedOrders = completedRegionalOrders.filter((o: any) => typeof o.rating === 'number' && o.rating > 0);
  const avgRating = ratedOrders.length > 0 
    ? (ratedOrders.reduce((sum, o: any) => sum + o.rating, 0) / ratedOrders.length).toFixed(1) 
    : '0';

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
      {/* GLOBAL HEADER BAR */}
      <div className="bg-slate-900 text-white px-5 pt-4 pb-12 shrink-0 shadow-md rounded-b-[32px] flex justify-between items-start z-30 relative overflow-hidden">
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
          <div className="text-left flex items-center gap-2.5">
            <div>
              <h1 className="text-sm font-black leading-none">{appSettings?.['GLOBAL']?.business_name || 'Sugar AC'}</h1>
              <p className="text-[9px] text-blue-200 mt-1">Sistem Layanan AC Profesional | Keuangan</p>
            </div>
            <span className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white text-[8px] font-black px-2.5 py-1 rounded-full border border-indigo-400/20 uppercase tracking-widest ml-1 shadow-sm">
              Region: {userRegionName}
            </span>
          </div>
        </div>
      </div>

      {/* ===================== NEW CONTROL TABS SYSTEM ===================== */}
      <div className="px-5 -mt-8 relative z-40 shrink-0 mb-2">
        <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/40 border border-slate-100/60 p-4 md:p-5">
          <div className="grid grid-cols-4 md:grid-cols-7 gap-y-5 gap-x-2">
            
            <div onClick={() => setActiveTab('OVERVIEW')} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors ${activeTab === 'OVERVIEW' ? 'bg-blue-100 text-blue-600 border border-blue-200 shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}>
                 <TrendingUp size={24} strokeWidth={2.5} />
              </div>
              <span className={`text-[9px] font-extrabold text-center uppercase tracking-wider ${activeTab === 'OVERVIEW' ? 'text-blue-700' : 'text-slate-500'}`}>Ringkasan</span>
            </div>
            
            <div onClick={() => setActiveTab('BERGERAK')} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors ${activeTab === 'BERGERAK' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}>
                 <Box size={24} strokeWidth={2.5} />
              </div>
              <span className={`text-[9px] font-extrabold text-center uppercase tracking-wider ${activeTab === 'BERGERAK' ? 'text-emerald-700' : 'text-slate-500'}`}>Bergerak</span>
            </div>
            
            <div onClick={() => setActiveTab('TETAP')} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors ${activeTab === 'TETAP' ? 'bg-amber-100 text-amber-600 border border-amber-200 shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}>
                 <Building size={24} strokeWidth={2.5} />
              </div>
              <span className={`text-[9px] font-extrabold text-center uppercase tracking-wider ${activeTab === 'TETAP' ? 'text-amber-700' : 'text-slate-500'}`}>Tetap</span>
            </div>
            
            <div onClick={() => setActiveTab('RIWAYAT')} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors ${activeTab === 'RIWAYAT' ? 'bg-indigo-100 text-indigo-600 border border-indigo-200 shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}>
                 <History size={24} strokeWidth={2.5} />
              </div>
              <span className={`text-[9px] font-extrabold text-center uppercase tracking-wider ${activeTab === 'RIWAYAT' ? 'text-indigo-700' : 'text-slate-500'}`}>Mutasi</span>
            </div>

            <div onClick={() => setActiveTab('STAFF_PERFORMANCE')} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors ${activeTab === 'STAFF_PERFORMANCE' ? 'bg-cyan-100 text-cyan-600 border border-cyan-200 shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}>
                 <UserCheck size={24} strokeWidth={2.5} />
              </div>
              <span className={`text-[9px] font-extrabold text-center uppercase tracking-wider ${activeTab === 'STAFF_PERFORMANCE' ? 'text-cyan-700' : 'text-slate-500'}`}>Kinerja</span>
            </div>

            <div onClick={() => setActiveTab('PROFIL')} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors ${activeTab === 'PROFIL' ? 'bg-purple-100 text-purple-600 border border-purple-200 shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}>
                 <UserIcon size={24} strokeWidth={2.5} />
              </div>
              <span className={`text-[9px] font-extrabold text-center uppercase tracking-wider ${activeTab === 'PROFIL' ? 'text-purple-700' : 'text-slate-500'}`}>Profil</span>
            </div>

            <div onClick={() => setShowLogoutConfirm(true)} className="flex flex-col items-center gap-2.5 cursor-pointer group active:scale-95 transition-all hover:scale-105">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center bg-rose-50 text-rose-500 border border-rose-100 transition-colors group-hover:bg-rose-100 group-hover:text-rose-600 group-hover:border-rose-200 shadow-sm">
                 <LogOut size={24} strokeWidth={2.5} />
              </div>
              <span className="text-[9px] font-extrabold text-slate-500 text-center uppercase tracking-wider group-hover:text-rose-600 transition-colors">Keluar</span>
            </div>
            
          </div>
        </div>
      </div>

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
              {activeTab !== 'PROFIL' && (
                <div className="flex justify-start mb-4">
                  <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline-block">Filter Tanggal:</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-700 font-bold">
                      <input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg outline-none focus:border-indigo-500 font-mono"
                      />
                      <span className="text-slate-400">s/d</span>
                      <input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'OVERVIEW' && (
                <div className="space-y-6 animate-fade-in text-left">


                  {/* Financial Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div 
                      onClick={() => setActiveDetailModal('BERGERAK')}
                      className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-3xl border border-indigo-400/30 shadow-lg shadow-indigo-200/50 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 cursor-pointer"
                    >
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition duration-500"></div>
                      <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Total Nilai Aset Bergerak (Inventaris)</p>
                      <h2 className="text-2xl font-black text-white mt-1 relative z-10">Rp {totalMovingAssetValue.toLocaleString('id-ID')}</h2>
                      <p className="text-[9.5px] text-white/70 mt-2 font-medium">Berdasarkan stok terdaftar dikali HPP per barang. <span className="underline opacity-90 block mt-1">Klik untuk detail →</span></p>
                    </div>

                    <div 
                      onClick={() => setActiveDetailModal('TETAP')}
                      className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl border border-emerald-400/30 shadow-lg shadow-emerald-200/50 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 cursor-pointer"
                    >
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition duration-500"></div>
                      <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Total Pembelian Aset Tetap</p>
                      <h2 className="text-2xl font-black text-white mt-1 relative z-10">Rp {totalFixedAssetValue.toLocaleString('id-ID')}</h2>
                      <p className="text-[9.5px] text-white/70 mt-2 font-medium">Nilai akumulasi total pengeluaran belanja aset fisik. <span className="underline opacity-90 block mt-1">Klik untuk detail →</span></p>
                    </div>

                    <div 
                      onClick={() => setActiveDetailModal('GAJI')}
                      className="bg-gradient-to-br from-cyan-500 to-blue-600 p-6 rounded-3xl border border-cyan-400/30 shadow-lg shadow-cyan-200/50 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 cursor-pointer"
                    >
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition duration-500"></div>
                      <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Pengeluaran Gaji Karyawan</p>
                      <h2 className="text-2xl font-black text-white mt-1 relative z-10">Rp {totalStaffSalaryExpense.toLocaleString('id-ID')}</h2>
                      <p className="text-[9.5px] text-white/70 mt-2 font-medium">Total klaim gaji & poin yang sudah dibayarkan. <span className="underline opacity-90 block mt-1">Lihat Histori Klaim →</span></p>
                    </div>

                    <div 
                      onClick={() => setActiveDetailModal('PENDAPATAN')}
                      className="bg-gradient-to-br from-rose-500 to-pink-600 p-6 rounded-3xl border border-rose-400/30 shadow-lg shadow-rose-200/50 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 cursor-pointer"
                    >
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition duration-500"></div>
                      <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Total Pendapatan Cabang</p>
                      <h2 className="text-2xl font-black text-white mt-1 relative z-10">Rp {totalRevenue.toLocaleString('id-ID')}</h2>
                      <p className="text-[9.5px] text-white/70 mt-2 font-medium">Akumulasi omset lunas dari order Cabang {userRegionName}. <span className="underline opacity-90 block mt-1">Klik untuk rincian order →</span></p>
                    </div>
                  </div>

                  {/* Overview Lists / Activity info */}
                  <div className="grid grid-cols-1 gap-6">

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
                    <div className="flex gap-2">
                      <button
                        onClick={handleOpenAdjustmentModal}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 transition active:scale-[0.98] cursor-pointer"
                      >
                        <Sparkles size={14} /> Penyesuaian Stok
                      </button>
                      <button
                        onClick={() => { resetAddonForm(); setEditingAddon(null); setShowAddAddonModal(true); }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 transition active:scale-[0.98] cursor-pointer"
                      >
                        <Plus size={14} /> Daftar Add-on Baru
                      </button>
                    </div>
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
                        
                      </div>

                      <div className="grid grid-cols-1 gap-5">
                        {users.filter(u => u.role === Role.STAFF && u.status === 'active').map(staff => {
                          const staffOrders = orders.filter(o => {
                            if (o.assignedTo !== staff.id || o.status !== 'SELESAI') return false;
                            const orderDateStr = o.completedAt || o.scheduledDate || o.createdAt;
                            const orderDate = getLocalDateOnly(orderDateStr);
                            return orderDate >= filterStartDate && orderDate <= filterEndDate;
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

              {/* ================= TAB: PROFIL ================= */}
              {activeTab === 'PROFIL' && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 max-w-2xl mx-auto shadow-xl shadow-slate-200/50 animate-fade-in text-left">
                  <div className="flex justify-between items-center px-1 border-b pb-3 border-slate-100">
                    <div>
                      <h3 className="font-extrabold text-sm uppercase text-slate-800">Profil Keuangan</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Informasi akun dan akses cabang Anda</p>
                    </div>
                    <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[8.5px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                      KEUANGAN ({userRegionName})
                    </span>
                  </div>

                  {saveProfileSuccess && (
                    <div className="bg-emerald-100 border border-emerald-200 p-2.5 rounded-xl text-[11px] text-emerald-800 font-bold flex items-center gap-2">
                      <Check size={14} /> Profil/Password berhasil diperbarui!
                    </div>
                  )}

                  {profileErrorMsg && (
                    <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-[11px] text-rose-700 font-semibold flex items-center gap-2">
                      <X size={14} /> {profileErrorMsg}
                    </div>
                  )}

                  {profileViewMode === 'readonly' && (
                    <div className="space-y-5">
                      <div className="flex flex-col items-center justify-center pb-4 border-b border-slate-150">
                        <div className="w-20 h-20 bg-indigo-100 text-indigo-700 font-black text-lg flex items-center justify-center rounded-2xl shadow-sm border overflow-hidden">
                          {activeUser?.photo ? (
                            <img src={activeUser.photo} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            activeUser?.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-850 mt-2">{activeUser?.name}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">{activeUser?.email}</p>
                      </div>

                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between border-b pb-3 border-slate-50">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap</p>
                            <p className="text-xs font-bold text-slate-800 mt-0.5">{activeUser?.name}</p>
                          </div>
                          <UserIcon size={16} className="text-slate-350" />
                        </div>

                        <div className="flex items-center justify-between border-b pb-3 border-slate-50">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No. Handphone</p>
                            <p className="text-xs font-bold text-slate-800 mt-0.5">{activeUser?.phone || <span className="italic text-slate-400">Belum diatur</span>}</p>
                          </div>
                          <Phone size={16} className="text-slate-350" />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Alamat Rumah</p>
                            <p className="text-xs font-bold text-slate-800 mt-0.5">{activeUser?.address || <span className="italic text-slate-400">Belum diatur</span>}</p>
                          </div>
                          <MapPin size={16} className="text-slate-350" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-3">
                        <button
                          onClick={() => { setProfileErrorMsg(''); setProfileViewMode('edit-profile'); }}
                          className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[10px] py-2.5 rounded-xl uppercase transition cursor-pointer text-center"
                        >
                          Edit Profil
                        </button>
                        <button
                          onClick={() => { setProfileErrorMsg(''); setProfileViewMode('edit-password'); }}
                          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] py-2.5 rounded-xl uppercase transition cursor-pointer text-center"
                        >
                          Ubah Password
                        </button>
                      </div>
                    </div>
                  )}

                  {profileViewMode === 'edit-profile' && (
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      {/* Profile Photo Upload */}
                      <div className="space-y-2 pb-2 border-b border-slate-100">
                        <label className="text-[9.5px] text-slate-400 font-bold uppercase block">Foto Profil</label>
                        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-150">
                          <div className="w-14 h-14 bg-slate-200 text-slate-500 rounded-2xl flex items-center justify-center overflow-hidden border">
                            {editProfilePhoto ? (
                              <img src={editProfilePhoto} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-bold">No Photo</span>
                            )}
                          </div>
                          <div className="flex-grow text-left">
                            <span className="text-[10px] text-slate-655 font-bold block mb-1">Unggah Foto Profil</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleProfilePhotoChange}
                              className="w-full text-[10px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-755 hover:file:bg-indigo-100 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Nama Lengkap</label>
                        <input
                          type="text"
                          value={editProfileName}
                          onChange={(e) => setEditProfileName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 disabled:opacity-50 transition"
                          disabled={isUpdatingProfile}
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">No. Handphone</label>
                        <input
                          type="text"
                          value={editProfilePhone}
                          onChange={(e) => setEditProfilePhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 disabled:opacity-50 transition"
                          disabled={isUpdatingProfile}
                        />
                      </div>

                      <div>
                        <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Alamat Rumah</label>
                        <textarea
                          value={editProfileAddress}
                          onChange={(e) => setEditProfileAddress(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none focus:border-indigo-500 h-16 resize-none disabled:opacity-50 transition"
                          disabled={isUpdatingProfile}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setProfileViewMode('readonly')}
                          disabled={isUpdatingProfile}
                          className="w-full bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-655 font-extrabold text-[10px] py-3 rounded-xl uppercase cursor-pointer transition text-center"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isUpdatingProfile}
                          className="w-full bg-indigo-600 hover:bg-indigo-755 disabled:bg-slate-400 text-white font-extrabold text-[10px] py-3 rounded-xl uppercase cursor-pointer flex items-center justify-center gap-2 transition shadow-md text-center"
                        >
                          {isUpdatingProfile && <Loader size={12} className="animate-spin" />}
                          {isUpdatingProfile ? 'Menyimpan...' : 'Simpan Profil'}
                        </button>
                      </div>
                    </form>
                  )}

                  {profileViewMode === 'edit-password' && (
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2 mb-2">
                        <ShieldCheck size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                        <p className="text-[9.5px] text-slate-555 font-medium leading-relaxed">
                          Silakan masukkan password lama Anda untuk memverifikasi perubahan password baru.
                        </p>
                      </div>

                      <div>
                        <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Password Lama</label>
                        <input
                          type="password"
                          value={editOldPassword}
                          onChange={(e) => setEditOldPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 transition"
                          disabled={isUpdatingProfile}
                          required
                        />
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Password Baru</label>
                        <input
                          type="password"
                          value={editNewPassword}
                          onChange={(e) => setEditNewPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 transition"
                          disabled={isUpdatingProfile}
                          required
                          minLength={6}
                        />
                      </div>

                      <div>
                        <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Konfirmasi Password Baru</label>
                        <input
                          type="password"
                          value={editConfirmPassword}
                          onChange={(e) => setEditConfirmPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 transition"
                          disabled={isUpdatingProfile}
                          required
                          minLength={6}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setProfileViewMode('readonly');
                            setEditOldPassword('');
                            setEditNewPassword('');
                            setEditConfirmPassword('');
                            setProfileErrorMsg('');
                          }}
                          disabled={isUpdatingProfile}
                          className="w-full bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-655 font-extrabold text-[10px] py-3 rounded-xl uppercase cursor-pointer transition text-center"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isUpdatingProfile}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-extrabold text-[10px] py-3 rounded-xl uppercase cursor-pointer flex items-center justify-center gap-2 transition shadow-md text-center"
                        >
                          {isUpdatingProfile && <Loader size={12} className="animate-spin" />}
                          {isUpdatingProfile ? 'Menyimpan...' : 'Ubah Password'}
                        </button>
                      </div>
                    </form>
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
      {/* ================= MODAL: DETAIL LAPORAN KEUANGAN & ASET ================= */}
      {activeDetailModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white shrink-0">
              <div>
                <span className="text-[8px] bg-indigo-650 px-2.5 py-0.5 rounded font-black uppercase text-white tracking-widest">Detail Laporan Wilayah</span>
                <h3 className="text-sm font-extrabold text-white mt-1">
                  {activeDetailModal === 'BERGERAK' && `Aset Bergerak & Mutasi Cabang — ${userRegionName}`}
                  {activeDetailModal === 'TETAP' && `Pembelian Aset Tetap Cabang — ${userRegionName}`}
                  {activeDetailModal === 'PENDAPATAN' && `Rincian Pendapatan Cabang — ${userRegionName}`}
                  {activeDetailModal === 'LABA' && `Rincian Laba Bersih & Margin Cabang — ${userRegionName}`}
                  {activeDetailModal === 'KINERJA' && `Ulasan Pelanggan & Kinerja Staff — ${userRegionName}`}
                  {activeDetailModal === 'GAJI' && `Histori Pencairan Gaji & Poin — ${userRegionName}`}
                </h3>
              </div>
              <button 
                onClick={() => setActiveDetailModal(null)} 
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 bg-slate-50 flex-1 text-xs">
              {/* 1. ASET BERGERAK DETAIL */}
              {activeDetailModal === 'BERGERAK' && (
                <div className="space-y-5">
                  <div className="bg-white border border-slate-150 p-4 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Katalog Inventaris Wilayah</span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-semibold text-slate-650">
                        <thead>
                          <tr className="border-b border-slate-200 text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                            <th className="py-2.5 px-3">Nama Barang</th>
                            <th className="py-2.5 px-2 text-center">Stok</th>
                            <th className="py-2.5 px-2">HPP</th>
                            <th className="py-2.5 px-2">Harga Jual</th>
                            <th className="py-2.5 px-3 text-right">Total Nilai HPP</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {addons.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-4 text-center text-slate-400">Tidak ada barang terdaftar.</td>
                            </tr>
                          ) : (
                            addons.map(a => (
                              <tr key={a.id} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-3 font-bold text-slate-800">{a.name}</td>
                                <td className="py-2.5 px-2 text-center">
                                  <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-black ${a.stock < 20 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'}`}>
                                    {a.stock || 0} unit
                                  </span>
                                </td>
                                <td className="py-2.5 px-2 font-mono text-slate-500">Rp {Number(a.hpp || 0).toLocaleString('id-ID')}</td>
                                <td className="py-2.5 px-2 font-mono text-emerald-500">Rp {Number(a.price).toLocaleString('id-ID')}</td>
                                <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-extrabold">Rp {((a.stock || 0) * (a.hpp || 0)).toLocaleString('id-ID')}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs font-black text-slate-850">
                      <span>TOTAL KEKAYAAN ASET BERGERAK (HPP):</span>
                      <span className="text-sm text-indigo-600 font-mono">Rp {totalMovingAssetValue.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Mutasi logs */}
                  <div className="bg-white border border-slate-150 p-4 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mutasi Stok Terakhir (Cabang)</span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-semibold text-slate-650">
                        <thead>
                          <tr className="border-b border-slate-200 text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                            <th className="py-2.5 px-3">Waktu</th>
                            <th className="py-2.5 px-3">Nama Barang</th>
                            <th className="py-2.5 px-2">Jenis</th>
                            <th className="py-2.5 px-2 text-center">Qty</th>
                            <th className="py-2.5 px-3 text-right">Harga Unit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(() => {
                            const regionalAddonIds = addons.map(a => a.id);
                            const regTx = transactions.filter(t => regionalAddonIds.includes(t.addonId)).slice(0, 8);
                            if (regTx.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={5} className="py-4 text-center text-slate-400">Belum ada riwayat mutasi stok.</td>
                                </tr>
                              );
                            }
                            return regTx.map(tx => (
                              <tr key={tx.id} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-3 text-slate-500 font-mono">{new Date(tx.createdAt).toLocaleString('id-ID')}</td>
                                <td className="py-2.5 px-3 font-bold text-slate-800">{tx.addonName}</td>
                                <td className="py-2.5 px-2">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${tx.type === 'masuk' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                                    {tx.type === 'masuk' ? 'Masuk' : 'Keluar'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-2 text-center font-mono font-black">{tx.qty}x</td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700">Rp {Number(tx.price).toLocaleString('id-ID')}</td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. ASET TETAP DETAIL */}
              {activeDetailModal === 'TETAP' && (
                <div className="bg-white border border-slate-150 p-4 rounded-2xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inventaris Peralatan Cabang</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-semibold text-slate-650">
                      <thead>
                        <tr className="border-b border-slate-200 text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                          <th className="py-2.5 px-3">Nama Alat / Aset</th>
                          <th className="py-2.5 px-3">Tanggal Beli</th>
                          <th className="py-2.5 px-3">Deskripsi</th>
                          <th className="py-2.5 px-3 text-right">Harga Beli</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {fixedAssets.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-slate-400">Belum ada aset tetap terdaftar.</td>
                          </tr>
                        ) : (
                          fixedAssets.map(asset => (
                            <tr key={asset.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 font-bold text-slate-800">{asset.name}</td>
                              <td className="py-2.5 px-3 text-slate-500">{new Date(asset.purchase_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                              <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">{asset.description || '-'}</td>
                              <td className="py-2.5 px-3 text-right font-mono text-emerald-500 font-extrabold">Rp {Number(asset.purchase_price).toLocaleString('id-ID')}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs font-black text-slate-850">
                    <span>TOTAL PENGELUARAN ASET TETAP:</span>
                    <span className="text-sm text-emerald-500 font-mono">Rp {totalFixedAssetValue.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}

              {/* 3. PENDAPATAN CABANG DETAIL */}
              {activeDetailModal === 'PENDAPATAN' && (
                <div className="bg-white border border-slate-150 p-4 rounded-2xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rincian Order Selesai & Terbayar</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-semibold text-slate-650">
                      <thead>
                        <tr className="border-b border-slate-200 text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                          <th className="py-2.5 px-3">Order ID</th>
                          <th className="py-2.5 px-3">Customer</th>
                          <th className="py-2.5 px-2 text-center">Selesai</th>
                          <th className="py-2.5 px-2">Jasa</th>
                          <th className="py-2.5 px-2">Addon</th>
                          <th className="py-2.5 px-3 text-right">Total Dibayar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {completedRegionalOrders.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-4 text-center text-slate-400">Belum ada pendapatan terekam untuk cabang ini.</td>
                          </tr>
                        ) : (
                          completedRegionalOrders.map(o => (
                            <tr key={o.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">{o.id}</td>
                              <td className="py-2.5 px-3 text-slate-800">
                                <span className="font-bold block">{o.customerName}</span>
                                <span className="text-[9px] text-slate-450">{o.customerPhone}</span>
                              </td>
                              <td className="py-2.5 px-2 text-center text-slate-500 font-mono">{o.completedAt ? new Date(o.completedAt).toLocaleDateString('id-ID') : new Date(o.scheduledDate).toLocaleDateString('id-ID')}</td>
                              <td className="py-2.5 px-2 font-mono text-slate-500">Rp {Number(o.serviceCost || 0).toLocaleString('id-ID')}</td>
                              <td className="py-2.5 px-2 font-mono text-slate-500">Rp {Number(o.addonsCost || 0).toLocaleString('id-ID')}</td>
                              <td className="py-2.5 px-3 text-right font-mono text-rose-500 font-extrabold">Rp {Number(o.finalPrice || o.totalCost || 0).toLocaleString('id-ID')}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs font-black text-slate-850">
                    <span>TOTAL PENDAPATAN BRUTO CABANG:</span>
                    <span className="text-sm text-rose-500 font-mono">Rp {totalRevenue.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}

              {/* 4. LABA BERSIH CABANG DETAIL */}
              {activeDetailModal === 'LABA' && (
                <div className="space-y-4">
                  <div className="bg-white border border-slate-150 p-4 rounded-2xl space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Analisa Laba Rugi Cabang (Pekerjaan Selesai)</span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-semibold text-slate-650">
                        <thead>
                          <tr className="border-b border-slate-200 text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                            <th className="py-2.5 px-3">Order ID & Customer</th>
                            <th className="py-2.5 px-3 text-right">Pendapatan</th>
                            <th className="py-2.5 px-3 text-right">HPP (Modal Jasa/Stok)</th>
                            <th className="py-2.5 px-3 text-right">Laba Bersih (Margin)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {completedRegionalOrders.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-4 text-center text-slate-400">Belum ada data laba rugi.</td>
                            </tr>
                          ) : (
                            completedRegionalOrders.map(o => {
                              const rev = Number(o.finalPrice || o.totalCost || 0);
                              const marg = Number(o.margin || 0);
                              const hppVal = Math.max(0, rev - marg);
                              return (
                                <tr key={o.id} className="hover:bg-slate-50/50">
                                  <td className="py-2.5 px-3 text-slate-850">
                                    <span className="font-mono text-[9.5px] text-slate-450 block">{o.id}</span>
                                    <span className="font-bold">{o.customerName}</span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono text-slate-800">Rp {rev.toLocaleString('id-ID')}</td>
                                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">Rp {hppVal.toLocaleString('id-ID')}</td>
                                  <td className="py-2.5 px-3 text-right font-mono text-emerald-500 font-extrabold">Rp {marg.toLocaleString('id-ID')}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Financial calculation metrics breakdown */}
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-100 p-4 rounded-2xl space-y-3">
                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest block">Simulasi Laba Bersih Wilayah</span>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-white p-3 rounded-xl border border-indigo-100/70 shadow-xs">
                        <span className="text-[8.5px] uppercase tracking-wider font-bold text-slate-400 block mb-1">Total Omset</span>
                        <span className="text-xs font-black text-slate-800 font-mono">Rp {totalRevenue.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-indigo-100/70 shadow-xs">
                        <span className="text-[8.5px] uppercase tracking-wider font-bold text-slate-400 block mb-1">Estimasi HPP & Komisi</span>
                        <span className="text-xs font-black text-slate-500 font-mono">Rp {(totalRevenue - totalMargin).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-indigo-100/70 shadow-xs">
                        <span className="text-[8.5px] uppercase tracking-wider font-bold text-slate-400 block mb-1">Estimasi Laba Bersih</span>
                        <span className="text-xs font-black text-emerald-500 font-mono">Rp {totalMargin.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. KINERJA STAFF & ULASAN DETAIL */}
              {activeDetailModal === 'KINERJA' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                  
                  {/* Leaderboard staff */}
                  <div className="bg-white border border-slate-150 p-4 rounded-2xl space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Peringkat & Kinerja Staff (Teknisi)</span>
                    <div className="space-y-2">
                      {(() => {
                        const staffStats: { [name: string]: { completed: number, ratings: number[], sumRating: number } } = {};
                        completedRegionalOrders.forEach(o => {
                          const name = o.assignedEmployeeName || 'Belum Ditugaskan';
                          if (!staffStats[name]) {
                            staffStats[name] = { completed: 0, ratings: [], sumRating: 0 };
                          }
                          staffStats[name].completed += 1;
                          if (typeof o.rating === 'number' && o.rating > 0) {
                            staffStats[name].ratings.push(o.rating);
                            staffStats[name].sumRating += o.rating;
                          }
                        });

                        const staffList = Object.keys(staffStats).map(name => {
                          const s = staffStats[name];
                          const avg = s.ratings.length > 0 ? (s.sumRating / s.ratings.length).toFixed(1) : 'N/A';
                          return { name, completed: s.completed, avgRating: avg };
                        }).sort((a, b) => b.completed - a.completed);

                        if (staffList.length === 0) {
                          return <p className="text-center text-slate-400 py-4">Belum ada tugas selesai oleh staff.</p>;
                        }

                        return staffList.map((st, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 border rounded-xl hover:border-indigo-200 transition duration-150">
                            <div>
                              <span className="text-[10px] font-mono font-black text-slate-400 bg-slate-200/60 w-5 h-5 rounded-full inline-flex items-center justify-center mr-2">#{idx + 1}</span>
                              <strong className="text-slate-800 font-bold">{st.name}</strong>
                            </div>
                            <div className="text-right">
                              <span className="block text-[10px] font-black text-indigo-700">{st.completed} Tugas Selesai</span>
                              <span className="block text-[9.5px] font-bold text-amber-500">★ {st.avgRating} Rating</span>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Customer Review ulasan */}
                  <div className="bg-white border border-slate-150 p-4 rounded-2xl space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ulasan & Rating dari Pelanggan</span>
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {(() => {
                        const reviews = completedRegionalOrders.filter(o => typeof o.rating === 'number' && o.rating > 0);
                        if (reviews.length === 0) {
                          return <p className="text-center text-slate-400 py-4">Belum ada ulasan yang terisi.</p>;
                        }
                        return reviews.map(r => (
                          <div key={r.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1.5 text-left hover:shadow-xs transition">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-bold text-slate-800 text-[11px]">{r.customerName}</span>
                                <span className="text-[8px] font-mono text-slate-450 block">{r.id} | {r.completedAt ? new Date(r.completedAt).toLocaleDateString('id-ID') : ''}</span>
                              </div>
                              <span className="text-amber-400 font-black tracking-wide text-xs">
                                {'★'.repeat(r.rating || 0)}
                                <span className="text-slate-300">{'★'.repeat(5 - (r.rating || 0))}</span>
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-650 italic leading-relaxed bg-white p-2 rounded-lg border border-slate-100">
                              "{r.ratingNotes || 'Tidak ada komentar tertulis.'}"
                            </p>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>

              )}

              {/* 6. HISTORI KLAIM GAJI & POIN */}
              {activeDetailModal === 'GAJI' && (
                <div className="bg-white border border-slate-150 p-4 rounded-2xl space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Histori Pencairan Gaji & Poin Karyawan</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-semibold text-slate-650">
                      <thead>
                        <tr className="border-b border-slate-200 text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                          <th className="py-2.5 px-3">Waktu Klaim</th>
                          <th className="py-2.5 px-3">Karyawan</th>
                          <th className="py-2.5 px-2">Jenis Klaim</th>
                          <th className="py-2.5 px-3 text-right">Nominal Pencairan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {approvedClaims.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-slate-400">Belum ada histori pencairan gaji.</td>
                          </tr>
                        ) : (
                          approvedClaims.map(c => (
                            <tr key={c.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">{new Date(c.created_at || new Date()).toLocaleString('id-ID')}</td>
                              <td className="py-2.5 px-3 font-bold text-slate-800">{c.user_name || c.employeeName || 'Karyawan'}</td>
                              <td className="py-2.5 px-2">
                                <span className={`px-2 py-0.5 rounded-md font-mono text-[9px] font-black uppercase ${c.type === 'points' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {c.type === 'points' ? 'Klaim Poin' : 'Klaim Gaji'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-extrabold">
                                Rp {c.type === 'points' ? ((Number(c.amount) || Number(c.points_claimed) || 0) * 1000).toLocaleString('id-ID') : (Number(c.amount) || 0).toLocaleString('id-ID')}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-100 text-right shrink-0">
              <button 
                onClick={() => setActiveDetailModal(null)} 
                className="bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] px-5 py-2.5 rounded-xl uppercase tracking-wider transition cursor-pointer"
              >
                Tutup Laporan
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ================= MODAL: PENYESUAIAN STOK (STOCK OPNAME) ================= */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white shrink-0">
              <div>
                <span className="text-[8px] bg-amber-600 px-2.5 py-0.5 rounded font-black uppercase text-white tracking-widest">Penyesuaian Persediaan (Stock Opname)</span>
                <h3 className="text-sm font-extrabold text-white mt-1">
                  Input Stok Fisik Cabang — {userRegionName}
                </h3>
              </div>
              <button 
                onClick={() => setShowAdjustmentModal(false)} 
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handlePostAdjustment} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 bg-slate-50 flex-1 text-xs">
                <div className="bg-amber-50 border border-amber-250 p-3.5 rounded-2xl flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-800 font-semibold leading-relaxed">
                    Instruksi: Masukkan jumlah <strong>Stok Fisik</strong> riil yang ada di gudang. Sistem akan secara otomatis menghitung selisih dan memposting jurnal mutasi stok penyesuaian (masuk/keluar).
                  </p>
                </div>

                <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-semibold text-slate-655 border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                          <th className="py-2.5 px-4 w-1/3">Nama Barang</th>
                          <th className="py-2.5 px-2 text-center w-24">Stok Sistem</th>
                          <th className="py-2.5 px-2 text-center w-28">Stok Fisik</th>
                          <th className="py-2.5 px-2 text-center w-20">Selisih</th>
                          <th className="py-2.5 px-4 w-1/3">Alasan / Catatan Penyesuaian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {addons.map(addon => {
                          const sysStock = addon.stock || 0;
                          const physStockVal = adjustmentCounts[addon.id] || '';
                          const physStock = physStockVal === '' ? sysStock : Number(physStockVal);
                          const diff = physStock - sysStock;

                          return (
                            <tr key={addon.id} className="hover:bg-slate-50/50">
                              <td className="py-3 px-4 font-bold text-slate-800">
                                <span>{addon.name}</span>
                                <span className="block text-[9px] font-medium text-slate-450 mt-0.5">HPP: Rp {Number(addon.hpp || 0).toLocaleString('id-ID')}</span>
                              </td>
                              <td className="py-3 px-2 text-center font-mono font-black text-slate-500">
                                {sysStock} unit
                              </td>
                              <td className="py-3 px-2 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  value={physStockVal}
                                  onChange={(e) => {
                                    setAdjustmentCounts(prev => ({
                                      ...prev,
                                      [addon.id]: e.target.value
                                    }));
                                  }}
                                  className="w-20 bg-white border border-slate-200 text-slate-850 text-xs px-2 py-1 rounded-lg focus:border-amber-500 outline-none text-center font-mono font-bold"
                                />
                              </td>
                              <td className="py-3 px-2 text-center font-mono font-black">
                                {diff > 0 && <span className="text-emerald-600 font-extrabold">+{diff}</span>}
                                {diff < 0 && <span className="text-rose-600 font-extrabold">{diff}</span>}
                                {diff === 0 && <span className="text-slate-400">0</span>}
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="text"
                                  placeholder="Contoh: Selisih hitung / rusak"
                                  value={adjustmentNotes[addon.id] || ''}
                                  onChange={(e) => {
                                    setAdjustmentNotes(prev => ({
                                      ...prev,
                                      [addon.id]: e.target.value
                                    }));
                                  }}
                                  className="w-full bg-white border border-slate-200 text-slate-850 text-xs px-3 py-1 rounded-lg focus:border-amber-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                                  disabled={diff === 0}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-2.5 shrink-0">
                <button 
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-655 font-black text-[10px] px-5 py-2.5 rounded-xl uppercase tracking-wider transition cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isPostingAdjustment}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-black text-[10px] px-5 py-2.5 rounded-xl uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  {isPostingAdjustment && <Loader size={12} className="animate-spin" />}
                  {isPostingAdjustment ? 'Memposting...' : 'Posting Penyesuaian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-2">
              <LogOut size={32} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Keluar dari Akun?</h3>
              <p className="text-xs font-medium text-slate-500 mt-2">Anda harus login kembali untuk mengakses data keuangan Anda.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => setShowLogoutConfirm(false)} className="py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Batal</button>
              <button onClick={() => { setShowLogoutConfirm(false); logout(); }} className="py-3 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-500/30 transition">Ya, Keluar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  function handleEditAddon(addon: any) {
    handleEditAddonClick(addon);
  }
}
