'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/auth-context';
import * as api from '@/lib/api';
import {
  Phone,
  MessageCircle,
  Wrench,
  CheckCircle,
  MapPin,
  HelpCircle,
  Info,
  Star,
  Users,
  Compass,
  ArrowRight,
  Shield,
  Loader,
  X,
  AlertTriangle,
  ThumbsUp,
  Check,
  Settings,
  Wind,
  Instagram,
  Menu
} from 'lucide-react';

export default function SugarACCompanyProfile() {
  const { activeUser, appSettings, regions } = useApp();
  const router = useRouter();

  // Region and branch selection
  const [selectedBranch, setSelectedBranch] = useState('');

  useEffect(() => {
    if (regions && regions.length > 0 && !selectedBranch) {
      // Prioritaskan Palembang / region-utama jika ada
      const utamaRegion = regions.find(r => r.id === 'region-utama' || r.name.toLowerCase() === 'palembang');
      setSelectedBranch(utamaRegion ? utamaRegion.name : regions[0].name);
    }
  }, [regions, selectedBranch]);

  // Active Service Tab
  const [activeServiceTab, setActiveServiceTab] = useState('Cuci AC');

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const businessName = appSettings?.['GLOBAL']?.business_name || 'Sugar AC';

  const activeRegion = regions?.find(r => r.name === selectedBranch);
  const activeRegionId = activeRegion?.id;

  // Get dynamic phone from branch settings, fallback to global, fallback to default
  const dynamicPhone = appSettings?.[activeRegionId || '']?.phone_number || appSettings?.['GLOBAL']?.phone_number || '6281284976852';
  const cleanPhone = dynamicPhone.replace(/\D/g, '');

  const handleQuickContact = (type: 'wa' | 'phone' | 'install' | 'trade', service?: string) => {
    if (type === 'wa') {
      window.open(`https://wa.me/${cleanPhone}?text=Halo%20${encodeURIComponent(businessName)}%2C%20saya%20butuh%20layanan%20AC.`, '_blank');
    } else if (type === 'phone') {
      window.open(`tel:+${cleanPhone}`, '_self');
    } else if (type === 'install') {
      const text = service ? `Halo ${businessName}, saya ingin memesan layanan ${service}.` : `Halo ${businessName}, saya ingin pesan layanan AC.`;
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
    } else if (type === 'trade') {
      window.open(`https://wa.me/${cleanPhone}?text=Halo%20${encodeURIComponent(businessName)}%2C%20saya%2520ingin%2520tanya%2520jual%2520beli%2520AC%2520baru%252Fbekas.`, '_blank');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800 relative overflow-x-hidden">
      {/* ================= HEADER NAVBAR ================= */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-xs">
        <div className="w-full px-6 lg:px-12 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-md shadow-blue-500/25 overflow-hidden group-hover:scale-105 transition-transform duration-300">
              {appSettings?.['GLOBAL']?.business_logo ? (
                <img src={appSettings['GLOBAL'].business_logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span>❄️</span>
              )}
            </div>
            <div>
              <span className="text-base font-black tracking-wider text-slate-900 block group-hover:text-blue-600 transition-colors duration-300">{businessName.toUpperCase()}</span>
              <span className="text-[9px] font-bold text-blue-600 block uppercase tracking-widest -mt-0.5">Sejuk Segar AC</span>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#hero" className="hover:text-blue-600 transition">Beranda</a>
            <a href="#services" className="hover:text-blue-600 transition">Pelayanan Kami</a>
            <a href="#education" className="hover:text-blue-600 transition">Edukasi Perawatan</a>
            <a href="#why-us" className="hover:text-blue-600 transition">Tentang Kami</a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (activeUser) {
                  router.push(`/dashboard/${activeUser.role.toLowerCase()}`);
                } else {
                  router.push('/login');
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-6 py-2.5 rounded-full uppercase tracking-widest shadow-md shadow-blue-600/20 transition hidden sm:block"
            >
              {activeUser ? 'Dashboard' : 'Login'}
            </button>

            {/* Hamburger Button for Mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-slate-600 hover:text-blue-600 p-2 focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU DROPDOWN */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-6 py-5 shadow-2xl absolute w-full left-0 top-16 z-50 rounded-b-2xl animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-4 text-sm font-bold text-slate-700">
              <a href="#hero" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-blue-600 transition">Beranda</a>
              <a href="#services" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-blue-600 transition">Pelayanan Kami</a>
              <a href="#education" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-blue-600 transition">Edukasi Perawatan</a>
              <a href="#why-us" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-blue-600 transition">Tentang Kami</a>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (activeUser) {
                    router.push(`/dashboard/${activeUser.role.toLowerCase()}`);
                  } else {
                    router.push('/login');
                  }
                }}
                className="mt-4 bg-blue-600 text-white font-black text-xs px-6 py-3.5 rounded-xl uppercase tracking-widest text-center shadow-lg shadow-blue-600/20 sm:hidden"
              >
                {activeUser ? 'Dashboard' : 'Login'}
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* ================= HERO SECTION ================= */}
      <section id="hero" className="relative min-h-[600px] md:min-h-[650px] flex items-center overflow-hidden bg-slate-50">
        {/* Background Image (Right half on Desktop, Full on Mobile) */}
        <div className="absolute inset-y-0 right-0 w-full md:w-[60%] lg:w-[65%] z-0">
          <img
            src="/hero_technicians.png"
            alt="Sugar AC Technicians Team"
            className="w-full h-full object-cover object-center"
          />
          {/* Seamless, extra-wide gradient blend to the left solid background */}
          <div className="hidden md:block absolute inset-y-0 left-0 w-80 lg:w-96 bg-gradient-to-r from-slate-50 via-slate-50/90 to-transparent"></div>
          {/* Strong overlay for mobile so text stays readable */}
          <div className="absolute inset-0 bg-slate-50/90 md:hidden"></div>
        </div>

        <div className="relative z-10 max-w-[1440px] mx-auto px-6 lg:px-12 xl:px-16 w-full py-20 mt-8">
          <div className="max-w-xl lg:max-w-2xl space-y-7">
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-slate-900 leading-[1.15] tracking-tight">
              Layanan Service AC <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-black">Terpercaya</span>
            </h1>
            <p className="text-[15px] md:text-base text-slate-600 leading-relaxed font-medium">
              Sugar AC adalah mitra terpercaya untuk segala kebutuhan layanan AC Anda. Tim teknisi ahli kami siap memberikan solusi perbaikan AC bocor, tidak dingin, cuci AC berkala, hingga bongkar pasang AC dengan garansi resmi.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-5">
              <button
                onClick={() => handleQuickContact('wa')}
                className="bg-slate-900 hover:bg-blue-600 text-white font-extrabold text-[11px] py-4 px-8 uppercase tracking-widest transition-colors duration-300 w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} /> Pesan Sekarang
              </button>
              <button
                onClick={() => document.getElementById('footer-branches')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-blue-600 hover:bg-slate-900 text-white font-extrabold text-[11px] py-4 px-8 uppercase tracking-widest transition-colors duration-300 w-full sm:w-auto shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                <Phone size={16} /> Hubungi Kami
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SERVICES & PACKAGES SECTION ================= */}
      <section id="services" className="py-16 bg-slate-50 border-y border-slate-150">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 xl:px-16">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
            <h2 className="text-3xl font-black text-slate-900">Layanan & Jasa Sugar AC</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Solusi Terpadu Untuk Segala Kebutuhan AC Anda</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Tabs */}
            <div className="w-full lg:w-1/3 flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 hide-scrollbar snap-x">
              {[
                { id: 'Cuci AC', title: 'Cuci AC Rutin', icon: <Wind size={18} /> },
                { id: 'Perbaikan AC', title: 'Perbaikan AC', icon: <Settings size={18} /> },
                { id: 'Bongkar Pasang', title: 'Bongkar Pasang AC', icon: <Wrench size={18} /> },
                { id: 'Service Bocor', title: 'Service AC Bocor', icon: <Shield size={18} /> },
                { id: 'Freon', title: 'Isi & Tambah Freon', icon: <AlertTriangle size={18} /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveServiceTab(tab.id)}
                  className={`flex items-center justify-center lg:justify-start gap-2 lg:gap-3 w-auto lg:w-full text-left px-5 lg:px-5 py-3.5 lg:py-4 rounded-xl lg:rounded-2xl transition duration-200 snap-center shrink-0 whitespace-nowrap lg:whitespace-normal font-extrabold text-[13px] lg:text-sm border ${activeServiceTab === tab.id ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'}`}
                >
                  <span className={activeServiceTab === tab.id ? 'text-white' : 'text-blue-500'}>{tab.icon}</span>
                  {tab.title}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="w-full lg:w-2/3">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                {activeServiceTab === 'Cuci AC' && (
                  <div className="space-y-5 animate-fade-in">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">Cuci AC Secara Rutin</h3>
                      <p className="text-[12px] text-slate-500 font-medium leading-relaxed mt-2">
                        Cuci AC adalah salah satu upaya penting untuk membuat AC lebih dingin dan awet. Pembersihan AC ini bertujuan untuk menghilangkan kotoran, kerak lendir, dan debu yang dapat mengganggu kinerja AC Anda. Dengan melakukan Cuci AC secara rutin, Anda dapat menikmati kualitas udara yang lebih baik dan memastikan AC Anda tetap berfungsi optimal.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2"><CheckCircle size={16} className="text-blue-600" /> Ringkasan Pekerjaan:</h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-[11.5px] text-slate-600 font-medium">
                        <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Membersihkan Indoor & Outdoor AC untuk performa maksimal.</li>
                        <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Mencuci Evaporator & Condenser untuk efisiensi pendinginan.</li>
                        <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Menembak saluran pembuangan air AC agar tidak tersumbat.</li>
                        <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Mencuci Filter Udara dan Body AC dari debu yang menempel.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeServiceTab === 'Perbaikan AC' && (
                  <div className="space-y-5 animate-fade-in">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">Layanan Perbaikan AC</h3>
                      <p className="text-[12px] text-slate-500 font-medium leading-relaxed mt-2">
                        Dengan layanan perbaikan AC kami, Anda dapat dengan mudah mengatasi berbagai masalah AC Anda. Teknisi kami yang berpengalaman siap membantu memastikan AC Anda berfungsi optimal dengan jaminan perbaikan tanpa biaya tersembunyi.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2"><CheckCircle size={16} className="text-blue-600" /> Ringkasan Pekerjaan:</h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-[11.5px] text-slate-600 font-medium">
                        <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Memperbaiki AC tidak dingin, bocor air, atau bersuara bising.</li>
                        <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Perbaikan masalah pada motor fan indoor maupun outdoor.</li>
                        <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Mengganti komponen rusak seperti kapasitor dan kompresor.</li>
                        <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Perbaikan kelistrikan, modul Inverter / Non-Inverter, & PCB.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeServiceTab === 'Bongkar Pasang' && (
                  <div className="space-y-5 animate-fade-in">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">Bongkar Pasang / Instalasi AC</h3>
                      <p className="text-[12px] text-slate-500 font-medium leading-relaxed mt-2">
                        Dapatkan layanan profesional dan handal untuk memastikan AC Anda terpasang dengan sempurna dan dibongkar dengan hati-hati. Tim berpengalaman kami siap memberikan kenyamanan dan kualitas udara optimal di rumah atau kantor Anda.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2"><CheckCircle size={16} className="text-blue-600" /> Proses Pengerjaan:</h4>
                      <ul className="space-y-3 text-[11.5px] text-slate-600 font-medium">
                        <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">1.</span> <strong>Penilaian Lokasi:</strong> Menentukan lokasi terbaik untuk sirkulasi udara dan estetika ruangan.</li>
                        <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">2.</span> <strong>Pemilihan Unit:</strong> Membantu rekomendasi efisiensi energi jika memasang unit baru.</li>
                        <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">3.</span> <strong>Pemasangan Profesional:</strong> Pemasangan pipa dan kabel yang presisi dan sangat rapi.</li>
                        <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">4.</span> <strong>Uji Coba:</strong> Verifikasi kinerja setelah pemasangan dan pengenalan cara merawat AC.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeServiceTab === 'Service Bocor' && (
                  <div className="space-y-5 animate-fade-in">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">Service AC Bocor / Menetes</h3>
                      <p className="text-[12px] text-slate-500 font-medium leading-relaxed mt-2">
                        Teknisi profesional kami akan segera mendiagnosa dan memperbaiki masalah tetesan air AC di ruangan Anda secara teliti. Kami mengutamakan kepuasan dan hasil pengerjaan yang bersih, tuntas, serta bebas masalah di kemudian hari.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2"><CheckCircle size={16} className="text-blue-600" /> Tahapan Penanganan:</h4>
                      <ul className="space-y-3 text-[11.5px] text-slate-600 font-medium">
                        <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">1.</span> <strong>Diagnosa Mendalam:</strong> Pemeriksaan menyeluruh menemukan titik utama kebocoran (pipa / pembuangan).</li>
                        <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">2.</span> <strong>Penanganan Penyumbatan:</strong> Pembersihan lendir/kotoran penyebab air menetes dari talang air.</li>
                        <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">3.</span> <strong>Penggantian Komponen:</strong> Mengganti isolasi atau pipa pembuangan yang rusak atau bocor.</li>
                        <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">4.</span> <strong>Pengecekan Freon:</strong> Memeriksa apakah kebocoran air disertai masalah kebocoran gas pendingin.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeServiceTab === 'Freon' && (
                  <div className="space-y-5 animate-fade-in">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">Pengisian & Tambah Freon AC</h3>
                      <p className="text-[12px] text-slate-500 font-medium leading-relaxed mt-2">
                        Freon adalah gas pendingin penting dalam proses kerja AC. Kehabisan freon adalah penyebab utama AC tidak dingin. Layanan kami mencakup pengisian tekanan yang tepat sekaligus memastikan tidak ada kebocoran di jalur sistem pendingin.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2"><CheckCircle size={16} className="text-blue-600" /> Ringkasan Pekerjaan:</h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-[11.5px] text-slate-600 font-medium">
                        <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Cek Tekanan Freon menggunakan manifold gauge.</li>
                        <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Mendeteksi titik kebocoran pada instalasi pipa AC.</li>
                        <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Mengisi atau Menambah takaran Freon sesuai kapasitas.</li>
                        <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Mengencangkan nepel baut untuk mencegah freon terbuang lagi.</li>
                      </ul>
                    </div>
                  </div>
                )}

                <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Siap Membantu Anda</div>
                  <button
                    onClick={() => handleQuickContact('wa')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl uppercase tracking-wider transition shadow-lg shadow-blue-500/20"
                  >
                    Pesan Layanan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= AC ISSUES EDUCATION SECTION ================= */}
      <section id="education" className="py-16 bg-white border-y border-slate-150">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 xl:px-16">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <span className="text-[9px] bg-blue-100 text-blue-700 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">Edukasi Perawatan AC</span>
            <h2 className="text-3xl font-black text-slate-900">Kenali Masalah Umum Pada AC Anda</h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Pahami gejala awal kerusakan AC Anda agar terhindar dari biaya perbaikan besar di kemudian hari.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-150 space-y-3 hover:bg-white hover:shadow-lg transition">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle size={18} />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800">1. AC Hanya Keluar Angin / Tidak Dingin</h4>
              <p className="text-[11.5px] text-slate-500 leading-relaxed font-medium">
                Penyebab utama biasanya adalah filter udara yang terlalu kotor menyumbat hembusan udara, debu tebal pada evaporator, atau adanya kebocoran cairan pendingin (freon).
              </p>
              <div className="text-[10px] text-blue-600 font-extrabold uppercase pt-1">
                👉 Solusi: Cuci AC Rutin & Cek Tekanan Freon
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-150 space-y-3 hover:bg-white hover:shadow-lg transition">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle size={18} />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800">2. AC Bocor Air / Menetes ke Dalam Ruangan</h4>
              <p className="text-[11.5px] text-slate-500 leading-relaxed font-medium">
                Tetesan air biasanya disebabkan oleh pipa pembuangan air kondensasi (drainase) yang tersumbat oleh debu, lumut, atau lendir akibat jarang dicuci.
              </p>
              <div className="text-[10px] text-blue-600 font-extrabold uppercase pt-1">
                👉 Solusi: Chemical Cleaning & Tembak Saluran Pipa Pembuangan
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-150 space-y-3 hover:bg-white hover:shadow-lg transition">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle size={18} />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800">3. AC Mengeluarkan Suara Bising / Berisik</h4>
              <p className="text-[11.5px] text-slate-500 leading-relaxed font-medium">
                Bisa disebabkan oleh kipas blower indoor/outdoor yang oleng, bracket kompresor yang longgar, bearing kipas fan aus, atau instalasi unit yang kurang stabil.
              </p>
              <div className="text-[10px] text-blue-600 font-extrabold uppercase pt-1">
                👉 Solusi: Kencangkan Baut Bracket & Cek Bearing Fan
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-150 space-y-3 hover:bg-white hover:shadow-lg transition">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle size={18} />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800">4. Keluar Bau Tidak Sedap dari Hembusan AC</h4>
              <p className="text-[11.5px] text-slate-500 leading-relaxed font-medium">
                Kelembapan yang tinggi di dalam unit AC yang kotor memicu pertumbuhan jamur dan bakteri di atas evaporator, sehingga udara hembusan berbau apek.
              </p>
              <div className="text-[10px] text-blue-600 font-extrabold uppercase pt-1">
                👉 Solusi: Pembersihan Evaporator Secara Menyeluruh & Spray Antibakteri
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-150 space-y-3 hover:bg-white hover:shadow-lg transition">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle size={18} />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800">5. AC Mati Sendiri Secara Tiba-Tiba</h4>
              <p className="text-[11.5px] text-slate-500 leading-relaxed font-medium">
                Sensor suhu (*thermistor*) yang mendeteksi suhu dingin terganggu karena karat/debu, kerusakan modul kelistrikan utama, atau tegangan listrik rumah yang turun-naik.
              </p>
              <div className="text-[10px] text-blue-600 font-extrabold uppercase pt-1">
                👉 Solusi: Cek Tegangan Listrik & Servis Thermistor/Modul
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-150 space-y-3 hover:bg-white hover:shadow-lg transition">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle size={18} />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800">6. Pemborosan Listrik Akibat AC</h4>
              <p className="text-[11.5px] text-slate-500 leading-relaxed font-medium">
                Kompresor bekerja 2x lipat lebih keras karena evaporator dan kondensor yang dipenuhi lumpur debu tebal, sehingga AC menarik daya listrik yang sangat tinggi untuk mencapai suhu dingin.
              </p>
              <div className="text-[10px] text-blue-600 font-extrabold uppercase pt-1">
                👉 Solusi: Cuci AC Rutin Setiap 2-3 Bulan Sekali
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= ADVANTAGES SECTION ================= */}
      <section id="advantages" className="py-12 bg-white border-y border-slate-150">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 xl:px-16">
          <div className="text-center max-w-xl mx-auto space-y-2 mb-10">
            <h2 className="text-2xl font-black text-slate-900">Keunggulan {businessName}</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Kenapa Mempercayakan AC Anda Kepada Kami?</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6 text-left">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Users size={18} />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-800">Teknisi AC Ahli & Berpengalaman</h4>
                  <p className="text-[11.5px] text-slate-500 mt-1 leading-relaxed">
                    Layanan kami dikerjakan oleh tim teknisi AC profesional yang telah dibekali pelatihan intensif, sertifikasi kompetensi, serta pemahaman mendalam tentang semua jenis & merek AC (Daikin, Panasonic, LG, Sharp, dll).
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-800">Layanan Panggilan Terdekat & Cepat</h4>
                  <p className="text-[11.5px] text-slate-500 mt-1 leading-relaxed">
                    Dengan beberapa kantor cabang yang tersebar di wilayah {selectedBranch}, kami memastikan kedatangan teknisi ke lokasi Anda secara tepat waktu tanpa menunggu lama saat AC Anda mendadak bermasalah.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Shield size={18} />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-800">Garansi Penuh & Harga Transparan</h4>
                  <p className="text-[11.5px] text-slate-500 mt-1 leading-relaxed">
                    Semua jenis jasa pencucian, perbaikan kebocoran freon, dan penggantian sparepart dilindungi garansi resmi. Harga yang ditagihkan transparan sesuai dengan daftar paket layanan kami.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 rounded-3xl overflow-hidden border border-slate-200/60 shadow-lg">
              <img
                src="/advantages_ac.png"
                alt="Washing AC Unit"
                className="w-full aspect-video object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================= WHY CHOOSE SUGAR AC SECTION ================= */}
      <section id="why-us" className="py-16 bg-gradient-to-b from-blue-50/50 to-white border-b border-slate-150">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 xl:px-16 text-center">
          <div className="max-w-2xl mx-auto space-y-2 mb-12">
            <span className="text-[9px] bg-blue-100 text-blue-700 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">Kepercayaan Anda Prioritas Kami</span>
            <h2 className="text-3xl font-black text-slate-900">Kenapa Harus Memakai Jasa Sugar AC?</h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Kami berkomitmen memberikan standar layanan cuci & perbaikan AC terbaik dengan berbagai keuntungan yang tidak Anda temukan di tempat lain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs space-y-3 hover:shadow-md transition">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <Shield size={22} />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800">Garansi Pengerjaan 7 Hari</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Setiap layanan cuci AC dan penggantian suku cadang dilengkapi dengan garansi 7 hari. Jika AC Anda kembali bermasalah, teknisi kami siap datang kembali tanpa biaya tambahan.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs space-y-3 hover:shadow-md transition">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <ThumbsUp size={22} />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800">Harga Jujur & Transparan</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Tarif jasa kami transparan tanpa ada biaya siluman. Teknisi kami akan melakukan diagnosa terlebih dahulu dan memberikan rincian estimasi biaya secara jujur di awal sebelum pengerjaan dimulai.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs space-y-3 hover:shadow-md transition">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <Users size={22} />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800">Teknisi Jujur & Terlatih</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Semua teknisi Sugar AC memiliki seragam resmi, tanda pengenal diri, bersikap ramah, sopan, dan telah melewati tahap penyaringan ketat serta pelatihan khusus tentang kepuasan pelanggan.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs space-y-3 hover:shadow-md transition">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                <Settings size={22} />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800">Peralatan Modern & Bersih</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Kami menggunakan pompa jet air bertekanan tinggi khusus, terpal pelindung anti air untuk menjaga dinding & lantai tetap bersih, serta alat ukur kebocoran freon digital berakurasi tinggi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SOCIAL MEDIA BANNER SECTION ================= */}
      <section className="py-12 bg-blue-600 text-white border-y border-blue-700">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 xl:px-16 text-center space-y-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <Instagram size={28} className="text-white" />
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-2.83V7.65a6.34 6.34 0 0 0-5.1 6.32 6.34 6.34 0 0 0 10.79 4.49 6.32 6.32 0 0 0 1.66-4.49V9.3a8.16 8.16 0 0 0 4.76 1.54V7.4a4.86 4.86 0 0 1-2-0.71z" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-black leading-tight text-white">Ikuti Media Sosial Kami</h2>
          <p className="text-sm text-blue-100 font-medium max-w-2xl mx-auto">
            Dapatkan tips perawatan AC harian, promo menarik, dan lihat hasil kerja teknisi kami secara langsung di Instagram &amp; TikTok.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a
              href="https://instagram.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-white text-blue-600 font-extrabold text-sm px-7 py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              <Instagram size={20} />
              <span>Instagram</span>
            </a>
            <a
              href="https://www.tiktok.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-slate-900 text-white font-extrabold text-sm px-7 py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all border border-slate-700"
            >
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-2.83V7.65a6.34 6.34 0 0 0-5.1 6.32 6.34 6.34 0 0 0 10.79 4.49 6.32 6.32 0 0 0 1.66-4.49V9.3a8.16 8.16 0 0 0 4.76 1.54V7.4a4.86 4.86 0 0 1-2-0.71z" />
              </svg>
              <span>TikTok</span>
            </a>
          </div>
        </div>
      </section>

      {/* ================= BOTTOM INFO BAR ================= */}
      <footer id="footer-branches" className="bg-slate-900 text-white">
        {/* Branch contacts row */}
        {(regions || []).length > 0 && (
          <div className="border-b border-slate-700">
            <div className="max-w-[1440px] mx-auto px-6 lg:px-12 xl:px-16 py-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Cabang Kami</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {(regions || []).map((r) => {
                  const branchPhone = appSettings?.[r.id]?.phone_number || appSettings?.['GLOBAL']?.phone_number || '';
                  const cleanBranchPhone = branchPhone.replace(/\D/g, '');
                  return (
                    <div key={r.id} className="flex items-start gap-3 bg-slate-800/60 rounded-2xl px-4 py-3">
                      <div className="w-8 h-8 bg-blue-600/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin size={14} className="text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-white truncate">{r.name}</p>
                        {cleanBranchPhone ? (
                          <a
                            href={`tel:+${cleanBranchPhone}`}
                            className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition flex items-center gap-1 mt-0.5"
                          >
                            <Phone size={10} />
                            {branchPhone}
                          </a>
                        ) : (
                          <p className="text-[11px] text-slate-500 mt-0.5">Hubungi pusat</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Copyright row */}
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 xl:px-16 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-slate-500 font-medium">
            &copy; {new Date().getFullYear()} {businessName}. All rights reserved.
          </p>
          <p className="text-[10px] text-slate-600 font-medium">Jasa Cuci &amp; Service AC Profesional</p>
        </div>
      </footer>
    </div>
  );
}
