'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useApp } from '@/lib/auth-context';
import { OrderStatus } from '@/types';
import * as api from '@/lib/api';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });
import {
  Plus,
  Clock,
  Calendar,
  MapPin,
  LogOut,
  FileText,
  CheckCircle2,
  X,
  Home,
  User as UserIcon,
  ShieldCheck,
  Mail,
  Check,
  Star,
  Navigation,
  CreditCard,
  Sparkles,
  CheckCircle,
  Phone,
  AlertCircle,
  Loader,
  ArrowUp,
} from 'lucide-react';

export default function PelangganDashboard() {
  const { activeUser, setActiveUser, orders, setOrders, models, categories, services, addons, logout, showAlert, users } = useApp();
  const alert = showAlert;

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'profile'>('dashboard');

  // Booking Form State
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showConfirmOrderModal, setShowConfirmOrderModal] = useState(false);
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);
  const [confirmErrorMsg, setConfirmErrorMsg] = useState('');

  const [selectedModel, setSelectedModel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState(activeUser?.address || '');
  const [phone, setPhone] = useState(activeUser?.phone || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [notes, setNotes] = useState('');

  // Simulated Location details
  const [lat, setLat] = useState<number | undefined>(activeUser?.lat);
  const [lng, setLng] = useState<number | undefined>(activeUser?.lng);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Rating input state
  const [ratingInput, setRatingInput] = useState<{ [orderId: string]: { score: number; review: string } }>({});

  // Payment Selection State
  const [orderPaymentMethods, setOrderPaymentMethods] = useState<{ [orderId: string]: 'CASH' | 'TRANSFER' }>({});

  // Profile Form States
  const [profileViewMode, setProfileViewMode] = useState<'readonly' | 'edit-profile' | 'edit-password'>('readonly');
  const [editName, setEditName] = useState(activeUser?.name || '');
  const [editPhone, setEditPhone] = useState(activeUser?.phone || '');
  const [editAddress, setEditAddress] = useState(activeUser?.address || '');
  const [editLat, setEditLat] = useState<number | undefined>(activeUser?.lat);
  const [editLng, setEditLng] = useState<number | undefined>(activeUser?.lng);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showProfileMapPicker, setShowProfileMapPicker] = useState(false);

  // Password Edit States
  const [editOldPassword, setEditOldPassword] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');

  // Initialize dropdowns
  useEffect(() => {
    if (models.length > 0) setSelectedModel(models[0].name);
    if (categories.length > 0) {
      setSelectedCategory(categories[0].id);
      const filtered = services.filter(s => s.categoryId === categories[0].id);
      if (filtered.length > 0) {
        setSelectedService(filtered[0].name);
      } else {
        setSelectedService('none');
      }
    }
  }, [models, categories, services]);

  // Sync edits when user props update
  useEffect(() => {
    if (activeUser) {
      setEditName(activeUser.name);
      setEditPhone(activeUser.phone || '');
      setEditAddress(activeUser.address || '');
      setEditLat(activeUser.lat);
      setEditLng(activeUser.lng);
      setAddress(activeUser.address || '');
      setPhone(activeUser.phone || '');
      setLat(activeUser.lat);
      setLng(activeUser.lng);
    }
  }, [activeUser]);

  // Poll payment status for active transfer orders in PAYMENT stage
  useEffect(() => {
    if (!activeUser) return;

    const paymentOrders = orders.filter(
      o => o.customerId === activeUser.id && o.status === OrderStatus.PAYMENT && o.paymentMethod === 'TRANSFER' && o.paymentInvoiceId
    );

    if (paymentOrders.length === 0) return;

    const interval = setInterval(async () => {
      let changed = false;
      for (const order of paymentOrders) {
        try {
          let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
          if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            apiUrl = apiUrl.replace(/localhost|127\.0\.0\.1/, window.location.hostname);
          }
          const response = await fetch(`${apiUrl}/orders/${order.id}/payment-status`, {
            headers: api.getAuthHeaders()
          });
          if (response.ok) {
            const data = await response.json();
            if (data.paymentStatus === 'PAID') {
              changed = true;
            }
          }
        } catch (err) {
          console.error('Error polling payment status:', err);
        }
      }

      if (changed) {
        const updatedOrders = await api.fetchOrders();
        setOrders(updatedOrders);
      }
    }, 4000); // Check status every 4 seconds

    return () => clearInterval(interval);
  }, [orders, activeUser]);

  if (!activeUser) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Filter orders
  const myOrders = orders.filter(o => o.customerId === activeUser.id);
  const activeOrders = myOrders.filter(o => o.status !== OrderStatus.SELESAI || !o.rating || o.rating === null);
  const completedOrders = myOrders.filter(o => o.status === OrderStatus.SELESAI);

  // Handle Category Switch
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const filtered = services.filter(s => s.categoryId === categoryId);
    if (filtered.length > 0) {
      setSelectedService(filtered[0].name);
    } else {
      setSelectedService('none');
    }
  };

  // Get service price
  const getSelectedServicePrice = () => {
    if (selectedService === 'none' || !selectedService) {
      return 50000;
    }
    const match = services.find(s => s.name === selectedService);
    return match ? match.price : 75000;
  };

  const currentServicePrice = getSelectedServicePrice();
  const estimatedCost = currentServicePrice * quantity;

  // Submit new booking (pre-submit confirmation)
  const handlePreSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || !phone.trim() || !date) {
      alert('Mohon lengkapi alamat, nomor telepon, dan tanggal pengerjaan.');
      return;
    }
    setConfirmErrorMsg('');
    setShowConfirmOrderModal(true);
  };

  // Actual API submit on confirmation
  const handleConfirmSubmitOrder = async () => {
    try {
      setIsLoading(true);
      setConfirmErrorMsg('');
      const catObj = categories.find(c => c.id === selectedCategory);
      const categoryName = catObj ? catObj.name : 'Inspeksi & Konsultasi';

      // Generate order ID
      const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get service price
      const serviceObj = services.find(s => s.id === selectedService || s.name === selectedService);
      const serviceCost = serviceObj ? serviceObj.price : 75000;
      const totalCost = serviceCost * quantity;

      await api.createOrder({
        id: orderId,
        customerId: activeUser.id,
        customerName: activeUser.name,
        customerPhone: phone.trim(),
        acType: selectedModel,
        address: address.trim(),
        scheduledDate: date,
        scheduledTime: time,
        schedule: `${date} ${time}`,
        status: 'MENUNGGU',
        acDetail: {
          acType: selectedModel,
          category: categoryName,
          serviceType: selectedService,
          quantity,
        },
        notes: notes.trim(),
        serviceCost: serviceCost,
        addonsCost: 0,
        totalCost: totalCost,
        totalPrice: totalCost,
        latitude: lat,
        longitude: lng,
      });

      // Refresh orders from API
      const updatedOrders = await api.fetchOrders();
      setOrders(updatedOrders);

      setNotes('');
      setLat(activeUser.lat);
      setLng(activeUser.lng);
      setShowNewOrderModal(false);
      setShowConfirmOrderModal(false);

      // Reset dropdown values to default values
      if (models.length > 0) setSelectedModel(models[0].name);
      if (categories.length > 0) {
        setSelectedCategory(categories[0].id);
        const filtered = services.filter(s => s.categoryId === categories[0].id);
        if (filtered.length > 0) {
          setSelectedService(filtered[0].name);
        } else {
          setSelectedService('none');
        }
      }
      setQuantity(1);
      setDate('');
      setTime('09:00');
      setIsLoading(false);

      // Set success order ID to trigger the success popup
      setOrderSuccessId(orderId);
    } catch (error: any) {
      setIsLoading(false);
      setConfirmErrorMsg(error.message || 'Gagal membuat pesanan');
    }
  };

  // Save profile changes
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
      });

      const updatedUser = {
        ...activeUser!,
        name: editName.trim(),
        phone: editPhone.trim(),
        address: editAddress.trim(),
        lat: editLat,
        lng: editLng,
      };
      setActiveUser(updatedUser);

      setSaveSuccess(true);
      setProfileViewMode('readonly');
      setTimeout(() => setSaveSuccess(false), 2500);
      setIsLoading(false);
    } catch (error: any) {
      setErrorMsg(error?.message || 'Gagal memperbarui profil');
      setIsLoading(false);
    }
  };

  // Update password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editNewPassword !== editConfirmPassword) {
      setErrorMsg('Password baru dan konfirmasi tidak cocok');
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
        newPassword: editNewPassword,
      });

      setSaveSuccess(true);
      setProfileViewMode('readonly');

      // Clear password fields
      setEditOldPassword('');
      setEditNewPassword('');
      setEditConfirmPassword('');

      setTimeout(() => setSaveSuccess(false), 3000);
      setIsLoading(false);
    } catch (error: any) {
      setErrorMsg(error?.message || 'Gagal mengganti password');
      setIsLoading(false);
    }
  };

  // GPS Detection (simulated)
  const handleGPSDetection = () => {
    setIsDetectingLocation(true);
    setTimeout(() => {
      const randLat = -6.273 + (Math.random() - 0.5) * 0.05;
      const randLng = 106.812 + (Math.random() - 0.5) * 0.05;
      setLat(parseFloat(randLat.toFixed(5)));
      setLng(parseFloat(randLng.toFixed(5)));

      const cleanAddress = activeUser.address
        ? `${activeUser.address} (GPS: ${randLat.toFixed(4)}, ${randLng.toFixed(4)})`
        : `Jl. Kemang Raya No. ${Math.floor(Math.random() * 80) + 1}, Jakarta Selatan (GPS: ${randLat.toFixed(4)}, ${randLng.toFixed(4)})`;

      setAddress(cleanAddress);
      setIsDetectingLocation(false);
    }, 1200);
  };

  // Handle rating submission
  const handleRateOrder = async (orderId: string) => {
    const ratingData = ratingInput[orderId];
    if (!ratingData || !ratingData.score) {
      alert('Mohon beri rating untuk menyelesaikan pesanan');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Sending rating:', { orderId, rating: ratingData.score, notes: ratingData.review });

      await api.updateOrder(orderId, {
        rating: ratingData.score,
        ratingNotes: ratingData.review || '',
      });

      // Refresh orders from API
      const updatedOrders = await api.fetchOrders();
      setOrders(updatedOrders);

      // Update local state
      setRatingInput(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });

      setIsLoading(false);
      alert('✓ Terima kasih atas rating Anda!');
    } catch (error: any) {
      setIsLoading(false);
      console.error('Rating error:', error);
      alert('❌ Gagal menyimpan rating: ' + error.message);
    }
  };

  // Handle payment method selection
  const handlePaymentMethodSelect = async (orderId: string, method: 'CASH' | 'TRANSFER') => {
    setOrderPaymentMethods(prev => ({ ...prev, [orderId]: method }));

    try {
      await api.updateOrder(orderId, {
        paymentMethod: method,
      });
      // Refresh orders from API to get the new paymentUrl from backend
      const updatedOrders = await api.fetchOrders();
      setOrders(updatedOrders);
    } catch (error) {
      alert('❌ Gagal update metode pembayaran');
    }
  };

  // Format Rupiah
  const formatRupiah = (num: any) => {
    return 'Rp' + Number(num || 0).toLocaleString('id-ID');
  };

  // Status step index
  const getStatusStepIndex = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.MENUNGGU:
        return 0;
      case OrderStatus.DITUGASKAN:
        return 1;
      case OrderStatus.CEK_LAYANAN:
        return 2;
      case OrderStatus.PENGERJAAN:
        return 3;
      case OrderStatus.PAYMENT:
        return 4;
      case OrderStatus.SELESAI:
        return 5;
      default:
        return 0;
    }
  };

  const steps = [
    { label: 'Menunggu', desc: 'Mencari Teknisi' },
    { label: 'Ditugaskan', desc: 'Teknisi Ditunjuk' },
    { label: 'Cek Layanan', desc: 'Foto Sebelum' },
    { label: 'Pengerjaan', desc: 'Pemasangan & Foto Setelah' },
    { label: 'Payment', desc: 'Bayar Tagihan' },
    { label: 'Selesai', desc: 'Nilai Teknisi' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative min-h-0 h-full">
      <div className="w-full h-full flex flex-col relative">
        {/* TAB NAVIGATION - TOP */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shrink-0">
          <div className="flex items-center justify-start gap-1 px-4 md:px-8 lg:px-12 py-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'dashboard'
                ? 'text-emerald-600 border-emerald-600'
                : 'text-slate-600 border-transparent hover:text-slate-800'
                }`}
            >
              <span className="flex items-center gap-2">
                <Home size={16} />
                <span>Servis</span>
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

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto pb-6 min-h-0">
          {/* ==================== TAB 1: DASHBOARD ==================== */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Wave Header */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-650 to-indigo-800 px-5 md:px-8 lg:px-12 pt-5 pb-6 rounded-b-[24px] md:rounded-b-[40px] shadow-xl shrink-0 text-left text-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[8px] text-blue-100 bg-white/20 px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest">
                      Layanan Pelanggan
                    </span>
                    <h2 className="text-base font-extrabold text-white mt-1.5 truncate">Halo Kak, {activeUser.name}!</h2>
                    <p className="text-[10px] text-blue-105/85 truncate max-w-[200px] mt-0.5">{activeUser.email}</p>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold cursor-pointer transition"
                  >
                    Keluar
                  </button>
                </div>

                {/* Action booking widget */}
                <div className="bg-white/10 border border-white/10 rounded-xl p-4 flex justify-between items-center mt-2.5 text-white">
                  <div className="text-left">
                    <p className="text-[9px] text-blue-100 font-bold uppercase tracking-wider">Servis & Cuci AC Rutin</p>
                    <p className="text-lg font-black">{activeOrders.length} Pesanan Berjalan</p>
                  </div>
                  <button
                    onClick={() => setShowNewOrderModal(true)}
                    className="flex items-center gap-1 bg-white hover:bg-slate-100 text-indigo-700 font-extrabold px-3 py-1.8 rounded-xl shadow-md text-[10.5px] cursor-pointer transition"
                  >
                    <Plus size={12} />
                    Buat Pesanan Baru
                  </button>
                </div>
              </div>

              {/* Active Orders */}
              <div className="px-4 md:px-8 lg:px-12 py-6 space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Status Pesanan Aktif</h3>
                  <span className="flex items-center gap-1 text-[8px] text-emerald-600 font-black uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Dipantau 3 Role
                  </span>
                </div>

                {activeOrders.length === 0 ? (
                  <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-7 flex flex-col items-center justify-center text-center space-y-3 shadow-xs">
                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                      <Sparkles size={20} className="animate-spin" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs uppercase tracking-wide">Semua AC Dingin!</p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-normal max-w-xs">
                        Saat ini anda tidak memiliki jadwal servis yang berjalan. Cuci rutin berkala 3-4 bulan sekali direkomendasikan.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowNewOrderModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10.5px] font-extrabold rounded-xl hover:shadow-md cursor-pointer transition"
                    >
                      Pesan Layanan AC
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {activeOrders.map(order => {
                      const currentStepIdx = getStatusStepIndex(order.status);
                      const selectedPayMethod = orderPaymentMethods[order.id] || 'CASH';

                      return (
                        <div key={order.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 space-y-4 text-left flex flex-col">
                          {/* Header */}
                          <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                            <div>
                              <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase block tracking-wider">
                                {order.id}
                              </span>
                              <h4 className="font-bold text-xs text-slate-800 mt-1">
                                {order.acDetail?.quantity || 0} Unit x{' '}
                                {order.acDetail?.serviceType === 'none' ? order.acDetail?.category : order.acDetail?.serviceType}
                              </h4>
                              <p className="text-[9.5px] text-slate-400 font-semibold">{order.acDetail?.acType}</p>
                              <p className="text-[8px] text-blue-500 font-mono mt-1">
                                Status: {order.status} | Rating: {order.rating === null ? 'null' : order.rating === undefined ? 'undefined' : order.rating}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-black text-indigo-700 font-mono block">
                                {formatRupiah(order.totalCost || order.serviceCost || 0)}
                              </span>
                            </div>
                          </div>

                          {/* Schedule detail */}
                          <div className="grid grid-cols-2 gap-2 text-[10.5px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                            <div>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Tanggal & Jam</span>
                              <span className="font-semibold text-slate-700">
                                {order.scheduledDate} ({order.scheduledTime})
                              </span>
                            </div>
                            <div>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Telepon Kontak</span>
                              <span className="font-semibold text-slate-700 font-mono">{order.customerPhone}</span>
                            </div>
                            <div className="col-span-2 pt-1.5 border-t border-slate-200/50">
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Alamat Pengerjaan</span>
                              <span className="font-medium text-slate-700 truncate block">{order.address}</span>
                            </div>
                          </div>

                          {/* Customer Notes */}
                          {order.notes && (
                            <div className="border border-slate-100 p-2 rounded-lg text-[10.5px] leading-relaxed italic bg-blue-50/20 text-slate-600">
                              <strong>Keluhan awal:</strong> "{order.notes}"
                            </div>
                          )}

                          {/* Staff Assignment */}
                          {order.assignedEmployeeName ? (
                            <div className="flex items-center gap-2 bg-emerald-50/50 border border-emerald-100 px-3 py-2 rounded-xl text-left">
                              <div className="w-6.5 h-6.5 bg-emerald-600 text-white font-bold flex items-center justify-center rounded-lg text-xs shrink-0 overflow-hidden border">
                                {users?.find(u => u.id === order.assignedTo)?.photo ? (
                                  <img src={users.find(u => u.id === order.assignedTo)?.photo} alt="Teknisi" className="w-full h-full object-cover" />
                                ) : (
                                  order.assignedEmployeeName.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[8px] uppercase font-bold tracking-widest text-emerald-600 block">Teknisi Ditunjuk</span>
                                <p className="text-[11px] font-extrabold text-slate-800 truncate mt-0.5">{order.assignedEmployeeName}</p>
                              </div>
                              <span className="text-[9px] bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded text-emerald-700 font-bold shrink-0 uppercase tracking-wider">
                                Menuju Lokasi
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-2.5 rounded-xl text-[10.5px] font-medium text-amber-800">
                              <AlertCircle size={14} className="shrink-0" />
                              <span>Menunggu persetujuan admin & penunjukan teknisi (staff) lapangan.</span>
                            </div>
                          )}

                          {/* Photo Before */}
                          {order.photoBefore && (
                            <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 space-y-1.5 text-left">
                              <span className="text-[8px] font-black tracking-widest text-indigo-600 uppercase block">
                                Kondisi Awal (Foto Sebelum)
                              </span>
                              <div className="flex gap-2 items-center">
                                <img
                                  src={order.photoBefore}
                                  alt="Before AC"
                                  className="w-16 h-12 rounded object-cover border border-slate-300"
                                  referrerPolicy="no-referrer"
                                />
                                <p className="text-[10px] text-slate-500 italic">
                                  "Pengecekan selesai. Teknisi telah mengambil foto kondisi awal unit AC Anda."
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Photo After & Addons */}
                          {order.photoAfter && (
                            <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 space-y-2 text-left">
                              <span className="text-[8px] font-black tracking-widest text-emerald-600 uppercase block">
                                Pengerjaan Rampung (Foto Sesudah)
                              </span>
                              <div className="flex gap-2 items-center border-b border-slate-200/50 pb-2">
                                <img
                                  src={order.photoAfter}
                                  alt="After AC"
                                  className="w-16 h-12 rounded object-cover border border-slate-300"
                                  referrerPolicy="no-referrer"
                                />
                                <p className="text-[10px] text-slate-500 italic">
                                  "AC selesai dikerjakan & dirakit kembali. Blower telah dicuci bersih berkilau."
                                </p>
                              </div>

                              {/* Addons summary */}
                              {order.addonsUsed && order.addonsUsed.length > 0 ? (
                                <div className="space-y-1">
                                  <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest block">
                                    Alat & Perlengkapan Tambahan:
                                  </span>
                                  <div className="space-y-0.5">
                                    {order.addonsUsed.map((add, addIdx) => (
                                      <div key={addIdx} className="flex justify-between text-[10px] text-slate-600">
                                        <span>• {add.name} (x{add.quantity})</span>
                                        <span className="font-mono font-bold">{formatRupiah(add.price * add.quantity)}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex justify-between text-[10px] text-slate-800 font-extrabold border-t border-slate-200/60 pt-1">
                                    <span>Total Perlengkapan:</span>
                                    <span className="font-mono text-emerald-600">{formatRupiah(order.addonsCost || 0)}</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[9px] text-slate-400 font-medium italic block">Tanpa sparepart/komponen tambahan.</span>
                              )}
                            </div>
                          )}

                          {/* Payment Selection */}
                          {order.status === OrderStatus.PAYMENT && (
                            <div className="border border-indigo-200 bg-indigo-50/70 rounded-xl p-3 space-y-3 text-left">
                              <span className="text-[8.5px] font-black text-indigo-700 uppercase tracking-widest block">
                                PILIH METODE PEMBAYARAN
                              </span>

                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => handlePaymentMethodSelect(order.id, 'CASH')}
                                  className={`p-2.5 rounded-xl border font-bold text-[10px] uppercase tracking-wider transition cursor-pointer ${selectedPayMethod === 'CASH'
                                    ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-200'
                                    }`}
                                >
                                  💵 Bayar Tunai
                                </button>
                                <button
                                  onClick={() => handlePaymentMethodSelect(order.id, 'TRANSFER')}
                                  className={`p-2.5 rounded-xl border font-bold text-[10px] uppercase tracking-wider transition cursor-pointer ${selectedPayMethod === 'TRANSFER'
                                    ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'
                                    }`}
                                >
                                  🏦 Transfer Bank
                                </button>
                              </div>

                              {selectedPayMethod === 'CASH' && (
                                <div className="bg-white border border-emerald-100 p-3.5 rounded-lg text-[10px] text-slate-700 space-y-2">
                                  <p className="font-bold text-emerald-700">💵 Pembayaran Tunai</p>
                                  <p className="font-medium">Instruksi: Siapkan uang tunai sebesar <strong className="text-slate-900 font-extrabold">{formatRupiah(order.totalCost || 0)}</strong> untuk teknisi di lokasi dengan rincian berikut:</p>
                                  <div className="border-t border-slate-100 pt-2 space-y-1 text-slate-600 text-[10px]">
                                    <div className="flex justify-between">
                                      <span>Biaya Jasa Utama:</span>
                                      <span className="font-mono font-bold">{formatRupiah(order.serviceCost)}</span>
                                    </div>
                                    {order.addonsUsed && order.addonsUsed.length > 0 && (
                                      <div className="space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                                        <span className="text-[8.5px] text-slate-400 font-black uppercase tracking-wider block">Alat & Bahan Tambahan:</span>
                                        {order.addonsUsed.map((ad, idx) => (
                                          <div key={idx} className="flex justify-between text-[9.5px]">
                                            <span className="text-slate-500">• {ad.name} ({ad.quantity}x)</span>
                                            <span className="font-mono font-bold text-slate-700">{formatRupiah(ad.price * ad.quantity)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <div className="flex justify-between font-black text-slate-900 border-t border-slate-100 pt-2 mt-1.5">
                                      <span>Grand Total:</span>
                                      <span className="font-mono text-emerald-600 text-xs">{formatRupiah(order.totalCost || order.serviceCost)}</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {selectedPayMethod === 'TRANSFER' && (
                                <div className="bg-white border border-indigo-100 p-3.5 rounded-lg text-[11px] text-slate-700 space-y-3 text-left">
                                  <p className="font-bold text-indigo-700">🏦 Transfer Bank & E-Wallet (Xendit)</p>
                                  <p className="text-[10px] text-slate-500 leading-normal">
                                    Anda dapat membayar tagihan dengan mudah menggunakan Virtual Account (BCA, Mandiri, BRI, BNI), QRIS (GoPay, OVO, ShopeePay, DANA), atau Alfamart.
                                  </p>
                                  <div className="border-t border-slate-100 pt-2.5 space-y-1 text-slate-600 text-[10px]">
                                    <div className="flex justify-between">
                                      <span>Biaya Jasa Utama:</span>
                                      <span className="font-mono font-bold">{formatRupiah(order.serviceCost)}</span>
                                    </div>
                                    {order.addonsUsed && order.addonsUsed.length > 0 && (
                                      <div className="space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                                        <span className="text-[8.5px] text-slate-400 font-black uppercase tracking-wider block">Alat & Bahan Tambahan:</span>
                                        {order.addonsUsed.map((ad, idx) => (
                                          <div key={idx} className="flex justify-between text-[9.5px]">
                                            <span className="text-slate-500">• {ad.name} ({ad.quantity}x)</span>
                                            <span className="font-mono font-bold text-slate-700">{formatRupiah(ad.price * ad.quantity)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <div className="flex justify-between font-black text-slate-900 border-t border-slate-100 pt-2 mt-1.5">
                                      <span>Grand Total:</span>
                                      <span className="font-mono text-indigo-700 text-xs">{formatRupiah(order.totalCost || order.serviceCost)}</span>
                                    </div>
                                  </div>

                                  {order.paymentUrl ? (
                                    <div className="space-y-2 pt-1">
                                      <a
                                        href={order.paymentUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10.5px] py-2.5 rounded-xl uppercase text-center block transition shadow-md shadow-indigo-650/20 cursor-pointer animate-pulse"
                                      >
                                        💳 Bayar via Xendit
                                      </a>
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            setIsLoading(true);
                                            let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
                                            if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                                              apiUrl = apiUrl.replace(/localhost|127\.0\.0\.1/, window.location.hostname);
                                            }
                                            const response = await fetch(`${apiUrl}/orders/${order.id}/payment-status`, {
                                              headers: api.getAuthHeaders()
                                            });
                                            if (response.ok) {
                                              const updatedOrders = await api.fetchOrders();
                                              setOrders(updatedOrders);
                                              alert('🔄 Status pembayaran berhasil diverifikasi & diperbarui!');
                                            }
                                          } catch (err) {
                                            console.error(err);
                                            alert('❌ Gagal memeriksa status pembayaran');
                                          } finally {
                                            setIsLoading(false);
                                          }
                                        }}
                                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] py-2.5 rounded-xl uppercase transition cursor-pointer flex items-center justify-center gap-1.5"
                                      >
                                        🔄 Cek Status Pembayaran
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center gap-2 py-2 text-indigo-600 font-bold text-xs">
                                      <Loader size={14} className="animate-spin" />
                                      <span>Menyiapkan Invoice Xendit...</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* RATING FORM - Show when SELESAI & no rating yet */}
                          {order.status === OrderStatus.SELESAI && (!order.rating || order.rating === null) && (
                            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl space-y-3">
                              <div className="flex items-center gap-1 text-emerald-800 font-extrabold text-[10.5px]">
                                <Sparkles size={14} className="shrink-0 text-emerald-600 animate-pulse" />
                                <span className="uppercase tracking-wider">TAHAP SELESAI & PENILAIAN</span>
                              </div>

                              <p className="text-[10.5px] text-slate-650 leading-normal font-medium">
                                Pekerjaan Anda telah selesai dan pembayaran telah lunas! Silakan berikan penilaian untuk merampungkan pesanan.
                              </p>

                              <div className="bg-white border border-slate-200 p-3 rounded-xl space-y-2.5">
                                <span className="text-[9px] text-slate-500 font-black uppercase block tracking-wider text-center">Formulir Penilaian Hasil Kerja</span>
                                <div className="flex gap-1.5 justify-center py-1">
                                  {[1, 2, 3, 4, 5].map((st) => {
                                    const curScore = ratingInput[order.id]?.score || 0;
                                    return (
                                      <button
                                        key={st}
                                        type="button"
                                        onClick={() => setRatingInput(prev => ({
                                          ...prev,
                                          [order.id]: { score: st, review: prev[order.id]?.review || '' }
                                        }))}
                                        className="transform active:scale-130 transition focus:outline-none cursor-pointer"
                                      >
                                        <Star size={20} className={st <= curScore ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                                      </button>
                                    );
                                  })}
                                </div>
                                <input
                                  type="text"
                                  placeholder="Ketik ulasan/saran Anda..."
                                  value={ratingInput[order.id]?.review || ''}
                                  onChange={(e) => setRatingInput(prev => ({
                                    ...prev,
                                    [order.id]: { score: prev[order.id]?.score || 0, review: e.target.value }
                                  }))}
                                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg outline-none focus:border-indigo-500 text-slate-800"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRateOrder(order.id)}
                                  disabled={isLoading}
                                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-extrabold text-[10px] uppercase py-2 rounded-xl transition tracking-wider cursor-pointer"
                                >
                                  {isLoading ? '⏳ Menyimpan...' : '✓ Kirim Penilaian & Selesaikan'}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Status Stepper */}
                          <div className="pt-3 border-t border-slate-100">
                            <div className="space-y-2">
                              <div className="flex gap-1 h-1.5 rounded-full overflow-hidden bg-slate-200">
                                {steps.map((_, idx) => (
                                  <div
                                    key={idx}
                                    className={`flex-1 transition ${idx <= currentStepIdx ? 'bg-indigo-600' : 'bg-slate-300'
                                      }`}
                                  />
                                ))}
                              </div>
                              <div className="grid grid-cols-6 gap-1 text-[8px] text-center">
                                {steps.map((step, idx) => (
                                  <div
                                    key={idx}
                                    className={`${idx <= currentStepIdx ? 'text-indigo-700 font-bold' : 'text-slate-400'
                                      }`}
                                  >
                                    <div className="font-black">{step.label}</div>
                                    <div className="text-[7px]">{step.desc}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== TAB 2: HISTORY ==================== */}
          {activeTab === 'history' && (
            <div>
              <div className="bg-slate-900 px-5 md:px-8 lg:px-12 pt-5 pb-6 text-white text-left rounded-b-[24px] md:rounded-b-[40px] shrink-0">
                <span className="text-[8px] text-blue-300 bg-white/5 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">
                  Arsip
                </span>
                <h2 className="text-base font-black mt-2">Histori Pekerjaan Selesai</h2>
                <div className="grid grid-cols-2 gap-3 mt-3.5 pt-3.5 border-t border-slate-800">
                  <div>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Total Pesanan</span>
                    <span className="text-sm font-black text-blue-400 mt-0.5 block">{completedOrders.length}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Total Pengeluaran</span>
                    <span className="text-sm font-black text-emerald-400 mt-0.5 block">
                      {formatRupiah(
                        completedOrders.reduce((sum, o) => sum + (Number(o.totalCost) || Number(o.serviceCost) || 0), 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-4 md:px-8 lg:px-12 py-6 space-y-4">
                {completedOrders.length === 0 ? (
                  <div className="bg-white border rounded-2xl p-8 text-center space-y-3">
                    <span className="text-xl">📊</span>
                    <p className="font-extrabold text-xs uppercase">Belum Ada Histori</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {completedOrders.map(order => (
                      <div key={order.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                        <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                          <div>
                            <span className="text-[9px] font-mono text-slate-400 font-bold block">{order.id}</span>
                            <h4 className="font-bold text-xs text-slate-800 mt-1">{order.customerName}</h4>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-emerald-600 font-mono block">
                              {formatRupiah(order.totalCost || order.serviceCost || 0)}
                            </span>
                            <span className="text-[8px] bg-emerald-50 text-emerald-600 font-black uppercase px-1.5 block mt-0.5">
                              CLOSED
                            </span>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-500 font-medium space-y-0.5">
                          <div>
                            🔧 Jasa: {order.acDetail?.quantity} Unit x{' '}
                            {order.acDetail?.serviceType === 'none' ? order.acDetail?.category : order.acDetail?.serviceType}
                          </div>
                          <div>📅 Selesai: {order.scheduledDate}</div>
                          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                            <span>💳 Pembayaran:</span>
                            {order.paymentMethod === 'TRANSFER' ? (
                              <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 text-[8.5px] px-1.5 py-0.5 rounded font-black uppercase">
                                TRANSFER (XENDIT)
                              </span>
                            ) : order.paymentMethod === 'CASH' ? (
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
                          {order.completionNotes && <div className="italic text-slate-600 mt-1">"{order.completionNotes}"</div>}
                        </div>

                        {!order.rating || order.rating === null ? (
                          <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-center text-[10px] text-amber-700 font-medium">
                            ⏳ Menunggu rating dari Anda di dashboard...
                          </div>
                        ) : (
                          <div className="bg-amber-500/10 border border-amber-500/25 p-2.5 rounded-lg flex items-center justify-between">
                            <div>
                              <span className="text-[8px] text-amber-700 font-black uppercase block">Rating</span>
                              {order.ratingNotes && (
                                <p className="italic text-[10px] text-amber-900 font-bold mt-1">"{order.ratingNotes}"</p>
                              )}
                            </div>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(st => (
                                <Star
                                  key={st}
                                  size={11}
                                  className={
                                    st <= (order.rating || 0) ? 'fill-amber-500 text-amber-500' : 'text-slate-200'
                                  }
                                />
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
                <span className="text-[8px] text-teal-200 bg-white/10 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">
                  Informasi Pengguna
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

              <div className="px-4 md:px-8 lg:px-12 py-6 space-y-4 max-w-2xl mx-auto">
                <div className="flex justify-between items-center px-1">
                  <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                    {profileViewMode === 'readonly' ? 'Informasi Akun' :
                      profileViewMode === 'edit-profile' ? 'Perbarui Profil' : 'Ubah Password'}
                  </h3>
                  <button
                    onClick={() => logout()}
                    className="bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg cursor-pointer hover:bg-rose-100 transition"
                  >
                    Keluar
                  </button>
                </div>

                {saveSuccess && (
                  <div className="bg-emerald-100 border border-emerald-250 p-2.5 rounded-xl text-[11px] text-emerald-800 font-bold">
                    ✅ {profileViewMode === 'edit-password' ? 'Password' : 'Profil'} berhasil diperbarui!
                  </div>
                )}

                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl text-[11px] text-red-700 font-semibold">
                    ❌ {errorMsg}
                  </div>
                )}

                {profileViewMode === 'readonly' && (
                  <div className="bg-white border p-5 rounded-2xl shadow-xs space-y-5">
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
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Alamat Default</p>
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
                        className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[10px] py-2.5 rounded-xl uppercase transition cursor-pointer"
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
                    <div>
                      <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Nama Lengkap</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 disabled:opacity-50 transition"
                        disabled={isLoading}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">No. Handphone</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={e => setEditPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 disabled:opacity-50 transition"
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Alamat Rumah Default</label>
                      <div className="flex gap-2">
                        <textarea
                          value={editAddress}
                          onChange={e => setEditAddress(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none focus:border-indigo-500 h-16 resize-none disabled:opacity-50 transition"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowProfileMapPicker(true)}
                          className="bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-xl px-3 flex flex-col items-center justify-center gap-1 hover:bg-indigo-100 transition cursor-pointer"
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
                        className="w-full bg-slate-900 disabled:bg-slate-400 text-white font-extrabold text-[10px] py-3 rounded-xl uppercase cursor-pointer flex items-center justify-center gap-2 transition shadow-md"
                      >
                        {isLoading && <Loader size={12} className="animate-spin" />}
                        {isLoading ? 'Menyimpan...' : 'Simpan Profil'}
                      </button>
                    </div>
                  </form>
                )}

                {profileViewMode === 'edit-password' && (
                  <form onSubmit={handleUpdatePassword} className="bg-white border p-5 rounded-2xl shadow-xs space-y-4">
                    <div>
                      <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Password Lama</label>
                      <input
                        type="password"
                        value={editOldPassword}
                        onChange={e => setEditOldPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 disabled:opacity-50 transition"
                        disabled={isLoading}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Password Baru</label>
                      <input
                        type="password"
                        value={editNewPassword}
                        onChange={e => setEditNewPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 disabled:opacity-50 transition"
                        disabled={isLoading}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Konfirmasi Password Baru</label>
                      <input
                        type="password"
                        value={editConfirmPassword}
                        onChange={e => setEditConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 disabled:opacity-50 transition"
                        disabled={isLoading}
                        required
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

        {/* NEW ORDER MODAL */}
        {showNewOrderModal && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex flex-col justify-end z-45 animate-fade-in pt-10">
            <div className="bg-white rounded-t-[24px] flex flex-col max-h-[calc(100%-2.5rem)] overflow-hidden shadow-2xl animate-slide-up">
              {/* Modal Header */}
              <div className="px-5 py-4 border-b flex justify-between items-center bg-slate-900 text-white shrink-0">
                <div>
                  <span className="text-[8px] bg-indigo-600 px-1.5 py-0.5 rounded font-black uppercase">Pesanan Baru</span>
                  <h4 className="text-sm font-extrabold text-white mt-1">Buat Pesanan Servis AC</h4>
                </div>
                <button
                  onClick={() => setShowNewOrderModal(false)}
                  className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 overflow-y-auto space-y-4 pb-12 bg-slate-50">
                <form onSubmit={handlePreSubmitOrder} className="space-y-4">
                  {/* Model Selection */}
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                      1. Tipe AC / Model
                    </label>
                    <select
                      value={selectedModel}
                      onChange={e => setSelectedModel(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none"
                    >
                      {models.map(m => (
                        <option key={m.id} value={m.name}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                      2. Kategori Layanan
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={e => handleCategoryChange(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Service Selection */}
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                      3. Jenis Layanan
                    </label>
                    <select
                      value={selectedService}
                      onChange={e => setSelectedService(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none"
                    >
                      {services
                        .filter(s => s.categoryId === selectedCategory)
                        .map(s => (
                          <option key={s.id} value={s.name}>
                            {s.name} ({formatRupiah(s.price)})
                          </option>
                        ))}
                      {services.filter(s => s.categoryId === selectedCategory).length === 0 && (
                        <option value="none">Inspeksi & Konsultasi (Rp50.000)</option>
                      )}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                      4. Jumlah Unit
                    </label>
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 h-10">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="text-slate-500 hover:text-slate-800 font-extrabold text-[14px] px-1.5 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono font-black w-6 text-center">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="text-slate-500 hover:text-slate-800 font-extrabold text-[14px] px-1.5 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                      5. No. Handphone Kontak
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none"
                      placeholder="+62812345678"
                      required
                    />
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                        6. Tanggal Kunjungan
                      </label>
                      <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                        7. Jam Kunjungan
                      </label>
                      <select
                        value={time}
                        onChange={e => setTime(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none"
                      >
                        <option value="09:00">09:00 - Pagi</option>
                        <option value="11:00">11:00 - Siang</option>
                        <option value="13:00">13:00 - Siang</option>
                        <option value="15:00">15:00 - Sore</option>
                        <option value="17:00">17:00 - Sore</option>
                      </select>
                    </div>
                  </div>

                  {/* GPS Detection */}
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                      8. Lokasi (Peta Interaktif)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(true)}
                      className="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border border-indigo-200 font-bold text-[10.5px] py-2 rounded-xl uppercase flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm"
                    >
                      <MapPin size={13} />
                      Pilih dari Peta Pintar
                    </button>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                      9. Alamat Lengkap Kunjungan
                    </label>
                    <textarea
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none h-16 resize-none"
                      placeholder="Jl. Kemang Raya No. 123, Jakarta Selatan"
                      required
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                      10. Keluhan / Catatan Awal (Opsional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none h-12 resize-none"
                      placeholder="Contoh: AC tidak bisa dingin, angin keluar berkurang..."
                    />
                  </div>

                  {/* Billing Estimate */}
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200 p-3.5 rounded-xl space-y-2">
                    <span className="text-[8px] font-black text-indigo-700 uppercase tracking-widest block">Estimasi Biaya Jasa</span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] text-slate-600">
                        {quantity} Unit x {formatRupiah(currentServicePrice)}
                      </span>
                      <span className="text-lg font-black text-indigo-700 font-mono">{formatRupiah(estimatedCost)}</span>
                    </div>
                    <p className="text-[8.5px] text-slate-500 italic">*Tidak termasuk sparepart/komponen tambahan yang mungkin dibutuhkan</p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white font-black text-xs py-3.5 rounded-xl uppercase tracking-widest cursor-pointer shadow-md transition"
                  >
                    Buat Pesanan Servis
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 1. CONFIRM ORDER MODAL */}
        {showConfirmOrderModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-[28px] shadow-2xl p-6 max-w-md w-full text-left flex flex-col space-y-4 animate-scale-in">
              <div>
                <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">Konfirmasi Pesanan</span>
                <h4 className="text-base font-extrabold text-slate-800 mt-1">Periksa Kembali Pesanan Anda</h4>
              </div>

              <div className="bg-slate-50 border rounded-2xl p-4 space-y-2.5 text-xs text-slate-650">
                <div className="flex justify-between">
                  <span>Model AC:</span>
                  <strong className="text-slate-800">{selectedModel}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Kategori Jasa:</span>
                  <strong className="text-slate-800">
                    {categories.find(c => c.id === selectedCategory)?.name || 'Inspeksi & Konsultasi'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Jenis Layanan:</span>
                  <strong className="text-indigo-700">{selectedService === 'none' ? 'Inspeksi & Konsultasi' : selectedService}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Jumlah Unit:</span>
                  <strong className="text-slate-800 font-mono">{quantity} Unit</strong>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-2">
                  <span>Tanggal Kunjungan:</span>
                  <strong className="text-slate-800">{date} ({time})</strong>
                </div>
                <div className="flex justify-between">
                  <span>No. HP Kontak:</span>
                  <strong className="text-slate-800 font-mono">{phone}</strong>
                </div>
                <div className="border-t border-slate-200/60 pt-2">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Alamat Kunjungan:</span>
                  <span className="block text-slate-800 font-medium leading-relaxed">{address}</span>
                </div>
                {notes.trim() && (
                  <div className="border-t border-slate-200/60 pt-2">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Catatan/Keluhan:</span>
                    <span className="block text-slate-700 italic">"{notes}"</span>
                  </div>
                )}
              </div>

              {/* Total Cost */}
              <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest block">Total Pembayaran</span>
                  <span className="text-xs text-slate-500">{quantity} Unit x {formatRupiah(currentServicePrice)}</span>
                </div>
                <span className="text-lg font-black text-indigo-700 font-mono">{formatRupiah(estimatedCost)}</span>
              </div>

              {confirmErrorMsg && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-xl text-center font-semibold">
                  {confirmErrorMsg}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmOrderModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition cursor-pointer"
                  disabled={isLoading}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmitOrder}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 active:scale-[0.98] text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-600/10 transition cursor-pointer flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader size={14} className="animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Pesan Sekarang</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. SUCCESS ORDER MODAL */}
        {orderSuccessId && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-[28px] shadow-2xl p-6 max-w-sm w-full text-center flex flex-col items-center animate-scale-in">
              {/* Green success icon wrapper */}
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 shadow-inner">
                <CheckCircle size={36} className="text-emerald-500" />
              </div>

              <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wider mb-2">Pesanan Sukses</h3>
              <p className="text-xs text-slate-650 font-semibold leading-relaxed mb-4">
                Pesanan servis AC Anda berhasil dibuat dan telah terdaftar di sistem.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 mb-6 w-full flex flex-col items-center">
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">ID PESANAN</span>
                <span className="text-xs font-mono font-bold text-slate-800 mt-0.5 select-all">{orderSuccessId}</span>
              </div>

              <button
                type="button"
                onClick={() => setOrderSuccessId(null)}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-[0.98] text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-lg transition duration-200 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
        {/* MAP PICKER MODALS */}
        {showMapPicker && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex flex-col justify-end animate-fade-in">
            <div className="bg-white rounded-t-3xl flex flex-col h-[85vh] overflow-hidden shadow-2xl animate-slide-up">
              <div className="px-5 py-4 flex justify-between items-center bg-slate-900 text-white shrink-0">
                <h4 className="text-sm font-extrabold text-white">Pilih Lokasi</h4>
                <button
                  onClick={() => setShowMapPicker(false)}
                  className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="flex-1 min-h-0 bg-slate-50 relative">
                <MapPicker
                  onLocationSelect={(addr, l, r) => {
                    setAddress(addr);
                    setLat(l);
                    setLng(r);
                    setShowMapPicker(false);
                  }}
                  onCancel={() => setShowMapPicker(false)}
                />
              </div>
            </div>
          </div>
        )}

        {showProfileMapPicker && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex flex-col justify-end animate-fade-in">
            <div className="bg-white rounded-t-3xl flex flex-col h-[85vh] overflow-hidden shadow-2xl animate-slide-up">
              <div className="px-5 py-4 flex justify-between items-center bg-slate-900 text-white shrink-0">
                <h4 className="text-sm font-extrabold text-white">Pilih Alamat Rumah Default</h4>
                <button
                  onClick={() => setShowProfileMapPicker(false)}
                  className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="flex-1 min-h-0 bg-slate-50 relative">
                <MapPicker
                  onLocationSelect={(addr, l, r) => {
                    setEditAddress(addr);
                    setEditLat(l);
                    setEditLng(r);
                    setShowProfileMapPicker(false);
                  }}
                  onCancel={() => setShowProfileMapPicker(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
