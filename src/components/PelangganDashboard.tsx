/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Order, OrderStatus, ACModel, ACCategory, ACService, ACAddon } from '../types';
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
  AlertCircle
} from 'lucide-react';

interface PelangganDashboardProps {
  user: User;
  orders: Order[];
  models: ACModel[];
  categories: ACCategory[];
  services: ACService[];
  addons: ACAddon[];
  onLogout: () => void;
  onAddNewOrder: (orderData: {
    acType: string;
    category: string;
    serviceType: string;
    quantity: number;
    scheduledDate: string;
    scheduledTime: string;
    address: string;
    customerPhone: string;
    notes?: string;
    latitude?: number;
    longitude?: number;
  }) => void;
  onRateOrder: (orderId: string, rating: number, ratingNotes?: string) => void;
  onUpdateUserData: (userId: string, updatedData: Partial<User>) => void;
  onUpdateOrderStatus?: (orderId: string, newStatus: OrderStatus, payload?: Partial<Order>) => void;
}

export default function PelangganDashboard({ 
  user, 
  orders, 
  models, 
  categories, 
  services, 
  addons, 
  onLogout, 
  onAddNewOrder, 
  onRateOrder, 
  onUpdateUserData,
  onUpdateOrderStatus
}: PelangganDashboardProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'profile'>('dashboard');

  // Booking Form State
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState(user.address || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  
  // Simulated Location details
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Rating input state
  const [ratingInput, setRatingInput] = useState<{ [orderId: string]: { score: number; review: string } }>({});

  // Payment Selection State
  const [orderPaymentMethods, setOrderPaymentMethods] = useState<{ [orderId: string]: 'CASH' | 'TRANSFER' }>({});

  // Profile Form States
  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const [editAddress, setEditAddress] = useState(user.address || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize dropdowns with first items on first view or on props change
  useEffect(() => {
    if (models.length > 0) setSelectedModel(models[0].name);
    if (categories.length > 0) {
      setSelectedCategory(categories[0].id);
      // Filter services
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
    setEditName(user.name);
    setEditPhone(user.phone || '');
    setEditAddress(user.address || '');
    setAddress(user.address || '');
    setPhone(user.phone || '');
  }, [user]);

  // Handle Category Switch on form
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const filtered = services.filter(s => s.categoryId === categoryId);
    if (filtered.length > 0) {
      setSelectedService(filtered[0].name);
    } else {
      setSelectedService('none');
    }
  };

  // Filter orders
  const myOrders = orders.filter(o => o.customerId === user.id);
  const activeOrders = myOrders.filter(o => o.status !== OrderStatus.SELESAI || o.rating === undefined);
  const completedOrders = myOrders.filter(o => o.status === OrderStatus.SELESAI && o.rating !== undefined);

  // Simulated GPS Location Detection
  const handleGPSDetection = () => {
    setIsDetectingLocation(true);
    setTimeout(() => {
      // Mock latitude/longitude around Jakarta Selatan
      const randLat = -6.273 + (Math.random() - 0.5) * 0.05;
      const randLng = 106.812 + (Math.random() - 0.5) * 0.05;
      setLat(parseFloat(randLat.toFixed(5)));
      setLng(parseFloat(randLng.toFixed(5)));
      
      const cleanAddress = user.address 
        ? `${user.address} (GPS: ${randLat.toFixed(4)}, ${randLng.toFixed(4)})` 
        : `Jl. Kemang Raya No. ${Math.floor(Math.random() * 80) + 1}, Jakarta Selatan (GPS: ${randLat.toFixed(4)}, ${randLng.toFixed(4)})`;
      
      setAddress(cleanAddress);
      setIsDetectingLocation(false);
    }, 1200);
  };

  // Calculate pricing
  const getSelectedServicePrice = () => {
    if (selectedService === 'none' || !selectedService) {
      return 50000; // Flat-rate checkup fee if category doesn't have custom services
    }
    const match = services.find(s => s.name === selectedService);
    return match ? match.price : 75000;
  };

  const currentServicePrice = getSelectedServicePrice();
  const estimatedCost = currentServicePrice * quantity;

  // Submit new booking
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || !phone.trim() || !date) {
      alert('Mohon lengkapi alamat, nomor telepon, dan tanggal pengerjaan.');
      return;
    }

    const catObj = categories.find(c => c.id === selectedCategory);
    const categoryName = catObj ? catObj.name : 'Inspeksi & Konsultasi';

    onAddNewOrder({
      acType: selectedModel,
      category: categoryName,
      serviceType: selectedService,
      quantity,
      scheduledDate: date,
      scheduledTime: time,
      address: address.trim(),
      customerPhone: phone.trim(),
      notes: notes.trim(),
      latitude: lat,
      longitude: lng,
    });

    // Reset Form & Close
    setNotes('');
    setLat(undefined);
    setLng(undefined);
    setShowNewOrderModal(false);
  };

  // Save profile changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert('Nama tidak boleh kosong');
      return;
    }
    onUpdateUserData(user.id, {
      name: editName.trim(),
      phone: editPhone.trim(),
      address: editAddress.trim(),
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const formatRupiah = (num: number) => {
    return 'Rp' + num.toLocaleString('id-ID');
  };

  // Stepper Tracker Info (6 Statuses)
  const getStatusStepIndex = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.MENUNGGU: return 0;
      case OrderStatus.DITUGASKAN: return 1;
      case OrderStatus.CEK_LAYANAN: return 2;
      case OrderStatus.PENGERJAAN: return 3;
      case OrderStatus.PAYMENT: return 4;
      case OrderStatus.SELESAI: return 5;
      default: return 0;
    }
  };

  const steps = [
    { label: 'Menunggu', desc: 'Mencari Teknisi' },
    { label: 'Ditugaskan', desc: 'Teknisi Ditunjuk' },
    { label: 'Cek Layanan', desc: 'Foto Sebelum' },
    { label: 'Pengerjaan', desc: 'Pemasangan & Foto Setelah' },
    { label: 'Payment', desc: 'Bayar Tagihan' },
    { label: 'Selesai', desc: 'Nilai Teknisi' }
  ];

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative min-h-0 h-full">
      
      {/* 1. SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto pb-24 min-h-0">
        
        {/* ==================== TAB 1: DASHBOARD ==================== */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Top Wave Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-650 to-indigo-800 px-5 pt-5 pb-6 rounded-b-[24px] shadow-lg shadow-indigo-505/10 shrink-0 text-left text-white">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-[8px] text-blue-100 bg-white/20 px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest leading-none">
                    Layanan Pelanggan
                  </span>
                  <h2 className="text-base font-extrabold text-white mt-1.5 truncate">Halo Kak, {user.name}!</h2>
                  <p className="text-[10px] text-blue-105/85 truncate max-w-[200px] mt-0.5">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition text-[10px] font-bold cursor-pointer"
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
                  type="button"
                  onClick={() => setShowNewOrderModal(true)}
                  className="flex items-center gap-1 bg-white hover:bg-slate-100 text-indigo-700 font-extrabold px-3 py-1.8 rounded-xl shadow-md text-[10.5px] transition cursor-pointer"
                >
                  <Plus size={12} />
                  Buat Pesanan Baru
                </button>
              </div>
            </div>

            {/* List Active Orders with Interactive Progress Screen */}
            <div className="px-4 py-4 space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Status Pesanan Aktif</h3>
                <span className="flex items-center gap-1 text-[8px] text-emerald-600 font-black uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Dipantau 3 Role
                </span>
              </div>

              {activeOrders.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-7 flex flex-col items-center justify-center text-center space-y-3 shadow-xs">
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
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10.5px] font-extrabold rounded-xl hover:shadow-md transition"
                  >
                    Pesan Layanan AC
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeOrders.map(order => {
                    const currentStepIdx = getStatusStepIndex(order.status);
                    const selectedPayMethod = orderPaymentMethods[order.id] || 'CASH';

                    return (
                      <div key={order.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4 text-left">
                        
                        {/* Header card state */}
                        <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                          <div>
                            <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-55 block bg-blue-50 px-1.5 py-0.5 rounded uppercase w-max tracking-wider">{order.id}</span>
                            <h4 className="font-bold text-xs text-slate-800 mt-1">
                              {order.acDetail.quantity} Unit x {order.acDetail.serviceType === 'none' ? order.acDetail.category : order.acDetail.serviceType}
                            </h4>
                            <p className="text-[9.5px] text-slate-400 font-semibold">{order.acDetail.acType}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-rose-605 text-indigo-700 font-mono block">
                              {formatRupiah(order.totalCost || order.serviceCost)}
                            </span>
                          </div>
                        </div>

                        {/* Schedule detail */}
                        <div className="grid grid-cols-2 gap-2 text-[10.5px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Tanggal & Jam</span>
                            <span className="font-semibold text-slate-700">{order.scheduledDate} ({order.scheduledTime})</span>
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

                        {/* ================ PERSETUJUAN PERUBAHAN JADWAL ================ */}
                        {order.rescheduleStatus === 'PENDING' && order.rescheduleDate && order.rescheduleTime && (
                          <div className="border border-indigo-200 bg-indigo-50/70 rounded-xl p-3 text-left space-y-2.5 animate-in fade-in duration-200">
                            <div className="flex items-start gap-1.5 text-indigo-800 text-[11px] font-bold">
                              <AlertCircle size={15} className="shrink-0 text-indigo-600 mt-0.5 animate-bounce" />
                              <div>
                                <span className="text-[9px] uppercase font-black tracking-wider text-indigo-600 block mb-0.5">PERUBAHAN JADWAL BUTUH ACC ANDA</span>
                                Admin mengajukan perubahan waktu kedatangan karena ketersediaan jadwal teknisi.
                              </div>
                            </div>
                            <div className="text-[10px] bg-white border border-indigo-100 p-2.5 rounded-xl font-medium space-y-1.5 text-slate-700">
                              <div>📅 Jadwal Baru: <strong className="text-indigo-700 text-xs">{order.rescheduleDate}</strong> pukul <strong className="font-mono text-indigo-700 text-xs">{order.rescheduleTime}</strong></div>
                              <div className="text-[9.5px] text-slate-400 line-through">📅 Jadwal Sebelumnya: {order.scheduledDate} pukul {order.scheduledTime}</div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateOrderStatus(order.id, order.status, {
                                    scheduledDate: order.rescheduleDate,
                                    scheduledTime: order.rescheduleTime,
                                    rescheduleStatus: 'ACCEPTED'
                                  });
                                  alert('Terima kasih! Perubahan jadwal telah Anda setujui.');
                                }}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10.5px] py-2 rounded-xl transition cursor-pointer shadow-sm hover:shadow"
                              >
                                Setujui Jadwal Baru
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateOrderStatus(order.id, order.status, {
                                    rescheduleStatus: 'REJECTED'
                                  });
                                  alert('Perubahan jadwal ditolak. Admin kami akan menghubungi Anda kembali untuk menyepakati jadwal alternatif.');
                                }}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[10.5px] px-3 py-2 rounded-xl transition cursor-pointer"
                              >
                                Tolak
                              </button>
                            </div>
                          </div>
                        )}

                        {order.rescheduleStatus === 'REJECTED' && (
                          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[10.5px] p-2.5 rounded-xl text-left font-medium space-y-0.5">
                            <p className="font-bold">❌ Anda telah menolak jadwal baru yang diajukan ({order.rescheduleDate} pukul {order.rescheduleTime}).</p>
                            <p className="text-[9.5px] text-slate-500">Admin/CS kami akan segera menghubungi Anda kembali untuk koordinasi waktu kunjungan.</p>
                          </div>
                        )}

                        {order.rescheduleStatus === 'ACCEPTED' && (
                          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] p-2.5 rounded-xl text-left font-medium flex items-center gap-1.5">
                            <span>✅ Perubahan jadwal berhasil disepakati pada: <strong>{order.scheduledDate} ({order.scheduledTime})</strong>.</span>
                          </div>
                        )}

                        {/* Staff Assignment */}
                        {order.assignedEmployeeName ? (
                          <div className="flex items-center gap-2 bg-emerald-50/50 border border-emerald-100 px-3 py-2 rounded-xl text-left">
                            <div className="w-6.5 h-6.5 bg-emerald-600 text-white font-bold flex items-center justify-center rounded-lg text-xs leading-none shrink-0">
                              {order.assignedEmployeeName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[8px] uppercase font-bold tracking-widest text-emerald-600 block leading-none">Teknisi Ditunjuk</span>
                              <p className="text-[11px] font-extrabold text-slate-800 truncate mt-0.5 leading-none">{order.assignedEmployeeName}</p>
                            </div>
                            <span className="text-[9px] bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded text-emerald-700 font-bold leading-none shrink-0 uppercase tracking-wider">
                              Menuju Lokasi
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-2.5 rounded-xl text-[10.5px] font-medium text-amber-800">
                            <AlertCircle size={14} className="shrink-0 text-amber-600" />
                            <span>Menunggu persetujuan admin & penunjukan teknisi (staff) lapangan.</span>
                          </div>
                        )}

                        {/* ================ FOTO SEBELUM (CEK LAYANAN) ================ */}
                        {order.photoBefore && (
                          <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 space-y-1.5 text-left">
                            <span className="text-[8px] font-black tracking-widest text-indigo-600 uppercase block">Kondisi Awal (Foto Sebelum)</span>
                            <div className="flex gap-2 items-center">
                              <img 
                                src={order.photoBefore} 
                                alt="Before AC" 
                                className="w-16 h-12 rounded object-cover border border-slate-300"
                                referrerPolicy="no-referrer"
                              />
                              <p className="text-[10px] text-slate-500 italic">"Pengecekan selesai. Teknisi telah mengambil foto kondisi awal unit AC Anda."</p>
                            </div>
                          </div>
                        )}

                        {/* ================ FOTO SESUDAH & SPAREPARTS (PENGERJAAN) ================ */}
                        {order.photoAfter && (
                          <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 space-y-2 text-left">
                            <span className="text-[8px] font-black tracking-widest text-emerald-600 uppercase block">Pengerjaan Rampung (Foto Sesudah)</span>
                            <div className="flex gap-2 items-center border-b border-slate-200/50 pb-2">
                              <img 
                                src={order.photoAfter} 
                                alt="After AC" 
                                className="w-16 h-12 rounded object-cover border border-slate-300"
                                referrerPolicy="no-referrer"
                              />
                              <p className="text-[10px] text-slate-500 italic">"AC selesai dikerjakan & dirakit kembali. Blower telah dicuci bersih berkilau."</p>
                            </div>

                            {/* Addons summary detail */}
                            {order.addonsUsed && order.addonsUsed.length > 0 ? (
                              <div className="space-y-1">
                                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest block">Alat & Perlengkapan Tambahan:</span>
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

                        {/* ================ PAYMENT PANEL INTERACTION ================ */}
                        {order.status === OrderStatus.PAYMENT && (
                          <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-xl space-y-3">
                            <div className="flex items-center gap-1 text-indigo-700 font-extrabold text-[10.5px]">
                              <CreditCard size={14} className="shrink-0" />
                              <span className="uppercase tracking-wider">INSTREKSI PEMBAYARAN JASA</span>
                            </div>

                            {/* Switch CASH vs TRANSFER */}
                            <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-lg border border-indigo-150 border-indigo-250 border-indigo-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setOrderPaymentMethods(prev => ({ ...prev, [order.id]: 'CASH' }));
                                  if (onUpdateOrderStatus) {
                                    onUpdateOrderStatus(order.id, OrderStatus.PAYMENT, { paymentMethod: 'CASH', paymentStatus: 'WAITING_APPROVAL' });
                                  }
                                }}
                                className={`py-1.5 text-[10.5px] font-black rounded-md transition ${
                                  selectedPayMethod === 'CASH' 
                                    ? 'bg-indigo-600 text-white shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                Bayar Tunai (Cash)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOrderPaymentMethods(prev => ({ ...prev, [order.id]: 'TRANSFER' }));
                                  if (onUpdateOrderStatus) {
                                    onUpdateOrderStatus(order.id, OrderStatus.PAYMENT, { 
                                      paymentMethod: 'TRANSFER', 
                                      paymentStatus: 'PAID', // Auto-cleared for ease under demo transfer norek
                                      bankName: 'Mandiri Xendit VA',
                                      bankAccountNo: '8055-2777-1111',
                                      bankAccountHolder: 'CoolAir Pro' 
                                    });
                                  }
                                }}
                                className={`py-1.5 text-[10.5px] font-black rounded-md transition ${
                                  selectedPayMethod === 'TRANSFER' 
                                    ? 'bg-indigo-600 text-white shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                Bank Transfer (Xendit)
                              </button>
                            </div>

                            {/* Detail info according to choice */}
                            {selectedPayMethod === 'TRANSFER' ? (
                              <div className="bg-white p-3 rounded-xl border border-indigo-100 space-y-2 text-[10.5px] text-slate-700 text-left">
                                <p className="font-bold text-slate-850">Metode: Virtual Account Bank (Gateway Xendit)</p>
                                <div className="space-y-1 font-mono text-[10px] bg-indigo-50/50 p-2 rounded-lg border border-indigo-100/40">
                                  <div>Bank: <strong>Bank Mandiri (Xendit)</strong></div>
                                  <div>No. Rekening: <strong className="text-blue-600 tracking-wider">8055-2777-1111</strong></div>
                                  <div>Atas Nama: <strong className="text-slate-800">CoolAir Co Ltd</strong></div>
                                  <div>Total Tagihan: <strong className="text-indigo-700">{formatRupiah(order.totalCost || order.serviceCost)}</strong></div>
                                </div>
                                <p className="text-[9px] text-slate-450 text-slate-400 leading-normal italic">
                                  "Silakan salin nomor VA Mandiri di atas. Pembayaran Virtual Account terverifikasi instan berstatus paid."
                                </p>
                              </div>
                            ) : (
                              <div className="bg-white p-3 rounded-xl border border-indigo-100 space-y-1.5 text-[10.5px] text-slate-700 text-left">
                                <p className="font-bold text-slate-800">Metode: Pembayaran Tunai Langust ke Teknisi</p>
                                <p className="leading-relaxed text-slate-600 font-medium">Serahkan uang tunai senilai <strong className="text-indigo-700 font-mono">{formatRupiah(order.totalCost || order.serviceCost)}</strong> kepada teknisi lapangan.</p>
                                <div className="bg-amber-50 text-amber-800 text-[9px] p-2 rounded-lg leading-relaxed border border-amber-100 font-semibold">
                                  ⚠️ Setelah uang diselesaikan, teknisi harus mengetuk "Konfirmasi Pembayaran Lunas" di HP-nya untuk menyetujui kuintansi cash Anda.
                                </div>
                              </div>
                            )}

                            {/* Verify and progress button */}
                            <div className="pt-1">
                              {order.paymentStatus === 'PAID' ? (
                                <div className="space-y-2.5">
                                  <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 p-2 rounded-lg text-[10px] font-black justify-center border border-emerald-200">
                                    <CheckCircle size={13} className="text-emerald-600" />
                                    <span>PEMBAYARAN TERVERIFIKASI LUNAS! Tagihan Selesai Terbayar.</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onUpdateOrderStatus) {
                                        onUpdateOrderStatus(order.id, OrderStatus.SELESAI, { completedAt: new Date().toISOString() });
                                      }
                                    }}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10.5px] uppercase py-2.5 rounded-xl transition font-black tracking-wider shadow-sm cursor-pointer"
                                  >
                                    Lanjut ke Tahap Selesai & Beri Nilai
                                  </button>
                                </div>
                              ) : (
                                selectedPayMethod === 'CASH' ? (
                                  <div className="space-y-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onUpdateOrderStatus) {
                                          onUpdateOrderStatus(order.id, OrderStatus.PAYMENT, { 
                                            paymentMethod: 'CASH', 
                                            paymentStatus: 'WAITING_APPROVAL' 
                                          });
                                        }
                                        alert('Konfirmasi pembayaran tunai berhasil dikirim ke sistem! Silakan serahkan uang tunai kepada teknisi di lokasi, lalu minta teknisi untuk mengetuk tombol "Konfirmasi Terima Cash Lunas" di aplikasi mereka.');
                                      }}
                                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10.5px] uppercase py-2.5 rounded-xl transition tracking-wider shadow-sm cursor-pointer"
                                    >
                                      Konfirmasi Sudah Serahkan Cash ke Teknisi
                                    </button>
                                    <div className="text-center text-[9px] text-slate-450 font-semibold italic">
                                      Menunggu konfirmasi penerimaan uang dari teknisi lapangan...
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center bg-slate-50 border border-slate-250 bg-slate-100 p-2.5 rounded-lg text-[10px] font-bold text-slate-500">
                                    ⏳ Menunggu konfirmasi pembayaran kas atau pelunasan Virtual Account transfer...
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* ================ SELESAI PANEL INTERACTION ================ */}
                        {order.status === OrderStatus.SELESAI && order.rating === undefined && (
                          <div className="bg-emerald-50 border border-emerald-205 p-3.5 rounded-xl space-y-3">
                            <div className="flex items-center gap-1 text-emerald-800 font-extrabold text-[10.5px]">
                              <Sparkles size={14} className="shrink-0 text-emerald-600 animate-pulse" />
                              <span className="uppercase tracking-wider">TAHAP SELESAI & PENILAIAN</span>
                            </div>
                            
                            <p className="text-[10.5px] text-slate-650 text-slate-600 leading-normal font-medium">
                              Pekerjaan Anda telah selesai dan pembayaran telah lunas! Silakan ketuk jumlah bintang di bawah serta berikan masukan Anda untuk merampungkan pesanan.
                            </p>

                            <div className="bg-white border border-slate-200 p-3 rounded-xl space-y-2.5">
                              <span className="text-[9px] text-slate-500 font-black uppercase block tracking-wider text-center">Formulir Penilaian Hasil Kerja Staff</span>
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
                                className="w-full bg-slate-50 border border-slate-205 border-slate-200 text-xs px-3 py-2 rounded-lg outline-none focus:border-indigo-500 text-slate-800"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const valObj = ratingInput[order.id];
                                  if (!valObj || valObj.score === 0) {
                                    alert('Mohon ketuk jumlah bintang penilaian Anda.');
                                    return;
                                  }
                                  onRateOrder(order.id, valObj.score, valObj.review);
                                }}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase py-2 rounded-xl transition font-black tracking-wider shadow-xs cursor-pointer"
                              >
                                Kirim Penilaian & Selesaikan Ulasan
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Status timeline stepper visual */}
                        <div className="pt-3 border-t border-slate-100">
                          <div className="flex justify-between items-center relative">
                            <div className="absolute top-2.5 left-0 right-0 h-0.5 bg-slate-100 -z-10"></div>
                            <div 
                              className="absolute top-2.5 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 -z-10 transition-all duration-300"
                              style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}
                            ></div>

                            {steps.map((st, sIdx) => {
                              const isDone = sIdx <= currentStepIdx;
                              const isCurrent = sIdx === currentStepIdx;

                              return (
                                <div key={st.label} className="flex flex-col items-center flex-1">
                                  <div 
                                    className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[8.5px] font-black border transition duration-300 ${
                                      isDone 
                                        ? 'bg-blue-600 text-white border-blue-500 shadow-xs' 
                                        : 'bg-slate-100 text-slate-400 border-slate-200'
                                    } ${isCurrent ? 'ring-2.5 ring-blue-500/20 scale-105' : ''}`}
                                  >
                                    {isDone && sIdx < currentStepIdx ? '✓' : sIdx + 1}
                                  </div>
                                  <span className={`text-[7.5px] mt-1 font-bold tracking-tight text-center ${isCurrent ? 'text-blue-600' : isDone ? 'text-slate-700' : 'text-slate-400'}`}>
                                    {st.label}
                                  </span>
                                </div>
                              );
                            })}
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
            {/* Dark Stats banner */}
            <div className="bg-slate-900 px-5 pt-5 pb-5 rounded-b-[24px] shadow-md text-white text-left">
              <span className="text-[8px] text-indigo-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest leading-none">
                Arsip Rekaman Layanan
              </span>
              <h2 className="text-base font-black mt-1.5">Riwayat Selesai</h2>
              <p className="text-[10.5px] text-slate-400 leading-normal mt-0.5">Berikut data servis AC rumah Anda yang sudah diselesaikan.</p>

              {/* Stats metric dashboard inline */}
              <div className="grid grid-cols-2 gap-3 mt-3.5">
                <div className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-left">
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Total Servis</span>
                  <span className="text-sm font-extrabold text-emerald-400 font-mono mt-0.5 block">{completedOrders.length} Order</span>
                </div>
                <div className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-left">
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Dana Dikeluarkan</span>
                  <span className="text-sm font-extrabold text-blue-400 font-mono mt-0.5 block">
                    {formatRupiah(completedOrders.reduce((acc, curr) => acc + (curr.totalCost || curr.serviceCost), 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* List entries */}
            <div className="px-4 py-4 space-y-4">
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider text-left">Dokumen Riwayat Transaksi</h3>

              {completedOrders.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="p-3 bg-slate-100 rounded-full text-slate-400">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-850 text-xs">Belum Ada Transaksi Rampung</p>
                    <p className="text-[10.5px] text-slate-500 mt-1 max-w-xs leading-normal">Ulasan dan riwayat pengerjaan lunas akan diarsipkan pada rekapitulasi data area ini.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedOrders.map(order => (
                    <div key={order.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 text-left">
                      
                      <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                        <div>
                          <span className="text-[8px] font-mono text-slate-400 font-bold tracking-wider">{order.id}</span>
                          <h4 className="font-bold text-xs text-slate-850 mt-0.5">
                            {order.acDetail.quantity} Unit x {order.acDetail.serviceType === 'none' ? order.acDetail.category : order.acDetail.serviceType}
                          </h4>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-emerald-600 font-mono block">
                            {formatRupiah(order.totalCost || order.serviceCost)}
                          </span>
                          <span className="text-[8px] bg-emerald-50 border border-emerald-150 text-emerald-600 font-black tracking-wider uppercase px-1.5 py-0.5 rounded block mt-0.5 text-center">
                            Lunas Blocked
                          </span>
                        </div>
                      </div>

                      <div className="text-[10.5px] text-slate-500 space-y-0.5 font-medium leading-relaxed">
                        <div>📅 Tanggal Kerja: {order.scheduledDate} ({order.scheduledTime})</div>
                        <div>🔧 Teknisi: {order.assignedEmployeeName || 'Tim CoolAir'}</div>
                        <div>💳 Mekanisme: {order.paymentMethod || 'TUNAI'}</div>
                      </div>

                      {/* Photo details */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/50">
                        {order.photoBefore && (
                          <div>
                            <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider">Kondisi Sebelum (Before)</span>
                            <img src={order.photoBefore} alt="Before" className="w-full h-14 object-cover rounded mt-1 border" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        {order.photoAfter && (
                          <div>
                            <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider">Kondisi Sesudah (After)</span>
                            <img src={order.photoAfter} alt="After" className="w-full h-14 object-cover rounded mt-1 border" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>

                      {/* Completion Notes from Technician */}
                      {order.completionNotes && (
                        <div className="bg-emerald-50/40 border border-emerald-100 p-2.5 rounded-lg">
                          <span className="text-[8px] font-black tracking-wider uppercase text-emerald-600 block mb-0.5">Laporan Servis Teknisi:</span>
                          <p className="text-[10px] text-slate-600 italic">"{order.completionNotes}"</p>
                        </div>
                      )}

                      {/* Ratings Area output */}
                      {order.rating !== undefined && (
                        <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg flex items-center justify-between">
                          <div className="text-left">
                            <span className="text-[8px] font-bold text-amber-700 uppercase tracking-widest block">Ulasan Bintang</span>
                            {order.ratingNotes && <p className="text-[10.5px] text-amber-900 italic mt-0.5">"{order.ratingNotes}"</p>}
                          </div>
                          <div className="flex gap-0.5 shrink-0">
                            {[1, 2, 3, 4, 5].map(st => (
                              <Star key={st} size={11} className={st <= order.rating! ? 'fill-amber-500 text-amber-500' : 'text-slate-200'} />
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
            <div className="bg-gradient-to-r from-blue-700 via-indigo-750 to-indigo-900 px-5 pt-5 pb-5 text-white rounded-b-[24px] text-left">
              <span className="text-[8px] text-blue-200 bg-white/10 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest leading-none">
                Akun Profile
              </span>
              <div className="flex items-center gap-3 mt-3.5">
                <div className="w-12 h-12 rounded-xl bg-white text-indigo-700 font-black text-base flex items-center justify-center shadow-md">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold leading-none">{user.name}</h3>
                  <p className="text-[10.5px] text-blue-200/70 truncate mt-1">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Editing form */}
            <div className="px-4 py-4 space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Edit Data Pengiriman</h3>
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-[9.5px] font-black uppercase tracking-wider"
                >
                  Keluar Sesi
                </button>
              </div>

              {saveSuccess && (
                <div className="bg-emerald-50 border border-emerald-250 p-2.5 rounded-xl text-[11px] text-emerald-800 font-bold text-left animate-in fade-in">
                  ✓ Berhasil mengupdate database profile lokal!
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-4 shadow-xs text-left">
                <div>
                  <label className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:bg-white focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block mb-1">No. Handphone default</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:bg-white focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Alamat rumah default</label>
                  <textarea
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none focus:bg-white focus:border-indigo-500 h-20 resize-none leading-relaxed"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs py-3 rounded-xl shadow-md cursor-pointer uppercase tracking-wider"
                >
                  Perbarui Profil
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ==================== 2. PERSISTENT FLOATING BOTTOM NAV BAR ==================== */}
      <div className="absolute bottom-4 left-4 right-4 bg-white border border-slate-200/80 rounded-2xl h-14 shadow-md flex items-center justify-around px-2 z-30">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 h-full rounded-xl transition cursor-pointer ${
            activeTab === 'dashboard' ? 'text-indigo-600 font-black' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home size={17} className={activeTab === 'dashboard' ? 'stroke-[2.5px] text-indigo-600' : 'text-slate-400'} />
          <span className="text-[8.5px] mt-0.5 font-bold">Servis</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center flex-1 h-full rounded-xl transition cursor-pointer ${
            activeTab === 'history' ? 'text-indigo-600 font-black' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock size={17} className={activeTab === 'history' ? 'stroke-[2.5px] text-indigo-600' : 'text-slate-400'} />
          <span className="text-[8.5px] mt-0.5 font-bold font-bold">Histori</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center flex-1 h-full rounded-xl transition cursor-pointer ${
            activeTab === 'profile' ? 'text-indigo-600 font-black' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <UserIcon size={17} className={activeTab === 'profile' ? 'stroke-[2.5px] text-indigo-600' : 'text-slate-400'} />
          <span className="text-[8.5px] mt-0.5 font-bold">Profil</span>
        </button>
      </div>

      {/* ==================== 3. BOOKING MODAL SCREEN ==================== */}
      {showNewOrderModal && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex flex-col justify-end z-45 animate-in slide-in-from-bottom duration-300 pt-16">
          <div className="bg-white rounded-t-[24px] flex flex-col max-h-full overflow-hidden shadow-2xl">
            
            {/* Header modal */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 shrink-0 text-left">
              <div>
                <h3 className="font-extrabold text-sm uppercase text-slate-800 tracking-tight">Pesan Kunjungan AC</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Sistem Jasa Layanan Real-Time</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewOrderModal(false)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Booking fields (Scrollable area) */}
            <form onSubmit={handleSubmitOrder} className="p-5 overflow-y-auto space-y-4 pb-12 bg-slate-50 text-left">
              
              {/* 1. AC Type Model selection */}
              <div>
                <label className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Pilih Model AC</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-white border border-slate-250 border-slate-200 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-blue-500"
                >
                  {models.map(m => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* 2. AC Category selection */}
              <div>
                <label className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Kategori AC (Kadang tanpa Layanan khusus)</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full bg-white border border-slate-250 border-slate-200 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-blue-500"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {!c.hasServices ? '(Flat-rate Pengecekan)' : ''}</option>
                  ))}
                </select>
              </div>

              {/* 3. AC Service Type selection (filtered based on Category) */}
              <div>
                <label className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Daftar Jenis Layanan Tersedia</label>
                {services.filter(s => s.categoryId === selectedCategory).length > 0 ? (
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full bg-white border border-slate-250 border-slate-200 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-blue-500 font-medium"
                  >
                    {services.filter(s => s.categoryId === selectedCategory).map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({formatRupiah(s.price)})</option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-amber-50 text-amber-800 border border-amber-200 text-[10.5px] p-2.5 rounded-xl font-medium">
                    ⚠️ Kategori ini hanya memiliki inspeksi / konsultasi fisik umum. Diaplikasikan biaya peninjauan dasar flat <strong>Rp50.000 / Unit</strong>.
                  </div>
                )}
              </div>

              {/* 4. AC Quantity units count */}
              <div>
                <label className="text-[9.5px] text-slate-500 font-bold block uppercase tracking-wider mb-1">Jumlah Unit AC ({quantity} Unit)</label>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-extrabold text-xs bg-white py-1.5 border rounded-lg">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    className="w-8 h-8 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 5. Contact phone */}
              <div>
                <label className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider block mb-1">No. Handphone Kontak Aktif</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-indigo-500 font-mono font-bold"
                  required
                />
              </div>

              {/* 6. Date & Time schedule selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9.5px] text-slate-500 font-bold uppercase block mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-850 text-xs px-2.5 py-2 rounded-xl outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9.5px] text-slate-500 font-bold uppercase block mb-1">Jam Kunjungan</label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-850 text-xs px-2.5 py-2 rounded-xl outline-none focus:border-indigo-500 font-semibold"
                  >
                    <option value="09:00">09:00 Pagi</option>
                    <option value="11:00">11:00 Siang</option>
                    <option value="13:00">13:00 Siang</option>
                    <option value="15:00">15:00 Sore</option>
                    <option value="17:00">17:00 Sore</option>
                  </select>
                </div>
              </div>

              {/* 7. Core GPS SIMULATED LOCATION DETECTION */}
              <div className="bg-white border rounded-xl p-3 border-indigo-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9.5px] text-slate-500 font-black uppercase tracking-wider">Deteksi Lokasi GPS Anda</span>
                  {lat && lng ? (
                    <span className="text-[8px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.5 rounded uppercase font-mono border border-emerald-250">
                      GPS: {lat}, {lng}
                    </span>
                  ) : (
                    <span className="text-[8px] bg-slate-100 text-slate-400 font-black px-1.5 py-0.5 rounded uppercase font-mono">
                      Belum Terdeteksi
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 leading-normal">Default mengisi dari profile, tapi koordinat GPS akurat bisa disimulasikan di bawah untuk presisi alamat peta.</p>

                <button
                  type="button"
                  onClick={handleGPSDetection}
                  disabled={isDetectingLocation}
                  className="w-full bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-750 font-extrabold text-[10px] py-2 rounded-lg flex items-center justify-center gap-1.5 transition text-indigo-700 uppercase"
                >
                  <Navigation size={12} className={isDetectingLocation ? 'animate-spin' : ''} />
                  {isDetectingLocation ? 'Membaca Satelit GPS...' : 'Simulasikan Koordinat Deteksi Lokasi'}
                </button>
              </div>

              {/* 8. Address text with simulated GPS values */}
              <div>
                <label className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Alamat Penjadwalan Jasa</label>
                <textarea
                  placeholder="Ketik alamat lengkap lokasi pengerjaan..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white border border-slate-205 border-slate-200 text-slate-800 text-xs px-3.5 py-2 rounded-xl outline-none focus:border-indigo-500 h-16 resize-none leading-relaxed transition"
                  required
                ></textarea>
              </div>

              {/* 9. Optional complaints */}
              <div>
                <label className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Catatan Opsional / Keluhan AC (Optional)</label>
                <textarea
                  placeholder="contoh: AC berisik di luar kotor atau air merembes menetes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-slate-205 border-slate-200 text-slate-800 text-xs px-3.5 py-2 rounded-xl outline-none focus:border-indigo-500 h-14 resize-none leading-relaxed transition"
                ></textarea>
              </div>

              {/* Billing estimate breakdown */}
              <div className="bg-slate-100 rounded-xl p-3 border text-[10.5px] text-slate-650 space-y-1 text-left">
                <div className="flex justify-between">
                  <span>Biaya Satuan Jasa:</span>
                  <span className="font-mono font-bold">{formatRupiah(currentServicePrice)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Jumlah Unit AC dipesan:</span>
                  <span className="font-bold">x {quantity} Unit</span>
                </div>
                <div className="h-px bg-slate-200 my-1"></div>
                <div className="flex justify-between text-slate-800 font-extrabold text-[11px] uppercase tracking-wider">
                  <span>Estimasi Biaya Jasa:</span>
                  <span className="font-mono text-indigo-700">{formatRupiah(estimatedCost)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs py-3 rounded-xl shadow-md uppercase tracking-widest hover:shadow-lg transition cursor-pointer"
              >
                Booking Jasa Sekarang
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
