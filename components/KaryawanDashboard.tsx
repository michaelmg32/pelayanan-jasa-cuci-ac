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
} from 'lucide-react';

export default function KaryawanDashboard() {
  const { activeUser, setActiveUser, orders, setOrders, addons, services, categories, logout } = useApp();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'profile'>('dashboard');

  // Work panel modal
  const [activeWorkingTask, setActiveWorkingTask] = useState<any | null>(null);

  // Service editing states (CEK_LAYANAN stage)
  const [editingServiceOrderId, setEditingServiceOrderId] = useState<string | null>(null);
  const [tempCategoryId, setTempCategoryId] = useState<string>('');
  const [tempServiceId, setTempServiceId] = useState<string>('');
  const [tempQuantity, setTempQuantity] = useState<number>(1);

  // Addons states (PENGERJAAN stage)
  const [addonsUsed, setAddonsUsed] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);
  const [selectedAddonId, setSelectedAddonId] = useState('');
  const [addonQuantity, setAddonQuantity] = useState(1);

  // Mock images for simulation
  const mockBeforeImages = [
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=300&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&auto=format&fit=crop&q=60'
  ];

  const mockAfterImages = [
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=300&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=300&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&auto=format&fit=crop&q=60'
  ];

  const [photoBeforeUrl, setPhotoBeforeUrl] = useState('');
  const [photoAfterUrl, setPhotoAfterUrl] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');

  // Profile edit states
  const [editName, setEditName] = useState(activeUser?.name || '');
  const [editPhone, setEditPhone] = useState(activeUser?.phone || '');
  const [editAddress, setEditAddress] = useState(activeUser?.address || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (activeUser) {
      setEditName(activeUser.name);
      setEditPhone(activeUser.phone || '');
      setEditAddress(activeUser.address || '');
    }
  }, [activeUser]);

  if (!activeUser) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const activeTasks = orders.filter(o => o.assignedTo === activeUser.id && o.status !== OrderStatus.SELESAI);
  const completedTasks = orders.filter(o => o.assignedTo === activeUser.id && o.status === OrderStatus.SELESAI);

  const formatRupiah = (num: number) => {
    return 'Rp' + num.toLocaleString('id-ID');
  };

  // ==================== HANDLERS ====================

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
      });

      const updatedUser = {
        ...activeUser!,
        name: editName.trim(),
        phone: editPhone.trim(),
        address: editAddress.trim(),
      };
      setActiveUser(updatedUser);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      setIsLoading(false);
    } catch (error: any) {
      setErrorMsg(error?.message || 'Gagal memperbarui profil');
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

  // Status transition: DITUGASKAN → CEK_LAYANAN
  const handleConfirmArrived = async (orderId: string) => {
    try {
      await api.updateOrder(orderId, { status: OrderStatus.CEK_LAYANAN });
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === orderId ? { ...o, status: OrderStatus.CEK_LAYANAN } : o
        )
      );
      setPhotoBeforeUrl(mockBeforeImages[0]);
      setPhotoAfterUrl(mockAfterImages[0]);
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
        paymentStatus: 'WAITING_APPROVAL'
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
                totalCost
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

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result as string;
        if (type === 'before') {
          setPhotoBeforeUrl(base64Url);
        } else {
          setPhotoAfterUrl(base64Url);
        }
      };
      reader.readAsDataURL(file);
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
        setAddonsUsed(prev => [...prev, { id: match.id, name: match.name, price: match.price, quantity: addonQuantity }]);
      }
      setSelectedAddonId('');
      setAddonQuantity(1);
    }
  };

  const handleRemoveAddonItem = (id: string) => {
    setAddonsUsed(prev => prev.filter(x => x.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative min-h-0 h-full">

      {/* TAB NAVIGATION - TOP */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shrink-0">
        <div className="flex items-center justify-start gap-1 px-4 py-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'dashboard'
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
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'history'
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
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'profile'
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
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          task.status === OrderStatus.DITUGASKAN ? 'bg-amber-50 border-amber-200 text-amber-800' :
                          task.status === OrderStatus.CEK_LAYANAN ? 'bg-blue-50 border-blue-200 text-blue-850' :
                          task.status === OrderStatus.PENGERJAAN ? 'bg-purple-50 border-purple-200 text-purple-800' :
                          'bg-indigo-50 border-indigo-200 text-indigo-750'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="text-[10.5px] text-slate-500 font-medium space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/50">
                        <div>👤 {task.customerName} ({task.customerPhone})</div>
                        <div>📍 {task.address}</div>
                      </div>

                      {/* ACTION BUTTONS PER STATUS */}
                      <div className="pt-2">
                        {task.status === OrderStatus.DITUGASKAN && (
                          <button
                            onClick={() => handleConfirmArrived(task.id)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 rounded-xl uppercase tracking-wider cursor-pointer"
                          >
                            Konfirmasi Tiba di Lokasi & Mulai Cek AC
                          </button>
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
                                <div className="space-y-1">
                                  <span className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider block">Pilih Preset:</span>
                                  <div className="flex gap-1.5 flex-wrap">
                                    {mockBeforeImages.map((img, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => setPhotoBeforeUrl(img)}
                                        className={`w-18 h-12 rounded border overflow-hidden ${photoBeforeUrl === img && !photoBeforeUrl.startsWith('data:') ? 'ring-2 ring-indigo-600' : 'border-slate-300'}`}
                                      >
                                        <img src={img} alt="before" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      </button>
                                    ))}
                                  </div>
                                </div>

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
                          <span className="text-xs font-black text-emerald-600 block">{formatRupiah(task.totalCost || task.serviceCost || 0)}</span>
                          <span className="text-[8px] bg-emerald-50 text-emerald-600 font-black uppercase px-1.5 block mt-0.5">CLOSED</span>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 font-medium space-y-0.5">
                        <div>🔧 Jasa: {task.acDetail?.quantity} Unit x {task.acDetail?.serviceType === 'none' ? task.acDetail?.category : task.acDetail?.serviceType}</div>
                        <div>📅 Selesai: {task.scheduledDate}</div>
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
            <div className="bg-gradient-to-r from-teal-700 to-emerald-900 px-5 py-5 text-white text-left rounded-b-[24px]">
              <span className="text-[8px] text-teal-200 bg-white/10 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">
                Informasi Personel
              </span>
              <div className="flex items-center gap-3 mt-3">
                <div className="w-12 h-12 bg-white text-emerald-700 font-black text-sm flex items-center justify-center rounded-xl">
                  {activeUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold">{activeUser.name}</h3>
                  <p className="text-[10px] text-slate-400 mt-1">{activeUser.email}</p>
                </div>
              </div>
            </div>

            <div className="px-4 py-4 space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Perbarui Profil</h3>
                <button
                  onClick={() => logout()}
                  className="bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg cursor-pointer hover:bg-rose-100"
                >
                  Keluar
                </button>
              </div>

              {saveSuccess && (
                <div className="bg-emerald-100 border border-emerald-250 p-2.5 rounded-xl text-[11px] text-emerald-800 font-bold">
                  ✅ Profil berhasil diperbarui ke database!
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl text-[11px] text-red-700 font-semibold">
                  ❌ {errorMsg}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="bg-white border p-4.5 rounded-2xl shadow-xs space-y-4">
                <div>
                  <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Nama</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none disabled:opacity-50"
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
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none disabled:opacity-50"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Alamat</label>
                  <textarea
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none h-16 resize-none disabled:opacity-50"
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-slate-900 disabled:bg-slate-400 text-white font-extrabold text-xs py-3 rounded-xl uppercase cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader size={14} className="animate-spin" />}
                  {isLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* WORK PANEL MODAL (PENGERJAAN STAGE) */}
      {activeWorkingTask && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex flex-col justify-end z-45 animate-in slide-in-from-bottom duration-300 pt-10">
          <div className="bg-white rounded-t-[24px] flex flex-col max-h-full overflow-hidden shadow-2xl">

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
                  <div className="space-y-1">
                    <span className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider block">Pilih Preset:</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {mockAfterImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPhotoAfterUrl(img)}
                          className={`w-18 h-12 rounded border overflow-hidden ${photoAfterUrl === img && !photoAfterUrl.startsWith('data:') ? 'ring-2 ring-purple-600' : 'border-slate-300'}`}
                        >
                          <img src={img} alt="after" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  </div>

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
  );
}
