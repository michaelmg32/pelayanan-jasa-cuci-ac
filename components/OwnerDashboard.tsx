'use client';

import React, { useState, useEffect } from 'react';
import { OrderStatus } from '@/types';
import { useApp } from '@/lib/auth-context';
import * as api from '@/lib/api';
import {
  LogOut,
  TrendingUp,
  Users,
  DollarSign,
  Star,
  Briefcase,
  Settings,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Camera,
  Check,
  Loader,
  X,
  MoreVertical,
  Search,
  Edit,
  UserCog,
  UserPlus,
  Clock,
} from 'lucide-react';
import { Role, User } from '@/types';

export default function OwnerDashboard() {
  const { activeUser, setActiveUser, orders: allOrders, users: allUsers, setUsers, logout, appSettings, updateAppSettings, regions } = useApp();

  const orders = activeUser?.region_id ? allOrders.filter(o => o.region_id === activeUser.region_id) : allOrders;
  const usersRaw = activeUser?.region_id ? allUsers.filter(u => u.region_id === activeUser.region_id) : allUsers;
  const users = usersRaw.filter(u => u.role !== Role.USER);

  const [expandedRegionId, setExpandedRegionId] = useState<string | null>(null);
  const [expandedDashboardRegionId, setExpandedDashboardRegionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'users' | 'regions' | 'settings'>('dashboard');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [addons, setAddons] = useState<any[]>([]);
  const [fixedAssets, setFixedAssets] = useState<any[]>([]);
  const [claimsList, setClaimsList] = useState<any[]>([]);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const [fetchedAddons, fetchedAssets, claimsRes] = await Promise.all([
          api.fetchAddons(),
          api.fetchFixedAssets(),
          fetch('/api/salary-claims')
        ]);
        setAddons(fetchedAddons);
        setFixedAssets(fetchedAssets);
        if (claimsRes.ok) {
          const claims = await claimsRes.json();
          setClaimsList(claims);
        }
      } catch (error) {
        console.error("Failed to fetch financial data:", error);
      }
    };
    fetchFinancialData();
  }, []);

  const getLocalDateString = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDateStr = getLocalDateString();
  const getFirstDayOfMonth = () => {
    const d = new Date();
    d.setDate(1);
    return getLocalDateString(d);
  };
  const getLastDayOfMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return getLocalDateString(d);
  };
  const [filterStartDate, setFilterStartDate] = useState(getFirstDayOfMonth());
  const [filterEndDate, setFilterEndDate] = useState(getLastDayOfMonth());
  const [showCashFlowModal, setShowCashFlowModal] = useState(false);
  const [showMovingAssetModal, setShowMovingAssetModal] = useState(false);
  const [showFixedAssetModal, setShowFixedAssetModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  // Owner Profile States
  const [profileViewMode, setProfileViewMode] = useState<'readonly' | 'edit-profile' | 'edit-password'>('readonly');
  const [staffSortKey, setStaffSortKey] = useState<'rating' | 'jobs' | 'margin'>('rating');
  const [editProfileName, setEditProfileName] = useState(activeUser?.name || '');
  const [editProfilePhone, setEditProfilePhone] = useState(activeUser?.phone || '');
  const [editProfileAddress, setEditProfileAddress] = useState(activeUser?.address || '');
  const [editProfilePhoto, setEditProfilePhoto] = useState(activeUser?.photo || '');
  const [editOldPassword, setEditOldPassword] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [saveProfileSuccess, setSaveProfileSuccess] = useState(false);
  const [profileErrorMsg, setProfileErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // User Management States
  const [userSearch, setUserSearch] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<Role>(Role.STAFF);
  const [regRegionId, setRegRegionId] = useState('');
  const [regKtp, setRegKtp] = useState('');
  const [regSelfie, setRegSelfie] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<Role>(Role.USER);
  const [editRegionId, setEditRegionId] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editStatus, setEditStatus] = useState<string>('active');
  const [errorMsg, setErrorMsg] = useState('');

  // Region Management States
  const [newRegionName, setNewRegionName] = useState('');
  const [isAddingRegion, setIsAddingRegion] = useState(false);
  const [reportRegionId, setReportRegionId] = useState('ALL');

  // Sync edits when user props update
  useEffect(() => {
    if (activeUser) {
      setEditProfileName(activeUser.name || '');
      setEditProfilePhone(activeUser.phone || '');
      setEditProfileAddress(activeUser.address || '');
      setEditProfilePhoto(activeUser.photo || '');
    }
  }, [activeUser]);

  // Click-outside listener to close the three-dots menu dropdown
  useEffect(() => {
    if (!showMoreMenu) return;
    const handleOutsideClick = () => {
      setShowMoreMenu(false);
    };
    // Use timeout to prevent immediate closing during trigger click event propagation
    const timer = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 0);

    return (
    ) => {
      clearTimeout(timer);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [showMoreMenu]);

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
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/webp', quality);
          resolve(compressedBase64);
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
        alert('❌ Gagal memproses foto profil. Silakan coba lagi.');
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
      setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editNewPassword !== editConfirmPassword) {
      setProfileErrorMsg('Password baru dan konfirmasi tidak cocok');
      return;
    }
    if (editNewPassword.length < 6) {
      setProfileErrorMsg('Password baru minimal 6 karakter');
      return;
    }
    try {
      setIsLoading(true);
      setProfileErrorMsg('');
      await api.updatePassword(activeUser!.id, {
        oldPassword: editOldPassword,
        newPassword: editNewPassword,
      });
      setSaveProfileSuccess(true);
      setProfileViewMode('readonly');
      setEditOldPassword('');
      setEditNewPassword('');
      setEditConfirmPassword('');
      setTimeout(() => setSaveProfileSuccess(false), 3000);
    } catch (error: any) {
      setProfileErrorMsg(error?.message || 'Gagal mengganti password');
    } finally {
      setIsLoading(false);
    }
  };

  // User Actions
  const handleCreateUser = async () => {
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg('Nama, Email, dan Password wajib diisi.');
      return;
    }
    try {
      setIsRegistering(true);
      setErrorMsg('');
      const payload = {
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        role: regRole,
        region_id: activeUser?.region_id || regRegionId || null,
        ktpPhoto: regRole === Role.STAFF ? regKtp : null,
        selfiePhoto: regRole === Role.STAFF ? regSelfie : null,
      };
      await api.createUser(payload);

      // Reset form and reload
      setRegName('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
      setRegRegionId('');
      setRegRole(Role.STAFF);
      setRegKtp('');
      setRegSelfie('');
      setShowAddUserModal(false);
      window.location.reload();
    } catch (e: any) {
      setErrorMsg(e.message || 'Gagal menambahkan pengguna baru.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSaveUserEdit = async (userId: string) => {
    try {
      setIsLoading(true);
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) {
        setErrorMsg('User tidak ditemukan');
        return;
      }

      const updatePayload = {
        name: targetUser.name,
        email: targetUser.email,
        role: editRole,
        phone: editPhone,
        status: editStatus,
        region_id: editRole === Role.USER ? null : (activeUser?.region_id || editRegionId || null),
      };

      await api.updateUser(userId, updatePayload);

      // Update local state
      const updatedUser = users.find(u => u.id === userId);
      if (updatedUser) {
        updatedUser.role = editRole;
        updatedUser.phone = editPhone;
        updatedUser.address = editAddress;
        updatedUser.status = editStatus;
        setUsers([...users]);
      }

      setErrorMsg('');
      setEditingUserId(null);
      alert('✅ Data pengguna berhasil diperbarui');
    } catch (error: any) {
      console.error('Error updating user:', error);
      setErrorMsg(error?.message || 'Gagal memperbarui data pengguna');
    } finally {
      setIsLoading(false);
    }
  };

  const startEditUser = (target: User) => {
    setEditingUserId(target.id);
    setEditRole(target.role);
    setEditPhone(target.phone || '');
    setEditRegionId(target.region_id || '');
    setEditAddress(target.address || '');
    setEditStatus(target.status || 'active');
  };

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editName, setEditName] = useState(appSettings?.[activeUser?.region_id || 'GLOBAL']?.business_name || '');
  const [editLogo, setEditLogo] = useState(appSettings?.[activeUser?.region_id || 'GLOBAL']?.business_logo || '');
  const [editBankName, setEditBankName] = useState(appSettings?.[activeUser?.region_id || 'GLOBAL']?.bank_name || '');
  const [editBankAccountNumber, setEditBankAccountNumber] = useState(appSettings?.[activeUser?.region_id || 'GLOBAL']?.bank_account_number || '');
  const [editBankAccountHolder, setEditBankAccountHolder] = useState(appSettings?.[activeUser?.region_id || 'GLOBAL']?.bank_account_holder || '');
  const [editQrisImage, setEditQrisImage] = useState(appSettings?.[activeUser?.region_id || 'GLOBAL']?.qris_image || '');
  const [editPhoneNumber, setEditPhoneNumber] = useState(appSettings?.[activeUser?.region_id || 'GLOBAL']?.phone_number || '');

  const formatRupiah = (num: any) => {
    return 'Rp' + Number(num || 0).toLocaleString('id-ID');
  };

  const handleOpenSettings = () => {
    setEditName(appSettings?.[activeUser?.region_id || 'GLOBAL']?.business_name || '');
    setEditLogo(appSettings?.[activeUser?.region_id || 'GLOBAL']?.business_logo || '');
    setEditBankName(appSettings?.[activeUser?.region_id || 'GLOBAL']?.bank_name || '');
    setEditBankAccountNumber(appSettings?.[activeUser?.region_id || 'GLOBAL']?.bank_account_number || '');
    setEditBankAccountHolder(appSettings?.[activeUser?.region_id || 'GLOBAL']?.bank_account_holder || '');
    setEditQrisImage(appSettings?.[activeUser?.region_id || 'GLOBAL']?.qris_image || '');
    setEditPhoneNumber(appSettings?.[activeUser?.region_id || 'GLOBAL']?.phone_number || '');
    setActiveTab('settings');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQrisFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditQrisImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegKtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRegKtp(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRegSelfie(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter completed orders for revenue
  const filteredOrdersByRegion = reportRegionId === 'ALL' ? orders : orders.filter(o => o.region_id === reportRegionId);
  const completedOrders = filteredOrdersByRegion.filter(o => o.status === OrderStatus.SELESAI);

  // Filter cash flow orders by date range (only for this container)
  const cashFlowOrders = completedOrders.filter(o => {
    if (!o.scheduledDate) return false;
    return o.scheduledDate >= filterStartDate && o.scheduledDate <= filterEndDate;
  });

  // Calculations
  const totalBaseRevenue = cashFlowOrders.reduce((sum, o) => sum + (Number(o.totalCost || o.serviceCost) || 0), 0);
  const totalAddonsRevenue = cashFlowOrders.reduce((sum, o) => sum + (Number(o.addonsCost) || 0), 0);
  const totalRevenue = cashFlowOrders.reduce((sum, o) => {
    const calcFinalPrice = Math.max(0, Number(o.serviceCost || 0) + Number(o.addonsCost || 0) - Number(o.voucher_discount || 0));
    return sum + calcFinalPrice;
  }, 0);
  const totalAddonsCost = cashFlowOrders.reduce((sum, o) => sum + (Number(o.hpp_orders) || 0), 0);
  const totalMargin = cashFlowOrders.reduce((sum, o) => {
    const calcFinalPrice = Math.max(0, Number(o.serviceCost || 0) + Number(o.addonsCost || 0) - Number(o.voucher_discount || 0));
    return sum + (calcFinalPrice - (Number(o.hpp_orders) || 0));
  }, 0);

  // Staff (Employee) Performance Stats
  const staffList = (users || []).filter(u => u.role === 'STAFF' && (reportRegionId === 'ALL' || u.region_id === reportRegionId));
  const staffStats = staffList.map(staff => {
    const staffOrders = orders.filter(o => o.assignedTo === staff.id && o.status === OrderStatus.SELESAI);
    const jobsDone = staffOrders.length;

    // Average Rating
    const ratedOrders = staffOrders.filter(o => typeof o.rating === 'number');
    const avgRating = ratedOrders.length > 0
      ? parseFloat((ratedOrders.reduce((sum, o) => sum + (o.rating || 0), 0) / ratedOrders.length).toFixed(1))
      : 0;

    // Total Margin Contribution
    const totalMarginContrib = staffOrders.reduce((sum, o) => sum + (Number(o.margin) || 0), 0);

    return {
      ...staff,
      jobsDone,
      avgRating,
      totalMarginContrib
    };
  });

  const sortedStaffStats = [...staffStats].sort((a, b) => {
    if (staffSortKey === 'rating') {
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
      return b.jobsDone - a.jobsDone;
    } else if (staffSortKey === 'jobs') {
      if (b.jobsDone !== a.jobsDone) return b.jobsDone - a.jobsDone;
      return b.avgRating - a.avgRating;
    } else if (staffSortKey === 'margin') {
      return b.totalMarginContrib - a.totalMarginContrib;
    }
    return 0;
  });

  // Ratings
  const ratedOrders = completedOrders.filter(o => o.rating !== undefined);
  const averageRating = ratedOrders.length > 0
    ? parseFloat((ratedOrders.reduce((sum, o) => sum + (o.rating || 0), 0) / ratedOrders.length).toFixed(1))
    : 0;

  // Count by status
  const statusCounts = {
    [OrderStatus.MENUNGGU]: orders.filter(o => o.status === OrderStatus.MENUNGGU).length,
    [OrderStatus.DITUGASKAN]: orders.filter(o => o.status === OrderStatus.DITUGASKAN).length,
    [OrderStatus.CEK_LAYANAN]: orders.filter(o => o.status === OrderStatus.CEK_LAYANAN).length,
    [OrderStatus.PENGERJAAN]: orders.filter(o => o.status === OrderStatus.PENGERJAAN).length,
    [OrderStatus.PAYMENT]: orders.filter(o => o.status === OrderStatus.PAYMENT).length,
    [OrderStatus.SELESAI]: orders.filter(o => o.status === OrderStatus.SELESAI).length,
    [OrderStatus.DIBATALKAN]: orders.filter(o => o.status === OrderStatus.DIBATALKAN).length,
  };

  const renderDashboardStats = () => {
    // Asset Totals
    const totalMovingAssetValue = addons.reduce((sum, item) => sum + (Number(item.hpp) || 0) * (Number(item.stock) || 0), 0);
    const totalFixedAssetValue = fixedAssets.reduce((sum, item) => sum + (Number(item.purchase_price) || 0), 0);

    // Claimed Salary Calculation
    const approvedClaims = claimsList.filter(c => ['DISETUJUI', 'DIBAYAR', 'SELESAI', 'APPROVED'].includes(c.status?.toUpperCase()));
    const totalClaimedPoints = approvedClaims.filter(c => c.type === 'points').reduce((sum, c) => sum + (Number(c.amount) || Number(c.points_claimed) || 0), 0);
    const totalClaimedSalary = approvedClaims.filter(c => c.type === 'daily_salary' || c.type === 'salary').reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const totalStaffSalaryExpense = (totalClaimedPoints * 1000) + totalClaimedSalary;

    return (
      <>
        {/* Global Date Filter (Top Left) */}
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

        {/* 4 Cards Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-4">
          <div onClick={() => setShowMovingAssetModal(true)} className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-3xl border border-indigo-400/30 shadow-lg shadow-indigo-200/50 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition duration-500"></div>
            <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Total Nilai Aset Bergerak (Inventaris)</p>
            <h2 className="text-2xl font-black text-white mt-1 relative z-10">Rp {totalMovingAssetValue.toLocaleString('id-ID')}</h2>
            <p className="text-[9.5px] text-white/70 mt-2 font-medium">Berdasarkan stok terdaftar dikali HPP per barang.</p>
          </div>

          <div onClick={() => setShowFixedAssetModal(true)} className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl border border-emerald-400/30 shadow-lg shadow-emerald-200/50 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition duration-500"></div>
            <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Total Pembelian Aset Tetap</p>
            <h2 className="text-2xl font-black text-white mt-1 relative z-10">Rp {totalFixedAssetValue.toLocaleString('id-ID')}</h2>
            <p className="text-[9.5px] text-white/70 mt-2 font-medium">Nilai akumulasi total pengeluaran belanja aset fisik.</p>
          </div>

          <div onClick={() => setShowPayrollModal(true)} className="bg-gradient-to-br from-cyan-500 to-blue-600 p-6 rounded-3xl border border-cyan-400/30 shadow-lg shadow-cyan-200/50 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition duration-500"></div>
            <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Pengeluaran Gaji Karyawan</p>
            <h2 className="text-2xl font-black text-white mt-1 relative z-10">Rp {totalStaffSalaryExpense.toLocaleString('id-ID')}</h2>
            <p className="text-[9.5px] text-white/70 mt-2 font-medium">Total klaim gaji & poin yang sudah dibayarkan.</p>
          </div>

          <div onClick={() => setShowCashFlowModal(true)} className="bg-gradient-to-br from-rose-500 to-pink-600 p-6 rounded-3xl border border-rose-400/30 shadow-lg shadow-rose-200/50 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition duration-500"></div>
            <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Total Pendapatan Cabang</p>
            <h2 className="text-2xl font-black text-white mt-1 relative z-10">Rp {totalRevenue.toLocaleString('id-ID')}</h2>
            <p className="text-[9.5px] text-white/70 mt-2 font-medium">Akumulasi omset kotor dari pendapatan.</p>
          </div>
        </div>

                    {/* Modal Aset Bergerak */}
      {showMovingAssetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300 relative">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">Rincian Aset Bergerak</h3>
              <button onClick={() => setShowMovingAssetModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition-colors">
                 <X size={18} strokeWidth={3} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-100/50 text-slate-500 uppercase tracking-widest text-[9px] font-black border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Nama Barang</th>
                      <th className="py-2.5 px-2 text-center">Stok</th>
                      <th className="py-2.5 px-2">HPP (Modal)</th>
                      <th className="py-2.5 px-3 text-right">Total Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {addons.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400 font-medium">Belum ada aset terdaftar.</td>
                      </tr>
                    ) : addons.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-800">{a.name}</td>
                        <td className="py-2.5 px-2 text-center">
                           <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-black ${(a.stock || 0) < 20 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'}`}>
                             {a.stock || 0}
                           </span>
                        </td>
                        <td className="py-2.5 px-2 font-mono text-slate-500">Rp {Number(a.hpp || 0).toLocaleString('id-ID')}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-indigo-600 font-black">Rp {((a.stock || 0) * (a.hpp || 0)).toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aset Tetap */}
      {showFixedAssetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300 relative">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">Rincian Aset Tetap</h3>
              <button onClick={() => setShowFixedAssetModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition-colors">
                 <X size={18} strokeWidth={3} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-100/50 text-slate-500 uppercase tracking-widest text-[9px] font-black border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Nama Aset</th>
                      <th className="py-2.5 px-3 text-right">Harga Beli</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fixedAssets.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-slate-400 font-medium">Belum ada aset tetap.</td>
                      </tr>
                    ) : fixedAssets.map(fa => (
                      <tr key={fa.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-2.5 px-3 text-slate-500 font-mono">{fa.purchase_date ? new Date(fa.purchase_date).toLocaleDateString('id-ID') : '-'}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{fa.name}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-black">Rp {Number(fa.purchase_price || 0).toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gaji Karyawan */}
      {showPayrollModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300 relative">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">Rincian Pengeluaran Gaji</h3>
              <button onClick={() => setShowPayrollModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition-colors">
                 <X size={18} strokeWidth={3} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-100/50 text-slate-500 uppercase tracking-widest text-[9px] font-black border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Nama Karyawan</th>
                      <th className="py-2.5 px-2">Jenis Klaim</th>
                      <th className="py-2.5 px-3 text-right">Nominal (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {approvedClaims.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400 font-medium">Belum ada pengeluaran gaji.</td>
                      </tr>
                    ) : approvedClaims.map(c => {
                        const isPoints = c.type === 'points';
                        const amount = isPoints ? (Number(c.amount || c.points_claimed || 0) * 1000) : Number(c.amount || 0);
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-2.5 px-3 text-slate-500 font-mono">{new Date(c.created_at).toLocaleDateString('id-ID')}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-800">{c.employee_name || 'Tanpa Nama'}</td>
                            <td className="py-2.5 px-2">
                               <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${isPoints ? 'bg-cyan-50 text-cyan-600 border border-cyan-200' : 'bg-indigo-50 text-indigo-600 border border-indigo-200'}`}>
                                 {isPoints ? 'Poin' : 'Gaji'}
                               </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700 font-black">Rp {amount.toLocaleString('id-ID')}</td>
                          </tr>
                        );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

{showCashFlowModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300 relative">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">Rincian Aliran Kas</h3>
              <button onClick={() => setShowCashFlowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition-colors">
                 <X size={18} strokeWidth={3} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <div>
                    <span className="text-[9px] font-black text-blue-600 uppercase">Jasa Cuci</span>
                    <p className="text-[10px] text-blue-700 font-semibold mt-1">{cashFlowOrders.length} Pekerjaan Selesai</p>
                  </div>
                  <span className="text-sm font-mono font-black text-blue-800">{formatRupiah(totalBaseRevenue)}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl border border-green-200">
                  <div>
                    <span className="text-[9px] font-black text-green-600 uppercase">Sparepart/Addon (Harga Jual)</span>
                    <p className="text-[10px] text-green-700 font-semibold mt-1">Pendapatan Perlengkapan</p>
                  </div>
                  <span className="text-sm font-mono font-black text-green-800">{formatRupiah(totalAddonsRevenue)}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div>
                    <span className="text-[9px] font-black text-amber-600 uppercase">Modal Sparepart (HPP)</span>
                    <p className="text-[10px] text-amber-700 font-semibold mt-1">Biaya Perlengkapan</p>
                  </div>
                  <span className="text-sm font-mono font-black text-amber-800">-{formatRupiah(totalAddonsCost)}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-xl border border-indigo-200 font-black">
                  <span className="text-[9px] uppercase text-indigo-600">Total Omzet (Kotor)</span>
                  <span className="text-sm font-mono text-indigo-800">{formatRupiah(totalRevenue)}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-emerald-600 text-white rounded-xl border border-emerald-700 font-black shadow-sm">
                  <span className="text-[9px] uppercase tracking-wider text-emerald-100">Keuntungan Bersih</span>
                  <span className="text-sm font-mono">{formatRupiah(totalMargin)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Umpan Balik & Ulasan Pelanggan */}
      <div className="bg-white border rounded-2xl p-4 shadow-xs">
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h3 className="font-black text-xs uppercase tracking-wider text-slate-800">Umpan Balik & Ulasan Pelanggan</h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Rating dan ulasan dari pelanggan terbaru</p>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {completedOrders
            .filter(o => o.rating !== undefined || (o.ratingNotes && o.ratingNotes.trim()))
            .slice()
            .reverse()
            .map((review) => {
              const rating = review.rating || 0;
              return (
                <div key={review.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-[10px] text-left">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-black flex items-center justify-center text-[9px] uppercase">
                        {review.customerName ? review.customerName.charAt(0) : 'U'}
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-800">{review.customerName || 'Pelanggan'}</span>
                        <p className="text-[8px] text-slate-400 font-semibold mt-0.5">
                          {review.scheduledDate} • Teknisi: <strong className="text-slate-650">{review.assignedEmployeeName || 'Belum ditunjuk'}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500 font-bold bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-lg text-[9px]">
                      <span>{rating}</span>
                      <span className="text-[8px]">★</span>
                    </div>
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-slate-100 space-y-1">
                    <div className="text-slate-500 font-semibold text-[9px]">
                      Layanan: {Array.isArray(review.acDetail)
                        ? review.acDetail.map(s => `${s.quantity}x ${s.serviceType === 'none' ? s.category : s.serviceType} (${s.acType || ''})`).join(', ')
                        : review.acDetail ? `${(review.acDetail as any).quantity}x ${(review.acDetail as any).serviceType === 'none' ? (review.acDetail as any).category : (review.acDetail as any).serviceType} (${(review.acDetail as any).acType})` : ''}
                    </div>
                    {review.ratingNotes && review.ratingNotes.trim() ? (
                      <p className="text-slate-700 italic font-medium">"{review.ratingNotes}"</p>
                    ) : (
                      <p className="text-slate-400 italic">Tidak ada komentar tertulis.</p>
                    )}
                  </div>

                  {review.completionNotes && review.completionNotes.trim() && (
                    <div className="text-[8.5px] text-slate-500 bg-slate-100/50 p-1.5 rounded-md border border-slate-205">
                      <span className="font-bold text-slate-600">Catatan Pengerjaan Teknisi:</span> {review.completionNotes}
                    </div>
                  )}
                </div>
              );
            })}

          {completedOrders.filter(o => o.rating !== undefined || (o.ratingNotes && o.ratingNotes.trim())).length === 0 && (
            <div className="text-center py-8 text-slate-400 text-[10px]">
              Belum ada umpan balik dari pelanggan
            </div>
          )}
        </div>
      </div>
    </>
  );
};

  if (!activeUser) return null;

  return (
    <div className="flex-1 flex flex-col bg-slate-100 text-slate-800 min-h-0 h-full overflow-hidden">
      {/* GLOBAL HEADER BAR WITH THREE-DOTS MENU */}
      {/* GLOBAL HEADER BAR */}
      <div className="bg-slate-900 text-white px-5 py-4 pb-12 shrink-0 shadow-md flex justify-between items-start z-20 relative rounded-b-[2.5rem]">
        {/* Logo, Business Name & Slogan */}
        <div className="flex items-center gap-3">
          <a href="/" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shadow-md overflow-hidden border border-white/20 cursor-pointer block">
            {appSettings?.[activeUser?.region_id || 'GLOBAL']?.business_logo ? (
              <img src={appSettings[activeUser?.region_id || 'GLOBAL'].business_logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </a>
          <div className="text-left">
            <h1 className="text-sm font-black leading-none">{appSettings?.[activeUser?.region_id || 'GLOBAL']?.business_name || 'Sugar AC'}</h1>
            <p className="text-[9px] text-blue-200 mt-1">Sistem Layanan AC Profesional | Owner</p>
          </div>
        </div>
      </div>

      {/* ===================== CONTROL TABS SYSTEM ===================== */}
      <div className="px-5 -mt-8 relative z-40 shrink-0 mb-2">
        <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/40 border border-slate-100/60 p-4 md:p-5">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-y-5 gap-x-2">
            
            <div onClick={() => setActiveTab('dashboard')} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all">
              <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center shadow-md border ${activeTab === 'dashboard' ? 'bg-gradient-to-br from-indigo-50 to-blue-100/50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-100 text-slate-400 shadow-slate-200/30 hover:bg-slate-50'}`}>
                 <TrendingUp size={24} strokeWidth={2.5} />
              </div>
              <span className={`text-[9px] font-extrabold text-center uppercase tracking-wider ${activeTab === 'dashboard' ? 'text-indigo-700' : 'text-slate-500'}`}>Ringkasan</span>
            </div>

            <div onClick={handleOpenSettings} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all">
              <div className="w-14 h-14 rounded-[18px] flex items-center justify-center shadow-md border bg-white border-slate-100 text-slate-400 shadow-slate-200/30 hover:bg-slate-50">
                 <Settings size={24} strokeWidth={2.5} />
              </div>
              <span className="text-[9px] font-extrabold text-center uppercase tracking-wider text-slate-500">Bisnis</span>
            </div>

            <div onClick={() => setActiveTab('profile')} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all">
              <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center shadow-md border ${activeTab === 'profile' ? 'bg-gradient-to-br from-indigo-50 to-blue-100/50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-100 text-slate-400 shadow-slate-200/30 hover:bg-slate-50'}`}>
                 <UserIcon size={24} strokeWidth={2.5} />
              </div>
              <span className={`text-[9px] font-extrabold text-center uppercase tracking-wider ${activeTab === 'profile' ? 'text-indigo-700' : 'text-slate-500'}`}>Profil</span>
            </div>

            <div onClick={() => setActiveTab('users')} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all">
              <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center shadow-md border ${activeTab === 'users' ? 'bg-gradient-to-br from-indigo-50 to-blue-100/50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-100 text-slate-400 shadow-slate-200/30 hover:bg-slate-50'}`}>
                 <UserCog size={24} strokeWidth={2.5} />
              </div>
              <span className={`text-[9px] font-extrabold text-center uppercase tracking-wider ${activeTab === 'users' ? 'text-indigo-700' : 'text-slate-500'}`}>Akses</span>
            </div>


            <div onClick={() => {
              if (window.confirm('Apakah Anda yakin ingin keluar?')) {
                logout();
              }
            }} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all">
              <div className="w-14 h-14 rounded-[18px] flex items-center justify-center shadow-md border bg-rose-50 border-rose-100 text-rose-500 shadow-rose-200/30 hover:bg-rose-100">
                 <LogOut size={24} strokeWidth={2.5} />
              </div>
              <span className="text-[9px] font-extrabold text-center uppercase tracking-wider text-rose-600">Keluar</span>
            </div>

          </div>
        </div>
      </div>

      {/* Body - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ===================== TAB: SETTINGS ===================== */}
        {activeTab === 'settings' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 w-full shadow-sm">
            <div className="flex justify-between items-center px-1 border-b pb-3 border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm uppercase text-slate-800">Pengaturan Profil Usaha</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Informasi & profil bisnis anda</p>
              </div>
            </div>

            <div className="space-y-4">
              {!activeUser?.region_id ? (
                <>
                  {/* Nama Usaha */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Nama Usaha / Brand</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition duration-200"
                      placeholder="Masukkan nama usaha..."
                    />
                  </div>

                  {/* Logo Usaha */}
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Logo Usaha & Icon</label>

                    {/* Logo Preview */}
                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500 overflow-hidden border">
                        {editLogo ? (
                          <img src={editLogo} alt="Logo Preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold">No Logo</span>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <span className="text-[10px] text-slate-600 font-bold block">Pratinjau Logo</span>
                        <span className="text-[8px] text-slate-400 block">Akan digunakan sebagai favicon dan logo aplikasi</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Metode 1: Unggah Gambar (Base64)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full text-[10px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mt-1">Metode 2: Menggunakan URL Gambar</span>
                      <input
                        type="text"
                        value={editLogo}
                        onChange={(e) => setEditLogo(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[10px] px-3 py-2 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition duration-200"
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Kontak Usaha */}
                  <div className="space-y-1 pb-3">
                    <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Nomor WhatsApp / Telepon</label>
                    <input
                      type="text"
                      value={editPhoneNumber}
                      onChange={(e) => setEditPhoneNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition duration-200"
                      placeholder="Contoh: 6281234567890"
                    />
                    <p className="text-[8px] text-slate-400">Gunakan format 62 (contoh: 62812...) untuk tautan WhatsApp yang valid.</p>
                  </div>

                  {/* Rekening Bank Manual & QRIS */}
                  <div className="border-t border-slate-100 pt-3 space-y-3">
                    <span className="text-[10px] font-black uppercase text-indigo-600 block">Metode Transfer & QRIS</span>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Nama Bank</label>
                        <input
                          type="text"
                          value={editBankName}
                          onChange={(e) => setEditBankName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition duration-200"
                          placeholder="e.g. Bank BCA"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">No. Rekening</label>
                        <input
                          type="text"
                          value={editBankAccountNumber}
                          onChange={(e) => setEditBankAccountNumber(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition duration-200"
                          placeholder="e.g. 123456789"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Nama Pemilik Rekening</label>
                      <input
                        type="text"
                        value={editBankAccountHolder}
                        onChange={(e) => setEditBankAccountHolder(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition duration-200"
                        placeholder="e.g. Sugar AC PT"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Barcode / Gambar QRIS</label>

                      {/* QRIS Preview */}
                      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500 overflow-hidden border">
                          {editQrisImage ? (
                            <img src={editQrisImage} alt="QRIS Preview" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-bold">No QRIS</span>
                          )}
                        </div>
                        <div className="flex-grow text-left">
                          <span className="text-[10px] text-slate-600 font-bold block">Pratinjau QRIS</span>
                          <span className="text-[8px] text-slate-400 block">Barcode pembayaran transfer pelanggan</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Metode 1: Unggah Gambar QRIS (Base64)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQrisFileChange}
                          className="w-full text-[10px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mt-1">Metode 2: URL Gambar QRIS</span>
                        <input
                          type="text"
                          value={editQrisImage}
                          onChange={(e) => setEditQrisImage(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[10px] px-3 py-2 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition duration-200"
                          placeholder="https://example.com/qris.png"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  if (!activeUser?.region_id) {
                    await updateAppSettings(editName, editLogo, undefined, undefined, undefined, undefined, editPhoneNumber);
                  } else {
                    await updateAppSettings("", "", editBankName, editBankAccountNumber, editBankAccountHolder, editQrisImage, editPhoneNumber);
                  }
                  setActiveTab('dashboard');
                }}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase rounded-lg shadow-sm transition cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        )}

        {/* ===================== TAB: DASHBOARD ===================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {activeUser?.region_id ? (
              renderDashboardStats()
            ) : (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <h3 className="font-extrabold text-sm uppercase text-slate-800">Analisis Cabang</h3>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">Pilih cabang di bawah ini untuk melihat
                    detail aliran kas, omzet, dan kinerja teknisinya.</p>
                </div>
                {regions.map(region => (
                  <div key={region.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all">
                    <button
                      onClick={() => {
                        if (expandedDashboardRegionId === region.id) {
                          setExpandedDashboardRegionId(null);
                        } else {
                          setExpandedDashboardRegionId(region.id);
                          setReportRegionId(region.id);
                        }
                      }}
                      className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          {region.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="text-left">
                          <h4 className="font-bold text-xs text-slate-800">{region.name}</h4>
                        </div>
                      </div>
                      {expandedDashboardRegionId === region.id ? (
                        <Check size={16} className="text-indigo-600" />
                      ) : (
                        <MoreVertical size={16} className="text-slate-400" />
                      )}
                    </button>

                    {expandedDashboardRegionId === region.id && (
                      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                        {renderDashboardStats()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {activeTab === 'profile' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 w-full shadow-sm">
            <div className="flex justify-between items-center px-1 border-b pb-3 border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm uppercase text-slate-800">Profil Owner</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Informasi akun pemilik usaha</p>
              </div>
              <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[8.5px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                OWNER
              </span>
            </div>

            {saveProfileSuccess && (
              <div className="bg-emerald-100 border border-emerald-200 p-2.5 rounded-xl text-[11px] text-emerald-800 font-bold flex items-center gap-2">
                <Check size={14} /> Profil berhasil diperbarui!
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
                    {activeUser.photo ? (
                      <img src={activeUser.photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      activeUser.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-850 mt-2">{activeUser.name}</h4>
                  <p className="text-[10px] text-slate-400 font-medium">{activeUser.email}</p>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b pb-3 border-slate-50">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{activeUser.name}</p>
                    </div>
                    <UserIcon size={16} className="text-slate-350" />
                  </div>

                  <div className="flex items-center justify-between border-b pb-3 border-slate-50">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No. Handphone</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{activeUser.phone || <span className="italic text-slate-400">Belum diatur</span>}</p>
                    </div>
                    <Phone size={16} className="text-slate-350" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Alamat Rumah</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{activeUser.address || <span className="italic text-slate-400">Belum diatur</span>}</p>
                    </div>
                    <MapPin size={16} className="text-slate-350" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3">
                  <button
                    onClick={() => { setProfileErrorMsg(''); setProfileViewMode('edit-profile'); }}
                    className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[10px] py-2.5 rounded-xl uppercase transition cursor-pointer"
                  >
                    Edit Profil
                  </button>
                  <button
                    onClick={() => { setProfileErrorMsg(''); setProfileViewMode('edit-password'); }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] py-2.5 rounded-xl uppercase transition cursor-pointer"
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
                    className="w-full bg-slate-55 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 disabled:opacity-50 transition"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div>
                  <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">No. Handphone</label>
                  <input
                    type="text"
                    value={editProfilePhone}
                    onChange={(e) => setEditProfilePhone(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 disabled:opacity-50 transition"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Alamat Rumah</label>
                  <textarea
                    value={editProfileAddress}
                    onChange={(e) => setEditProfileAddress(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none focus:border-indigo-500 h-16 resize-none disabled:opacity-50 transition"
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setProfileViewMode('readonly')}
                    disabled={isLoading}
                    className="w-full bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-655 font-extrabold text-[10px] py-3 rounded-xl uppercase cursor-pointer transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-755 disabled:bg-slate-400 text-white font-extrabold text-[10px] py-3 rounded-xl uppercase cursor-pointer flex items-center justify-center gap-2 transition shadow-md"
                  >
                    {isLoading && <Loader size={12} className="animate-spin" />}
                    {isLoading ? 'Menyimpan...' : 'Simpan Profil'}
                  </button>
                </div>
              </form>
            )}

            {profileViewMode === 'edit-password' && (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="bg-slate-55 p-3 rounded-xl border border-slate-100/70 flex items-start gap-2 mb-2">
                  <ShieldCheck size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-[9.5px] text-slate-500 font-medium leading-relaxed">
                    Silakan masukkan password lama Anda untuk memverifikasi perubahan password baru.
                  </p>
                </div>

                <div>
                  <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Password Lama</label>
                  <input
                    type="password"
                    value={editOldPassword}
                    onChange={(e) => setEditOldPassword(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 transition"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Password Baru</label>
                  <input
                    type="password"
                    value={editNewPassword}
                    onChange={(e) => setEditNewPassword(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 transition"
                    disabled={isLoading}
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
                    className="w-full bg-slate-55 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 transition"
                    disabled={isLoading}
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
                    disabled={isLoading}
                    className="w-full bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-655 font-extrabold text-[10px] py-3 rounded-xl uppercase cursor-pointer transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-extrabold text-[10px] py-3 rounded-xl uppercase cursor-pointer flex items-center justify-center gap-2 transition shadow-md"
                  >
                    {isLoading && <Loader size={12} className="animate-spin" />}
                    {isLoading ? 'Menyimpan...' : 'Ubah Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}



        {/* ===================== TAB: USER MANAGEMENT ===================== */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-extrabold text-sm uppercase text-slate-800">Akses Pengguna</h3>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Kelola wilayah cabang dan pengguna yang bertugas</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="w-full sm:w-64 relative">
                  <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari user..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs pl-10 pr-3.5 py-2 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  onClick={() => {
                    if (activeUser?.region_id) {
                      setRegRegionId(activeUser.region_id);
                    } else {
                      setRegRegionId('');
                    }
                    setShowAddUserModal(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs uppercase rounded-xl hover:bg-emerald-700 transition-colors w-full sm:w-auto whitespace-nowrap"
                >
                  + Tambah Pengguna
                </button>
              </div>
            </div>

            {!activeUser?.region_id && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  placeholder="Nama Cabang Baru..."
                  value={newRegionName}
                  onChange={(e) => setNewRegionName(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 text-xs px-3.5 py-2 rounded-xl outline-none focus:border-indigo-500 w-full"
                />
                <button
                  onClick={async () => {
                    if (!newRegionName.trim()) return;
                    try {
                      setIsAddingRegion(true);
                      await api.createRegion({ name: newRegionName });
                      setNewRegionName('');
                      alert('Cabang berhasil ditambahkan.');
                      window.location.reload();
                    } catch (e) {
                      alert('Gagal menambah cabang');
                    } finally {
                      setIsAddingRegion(false);
                    }
                  }}
                  disabled={isAddingRegion || !newRegionName.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs uppercase rounded-xl disabled:bg-slate-300 w-full sm:w-auto"
                >
                  {isAddingRegion ? 'Menyimpan...' : '+ Tambah Cabang'}
                </button>
              </div>
            )}

            {/* Accordion List */}
            <div className="space-y-3">
              {(!activeUser?.region_id ? [{ id: 'null', name: 'PUSAT (GLOBAL)' }, ...(regions || [])] : [{ id: activeUser.region_id, name: regions.find(r => r.id === activeUser.region_id)?.name || 'CABANG SAYA' }]).map((region) => {
                const isExpanded = expandedRegionId === region.id || (activeUser?.region_id && region.id === activeUser.region_id);
                const regionUsers = users.filter(u => (region.id === 'null' ? !u.region_id : u.region_id === region.id));
                const filteredRegionUsers = regionUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()));

                return (
                  <div key={region.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all duration-200">
                    {/* Header */}
                    <div
                      onClick={() => !activeUser?.region_id && setExpandedRegionId(isExpanded ? null : region.id)}
                      className={`p-4 flex items-center justify-between ${!activeUser?.region_id ? 'cursor-pointer hover:bg-slate-50' : ''} ${isExpanded ? 'border-b border-slate-100 bg-slate-50/50' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${region.id === 'null' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {region.id === 'null' ? <ShieldCheck size={16} /> : <MapPin size={16} />}
                        </div>
                        <div>
                          <h4 className="font-black text-sm uppercase text-slate-800">{region.name}</h4>
                          <p className="text-[10px] text-slate-500 font-bold">{regionUsers.length} Pengguna</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {region.id !== 'null' && region.id !== 'reg_default' && !activeUser?.region_id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Hapus cabang ini? Semua pengguna di dalamnya tidak akan terhapus namun kehilangan cabang.')) {
                                api.deleteRegion(region.id).then(() => window.location.reload());
                              }
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1 bg-white rounded-lg border border-rose-100 shadow-sm"
                          >
                            <X size={14} />
                          </button>
                        )}
                        {!activeUser?.region_id && (
                          <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><polyline points="6 9 12 15 18 9"></polyline></svg>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    {isExpanded && (
                      <div className="p-0 bg-slate-50/30">
                        {filteredRegionUsers.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-xs font-bold uppercase">
                            Tidak ada pengguna di cabang ini
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {filteredRegionUsers.map(u => (
                              <div key={u.id} className="p-4 hover:bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-left transition">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-inner uppercase overflow-hidden">
                                    {u.photo ? (
                                      <img src={u.photo} alt={u.name} className="w-full h-full object-cover" />
                                    ) : (
                                      u.name.charAt(0)
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-extrabold text-xs text-slate-800">{u.name}</h4>
                                      <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded border ${u.role === Role.ADMIN ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                        u.role === Role.OWNER ? 'bg-indigo-50 text-indigo-750 border-indigo-200' :
                                          u.role === Role.STAFF ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                            u.role === Role.KEUANGAN ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                              'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}>
                                        {u.role}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{u.email}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {u.role === Role.STAFF && (
                                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border ${u.status === 'inactive' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                      u.status === 'archived' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                        'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      }`}>
                                      {u.status === 'inactive' ? 'Menunggu' : u.status === 'archived' ? 'Nonaktif' : 'Aktif'}
                                    </span>
                                  )}
                                  {u.id !== activeUser.id && (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); startEditUser(u); }}
                                      className="bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-[10px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 uppercase transition shadow-sm"
                                    >
                                      <Edit size={12} /> Edit
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ===================== EDIT USER MODAL ===================== */}
      {editingUserId && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border rounded-2xl w-full w-full overflow-hidden shadow-2xl text-left animate-fadeIn">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <div>
                <h4 className="font-black text-xs uppercase tracking-wide">Edit Profil Pengguna</h4>
                <p className="text-[9.5px] text-slate-400 mt-1">{users.find(u => u.id === editingUserId)?.name}</p>
              </div>
              <button
                onClick={() => {
                  setEditingUserId(null);
                  setErrorMsg('');
                }}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                disabled={isLoading}
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 font-extrabold"
                  disabled={isLoading}
                >
                  <option value={Role.USER}>Pelanggan</option>
                  <option value={Role.STAFF}>Staff/Teknisi</option>
                  <option value={Role.ADMIN}>Admin</option>
                  <option value={Role.KEUANGAN}>Keuangan</option>
                  <option value={Role.OWNER}>Owner</option>
                </select>
              </div>
              {!activeUser?.region_id && editRole !== Role.USER && (
                <div>
                  <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Penempatan Wilayah/Cabang</label>
                  <select
                    value={editRegionId}
                    onChange={(e) => setEditRegionId(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 font-extrabold"
                    disabled={isLoading}
                  >
                    <option value="">-- Pusat (Tanpa Wilayah) --</option>
                    {regions.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Status Akun</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 font-extrabold"
                  disabled={isLoading}
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Menunggu Verifikasi (Inactive)</option>
                  <option value="archived">Diarsipkan (Archived / Nonaktif)</option>
                </select>
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-[10px] p-2 rounded-lg font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingUserId(null);
                    setErrorMsg('');
                  }}
                  disabled={isLoading}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 text-slate-800 font-black text-xs px-4 py-2.5 rounded-xl uppercase transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleSaveUserEdit(editingUserId)}
                  disabled={isLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-xs px-4 py-2.5 rounded-xl uppercase transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader size={14} className="animate-spin" />}
                  {isLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* MODAL: Tambah Pengguna */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <UserPlus size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">Tambah Pengguna Baru</h3>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Buat akun untuk karyawan atau admin</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition border"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-xl text-xs font-semibold mb-4">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 ml-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 ml-1">Email</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition"
                    placeholder="email@contoh.com"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 ml-1">Nomor WhatsApp</label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition"
                    placeholder="081234567890"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 ml-1">Kata Sandi (Password)</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition"
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 mt-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 ml-1">Peran (Role)</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as Role)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition"
                  >
                    <option value={Role.STAFF}>STAFF (Karyawan/Teknisi)</option>
                    <option value={Role.ADMIN}>ADMIN (Pengurus Cabang)</option>
                    <option value={Role.KEUANGAN}>KEUANGAN (Divisi Keuangan)</option>
                    <option value={Role.OWNER}>OWNER (Pemilik)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 ml-1">Wilayah Cabang</label>
                  <select
                    value={regRegionId}
                    onChange={(e) => setRegRegionId(e.target.value)}
                    disabled={!!activeUser?.region_id}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="">PUSAT (GLOBAL)</option>
                    {regions.map(r => (
                      <option key={r.id} value={r.id}>{r.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              {regRole === Role.STAFF && (
                <div className="space-y-4 pt-2 border-t border-slate-100 mt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block ml-1">Unggah KTP</label>
                      <div className="flex flex-col gap-2">
                        {regKtp && (
                          <div className="w-full h-24 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                            <img src={regKtp} alt="KTP Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleRegKtpChange}
                          className="w-full text-[10px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block ml-1">Foto Selfie Karyawan</label>
                      <div className="flex flex-col gap-2">
                        {regSelfie && (
                          <div className="w-full h-24 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                            <img src={regSelfie} alt="Selfie Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleRegSelfieChange}
                          className="w-full text-[10px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div className="p-4 sm:p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-xs uppercase rounded-xl hover:bg-slate-50 transition"
                disabled={isRegistering}
              >
                Batal
              </button>
              <button
                onClick={handleCreateUser}
                disabled={isRegistering || !regName || !regEmail || !regPassword}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase rounded-xl disabled:bg-slate-300 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {isRegistering ? (
                  <>
                    <Loader size={14} className="animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <UserPlus size={14} /> Buat Akun
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
