'use client';

import React, { useState } from 'react';
import { OrderStatus } from '@/types';
import { useApp } from '@/lib/auth-context';
import { LogOut, TrendingUp, Users, DollarSign, Star, Briefcase, Settings } from 'lucide-react';

export default function OwnerDashboard() {
  const { activeUser, orders, logout, appSettings, updateAppSettings } = useApp();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editName, setEditName] = useState(appSettings?.business_name || '');
  const [editLogo, setEditLogo] = useState(appSettings?.business_logo || '');

  const formatRupiah = (num: any) => {
    return 'Rp' + Number(num || 0).toLocaleString('id-ID');
  };

  const handleOpenSettings = () => {
    setEditName(appSettings?.business_name || '');
    setEditLogo(appSettings?.business_logo || '');
    setIsSettingsOpen(true);
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

  // Filter completed orders for revenue
  const completedOrders = orders.filter(o => o.status === OrderStatus.SELESAI);
  
  // Calculations
  const totalBaseRevenue = completedOrders.reduce((sum, o) => sum + (Number(o.serviceCost) || 0), 0);
  const totalAddonsRevenue = completedOrders.reduce((sum, o) => sum + (Number(o.addonsCost) || 0), 0);
  const totalRevenue = totalBaseRevenue + totalAddonsRevenue;

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
  };

  if (!activeUser) return null;

  return (
    <div className="flex-1 flex flex-col bg-slate-100 text-slate-800 min-h-0 h-full overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900 px-5 py-4 shrink-0 shadow-md text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <span className="text-[8px] bg-indigo-500 text-white font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
            Laporan Bisnis Owner
          </span>
          <h2 className="text-base font-black mt-1 text-white">Analytics & KPI Dashboard</h2>
          <p className="text-[10px] text-slate-400 mt-1">Pemilik: <strong className="text-white">{activeUser.name}</strong></p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenSettings}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black uppercase rounded-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <Settings size={12} />
            Pengaturan Bisnis
          </button>
          <button
            onClick={logout}
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-black uppercase rounded-lg transition cursor-pointer"
          >
            Keluar
          </button>
        </div>
      </div>

      {/* Body - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Revenue */}
          <div className="bg-white border rounded-2xl p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <DollarSign size={20} />
              </div>
              <div className="text-left">
                <span className="text-[8.5px] text-slate-400 font-black uppercase tracking-wider block">Total Pendapatan</span>
                <span className="text-sm font-black text-slate-850 font-mono mt-0.5 block">{formatRupiah(totalRevenue)}</span>
                <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-black mt-1 inline-block">Akurat</span>
              </div>
            </div>
          </div>

          {/* Average Rating */}
          <div className="bg-white border rounded-2xl p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Star size={20} className="fill-amber-500 text-amber-500" />
              </div>
              <div className="text-left">
                <span className="text-[8.5px] text-slate-400 font-black uppercase tracking-wider block">Rerata Kinerja</span>
                <span className="text-sm font-black text-slate-850 font-mono mt-0.5 block">{averageRating} / 5.0 ★</span>
                <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-semibold mt-1 inline-block">{ratedOrders.length} Ulasan</span>
              </div>
            </div>
          </div>

          {/* Completed Orders */}
          <div className="bg-white border rounded-2xl p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Briefcase size={20} />
              </div>
              <div className="text-left">
                <span className="text-[8.5px] text-slate-400 font-black uppercase tracking-wider block">Servis Rampung</span>
                <span className="text-sm font-black text-slate-850 font-mono mt-0.5 block">{completedOrders.length} Pekerjaan</span>
                <span className="text-[9px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-semibold mt-1 inline-block">{orders.length} Total Order</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Overview */}
        <div className="bg-white border rounded-2xl p-4 shadow-xs">
          <h3 className="font-black text-xs uppercase tracking-wider text-slate-800 mb-4">Ringkasan Status Pesanan</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: 'Menunggu', key: OrderStatus.MENUNGGU, color: 'bg-amber-50 text-amber-800 border-amber-200' },
              { label: 'Ditugaskan', key: OrderStatus.DITUGASKAN, color: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
              { label: 'Cek Layanan', key: OrderStatus.CEK_LAYANAN, color: 'bg-blue-50 text-blue-800 border-blue-200' },
              { label: 'Pengerjaan', key: OrderStatus.PENGERJAAN, color: 'bg-purple-50 text-purple-800 border-purple-200' },
              { label: 'Payment', key: OrderStatus.PAYMENT, color: 'bg-rose-50 text-rose-800 border-rose-200' },
              { label: 'Selesai', key: OrderStatus.SELESAI, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
            ].map(({ label, key, color }) => (
              <div key={key} className={`border rounded-xl p-3 text-center ${color}`}>
                <div className="text-xs font-black uppercase">{label}</div>
                <div className="text-lg font-black mt-1">{statusCounts[key]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-2xl p-4 shadow-xs">
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-800 mb-4">Aliran Kas</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl border border-blue-200">
                <div>
                  <span className="text-[9px] font-black text-blue-600 uppercase">Jasa Cuci</span>
                  <p className="text-[10px] text-blue-700 font-semibold mt-1">{completedOrders.length} Pekerjaan Selesai</p>
                </div>
                <span className="text-sm font-mono font-black text-blue-800">{formatRupiah(totalBaseRevenue)}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl border border-green-200">
                <div>
                  <span className="text-[9px] font-black text-green-600 uppercase">Sparepart/Addon</span>
                  <p className="text-[10px] text-green-700 font-semibold mt-1">Perlengkapan Tambahan</p>
                </div>
                <span className="text-sm font-mono font-black text-green-800">{formatRupiah(totalAddonsRevenue)}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-xl border border-indigo-200 font-black">
                <span className="text-[9px] uppercase text-indigo-600">Total Omzet</span>
                <span className="text-sm font-mono text-indigo-800">{formatRupiah(totalRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="bg-white border rounded-2xl p-4 shadow-xs">
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-800 mb-4">Statistik Bisnis</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-600 font-semibold">Total Pesanan</span>
                <span className="text-sm font-black text-slate-800">{orders.length}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-[10px] text-slate-600 font-semibold">Selesai & Dibayar</span>
                <span className="text-sm font-black text-emerald-700">{completedOrders.length}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-[10px] text-slate-600 font-semibold">Dalam Proses</span>
                <span className="text-sm font-black text-amber-700">{orders.filter(o => o.status !== OrderStatus.SELESAI && o.status !== OrderStatus.MENUNGGU).length}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-[10px] text-slate-600 font-semibold">Menunggu Penugasan</span>
                <span className="text-sm font-black text-slate-700">{statusCounts[OrderStatus.MENUNGGU]}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-[10px] text-slate-600 font-semibold">Rata-rata Rating</span>
                <span className="text-sm font-black text-amber-600">{averageRating} ★</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white border rounded-2xl p-4 shadow-xs">
          <h3 className="font-black text-xs uppercase tracking-wider text-slate-800 mb-4">Pesanan Terbaru</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {orders.slice(-10).reverse().map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 text-[10px]">
                <div className="flex-1">
                  <div className="font-bold text-slate-800">{order.customerName}</div>
                  <div className="text-slate-500 mt-0.5 flex gap-1.5 items-center flex-wrap">
                    <span>{order.scheduledDate}</span>
                    <span>•</span>
                    <span className={`text-[8.5px] font-black uppercase ${
                      order.paymentMethod === 'TRANSFER' ? 'text-indigo-600' :
                      order.paymentMethod === 'CASH' ? 'text-emerald-600' : 'text-slate-500'
                    }`}>
                      {order.paymentMethod === 'TRANSFER' ? '💳 TRANSFER (XENDIT)' :
                       order.paymentMethod === 'CASH' ? '💵 TUNAI (CASH)' : '💵 TUNAI (BAWAAN)'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-700">{formatRupiah(Number(order.serviceCost || 0) + Number(order.addonsCost || 0))}</div>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded inline-block mt-1 ${
                    order.status === OrderStatus.SELESAI ? 'bg-emerald-100 text-emerald-800' :
                    order.status === OrderStatus.MENUNGGU ? 'bg-amber-100 text-amber-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-[10px]">
                Belum ada pesanan
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 transform scale-100 transition duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Settings size={18} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Pengaturan Profil Usaha</h3>
            </div>
            
            <div className="space-y-4">
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
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase rounded-lg transition"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  await updateAppSettings(editName, editLogo);
                  setIsSettingsOpen(false);
                }}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase rounded-lg shadow-sm transition"
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
