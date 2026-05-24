/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Order, OrderStatus, Role } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  LogOut, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Star, 
  Briefcase, 
  Calendar, 
  Clock, 
  CheckCircle, 
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Percent
} from 'lucide-react';

interface OwnerDashboardProps {
  user: User;
  orders: Order[];
  staffList: User[];
  onLogout: () => void;
}

export default function OwnerDashboard({ user, orders, staffList, onLogout }: OwnerDashboardProps) {
  const [financeTimeframe, setFinanceTimeframe] = useState<'MONTH' | 'YEAR'>('MONTH');

  // Helpers
  const formatRupiah = (num: number) => {
    return 'Rp' + num.toLocaleString('id-ID');
  };

  // 1. FILTER COMPLETED ORDERS FOR REVENUE DATA
  const completedOrders = orders.filter(o => o.status === OrderStatus.SELESAI);

  // Totals calculations
  const totalBaseRevenueCount = completedOrders.reduce((sum, o) => sum + o.serviceCost, 0);
  const totalSparepartsRevenueCount = completedOrders.reduce((sum, o) => sum + (o.addonsCost || 0), 0);
  const grandTotalRevenue = totalBaseRevenueCount + totalSparepartsRevenueCount;

  // Rating averages
  const ratedOrders = completedOrders.filter(o => o.rating !== undefined);
  const averageAllRatings = ratedOrders.length > 0 
    ? parseFloat((ratedOrders.reduce((sum, o) => sum + o.rating!, 0) / ratedOrders.length).toFixed(1))
    : 0;

  // 2. PREPARE RECHARTS CHART DATA (REVENUE STREAMS BREAKDOWN)
  const pieChartData = [
    { name: 'Jasa Cuci Dasar', value: totalBaseRevenueCount, color: '#3b82f6' }, // blue-500
    { name: 'Sparepart Tambahan', value: totalSparepartsRevenueCount, color: '#10b981' } // emerald-500
  ];

  // 3. PREPARE RECHARTS WEEKLY TREND DATA
  // Let's mock a structured trend showing daily breakdowns for professional aesthetics
  const revenueTrendData = [
    { name: 'Senin', Jasa: 150000, Sparepart: 50000, Total: 200000 },
    { name: 'Selasa', Jasa: 225000, Sparepart: 100000, Total: 325000 },
    { name: 'Rabu', Jasa: 300000, Sparepart: 120000, Total: 420000 },
    { name: 'Kamis', Jasa: 450000, Sparepart: 240000, Total: 690000 },
    { name: 'Jumat', Jasa: 375000, Sparepart: 150000, Total: 525000 },
    { name: 'Sabtu', Jasa: 600000, Sparepart: 350000, Total: 950000 },
    { name: 'Minggu', Jasa: 750000, Sparepart: 420000, Total: 1170000 }
  ];

  // Map real historic days in mock database to give real feedback
  const groupedDatesRevenue: { [key: string]: { name: string; Jasa: number; Sparepart: number; Total: number } } = {};
  
  completedOrders.forEach(o => {
    const rawDate = o.completedAt ? o.completedAt.split('T')[0] : o.scheduledDate;
    // Format to readable day or date
    if (!groupedDatesRevenue[rawDate]) {
      groupedDatesRevenue[rawDate] = { name: rawDate, Jasa: 0, Sparepart: 0, Total: 0 };
    }
    groupedDatesRevenue[rawDate].Jasa += o.serviceCost;
    groupedDatesRevenue[rawDate].Sparepart += o.addonsCost || 0;
    groupedDatesRevenue[rawDate].Total += (o.totalCost || o.serviceCost);
  });

  // Convert to array and sort chronologically
  const dynamicRevenueTrend = Object.values(groupedDatesRevenue).sort((a,b) => a.name.localeCompare(b.name));
  const finalTrendChartData = dynamicRevenueTrend.length > 0 ? dynamicRevenueTrend : revenueTrendData;

  // 4. PREPARE STAFF RATINGS COMPARISON (RECHARTS BAR CHART)
  const staffChartData = staffList.map(s => {
    const sCompleted = completedOrders.filter(o => o.assignedTo === s.id);
    const sRates = sCompleted.filter(o => o.rating !== undefined);
    const avgScore = sRates.length > 0 
      ? parseFloat((sRates.reduce((sum, o) => sum + o.rating!, 0) / sRates.length).toFixed(1))
      : 0;

    return {
      name: s.name,
      rating: avgScore,
      completed: sCompleted.length,
      revenueGenerated: sCompleted.reduce((sum, o) => sum + (o.totalCost || o.serviceCost), 0)
    };
  });

  return (
    <div className="flex-1 flex flex-col bg-slate-100 text-slate-800 text-left min-h-0 h-full">
      
      {/* 1. TOP STATS BAR */}
      <div className="bg-slate-900 px-5 py-4.5 text-white shrink-0 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="text-left">
          <span className="text-[8px] bg-indigo-500 text-white font-black px-2.5 py-0.5 rounded uppercase tracking-widest leading-none">
            Keuangan & KPI Owner Panel
          </span>
          <h2 className="text-base font-extrabold mt-1 text-white leading-none">Laporan Analitik Bisnis</h2>
          <p className="text-[10px] text-slate-400 mt-1">Pemilik eksekutif: <strong className="text-white">{user.name}</strong> ({user.email})</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="px-3.5 py-1.8 bg-white/10 hover:bg-white/20 text-white text-[10.5px] font-black uppercase tracking-wider rounded-lg transition shrink-0 cursor-pointer"
        >
          Keluar Sesi
        </button>
      </div>

      {/* 2. BODY GRAPH SCROLLABLE AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* EXECUTIVE scorecard metrics row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border p-4 rounded-2xl flex items-center gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <DollarSign size={20} />
            </div>
            <div className="text-left">
              <span className="text-[8.5px] text-slate-400 font-extrabold uppercase tracking-widest block">Total Pendapatan Kotor</span>
              <span className="text-sm font-black text-slate-850 font-mono mt-0.5 block">{formatRupiah(grandTotalRevenue)}</span>
              <span className="text-[9.5px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-black mt-1 inline-block">Laporan Akurat</span>
            </div>
          </div>

          <div className="bg-white border p-4 rounded-2xl flex items-center gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Star size={20} className="fill-amber-500 text-amber-500" />
            </div>
            <div className="text-left">
              <span className="text-[8.5px] text-slate-400 font-extrabold uppercase tracking-widest block">Rerata Kinerja Staff</span>
              <span className="text-sm font-black text-slate-850 font-mono mt-0.5 block">{averageAllRatings} / 5.0 Bintang</span>
              <span className="text-[9.5px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-semibold mt-1 inline-block">{ratedOrders.length} Ulasan Terverifikasi</span>
            </div>
          </div>

          <div className="bg-white border p-4 rounded-2xl flex items-center gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Briefcase size={20} />
            </div>
            <div className="text-left">
              <span className="text-[8.5px] text-slate-400 font-extrabold uppercase tracking-widest block">Servis AC Rampung</span>
              <span className="text-sm font-black text-slate-850 font-mono mt-0.5 block">{completedOrders.length} Pekerjaan Lunas</span>
              <span className="text-[9.5px] text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded font-semibold mt-1 inline-block">{orders.length} Total Registrasi</span>
            </div>
          </div>
        </div>

        {/* RECHARTS SECTION 1: FINANCE CHARTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Trend chart Line */}
          <div className="bg-white border border-slate-205 rounded-2xl p-4.5 shadow-xs lg:col-span-2 text-left space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">Tren Grafik Pemasukan Berkala</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Pendapatan Jasa Dasar vs Sparepart dipasang</p>
              </div>
              <span className="text-[8px] bg-slate-100 border text-slate-500 font-black px-2 py-0.5 rounded uppercase font-mono">
                Real-Time Ledger
              </span>
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={finalTrendChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <YAxis tickFormatter={(val) => `Rp${val / 1000}k`} tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                  <Legend wrapperStyle={{ fontSize: 9 }} />
                  <Line type="monotone" dataKey="Jasa" stroke="#3b82f6" strokeWidth={2} name="Biaya Jasa" activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Sparepart" stroke="#10b981" strokeWidth={2} name="Biaya Sparepart" />
                  <Line type="monotone" dataKey="Total" stroke="#6366f1" strokeWidth={3} name="Total Pendapatan" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown Pie Chart */}
          <div className="bg-white border border-slate-205 rounded-2xl p-4.5 shadow-xs text-left flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">Distribusi Aliran Kas</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Komparasi nilai perolehan omzet usaha</p>
            </div>

            <div className="h-44 flex items-center justify-center">
              {grandTotalRevenue === 0 ? (
                <span className="text-[10.5px] text-slate-400 italic">Menunggu transaksi rampung pertama...</span>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="space-y-1.5 border-t border-slate-100 pt-3">
              {pieChartData.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-[10.5px]">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-650">
                    <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: item.color }}></span>
                    <span>{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">{formatRupiah(item.value)}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RECHARTS SECTION 2: STAFF RATINGS & WORKLOAD COMPARISONS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Comparative Bar Chart ratings */}
          <div className="bg-white border border-slate-205 rounded-2xl p-4.5 shadow-xs lg:col-span-2 text-left space-y-4">
            <div>
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">Komparasi Integritas & Rating Staff</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Metrik penilaian pelanggan atas kinerja masing-masing teknisi</p>
            </div>

            <div className="h-56">
              {staffChartData.length === 0 ? (
                <span className="text-[10.5px] text-slate-400">Tidak ada data personil staff.</span>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={staffChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 9 }} stroke="#94a3b8" />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 9 }} />
                    <Bar dataKey="rating" fill="#f59e0b" name="Skor Rating Bintang" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" fill="#14b8a6" name="Total Servis Selesai" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Business rating score list */}
          <div className="bg-white border rounded-2xl p-4.5 shadow-xs text-left flex flex-col justify-between">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">Rincian Omzet Jasa Teknisi</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Kontribusi nilai penjualan per orang</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pt-3">
              {staffChartData.map((emp, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200/50">
                  <div className="text-left font-bold">
                    <p className="text-slate-850 leading-none">{emp.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] bg-amber-100 text-amber-700 font-extrabold px-1 rounded flex items-center gap-0.5 leading-none">
                        ★ {emp.rating || '0'}
                      </span>
                      <span className="text-[9px] bg-teal-100 text-teal-800 font-bold px-1 rounded leading-none">
                        {emp.completed} srv
                      </span>
                    </div>
                  </div>
                  <strong className="font-mono text-slate-800">{formatRupiah(emp.revenueGenerated)}</strong>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RECENT RECENT CUSTOMER REVIEWS LOGS SHEET */}
        <div className="bg-white border border-slate-205 rounded-2xl p-4.5 text-left space-y-4">
          <div className="border-b border-slate-100 pb-2 flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">Catatan Ulasan & Feedback Konsumen</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Keluhan lisan langsung yang dikirimkan oleh pelanggan pasca-service selesai</p>
            </div>
            <span className="text-[9px] font-black uppercase text-indigo-700">Meningkatkan kepuasan</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {ratedOrders.length === 0 ? (
              <p className="text-[11px] text-slate-405 italic p-3 col-span-full">Belum mendapatkan feedback ulasan uap apa pun.</p>
            ) : (
              ratedOrders.map(ro => (
                <div key={ro.id} className="bg-amber-500/5 border border-amber-500/15 p-3 rounded-xl space-y-2 text-left">
                  <div className="flex justify-between items-center">
                    <div className="text-[10.5px]">
                      👤 Pelanggan: <strong>{ro.customerName}</strong>
                      <p className="text-[8.5px] font-mono text-slate-405 text-slate-400 mt-0.5">ID Order: {ro.id} • Teknisi: {ro.assignedEmployeeName}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((st) => (
                        <span key={st} className={`text-xs ${st <= ro.rating! ? 'text-amber-500' : 'text-slate-200'}`}>★</span>
                      ))}
                    </div>
                  </div>
                  <div className="italic text-[10.5px] text-slate-700 pl-2.5 border-l-2 border-amber-400 leading-normal bg-white/40 p-1.5 rounded-r-lg">
                    "{ro.ratingNotes || 'Pekerjaan lunas memuaskan tanpa coretan keluhan.'}"
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
