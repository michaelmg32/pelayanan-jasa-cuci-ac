/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Order, OrderStatus, Role, ACAddon, ACService, ACCategory } from '../types';
import { 
  LogOut, 
  MapPin, 
  Calendar, 
  Phone, 
  Briefcase, 
  X, 
  Home, 
  Clock, 
  User as UserIcon, 
  Check, 
  Mail, 
  ShieldCheck,
  Star,
  Camera,
  Plus,
  Trash2,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Wrench,
  Sliders,
} from 'lucide-react';

interface KaryawanDashboardProps {
  user: User;
  orders: Order[];
  addons: ACAddon[];
  services: ACService[];
  categories: ACCategory[];
  onLogout: () => void;
  onUpdateOrderStatus: (
    orderId: string,
    newStatus: OrderStatus,
    payload?: Partial<Order>
  ) => void;
  onUpdateUserData: (userId: string, updatedData: Partial<User>) => void;
}

export default function KaryawanDashboard({
  user,
  orders,
  addons,
  services,
  categories,
  onLogout,
  onUpdateOrderStatus,
  onUpdateUserData,
}: KaryawanDashboardProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'profile'>('dashboard');

  // Detailed Modal or Drawer for active task work
  const [activeWorkingTask, setActiveWorkingTask] = useState<Order | null>(null);

  // States for updating service/layanan during CEK_LAYANAN stage
  const [editingServiceOrderId, setEditingServiceOrderId] = useState<string | null>(null);
  const [tempCategoryId, setTempCategoryId] = useState<string>('');
  const [tempServiceId, setTempServiceId] = useState<string>('');
  const [tempQuantity, setTempQuantity] = useState<number>(1);

  // States for adding spare parts (Used during stage PENGERJAAN)
  const [addonsUsed, setAddonsUsed] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);
  const [selectedAddonId, setSelectedAddonId] = useState('');
  const [addonQuantity, setAddonQuantity] = useState(1);

  // Simulation images presets
  const mockBeforeImages = [
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=60', // Dusty AC
    'https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=300&auto=format&fit=crop&q=60', // Opened casing
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&auto=format&fit=crop&q=60'  // AC leakage
  ];

  const mockAfterImages = [
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=300&auto=format&fit=crop&q=60', // Clean AC
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=300&auto=format&fit=crop&q=60', // Working cooling fan
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&auto=format&fit=crop&q=60'  // Clean filter
  ];

  // Selected mock images
  const [photoBeforeUrl, setPhotoBeforeUrl] = useState('');
  const [photoAfterUrl, setPhotoAfterUrl] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');

  // Profile Edit
  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const [editAddress, setEditAddress] = useState(user.address || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync edits when user props update
  useEffect(() => {
    setEditName(user.name);
    setEditPhone(user.phone || '');
    setEditAddress(user.address || '');
  }, [user]);

  // Sync working order detail live states
  useEffect(() => {
    if (activeWorkingTask) {
      const match = orders.find(o => o.id === activeWorkingTask.id);
      if (match) {
        setActiveWorkingTask(match);
      }
    }
  }, [orders]);

  // Filter tasks assigned to this employee
  const myTasks = orders.filter(o => o.assignedTo === user.id);
  const activeTasks = myTasks.filter(o => o.status !== OrderStatus.SELESAI);
  const completedTasks = myTasks.filter(o => o.status === OrderStatus.SELESAI);

  const formatRupiah = (num: number) => {
    return 'Rp' + num.toLocaleString('id-ID');
  };

  // Profile save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert('Nama tidak boleh kosong');
      return;
    }
    onUpdateUserData(user.id, {
      name: editName.trim(),
      phone: editPhone.trim(),
      address: editAddress.trim()
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Addon Manager
  const handleAddAddonItem = () => {
    if (!selectedAddonId) return;
    const match = addons.find(a => a.id === selectedAddonId);
    if (match) {
      // Check if already contains
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

  // Adjust service details (Layanan & Quantity) during CEK_LAYANAN stage
  const handleStartEditingService = (order: Order) => {
    setEditingServiceOrderId(order.id);
    
    // Find matching category by name
    const currentCat = categories.find(c => c.name === order.acDetail.category) || categories[0];
    setTempCategoryId(currentCat ? currentCat.id : '');
    
    // Find matching service by name
    const currentSrv = services.find(s => s.name === order.acDetail.serviceType && s.categoryId === currentCat?.id) || 
                       services.find(s => s.categoryId === currentCat?.id);
    setTempServiceId(currentSrv ? currentSrv.id : '');
    
    setTempQuantity(order.acDetail.quantity || 1);
  };

  const handleSaveServiceUpdate = (orderId: string) => {
    const matchedCategory = categories.find(c => c.id === tempCategoryId);
    const matchedService = services.find(s => s.id === tempServiceId);

    if (!matchedCategory) {
      alert('Kategori layanan tidak valid');
      return;
    }

    const categoryName = matchedCategory.name;
    const serviceTypeName = matchedCategory.hasServices && matchedService ? matchedService.name : 'none';
    
    // Calculate new price
    let unitPrice = 50000; // default base price for checkups/inspections
    if (matchedCategory.hasServices && matchedService) {
      unitPrice = matchedService.price;
    }
    const newServiceCost = unitPrice * tempQuantity;

    const currentOrder = orders.find(o => o.id === orderId);
    if (!currentOrder) return;

    onUpdateOrderStatus(orderId, currentOrder.status, {
      acDetail: {
        ...currentOrder.acDetail,
        category: categoryName,
        serviceType: serviceTypeName,
        quantity: tempQuantity
      },
      serviceCost: newServiceCost,
      totalCost: newServiceCost + currentOrder.addonsCost
    });

    setEditingServiceOrderId(null);
    alert('Detail jenis layanan berhasil disesuaikan!');
  };


  // ORCHESTRATE STATUS TRANSITIONS (Staff steps)
  // Step 2: DITUGASKAN -> CEK_LAYANAN
  const handleConfirmArrived = (orderId: string) => {
    onUpdateOrderStatus(orderId, OrderStatus.CEK_LAYANAN);
    // Initialize mock image selections
    setPhotoBeforeUrl(mockBeforeImages[0]);
    setPhotoAfterUrl(mockAfterImages[0]);
  };

  // Step 3: CEK_LAYANAN -> PENGERJAAN
  const handleStartRepairAndWash = (orderId: string) => {
    if (!photoBeforeUrl) {
      alert('Mohon pilih/upload foto kondisi awal (Before) terlebih dahulu.');
      return;
    }
    onUpdateOrderStatus(orderId, OrderStatus.PENGERJAAN, {
      photoBefore: photoBeforeUrl
    });
  };

  // Step 4: PENGERJAAN -> PAYMENT
  const handleSendBillToCustomer = (orderId: string) => {
    if (!photoAfterUrl) {
      alert('Mohon ambil/pilih foto kondisi sesudah pekerjaan (After).');
      return;
    }
    if (!completionNotes.trim()) {
      alert('Mohon ketik rincian pengerjaan / catatan penyelesaian AC.');
      return;
    }

    const addonsCost = addonsUsed.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

    onUpdateOrderStatus(orderId, OrderStatus.PAYMENT, {
      photoAfter: photoAfterUrl,
      addonsUsed,
      addonsCost,
      completionNotes: completionNotes.trim(),
      paymentMethod: 'CASH',
      paymentStatus: 'WAITING_APPROVAL' // Pending
    });

    // Reset States
    setAddonsUsed([]);
    setCompletionNotes('');
    setActiveWorkingTask(null);
  };

  // Step 5: CASH PAYMENT Approval
  const handleApproveCashReceived = (orderId: string) => {
    onUpdateOrderStatus(orderId, OrderStatus.SELESAI, {
      paymentStatus: 'PAID'
    });
    alert('Pembayaran CASH lunas berhasil disetujui. Status pengerjaan otomatis diumumkan Selesai! Customer dipersilakan melakukan rating.');
  };

  // Handle uploading real photos and converting them to base64 format
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

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative min-h-0 h-full">
      
      {/* 1. VIEW COMPONENT Area */}
      <div className="flex-1 overflow-y-auto pb-24 min-h-0">
        
        {/* ===================== TAB 1: WORKER DASHBOARD ===================== */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Header section dark styling */}
            <div className="bg-slate-900 px-5 pt-5 pb-5 text-left text-white rounded-b-[24px] shadow-lg shrink-0">
              <span className="text-[8px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Departemen Teknisi Lapangan
              </span>
              <h2 className="text-base font-extrabold mt-1.5 leading-none text-white">Halo Sobat, {user.name}!</h2>
              <p className="text-[10.5px] text-slate-400 mt-1">Status: <strong className="text-emerald-400">SIAP BEKERJA (ON-DUTY)</strong></p>

              {/* Counter status widget */}
              <div className="grid grid-cols-2 gap-3 mt-3.5 pt-3.5 border-t border-slate-800">
                <div className="text-left">
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Tugas Aktif</span>
                  <span className="text-sm font-extrabold text-blue-400 font-mono mt-0.5 block">{activeTasks.length} Pekerjaan</span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Selesai Bulan Ini</span>
                  <span className="text-sm font-extrabold text-emerald-400 font-mono mt-0.5 block">{completedTasks.length} Order</span>
                </div>
              </div>
            </div>

            {/* Tasks listing area */}
            <div className="px-4 py-4 space-y-4">
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider text-left pl-1">Daftar Kunjungan Service Hari Ini</h3>

              {activeTasks.length === 0 ? (
                <div className="bg-white border rounded-2xl p-7 text-center space-y-3 shadow-xs">
                  <span className="text-xl">🛠️</span>
                  <div>
                    <p className="font-bold text-slate-850 text-xs uppercase tracking-wide">Jadwal Tugas Bersih!</p>
                    <p className="text-[10.5px] text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                      Tidak ada pesanan aktif ditugaskan kepada Anda saat ini. Silakan tunggu pembagian wilayah pencucian AC oleh admin.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fade">
                  {activeTasks.map(task => (
                    <div key={task.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5 text-left">
                      
                      {/* Header details */}
                      <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                        <div>
                          <span className="text-[8.5px] font-mono font-bold text-slate-400 bg-slate-50 px-1 py-0.5 border rounded uppercase tracking-wider">{task.id}</span>
                          <h4 className="font-extrabold text-xs text-slate-850 mt-1 uppercase">
                            {task.acDetail.quantity} Unit x {task.acDetail.serviceType === 'none' ? task.acDetail.category : task.acDetail.serviceType}
                          </h4>
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          task.status === OrderStatus.DITUGASKAN ? 'bg-amber-50 border-amber-200 text-amber-800' :
                          task.status === OrderStatus.CEK_LAYANAN ? 'bg-blue-50 border-blue-205 text-blue-850' :
                          task.status === OrderStatus.PENGERJAAN ? 'bg-purple-50 border-purple-200 text-purple-800' :
                          'bg-indigo-50 border-indigo-200 text-indigo-750'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Client metrics */}
                      <div className="text-[10.5px] text-slate-500 font-medium space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-10$ border-slate-200/50">
                        <div>👤 Nama Customer: <strong className="text-slate-800">{task.customerName}</strong> (<span className="font-mono">{task.customerPhone}</span>)</div>
                        <div>📍 Alamat Antar: <strong className="text-slate-700">{task.address}</strong></div>
                        {task.latitude !== undefined && (
                          <div className="text-[9.5px] text-blue-600 font-bold font-mono">
                            🌐 Poin GPS: {task.latitude}, {task.longitude}
                          </div>
                        )}
                        {task.notes && <div className="text-[10px] italic border-l-2 pl-2 bg-white p-1 rounded-md text-slate-405">"Catatan: {task.notes}"</div>}
                      </div>

                      {/* Actions buttons along progress */}
                      <div className="pt-2">
                        {task.status === OrderStatus.DITUGASKAN && (
                          <button
                            type="button"
                            onClick={() => handleConfirmArrived(task.id)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 rounded-xl uppercase tracking-wider shadow-sm transition cursor-pointer"
                          >
                            Konfirmasi Tiba di Lokasi & Mulai Cek AC
                          </button>
                        )}

                        {task.status === OrderStatus.CEK_LAYANAN && (
                          <div className="space-y-3">
                            {/* Service adjustment card */}
                            <div className="border border-amber-200 bg-amber-50/55 p-3.5 rounded-2xl text-left space-y-2.5">
                              <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-wider text-amber-800">
                                <span className="flex items-center gap-1">
                                  <Sliders size={12} className="text-amber-600" />
                                  Kesesuaian Paket Jasa AC
                                </span>
                                {editingServiceOrderId !== task.id && (
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditingService(task)}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-black text-[9px] px-2.5 py-1 rounded-lg cursor-pointer transition uppercase tracking-wide select-none"
                                  >
                                    Sesuaikan Jasa
                                  </button>
                                )}
                              </div>

                              {editingServiceOrderId === task.id ? (
                                <div className="space-y-3 pt-1 text-[11px] animate-fade">
                                  {/* Category selector */}
                                  <div>
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">1. Kategori Jasa:</label>
                                    <select
                                      value={tempCategoryId}
                                      onChange={(e) => {
                                        setTempCategoryId(e.target.value);
                                        // Pick first service of newly chosen category if applicable
                                        const subSrvs = services.filter(s => s.categoryId === e.target.value);
                                        if (subSrvs.length > 0) {
                                          setTempServiceId(subSrvs[0].id);
                                        } else {
                                          setTempServiceId('');
                                        }
                                      }}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 font-extrabold text-xs text-slate-800 outline-none focus:border-amber-500"
                                    >
                                      {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Service selector (Only if category hasServices) */}
                                  {categories.find(c => c.id === tempCategoryId)?.hasServices && (
                                    <div>
                                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">2. Jenis Jasa Sub-Layanan:</label>
                                      <select
                                        value={tempServiceId}
                                        onChange={(e) => setTempServiceId(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 font-bold text-xs text-slate-800 outline-none focus:border-amber-500"
                                      >
                                        {services.filter(s => s.categoryId === tempCategoryId).map(s => (
                                          <option key={s.id} value={s.id}>{s.name} ({formatRupiah(s.price)})</option>
                                        ))}
                                      </select>
                                    </div>
                                  )}

                                  {/* Quantity and Actions row */}
                                  <div className="flex justify-between items-end gap-3 pt-2.5 border-t border-amber-200/50">
                                    <div className="space-y-1">
                                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">3. Jumlah AC (Unit):</span>
                                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2 h-9">
                                        <button
                                          type="button"
                                          onClick={() => setTempQuantity(Math.max(1, tempQuantity - 1))}
                                          className="text-slate-500 hover:text-slate-800 font-extrabold text-[14px] px-1.5 cursor-pointer select-none"
                                        >
                                          -
                                        </button>
                                        <span className="text-xs font-mono font-black w-4 text-center">{tempQuantity}</span>
                                        <button
                                          type="button"
                                          onClick={() => setTempQuantity(tempQuantity + 1)}
                                          className="text-slate-500 hover:text-slate-800 font-extrabold text-[12px] px-1.5 cursor-pointer select-none"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setEditingServiceOrderId(null)}
                                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[9.5px] px-3 py-2 rounded-xl uppercase tracking-wide cursor-pointer transition select-none"
                                      >
                                        Batal
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveServiceUpdate(task.id)}
                                        className="bg-amber-600 hover:bg-amber-700 text-white font-black text-[9.5px] px-3.5 py-2 rounded-xl uppercase tracking-wide cursor-pointer transition select-none"
                                      >
                                        Simpan
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-[10.5px] font-medium text-slate-600 bg-white/75 p-3 rounded-xl border border-amber-100/40 space-y-1">
                                  <div>Kategori Jasa: <strong className="text-slate-850 font-bold">{task.acDetail.category}</strong></div>
                                  <div>Detail Layanan: <strong className="text-indigo-700 font-extrabold">{task.acDetail.serviceType === 'none' ? 'Inspeksi & Konsultasi' : task.acDetail.serviceType}</strong></div>
                                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100/70 font-mono text-[10px]">
                                    <span>Ongkos Jasa: {task.acDetail.quantity} Unit x {formatRupiah(task.serviceCost / (task.acDetail.quantity || 1))}</span>
                                    <strong className="text-emerald-700 font-black text-[11px]">{formatRupiah(task.serviceCost)}</strong>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="border border-indigo-100 bg-indigo-50/50 p-3 rounded-xl space-y-2.5 text-left text-[10.5px]">
                              <span className="text-[8px] font-black tracking-widest text-indigo-700 uppercase block">FOTO KONDISI AWAL (BEFORE)</span>
                              
                              <div className="flex flex-col sm:flex-row gap-3">
                                {/* Preset options */}
                                <div className="space-y-1">
                                  <span className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider block">Pilih Preset Simulasi:</span>
                                  <div className="flex gap-1.5 flex-wrap">
                                    {mockBeforeImages.map((img, iIdx) => (
                                      <button
                                        key={iIdx}
                                        type="button"
                                        onClick={() => setPhotoBeforeUrl(img)}
                                        className={`w-14 h-10 rounded border overflow-hidden relative ${photoBeforeUrl === img && !photoBeforeUrl.startsWith('data:') ? 'ring-2 ring-indigo-500 border-transparent shadow' : 'border-slate-300'}`}
                                      >
                                        <img src={img} alt="Before preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        {photoBeforeUrl === img && !photoBeforeUrl.startsWith('data:') && <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-xs">✓</span>}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Custom Upload */}
                                <div className="flex-1 flex flex-col justify-end">
                                  <span className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Upload Foto Asli:</span>
                                  <label className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300/85 hover:border-slate-400/85 text-slate-700 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider justify-center cursor-pointer transition h-10 select-none">
                                    <Camera size={13} className="text-slate-500" />
                                    <span>{photoBeforeUrl.startsWith('data:') ? 'Foto Terupload' : 'Ambil/Upload Foto'}</span>
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      onChange={(e) => handleImageUpload(e, 'before')} 
                                      className="hidden" 
                                    />
                                  </label>
                                </div>
                              </div>

                              {/* Preview of custom upload if any */}
                              {photoBeforeUrl.startsWith('data:') && (
                                <div className="mt-1.5 bg-white p-2 border border-indigo-200/50 rounded-xl relative flex items-center gap-2">
                                  <img src={photoBeforeUrl} alt="Custom upload draft" className="w-14 h-10 object-cover rounded border" />
                                  <div className="text-left">
                                    <span className="text-[8px] text-emerald-600 font-extrabold uppercase tracking-wide bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Real Uploaded</span>
                                    <p className="text-[9.5px] text-slate-500 font-medium mt-0.5">Sistem telah memproses foto kustom Anda.</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setPhotoBeforeUrl(mockBeforeImages[0])}
                                    className="absolute right-2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                    title="Gunakan simulasi kembali"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleStartRepairAndWash(task.id)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 rounded-xl uppercase tracking-wider shadow-sm transition cursor-pointer"
                            >
                              Konfirmasi Selesai Ulasan Fisik & Mulai Kerja
                            </button>
                          </div>
                        )}

                        {task.status === OrderStatus.PENGERJAAN && (
                          <button
                            type="button"
                            onClick={() => {
                              if (addons.length > 0) setSelectedAddonId(addons[0].id);
                              setActiveWorkingTask(task);
                            }}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs py-2.5 rounded-xl uppercase tracking-wider shadow-sm transition"
                          >
                            Buka Panel Pengerjaan & Input Sparepart
                          </button>
                        )}

                        {task.status === OrderStatus.PAYMENT && (
                          <div className="border border-slate-200 rounded-xl p-3 bg-indigo-50/40 text-left space-y-2.5 text-[11px] text-slate-700">
                            <span className="text-[8px] font-black uppercase text-indigo-700 block tracking-widest mb-1 leading-none">Status Pelunasan Tagihan</span>
                            <div className="flex justify-between">
                              <span>Mekanisme Pembayaran:</span>
                              <strong className="text-slate-800 uppercase">{task.paymentMethod === 'TRANSFER' ? 'BANK TRANSFER' : 'TUNAI'}</strong>
                            </div>
                            <div className="flex justify-between items-center bg-white p-1.5 rounded-lg border">
                              <span>Invoice Tagihan Jasa:</span>
                              <strong className="text-indigo-700 font-mono text-[11.5px]">{formatRupiah(task.totalCost || task.serviceCost)}</strong>
                            </div>

                            {(!task.paymentMethod || task.paymentMethod === 'CASH') ? (
                              <div className="space-y-1.5 pt-1">
                                <p className="text-[10px] text-amber-800 leading-normal font-semibold">⚠️ Pelanggan memilih pembayaran Tunai (Cash). Mohon konfirmasi kelayakan uang fisik di genggaman Anda.</p>
                                {task.paymentStatus === 'PAID' ? (
                                  <div className="bg-emerald-100 text-emerald-800 p-2 rounded-lg text-[10px] font-bold text-center">
                                    ✓ TRANSAKSI CASH LUNAS DI-APPROVED
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveCashReceived(task.id)}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] py-2 rounded-lg transition uppercase tracking-wider"
                                  >
                                    Konfirmasi Terima Cash Lunas
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="pt-1 text-[10px] text-indigo-805 text-indigo-800 bg-white p-2 rounded-lg border border-indigo-100/55 leading-relaxed font-semibold">
                                ⏳ Pelanggan memilih Virtual Account (VA Xendit). Terverifikasi instan, apabila Paid maka customer akan langsung me-rate kualifikasi kerja Anda.
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

        {/* ===================== TAB 2: HISTORY LISTS ===================== */}
        {activeTab === 'history' && (
          <div>
            <div className="bg-slate-900 px-5 pt-5 pb-5 text-white text-left rounded-b-[24px]">
              <span className="text-[8px] text-blue-300 bg-white/5 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest leading-none">
                Arsip Rekap Teknisi
              </span>
              <h2 className="text-base font-black mt-1.5 text-white">Histori Pekerjaan Selesai</h2>
              <p className="text-[10.5px] text-slate-400 mt-0.5">Berikut pekerjaan AC aman terselesaikan.</p>
            </div>

            <div className="px-4 py-4 space-y-4">
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider text-left pl-1">Data Pekerjaan Masa Lalu</h3>

              {completedTasks.length === 0 ? (
                <div className="bg-white border rounded-2xl p-8 text-center space-y-3 col-span-full">
                  <span className="text-xl">📊</span>
                  <p className="font-extrabold text-xs uppercase tracking-wide">Belum Ada Histori</p>
                  <p className="text-[10.5px] text-slate-500 max-w-sm leading-normal">Pekerjaan pencucian pertama Anda yang diselesaikan customer akan tersimpan di lemari digital ini.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedTasks.map(task => (
                    <div key={task.id} className="bg-white border border-slate-200 rounded-2xl p-4 list-none text-left space-y-3">
                      <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                        <div>
                          <span className="text-[8px] font-mono text-slate-400 font-bold block">{task.id}</span>
                          <h4 className="font-bold text-xs text-slate-800 mt-0.5">
                            {task.customerName}
                          </h4>
                          <p className="text-[9px] text-slate-400 font-extrabold">{task.acDetail.acType}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-emerald-600 block">{formatRupiah(task.totalCost || task.serviceCost)}</span>
                          <span className="text-[8px] bg-emerald-50 text-emerald-600 font-black border uppercase tracking-wider px-1.5 block mt-0.5">CLOSED</span>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 font-medium space-y-0.5 leading-relaxed">
                        <div>🔧 Jasa: {task.acDetail.quantity} Unit x {task.acDetail.serviceType === 'none' ? task.acDetail.category : task.acDetail.serviceType}</div>
                        <div>📅 Diselesaikan pada: {task.completedAt?.split('T')[0] || task.scheduledDate}</div>
                        {task.completionNotes && <div className="mt-1 font-semibold italic text-slate-600">"Penyelesaian: {task.completionNotes}"</div>}
                      </div>

                      {/* Rating section */}
                      {task.rating !== undefined && (
                        <div className="bg-amber-500/10 border border-amber-500/25 p-2.5 rounded-lg flex items-center justify-between">
                          <div>
                            <span className="text-[8px] text-amber-700 font-black uppercase tracking-wider block leading-none">Rating / Ulasan Bintang</span>
                            {task.ratingNotes && <p className="italic text-[10.5px] text-amber-900 font-bold mt-1">"{task.ratingNotes}"</p>}
                          </div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((st) => (
                              <Star key={st} size={11} className={st <= task.rating! ? 'fill-amber-500 text-amber-500' : 'text-slate-200'} />
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

        {/* ===================== TAB 3: PROFIL TEKNISI ===================== */}
        {activeTab === 'profile' && (
          <div>
            <div className="bg-gradient-to-r from-teal-700 via-emerald-850 to-emerald-900 bg-slate-900 px-5 py-5 text-white text-left rounded-b-[24px]">
              <span className="text-[8px] text-teal-200 bg-white/10 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest leading-none">
                Informasi Personel
              </span>
              <div className="flex items-center gap-3 mt-3">
                <div className="w-12 h-12 bg-white text-emerald-700 font-black text-sm flex items-center justify-center rounded-xl">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold leading-none">{user.name}</h3>
                  <p className="text-[10px] text-slate-400 mt-1.5">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="px-4 py-4 space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Perbarui Data Profil</h3>
                <button
                  type="button"
                  onClick={onLogout}
                  className="bg-rose-50 border border-rose-220 text-rose-600 hover:bg-rose-100 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg"
                >
                  Keluar / Log Out
                </button>
              </div>

              {saveSuccess && (
                <div className="bg-emerald-100 border border-emerald-250 p-2.5 rounded-xl text-[11px] text-emerald-800 font-bold text-left animate-in fade-in">
                  ✓ Berhasil menyimpan rekayasa profil Anda ke sistem!
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="bg-white border text-left p-4.5 rounded-2xl shadow-xs space-y-4">
                <div>
                  <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Nama Personel</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[9.5px] text-slate-405 font-bold uppercase block mb-1">No. Handphone Kontak</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[9.5px] text-slate-405 font-bold uppercase block mb-1">Alamat wilayah Tugas default</label>
                  <textarea
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs p-3 rounded-xl outline-none h-18 resize-none font-medium leading-relaxed"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 text-white font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider hover:bg-black transition duration-150 shadow cursor-pointer"
                >
                  Sunting Informasi
                </button>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* ===================== 2. BOTTOM EMBEDDED NAVIGATION BAR ===================== */}
      <div className="absolute bottom-4 left-4 right-4 bg-white border border-slate-200/80 rounded-2xl h-14 shadow-md flex items-center justify-around px-2 z-30">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 h-full rounded-xl transition cursor-pointer ${
            activeTab === 'dashboard' ? 'text-emerald-600 font-black' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home size={17} className={activeTab === 'dashboard' ? 'stroke-[2.5px] text-emerald-600' : 'text-slate-400'} />
          <span className="text-[8.5px] mt-0.5 font-bold">Penugasan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center flex-1 h-full rounded-xl transition cursor-pointer ${
            activeTab === 'history' ? 'text-emerald-600 font-black' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock size={17} className={activeTab === 'history' ? 'stroke-[2.5px] text-emerald-600' : 'text-slate-400'} />
          <span className="text-[8.5px] mt-0.5 font-bold">Closed</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center flex-1 h-full rounded-xl transition cursor-pointer ${
            activeTab === 'profile' ? 'text-emerald-600 font-black' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <UserIcon size={17} className={activeTab === 'profile' ? 'stroke-[2.5px] text-emerald-600' : 'text-slate-400'} />
          <span className="text-[8.5px] mt-0.5 font-bold font-bold">Karyawan</span>
        </button>
      </div>

      {/* ===================== 3. FULL SCREEN WORK PANEL MODAL (STAGE 4: PENGERJAAN) ===================== */}
      {activeWorkingTask && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex flex-col justify-end z-45 animate-in slide-in-from-bottom duration-300 pt-10">
          <div className="bg-white rounded-t-[24px] flex flex-col max-h-full overflow-hidden shadow-2xl text-left">
            
            {/* Modal navigation bar shrink-0 */}
            <div className="px-5 py-4 border-b flex justify-between items-center bg-slate-900 text-white shrink-0">
              <div>
                <span className="text-[8px] bg-purple-600 px-1.5 py-0.5 rounded font-black tracking-wider uppercase">Layar Input Pengerjaan</span>
                <h4 className="text-sm font-extrabold text-white mt-1 leading-none">ID: {activeWorkingTask.id} • {activeWorkingTask.customerName}</h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveWorkingTask(null)}
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable form */}
            <div className="p-5 overflow-y-auto space-y-4 pb-12 bg-slate-50">
              
              {/* Task summ details */}
              <div className="bg-white border rounded-xl p-3 text-[10.5px] text-slate-600 space-y-0.5">
                <div>⚙️ Layanan dipesan: <strong className="text-slate-800 font-bold">{activeWorkingTask.acDetail.quantity} Unit x {activeWorkingTask.acDetail.serviceType === 'none' ? activeWorkingTask.acDetail.category : activeWorkingTask.acDetail.serviceType}</strong></div>
                <div>💬 Note Customer: <span className="italic">"{activeWorkingTask.notes || 'Tanpa catatan'}"</span></div>
              </div>

              {/* Step 1: Simulated After Photo upload */}
              <div className="bg-white border rounded-xl p-3.5 space-y-2.5">
                <span className="text-[8.5px] font-black uppercase text-purple-600 tracking-wider block">1. Ambil Foto Selesai (After Pengerjaan)</span>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Preset options */}
                  <div className="space-y-1">
                    <span className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider block">Pilih Preset Simulasi:</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {mockAfterImages.map((img, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setPhotoAfterUrl(img)}
                          className={`w-18 h-12 rounded border overflow-hidden relative ${photoAfterUrl === img && !photoAfterUrl.startsWith('data:') ? 'ring-2 ring-purple-600 border-transparent shadow' : 'border-slate-300'}`}
                        >
                          <img src={img} alt="clean preset" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          {photoAfterUrl === img && !photoAfterUrl.startsWith('data:') && <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-xs">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Upload */}
                  <div className="flex-1 flex flex-col justify-end">
                    <span className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Upload Foto Selesai:</span>
                    <label className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300/85 hover:border-slate-400/85 text-slate-700 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider justify-center cursor-pointer transition h-12 select-none">
                      <Camera size={14} className="text-slate-500" />
                      <span>{photoAfterUrl.startsWith('data:') ? 'Foto Terupload' : 'Upload Foto Kerja'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleImageUpload(e, 'after')} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>

                {/* Preview of custom upload if any */}
                {photoAfterUrl.startsWith('data:') && (
                  <div className="bg-slate-50 p-2 border border-purple-200/50 rounded-xl relative flex items-center gap-2">
                    <img src={photoAfterUrl} alt="Custom upload draft" className="w-18 h-12 object-cover rounded border" />
                    <div className="text-left">
                      <span className="text-[8px] text-emerald-600 font-extrabold uppercase tracking-wide bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Real Uploaded</span>
                      <p className="text-[9.5px] text-slate-550 mt-0.5 font-medium">Selesai diproses! Foto ini akan dikirim sebagai bukti penyelesaian AC.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhotoAfterUrl(mockAfterImages[0])}
                      className="absolute right-2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Gunakan simulasi kembali"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2: Add-Ons materials usage */}
              <div className="bg-white border rounded-xl p-3.5 space-y-3">
                <span className="text-[8.5px] font-black uppercase text-purple-600 tracking-wider block">2. Input Sparepart & Material Tambahan</span>
                <p className="text-[10px] text-slate-400 leading-none">Sesuaikan dengan sparepart yang digunakan di lapangan (jika ada):</p>
                
                {/* Select row */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <select
                      value={selectedAddonId}
                      onChange={(e) => setSelectedAddonId(e.target.value)}
                      className="w-full bg-slate-50 border text-xs p-2 rounded-xl outline-none focus:border-purple-600 font-bold"
                    >
                      {addons.map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({formatRupiah(a.price)})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 self-end">
                    <button
                      type="button"
                      onClick={() => setAddonQuantity(Math.max(1, addonQuantity - 1))}
                      className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg font-bold text-xs hover:bg-slate-200 transition"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs bg-white font-extrabold py-1 border rounded">{addonQuantity}</span>
                    <button
                      type="button"
                      onClick={() => setAddonQuantity(Math.min(10, addonQuantity + 1))}
                      className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg font-bold text-xs hover:bg-slate-200 transition"
                    >
                      +
                    </button>

                    <button
                      type="button"
                      onClick={handleAddAddonItem}
                      className="bg-purple-600 text-white font-black text-[10px] py-2 px-3 rounded-lg uppercase transition cursor-pointer"
                    >
                      Tambah
                    </button>
                  </div>
                </div>

                {/* Listing of elements used */}
                <div className="space-y-1 pt-1.5 border-t border-slate-100">
                  {addonsUsed.length === 0 ? (
                    <span className="text-[9.5px] text-slate-400 font-bold italic block">Belum ada sparepart yang ditambahkan (Hanya jasa dasar).</span>
                  ) : (
                    <div className="space-y-1.5 animate-fade">
                      {addonsUsed.map(add => (
                        <div key={add.id} className="flex justify-between items-center text-[10.5px]">
                          <span className="font-semibold text-slate-700">• {add.name} (x{add.quantity}) <strong className="font-mono text-slate-400">@{formatRupiah(add.price)}</strong></span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800">{formatRupiah(add.price * add.quantity)}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAddonItem(add.id)}
                              className="text-red-500 hover:bg-red-50 p-1 rounded-md transition"
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

              {/* Step 3: Text completion notes */}
              <div>
                <label className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mb-1">3. Catatan Penyelesaian Kerja AC</label>
                <textarea
                  placeholder="contoh: Selesai menyemprot debu casing dalam, membersihkan filter air, menyalin freon 0.5 amp..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs p-3 rounded-xl outline-none focus:border-purple-600 h-20 resize-none font-medium leading-relaxed"
                ></textarea>
              </div>

              {/* Action Submit */}
              <button
                type="button"
                onClick={() => handleSendBillToCustomer(activeWorkingTask.id)}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs py-3.5 rounded-xl uppercase tracking-widest transition cursor-pointer shadow-md"
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
