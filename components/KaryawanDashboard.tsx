'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/auth-context';
import { OrderStatus } from '@/types';
import * as api from '@/lib/api';
import {
  Home,
  Clock,
  User as UserIcon,
  X,
  Sliders,
  Camera,
  Plus,
  Trash2,
  Star,
  Loader,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Check,
} from 'lucide-react';

import dynamic from 'next/dynamic';
const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

export default function KaryawanDashboard() {
  const { activeUser, setActiveUser, orders, setOrders, addons, services, categories, logout, showAlert } = useApp();
  const alert = showAlert;

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'profile'>('dashboard');

  // Work panel modal
  const [activeWorkingTask, setActiveWorkingTask] = useState<any | null>(null);

  // Cancellation modal
  const [activeCancelOrderId, setActiveCancelOrderId] = useState<string | null>(null);
  const [cancelReasonText, setCancelReasonText] = useState('');

  // Service editing states (CEK_LAYANAN stage)
  const [editingServiceOrderId, setEditingServiceOrderId] = useState<string | null>(null);
  const [tempCategoryId, setTempCategoryId] = useState<string>('');
  const [tempServiceId, setTempServiceId] = useState<string>('');
  const [tempQuantity, setTempQuantity] = useState<number>(1);

  // Addons states (PENGERJAAN stage)
  const [addonsUsed, setAddonsUsed] = useState<{ id: string; name: string; price: number; quantity: number; hpp?: number }[]>([]);
  const [selectedAddonId, setSelectedAddonId] = useState('');
  const [addonQuantity, setAddonQuantity] = useState(1);

  const [photoBeforeUrl, setPhotoBeforeUrl] = useState('');
  const [photoAfterUrl, setPhotoAfterUrl] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');

  // Profile edit states
  const [editName, setEditName] = useState(activeUser?.name || '');
  const [editPhone, setEditPhone] = useState(activeUser?.phone || '');
  const [editAddress, setEditAddress] = useState(activeUser?.address || '');
  const [editLat, setEditLat] = useState<number | undefined>(activeUser?.lat);
  const [editLng, setEditLng] = useState<number | undefined>(activeUser?.lng);
  const [editPhoto, setEditPhoto] = useState<string>(activeUser?.photo || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Added for new Profile View Modes
  const [profileViewMode, setProfileViewMode] = useState<'readonly' | 'edit-profile' | 'edit-password'>('readonly');
  const [showProfileMapPicker, setShowProfileMapPicker] = useState(false);
  const [editOldPassword, setEditOldPassword] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');

  useEffect(() => {
    if (activeUser) {
      setEditName(activeUser.name);
      setEditPhone(activeUser.phone || '');
      setEditAddress(activeUser.address || '');
      setEditLat(activeUser.lat);
      setEditLng(activeUser.lng);
      setEditPhoto(activeUser.photo || '');
    }
  }, [activeUser]);

  if (!activeUser) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const activeTasks = orders.filter(o => o.assignedTo === activeUser.id && o.status !== OrderStatus.SELESAI && o.status !== OrderStatus.DIBATALKAN && o.status !== OrderStatus.MENUNGGU);
  const completedTasks = orders.filter(o => o.assignedTo === activeUser.id && o.status === OrderStatus.SELESAI);

  const formatRupiah = (num: any) => {
    return 'Rp' + Number(num || 0).toLocaleString('id-ID');
  };

  // ==================== HANDLERS ====================

  // Client-side image compression to downsize massive photos
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

          // Calculate new dimensions keeping ratio
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
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // Profile update handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setErrorMsg('Nama tidak boleh kosong');
      return;
    }
    try {
      setIsLoading(true);
      setErrorMsg('');

      await api.updateUser(activeUser!.id, {
        name: editName.trim(),
        email: activeUser!.email,
        phone: editPhone.trim(),
        role: activeUser!.role,
        address: editAddress.trim(),
        lat: editLat,
        lng: editLng,
        photo: editPhoto,
      });

      const updatedUser = {
        ...activeUser!,
        name: editName.trim(),
        phone: editPhone.trim(),
        address: editAddress.trim(),
        lat: editLat,
        lng: editLng,
        photo: editPhoto,
      };
      setActiveUser(updatedUser);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      setIsLoading(false);
      setProfileViewMode('readonly');
    } catch (error: any) {
      setErrorMsg(error?.message || 'Gagal memperbarui profil');
      setIsLoading(false);
    }
  };

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 600, 600, 0.75);
        setEditPhoto(compressedBase64);
      } catch (err) {
        console.error('Error compressing profile image:', err);
        alert('❌ Gagal memproses foto profil. Silakan coba lagi.');
      }
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOldPassword || !editNewPassword || !editConfirmPassword) {
      setErrorMsg('Semua kolom password wajib diisi');
      return;
    }
    if (editNewPassword !== editConfirmPassword) {
      setErrorMsg('Konfirmasi password baru tidak cocok');
      return;
    }
    if (editNewPassword.length < 6) {
      setErrorMsg('Password baru minimal 6 karakter');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg('');

      await api.updatePassword(activeUser!.id, {
        oldPassword: editOldPassword,
        newPassword: editNewPassword
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      setIsLoading(false);

      setEditOldPassword('');
      setEditNewPassword('');
      setEditConfirmPassword('');
      setProfileViewMode('readonly');
    } catch (error: any) {
      setErrorMsg(error?.message || 'Gagal memperbarui password');
      setIsLoading(false);
    }
  };

  // Edit service details (CEK_LAYANAN stage)
  const handleStartEditingService = (order: any) => {
    setEditingServiceOrderId(order.id);
    const currentCat = categories.find(c => c.name === order.acDetail.category) || categories[0];
    setTempCategoryId(currentCat ? currentCat.id : '');
    const currentSrv = services.find(s => s.name === order.acDetail.serviceType && s.categoryId === currentCat?.id) ||
      services.find(s => s.categoryId === currentCat?.id);
    setTempServiceId(currentSrv ? currentSrv.id : '');
    setTempQuantity(order.acDetail.quantity || 1);
  };

  const handleSaveServiceUpdate = async (orderId: string) => {
    const matchedCategory = categories.find(c => c.id === tempCategoryId);
    const matchedService = services.find(s => s.id === tempServiceId);

    if (!matchedCategory) {
      alert('Kategori layanan tidak valid');
      return;
    }

    try {
      const categoryName = matchedCategory.name;
      const serviceTypeName = matchedCategory.hasServices && matchedService ? matchedService.name : 'none';
      let unitPrice = 50000;
      if (matchedCategory.hasServices && matchedService) {
        unitPrice = matchedService.price;
      }
      const newServiceCost = unitPrice * tempQuantity;

      const currentOrder = orders.find(o => o.id === orderId);
      if (!currentOrder) return;

      await api.updateOrder(orderId, {
        acDetail: {
          ...currentOrder.acDetail,
          category: categoryName,
          serviceType: serviceTypeName,
          quantity: tempQuantity
        },
        serviceCost: newServiceCost,
        totalCost: newServiceCost + (currentOrder.addonsCost || 0)
      });

      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === orderId
            ? {
              ...o,
              acDetail: { ...o.acDetail, category: categoryName, serviceType: serviceTypeName, quantity: tempQuantity },
              serviceCost: newServiceCost,
              totalCost: newServiceCost + (o.addonsCost || 0)
            }
            : o
        )
      );

      setEditingServiceOrderId(null);
      alert('✓ Detail jenis layanan berhasil disesuaikan!');
    } catch (error) {
      alert('❌ Gagal menyimpan layanan');
    }
  };

  const handleRequestCancelWorker = async () => {
    if (!activeCancelOrderId || !cancelReasonText.trim()) return;
    try {
      await api.updateOrder(activeCancelOrderId, { workerCancelReason: cancelReasonText.trim() });
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === activeCancelOrderId ? { ...o, workerCancelReason: cancelReasonText.trim() } : o
        )
      );
      alert('✓ Pengajuan pembatalan telah dikirim ke Admin untuk diverifikasi.');
      setActiveCancelOrderId(null);
      setCancelReasonText('');
    } catch (error) {
      alert('❌ Gagal mengirim pengajuan pembatalan');
    }
  };

  // Status transition: DITUGASKAN → CEK_LAYANAN
  const handleConfirmArrived = async (orderId: string) => {
    try {
      await api.updateOrder(orderId, { status: OrderStatus.CEK_LAYANAN });
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === orderId ? { ...o, status: OrderStatus.CEK_LAYANAN } : o
        )
      );
      setPhotoBeforeUrl('');
      setPhotoAfterUrl('');
    } catch (error) {
      alert('❌ Gagal update status');
    }
  };

  // Status transition: CEK_LAYANAN → PENGERJAAN
  const handleStartRepairAndWash = async (orderId: string) => {
    if (!photoBeforeUrl) {
      alert('Mohon pilih/upload foto kondisi awal (Before) terlebih dahulu.');
      return;
    }
    try {
      await api.updateOrder(orderId, {
        status: OrderStatus.PENGERJAAN,
        photoBefore: photoBeforeUrl
      });
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === orderId ? { ...o, status: OrderStatus.PENGERJAAN, photoBefore: photoBeforeUrl } : o
        )
      );
    } catch (error) {
      alert('❌ Gagal update status');
    }
  };

  // Status transition: PENGERJAAN → PAYMENT
  const handleSendBillToCustomer = async (orderId: string) => {
    if (!photoAfterUrl) {
      alert('Mohon ambil/pilih foto kondisi sesudah pekerjaan (After).');
      return;
    }
    if (!completionNotes.trim()) {
      alert('Mohon ketik rincian pengerjaan / catatan penyelesaian AC.');
      return;
    }

    try {
      const addonsCost = addonsUsed.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
      const currentOrder = orders.find(o => o.id === orderId);
      const totalCost = (currentOrder?.serviceCost || 0) + addonsCost;

      await api.updateOrder(orderId, {
        status: OrderStatus.PAYMENT,
        photoAfter: photoAfterUrl,
        addonsCost,
        completionNotes: completionNotes.trim(),
        totalCost,
        paymentStatus: 'WAITING_APPROVAL',
        addonsUsed: addonsUsed
      });

      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === orderId
            ? {
              ...o,
              status: OrderStatus.PAYMENT,
              photoAfter: photoAfterUrl,
              addonsCost,
              completionNotes: completionNotes.trim(),
              totalCost,
              addonsUsed: addonsUsed
            }
            : o
        )
      );

      setAddonsUsed([]);
      setCompletionNotes('');
      setActiveWorkingTask(null);
      alert('✓ Tagihan berhasil dikirim ke pelanggan!');
    } catch (error) {
      alert('❌ Gagal mengirim tagihan');
    }
  };

  // Status transition: PAYMENT → SELESAI (Cash approval)
  const handleApproveCashReceived = async (orderId: string) => {
    try {
      await api.updateOrder(orderId, {
        status: OrderStatus.SELESAI,
        paymentStatus: 'PAID'
      });
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === orderId ? { ...o, status: OrderStatus.SELESAI, paymentStatus: 'PAID' } : o
        )
      );
      alert('✓ Pembayaran CASH lunas disetujui. Status pengerjaan: SELESAI!');
    } catch (error) {
      alert('❌ Gagal update status');
    }
  };

  // Image upload handler with built-in compression to avoid EADDRINUSE/max_allowed_packet db errors
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Compress image to max 1000px width/height and 70% quality (ideal balance of detail and database size)
        const compressedBase64 = await compressImage(file, 1000, 1000, 0.7);
        if (type === 'before') {
          setPhotoBeforeUrl(compressedBase64);
        } else {
          setPhotoAfterUrl(compressedBase64);
        }
      } catch (err) {
        console.error('Error compressing image:', err);
        alert('❌ Gagal memproses gambar dari kamera HP. Silakan coba lagi.');
      }
    }
  };

  // Addon management
  const handleAddAddonItem = () => {
    if (!selectedAddonId) return;
    const match = addons.find(a => a.id === selectedAddonId);
    if (match) {
      const exists = addonsUsed.find(x => x.id === match.id);
      if (exists) {
        setAddonsUsed(prev => prev.map(x => x.id === match.id ? { ...x, quantity: x.quantity + addonQuantity } : x));
      } else {
        setAddonsUsed(prev => [...prev, { id: match.id, name: match.name, price: match.price, quantity: addonQuantity, hpp: match.hpp || 0 }]);
      }
      setSelectedAddonId('');
      setAddonQuantity(1);
    }
  };

  const handleRemoveAddonItem = (id: string) => {
    setAddonsUsed(prev => prev.filter(x => x.id !== id));
  };

  return (
    <>
      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative min-h-0 h-full">

        {/* TAB NAVIGATION - TOP */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shrink-0">
          <div className="flex items-center justify-start gap-1 px-4 py-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'dashboard'
                  ? 'text-emerald-600 border-emerald-600'
                  : 'text-slate-600 border-transparent hover:text-slate-800'
                }`}
            >
              <span className="flex items-center gap-2">
                <Home size={16} />
                <span>Penugasan</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'history'
                  ? 'text-emerald-600 border-emerald-600'
                  : 'text-slate-600 border-transparent hover:text-slate-800'
                }`}
            >
              <span className="flex items-center gap-2">
                <Clock size={16} />
                <span>Histori</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'profile'
                  ? 'text-emerald-600 border-emerald-600'
                  : 'text-slate-600 border-transparent hover:text-slate-800'
                }`}
            >
              <span className="flex items-center gap-2">
                <UserIcon size={16} />
                <span>Profil</span>
              </span>
            </button>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto pb-6 min-h-0">

          {/* ==================== TAB 1: DASHBOARD ==================== */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="bg-slate-900 px-5 pt-5 pb-5 text-left text-white rounded-b-[24px] shadow-lg shrink-0">
                <span className="text-[8px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Departemen Teknisi Lapangan
                </span>
                <h2 className="text-base font-extrabold mt-1.5 leading-none text-white">Halo Sobat, {activeUser.name}!</h2>
                <p className="text-[10.5px] text-slate-400 mt-1">Status: <strong className="text-emerald-400">SIAP BEKERJA</strong></p>

                <div className="grid grid-cols-2 gap-3 mt-3.5 pt-3.5 border-t border-slate-800">
                  <div className="text-left">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Tugas Aktif</span>
                    <span className="text-sm font-extrabold text-blue-400 font-mono mt-0.5 block">{activeTasks.length}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Selesai</span>
                    <span className="text-sm font-extrabold text-emerald-400 font-mono mt-0.5 block">{completedTasks.length}</span>
                  </div>
                </div>
              </div>

              <div className="px-4 py-4 space-y-4">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider text-left pl-1">Daftar Kunjungan Service</h3>

                {activeTasks.length === 0 ? (
                  <div className="bg-white border rounded-2xl p-7 text-center space-y-3 shadow-xs">
                    <span className="text-xl">🛠️</span>
                    <p className="font-bold text-slate-850 text-xs uppercase">Jadwal Tugas Bersih!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeTasks.map(task => (
                      <div key={task.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5 text-left">

                        <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                          <div>
                            <span className="text-[8.5px] font-mono font-bold text-slate-400 bg-slate-50 px-1 py-0.5 border rounded uppercase tracking-wider">{task.id}</span>
                            <h4 className="font-extrabold text-xs text-slate-850 mt-1 uppercase">
                              {task.acDetail?.quantity || 0} Unit x {task.acDetail?.serviceType === 'none' ? task.acDetail?.category : task.acDetail?.serviceType}
                            </h4>
                          </div>
                          <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${task.status === OrderStatus.DITUGASKAN ? 'bg-amber-50 border-amber-200 text-amber-800' :
                              task.status === OrderStatus.CEK_LAYANAN ? 'bg-blue-50 border-blue-200 text-blue-850' :
                                task.status === OrderStatus.PENGERJAAN ? 'bg-purple-50 border-purple-200 text-purple-800' :
                                  'bg-indigo-50 border-indigo-200 text-indigo-750'
                            }`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="text-[10.5px] text-slate-500 font-medium space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/50">
                          <div>👤 {task.customerName} ({task.customerPhone})</div>
                          <div className="flex items-start gap-1">
                            <span className="shrink-0 mt-0.5">📍</span>
                            <div>
                              <span>{task.address}</span>
                              {(task.latitude || task.lat) && (task.longitude || task.lng) && (
                                <a
                                  href={`https://www.google.com/maps?q=${task.latitude || task.lat},${task.longitude || task.lng}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-1 flex w-fit items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-[9px] font-bold hover:bg-indigo-200 transition"
                                >
                                  Buka di Google Maps
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* ACTION BUTTONS PER STATUS */}
                        <div className="pt-2">
                          {task.status === OrderStatus.DITUGASKAN && (
                            <div className="space-y-2">
                              {task.workerCancelReason ? (
                                <div className="bg-amber-100 text-amber-800 p-3 rounded-xl text-xs font-bold text-center border border-amber-300">
                                  ⏳ Menunggu verifikasi admin untuk pembatalan...
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleConfirmArrived(task.id)}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 rounded-xl uppercase tracking-wider cursor-pointer transition"
                                  >
                                    Konfirmasi Tiba di Lokasi & Mulai Cek AC
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveCancelOrderId(task.id);
                                      setCancelReasonText('');
                                    }}
                                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-[10px] py-2 rounded-xl uppercase tracking-wider cursor-pointer transition"
                                  >
                                    Ajukan Pembatalan (Ada Kendala)
                                  </button>
                                </>
                              )}
                            </div>
                          )}

                          {task.status === OrderStatus.CEK_LAYANAN && (
                            <div className="space-y-3">
                              {/* Service adjustment */}
                              <div className="border border-amber-200 bg-amber-50/55 p-3.5 rounded-2xl space-y-2.5">
                                <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-wider text-amber-800">
                                  <span className="flex items-center gap-1">
                                    <Sliders size={12} />
                                    Kesesuaian Paket Jasa AC
                                  </span>
                                  {editingServiceOrderId !== task.id && (
                                    <button
                                      onClick={() => handleStartEditingService(task)}
                                      className="bg-amber-600 hover:bg-amber-700 text-white font-black text-[9px] px-2.5 py-1 rounded-lg cursor-pointer uppercase tracking-wide"
                                    >
                                      Sesuaikan Jasa
                                    </button>
                                  )}
                                </div>

                                {editingServiceOrderId === task.id ? (
                                  <div className="space-y-3 pt-1 text-[11px]">
                                    <div>
                                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">1. Kategori Jasa:</label>
                                      <select
                                        value={tempCategoryId}
                                        onChange={(e) => {
                                          setTempCategoryId(e.target.value);
                                          const subSrvs = services.filter(s => s.categoryId === e.target.value);
                                          if (subSrvs.length > 0) setTempServiceId(subSrvs[0].id);
                                          else setTempServiceId('');
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 font-extrabold text-xs text-slate-800 outline-none"
                                      >
                                        {categories.map(c => (
                                          <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                      </select>
                                    </div>

                                    {categories.find(c => c.id === tempCategoryId)?.hasServices && (
                                      <div>
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">2. Jenis Jasa:</label>
                                        <select
                                          value={tempServiceId}
                                          onChange={(e) => setTempServiceId(e.target.value)}
                                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 font-bold text-xs text-slate-800 outline-none"
                                        >
                                          {services.filter(s => s.categoryId === tempCategoryId).map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({formatRupiah(s.price)})</option>
                                          ))}
                                        </select>
                                      </div>
                                    )}

                                    <div className="flex justify-between items-end gap-3 pt-2.5 border-t border-amber-200/50">
                                      <div className="space-y-1">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">3. Jumlah Unit:</span>
                                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2 h-9">
                                          <button
                                            onClick={() => setTempQuantity(Math.max(1, tempQuantity - 1))}
                                            className="text-slate-500 hover:text-slate-800 font-extrabold text-[14px] px-1.5 cursor-pointer"
                                          >
                                            -
                                          </button>
                                          <span className="text-xs font-mono font-black w-4 text-center">{tempQuantity}</span>
                                          <button
                                            onClick={() => setTempQuantity(tempQuantity + 1)}
                                            className="text-slate-500 hover:text-slate-800 font-extrabold text-[12px] px-1.5 cursor-pointer"
                                          >
                                            +
                                          </button>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                          onClick={() => setEditingServiceOrderId(null)}
                                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[9.5px] px-3 py-2 rounded-xl uppercase cursor-pointer"
                                        >
                                          Batal
                                        </button>
                                        <button
                                          onClick={() => handleSaveServiceUpdate(task.id)}
                                          className="bg-amber-600 hover:bg-amber-700 text-white font-black text-[9.5px] px-3.5 py-2 rounded-xl uppercase cursor-pointer"
                                        >
                                          Simpan
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-[10.5px] font-medium text-slate-600 bg-white/75 p-3 rounded-xl border border-amber-100/40 space-y-1">
                                    <div>Kategori: <strong className="text-slate-850 font-bold">{task.acDetail?.category}</strong></div>
                                    <div>Layanan: <strong className="text-indigo-700 font-extrabold">{task.acDetail?.serviceType === 'none' ? 'Inspeksi' : task.acDetail?.serviceType}</strong></div>
                                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100/70 font-mono text-[10px]">
                                      <span>{task.acDetail?.quantity || 0} Unit x {formatRupiah((task.serviceCost || 0) / (task.acDetail?.quantity || 1))}</span>
                                      <strong className="text-emerald-700 font-black text-[11px]">{formatRupiah(task.serviceCost || 0)}</strong>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Photo BEFORE */}
                              <div className="border border-indigo-100 bg-indigo-50/50 p-3 rounded-xl space-y-2.5">
                                <span className="text-[8px] font-black tracking-widest text-indigo-700 uppercase block">FOTO KONDISI AWAL (BEFORE)</span>

                                <div className="flex flex-col gap-3">
                                  <label className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-2 rounded-xl text-[10px] font-black uppercase justify-center cursor-pointer h-10">
                                    <Camera size={14} />
                                    Upload Foto Before
                                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'before')} className="hidden" />
                                  </label>

                                  {photoBeforeUrl && (
                                    <div className="mt-1 space-y-1">
                                      <span className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider block">Preview Foto Terpilih:</span>
                                      <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                                        <img src={photoBeforeUrl} alt="Preview Before" className="w-full h-full object-contain" />
                                        <button
                                          type="button"
                                          onClick={() => setPhotoBeforeUrl('')}
                                          className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md cursor-pointer"
                                        >
                                          <X size={10} />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => handleStartRepairAndWash(task.id)}
                                disabled={!photoBeforeUrl}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-extrabold text-xs py-2.5 rounded-xl uppercase tracking-wider cursor-pointer disabled:cursor-not-allowed"
                              >
                                Konfirmasi Selesai Ulasan & Mulai Kerja
                              </button>
                            </div>
                          )}

                          {task.status === OrderStatus.PENGERJAAN && (
                            <button
                              onClick={() => {
                                if (addons.length > 0) setSelectedAddonId(addons[0].id);
                                setActiveWorkingTask(task);
                                setAddonsUsed([]);
                                setCompletionNotes('');
                                setPhotoAfterUrl('');
                              }}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs py-2.5 rounded-xl uppercase tracking-wider cursor-pointer"
                            >
                              Buka Panel Pengerjaan & Input Sparepart
                            </button>
                          )}

                          {task.status === OrderStatus.PAYMENT && (
                            <div className="border border-slate-200 rounded-xl p-3 bg-indigo-50/40 space-y-2.5 text-[11px] text-slate-700">
                              <span className="text-[8px] font-black uppercase text-indigo-700 block tracking-widest">Status Pelunasan Tagihan</span>
                              <div className="flex justify-between">
                                <span>Mekanisme:</span>
                                <strong className="text-slate-800 uppercase">{task.paymentMethod === 'TRANSFER' ? 'TRANSFER' : 'TUNAI'}</strong>
                              </div>
                              <div className="flex justify-between items-center bg-white p-1.5 rounded-lg border">
                                <span>Tagihan:</span>
                                <strong className="text-indigo-700 font-mono text-[11.5px]">{formatRupiah(task.totalCost || task.serviceCost || 0)}</strong>
                              </div>

                              {task.paymentMethod === 'CASH' || !task.paymentMethod ? (
                                <div className="space-y-1.5 pt-1">
                                  <p className="text-[10px] text-amber-800 leading-normal font-semibold">⚠️ Pembayaran Tunai. Konfirmasi kelayakan uang?</p>
                                  {task.paymentStatus === 'PAID' ? (
                                    <div className="bg-emerald-100 text-emerald-800 p-2 rounded-lg text-[10px] font-bold text-center">
                                      ✓ CASH LUNAS DI-APPROVE
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleApproveCashReceived(task.id)}
                                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] py-2 rounded-lg uppercase cursor-pointer"
                                    >
                                      Konfirmasi Terima Cash Lunas
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="pt-1 text-[10px] text-indigo-800 bg-white p-2 rounded-lg border border-indigo-100/55 leading-relaxed font-semibold">
                                  ⏳ Transfer VA. Menunggu konfirmasi otomatis.
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== TAB 2: HISTORY ==================== */}
          {activeTab === 'history' && (
            <div>
              <div className="bg-slate-900 px-5 pt-5 pb-5 text-white text-left rounded-b-[24px]">
                <span className="text-[8px] text-blue-300 bg-white/5 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">
                  Arsip
                </span>
                <h2 className="text-base font-black mt-1.5">Histori Pekerjaan Selesai</h2>
              </div>

              <div className="px-4 py-4 space-y-4">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider text-left pl-1">Data Pekerjaan Masa Lalu</h3>

                {completedTasks.length === 0 ? (
                  <div className="bg-white border rounded-2xl p-8 text-center space-y-3">
                    <span className="text-xl">📊</span>
                    <p className="font-extrabold text-xs uppercase">Belum Ada Histori</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedTasks.map(task => (
                      <div key={task.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                          <div>
                            <span className="text-[8px] font-mono text-slate-400 font-bold block">{task.id}</span>
                            <h4 className="font-bold text-xs text-slate-800 mt-0.5">{task.customerName}</h4>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-emerald-600 block">{formatRupiah(Number(task.serviceCost || 0) + Number(task.addonsCost || 0))}</span>
                            <span className="text-[8px] bg-emerald-50 text-emerald-600 font-black uppercase px-1.5 block mt-0.5">CLOSED</span>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-500 font-medium space-y-0.5">
                          <div>🔧 Jasa: {task.acDetail?.quantity} Unit x {task.acDetail?.serviceType === 'none' ? task.acDetail?.category : task.acDetail?.serviceType}</div>
                          <div>📅 Selesai: {task.scheduledDate}</div>
                          {task.status !== OrderStatus.DIBATALKAN && (
                            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                              <span>💳 Pembayaran:</span>
                              {task.paymentMethod === 'TRANSFER' ? (
                                <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 text-[8.5px] px-1.5 py-0.5 rounded font-black uppercase">
                                  TRANSFER (XENDIT)
                                </span>
                              ) : task.paymentMethod === 'CASH' ? (
                                <span className="bg-emerald-50 border border-emerald-150 text-emerald-700 text-[8.5px] px-1.5 py-0.5 rounded font-black uppercase">
                                  TUNAI (CASH)
                                </span>
                              ) : (
                                <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[8.5px] px-1.5 py-0.5 rounded font-black uppercase">
                                  💵 TUNAI / MANUAL (BAWAAN)
                                </span>
                              )}
                              <span className="bg-emerald-500 text-white text-[8px] px-1 py-0.5 rounded font-black uppercase tracking-wider">
                                LUNAS
                              </span>
                            </div>
                          )}
                          {task.completionNotes && <div className="italic text-slate-600 mt-1">"{task.completionNotes}"</div>}
                        </div>

                        {task.rating !== undefined && (
                          <div className="bg-amber-500/10 border border-amber-500/25 p-2.5 rounded-lg flex items-center justify-between">
                            <div>
                              <span className="text-[8px] text-amber-700 font-black uppercase block">Rating</span>
                              {task.ratingNotes && <p className="italic text-[10px] text-amber-900 font-bold mt-1">"{task.ratingNotes}"</p>}
                            </div>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((st) => (
                                <Star key={st} size={11} className={st <= (task.rating || 0) ? 'fill-amber-500 text-amber-500' : 'text-slate-200'} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== TAB 3: PROFILE ==================== */}
          {activeTab === 'profile' && (
            <div>
              <div className="bg-gradient-to-r from-teal-700 to-emerald-900 px-5 md:px-8 lg:px-12 py-5 text-white text-left rounded-b-[24px] md:rounded-b-[40px] shrink-0">
                <div className="flex justify-between items-start">
                  <span className="text-[8px] text-teal-200 bg-white/10 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">
                    Informasi Personel
                  </span>
                  <button
                    onClick={() => logout()}
                    className="bg-rose-500/20 border border-rose-500/50 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg cursor-pointer hover:bg-rose-500 transition"
                  >
                    Keluar
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <div className="w-12 h-12 bg-white text-emerald-700 font-black text-sm flex items-center justify-center rounded-xl shadow-lg overflow-hidden border">
                    {activeUser.photo ? (
                      <img src={activeUser.photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      activeUser.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold">{activeUser.name}</h3>
                    <p className="text-[10px] text-emerald-200 mt-1 uppercase font-bold tracking-wider">{activeUser.role}</p>
                  </div>
                </div>
              </div>

              <div className="px-4 md:px-8 lg:px-12 py-6 space-y-4 max-w-2xl mx-auto">
                {saveSuccess && (
                  <div className="bg-emerald-100 border border-emerald-250 p-2.5 rounded-xl text-[11px] text-emerald-800 font-bold flex items-center gap-2">
                    <Check size={14} /> Profil berhasil diperbarui!
                  </div>
                )}

                {errorMsg && (
                  <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-[11px] text-rose-700 font-semibold flex items-center gap-2">
                    <X size={14} /> {errorMsg}
                  </div>
                )}

                {profileViewMode === 'readonly' && (
                  <div className="bg-white border p-5 rounded-2xl shadow-xs space-y-5">
                    {activeUser.photo && (
                      <div className="flex justify-center pb-2">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border shadow-sm">
                          <img src={activeUser.photo} alt="Profile Picture" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{activeUser.name}</p>
                        </div>
                        <UserIcon size={18} className="text-slate-300" />
                      </div>

                      <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Terdaftar</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{activeUser.email}</p>
                        </div>
                        <Mail size={18} className="text-slate-300" />
                      </div>

                      <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nomor Handphone</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{activeUser.phone || <span className="italic text-slate-400 text-xs">Belum diatur</span>}</p>
                        </div>
                        <Phone size={18} className="text-slate-300" />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Alamat Rumah</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{activeUser.address || <span className="italic text-slate-400 text-xs">Belum diatur</span>}</p>
                          {activeUser.lat && activeUser.lng && (
                            <p className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                              📍 {activeUser.lat.toFixed(5)}, {activeUser.lng.toFixed(5)}
                            </p>
                          )}
                        </div>
                        <MapPin size={18} className="text-slate-300" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3">
                      <button
                        onClick={() => { setErrorMsg(''); setProfileViewMode('edit-profile'); }}
                        className="w-full bg-teal-50 hover:bg-teal-100 text-teal-700 font-extrabold text-[10px] py-2.5 rounded-xl uppercase transition cursor-pointer"
                      >
                        Edit Profil
                      </button>
                      <button
                        onClick={() => { setErrorMsg(''); setProfileViewMode('edit-password'); }}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] py-2.5 rounded-xl uppercase transition cursor-pointer"
                      >
                        Ubah Password
                      </button>
                    </div>
                  </div>
                )}

                {profileViewMode === 'edit-profile' && (
                  <form onSubmit={handleSaveProfile} className="bg-white border p-5 rounded-2xl shadow-xs space-y-4">
                    {/* Foto Profil Upload */}
                    <div className="space-y-2 pb-2">
                      <label className="text-[9.5px] text-slate-400 font-bold uppercase block">Foto Profil</label>
                      <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <div className="w-14 h-14 bg-slate-200 text-slate-500 rounded-2xl flex items-center justify-center overflow-hidden border">
                          {editPhoto ? (
                            <img src={editPhoto} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-bold">No Photo</span>
                          )}
                        </div>
                        <div className="flex-grow text-left">
                          <span className="text-[10px] text-slate-600 font-bold block mb-1">Pilih Foto Diri</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePhotoChange}
                            className="w-full text-[10px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Nama Lengkap</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-teal-500 disabled:opacity-50 transition"
                        disabled={isLoading}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">No. Handphone</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-teal-500 disabled:opacity-50 transition"
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Alamat Rumah</label>
                      <div className="flex gap-2">
                        <textarea
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none focus:border-teal-500 h-16 resize-none disabled:opacity-50 transition"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowProfileMapPicker(true)}
                          className="bg-teal-50 text-teal-600 border border-teal-200 rounded-xl px-3 flex flex-col items-center justify-center gap-1 hover:bg-teal-100 transition cursor-pointer"
                        >
                          <MapPin size={16} />
                          <span className="text-[8px] font-black uppercase">Peta</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setProfileViewMode('readonly')}
                        disabled={isLoading}
                        className="w-full bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-600 font-extrabold text-[10px] py-3 rounded-xl uppercase cursor-pointer transition"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white font-extrabold text-[10px] py-3 rounded-xl uppercase cursor-pointer flex items-center justify-center gap-2 transition shadow-md"
                      >
                        {isLoading && <Loader size={12} className="animate-spin" />}
                        {isLoading ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </div>
                  </form>
                )}

                {profileViewMode === 'edit-password' && (
                  <form onSubmit={handleUpdatePassword} className="bg-white border p-5 rounded-2xl shadow-xs space-y-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2 mb-2">
                      <ShieldCheck size={16} className="text-teal-600 shrink-0 mt-0.5" />
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
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-teal-500 transition"
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
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-teal-500 transition"
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
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-teal-500 transition"
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
                          setErrorMsg('');
                        }}
                        disabled={isLoading}
                        className="w-full bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-600 font-extrabold text-[10px] py-3 rounded-xl uppercase cursor-pointer transition"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-slate-900 disabled:bg-slate-400 text-white font-extrabold text-[10px] py-3 rounded-xl uppercase cursor-pointer flex items-center justify-center gap-2 transition shadow-md"
                      >
                        {isLoading && <Loader size={12} className="animate-spin" />}
                        {isLoading ? 'Menyimpan...' : 'Ubah Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

        </div>

        {/* WORK PANEL MODAL (PENGERJAAN STAGE) */}
        {activeWorkingTask && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex flex-col justify-end z-45 animate-in slide-in-from-bottom duration-300 pt-10">
            <div className="bg-white rounded-t-[24px] flex flex-col max-h-[calc(100%-2.5rem)] overflow-hidden shadow-2xl">

              <div className="px-5 py-4 border-b flex justify-between items-center bg-slate-900 text-white shrink-0">
                <div>
                  <span className="text-[8px] bg-purple-600 px-1.5 py-0.5 rounded font-black uppercase">Pengerjaan</span>
                  <h4 className="text-sm font-extrabold text-white mt-1">ID: {activeWorkingTask.id}</h4>
                </div>
                <button
                  onClick={() => setActiveWorkingTask(null)}
                  className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 pb-12 bg-slate-50">

                <div className="bg-white border rounded-xl p-3 text-[10.5px] text-slate-600">
                  <div>⚙️ Layanan: <strong>{activeWorkingTask.acDetail?.quantity || 0} Unit x {activeWorkingTask.acDetail?.serviceType === 'none' ? activeWorkingTask.acDetail?.category : activeWorkingTask.acDetail?.serviceType}</strong></div>
                </div>

                {/* Photo AFTER */}
                <div className="bg-white border rounded-xl p-3.5 space-y-2.5">
                  <span className="text-[8.5px] font-black uppercase text-purple-600 tracking-wider block">1. Foto Selesai (After)</span>

                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-2 rounded-xl text-[10px] font-black uppercase justify-center cursor-pointer h-10">
                      <Camera size={14} />
                      Upload Foto After
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'after')} className="hidden" />
                    </label>

                    {photoAfterUrl && (
                      <div className="mt-1 space-y-1">
                        <span className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider block">Preview Foto Terpilih:</span>
                        <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                          <img src={photoAfterUrl} alt="Preview After" className="w-full h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setPhotoAfterUrl('')}
                            className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md cursor-pointer"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Addons */}
                <div className="bg-white border rounded-xl p-3.5 space-y-3">
                  <span className="text-[8.5px] font-black uppercase text-purple-600 tracking-wider block">2. Sparepart Digunakan</span>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedAddonId}
                      onChange={(e) => setSelectedAddonId(e.target.value)}
                      className="flex-1 bg-slate-50 border text-xs p-2 rounded-xl outline-none font-bold"
                    >
                      {addons.map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({formatRupiah(a.price)})</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setAddonQuantity(Math.max(1, addonQuantity - 1))}
                        className="w-8 h-8 bg-slate-100 border rounded-lg font-bold text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs bg-white font-extrabold border rounded">{addonQuantity}</span>
                      <button
                        onClick={() => setAddonQuantity(Math.min(10, addonQuantity + 1))}
                        className="w-8 h-8 bg-slate-100 border rounded-lg font-bold text-xs cursor-pointer"
                      >
                        +
                      </button>
                      <button
                        onClick={handleAddAddonItem}
                        className="bg-purple-600 text-white font-black text-[10px] py-2 px-3 rounded-lg cursor-pointer"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1.5 border-t border-slate-100">
                    {addonsUsed.length === 0 ? (
                      <span className="text-[9.5px] text-slate-400 font-bold italic block">Belum ada sparepart tambahan.</span>
                    ) : (
                      <div className="space-y-1.5">
                        {addonsUsed.map(add => (
                          <div key={add.id} className="flex justify-between items-center text-[10.5px]">
                            <span className="font-semibold text-slate-700">• {add.name} (x{add.quantity}) {formatRupiah(add.price)}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-800">{formatRupiah(add.price * add.quantity)}</span>
                              <button
                                onClick={() => handleRemoveAddonItem(add.id)}
                                className="text-red-500 hover:bg-red-50 p-1 rounded cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Completion notes */}
                <div>
                  <label className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mb-1">3. Catatan Penyelesaian</label>
                  <textarea
                    placeholder="Contoh: Selesai menyemprot, membersihkan filter, isi freon 0.5 amp..."
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs p-3 rounded-xl outline-none h-20 resize-none font-medium leading-relaxed"
                  />
                </div>

                <button
                  onClick={() => handleSendBillToCustomer(activeWorkingTask.id)}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs py-3.5 rounded-xl uppercase tracking-widest cursor-pointer shadow-md"
                >
                  Kirim Tagihan Layanan ke Pelanggan
                </button>

              </div>
            </div>
          </div>
        )}

      </div>

      {/* Cancellation Modal */}
      {activeCancelOrderId && (
        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 backdrop-blur-sm">
          <div className="bg-white border rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl text-left scale-in-center">
            <div className="p-5 border-b border-slate-100 bg-rose-50/50 flex justify-between items-center">
              <div>
                <h4 className="font-black text-sm text-rose-700 uppercase tracking-wide">Ajukan Pembatalan</h4>
                <p className="text-[10px] text-rose-500 mt-1 font-semibold">Berikan alasan rinci kepada admin</p>
              </div>
              <button
                onClick={() => setActiveCancelOrderId(null)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-200 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block mb-1.5">Alasan Kendala</label>
                <textarea
                  autoFocus
                  placeholder="Contoh: Alamat tidak ditemukan, pelanggan tidak ada di rumah, alat rusak..."
                  value={cancelReasonText}
                  onChange={(e) => setCancelReasonText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs p-3.5 rounded-xl outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 h-28 resize-none font-medium leading-relaxed transition-all text-slate-700"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveCancelOrderId(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[11px] py-3 rounded-xl uppercase tracking-wider cursor-pointer transition"
                >
                  Kembali
                </button>
                <button
                  onClick={handleRequestCancelWorker}
                  disabled={!cancelReasonText.trim()}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-black text-[11px] py-3 rounded-xl uppercase tracking-wider cursor-pointer shadow-md transition disabled:cursor-not-allowed"
                >
                  Kirim Ajuan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Map Picker Modal for Profile */}
      {showProfileMapPicker && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden animate-in fade-in duration-300">
          <MapPicker
            onLocationSelect={(address, lat, lng) => {
              setEditAddress(address);
              setEditLat(lat);
              setEditLng(lng);
              setShowProfileMapPicker(false);
            }}
            onCancel={() => setShowProfileMapPicker(false)}
          />
        </div>
      )}
    </>
  );
}
