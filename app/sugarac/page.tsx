'use client';

import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';

export default function SugarACCompanyProfile() {
  const { activeUser, appSettings, regions } = useApp();

  // Region and branch selection
  const [selectedBranch, setSelectedBranch] = useState('Palembang');

  // Booking Form State
  const [nama, setNama] = useState(activeUser?.name || '');
  const [telepon, setTelepon] = useState(activeUser?.phone || '');
  const [email, setEmail] = useState(activeUser?.email || '');
  const [layanan, setLayanan] = useState('Cuci AC Rutin');
  const [jumlah, setJumlah] = useState(1);
  const [keluhan, setKeluhan] = useState('');
  const [alamat, setAlamat] = useState(activeUser?.address || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Load user data on update
  useEffect(() => {
    if (activeUser) {
      setNama(activeUser.name || '');
      setTelepon(activeUser.phone || '');
      setEmail(activeUser.email || '');
      setAlamat(activeUser.address || '');
    }
  }, [activeUser]);

  const businessName = appSettings?.business_name || 'Sugar AC';
  const waNumber = '6281284976852'; // Prefilled default WA contact

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formattedMessage = `Halo ${businessName} ${selectedBranch},\n\nSaya ingin memesan layanan AC:\n- Nama: ${nama}\n- Telepon: ${telepon}\n- Email: ${email}\n- Layanan: ${layanan}\n- Jumlah: ${jumlah} Unit\n- Keluhan: ${keluhan || '-'}\n- Alamat: ${alamat}`;
    const encodedMessage = encodeURIComponent(formattedMessage);
    const waUrl = `https://wa.me/${waNumber}?text=${encodedMessage}`;

    try {
      if (activeUser) {
        // Automatically save order in local DB for registered user
        await api.createOrder({
          customerId: activeUser.id,
          customerName: nama,
          customerPhone: telepon,
          acType: 'Split Unit',
          address: alamat,
          scheduledDate: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0], // tomorrow
          scheduledTime: '09:00',
          status: 'MENUNGGU',
          acDetail: [{
            category: 'Pembersihan AC',
            serviceType: layanan,
            quantity: Number(jumlah) || 1,
            acType: 'Split Unit'
          }],
          notes: keluhan || 'Booking via Landing Page',
          serviceCost: 75000 * (Number(jumlah) || 1),
          addonsCost: 0,
          totalCost: 75000 * (Number(jumlah) || 1),
          totalPrice: 75000 * (Number(jumlah) || 1),
          finalPrice: 75000 * (Number(jumlah) || 1),
          quantity: Number(jumlah) || 1,
        });
      }
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        window.open(waUrl, '_blank');
      }, 1500);
    } catch (err) {
      console.error('Error submitting profile booking:', err);
      window.open(waUrl, '_blank');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickContact = (type: 'wa' | 'phone' | 'install' | 'trade') => {
    if (type === 'wa') {
      window.open(`https://wa.me/${waNumber}?text=Halo%20${encodeURIComponent(businessName)}%2C%20saya%20butuh%20layanan%20AC.`, '_blank');
    } else if (type === 'phone') {
      window.open(`tel:+6281284976852`, '_self');
    } else if (type === 'install') {
      const element = document.getElementById('booking-form');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (type === 'trade') {
      window.open(`https://wa.me/${waNumber}?text=Halo%20${encodeURIComponent(businessName)}%2C%20saya%2520ingin%2520tanya%2520jual%2520beli%2520AC%2520baru%252Fbekas.`, '_blank');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800 pb-20 md:pb-0 relative overflow-x-hidden">
      {/* ================= HEADER NAVBAR ================= */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-md shadow-blue-500/25">
              ❄️
            </div>
            <div>
              <span className="text-base font-black tracking-wider text-slate-900 block">{businessName.toUpperCase()}</span>
              <span className="text-[9px] font-bold text-blue-600 block uppercase tracking-widest -mt-0.5">Solusi AC Sejuk</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#hero" className="hover:text-blue-600 transition">Beranda</a>
            <a href="#advantages" className="hover:text-blue-600 transition">Keunggulan</a>
            <a href="#services" className="hover:text-blue-600 transition">Layanan & Harga</a>
            <a href="#booking-form" className="hover:text-blue-600 transition">Pemesanan</a>
            
            {/* Custom Branch selector dropdown in Header */}
            <div className="relative group">
              <button className="flex items-center gap-1 hover:text-blue-600 transition">
                <span>Cabang: {selectedBranch}</span>
                <span className="text-[10px]">▼</span>
              </button>
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition duration-200">
                {['Palembang', 'Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur'].map((b) => (
                  <button
                    key={b}
                    onClick={() => setSelectedBranch(b)}
                    className="w-full px-4 py-2 hover:bg-slate-50 text-left text-xs font-bold text-slate-700 block transition"
                  >
                    Cabang {b}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          <button
            onClick={() => handleQuickContact('wa')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11.5px] px-4.5 py-2.5 rounded-xl uppercase tracking-wider shadow-md shadow-blue-600/15 cursor-pointer transition hidden sm:block"
          >
            Hubungi Kami
          </button>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section id="hero" className="py-12 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="text-left space-y-6">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
              <Compass size={12} /> Cabang Resmi {selectedBranch}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
              Layanan Service AC <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-650">{selectedBranch}</span> & Sekitarnya
            </h1>
            <p className="text-sm md:text-base text-slate-550 leading-relaxed max-w-xl font-medium">
              Sugar AC adalah mitra terpercaya untuk segala kebutuhan layanan AC Anda. Tim teknisi ahli kami siap memberikan solusi perbaikan AC bocor, tidak dingin, cuci AC berkala, hingga bongkar pasang AC dengan garansi resmi.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => handleQuickContact('wa')}
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3.5 px-6 rounded-2xl uppercase tracking-wider shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2 transition"
              >
                <MessageCircle size={16} /> WhatsApp Kami
              </button>
              <button
                onClick={() => handleQuickContact('phone')}
                className="flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-3.5 px-6 rounded-2xl uppercase tracking-wider shadow-lg shadow-slate-900/10 cursor-pointer flex items-center justify-center gap-2 transition"
              >
                <Phone size={16} /> Telepon Langsung
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-indigo-650/15 rounded-3xl -rotate-2 scale-102"></div>
            <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100">
              <img 
                src="/hero_technicians.png" 
                alt="Sugar AC Technicians Team" 
                className="w-full object-cover aspect-video sm:aspect-4/3 lg:aspect-video"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 to-transparent p-4 text-white text-left flex justify-between items-center">
                <div>
                  <h4 className="font-extrabold text-xs">Tim Teknisi Profesional</h4>
                  <p className="text-[10px] text-slate-300">Siap berkunjung ke rumah & kantor Anda</p>
                </div>
                <span className="text-[10px] bg-blue-600 px-2 py-0.5 rounded font-black uppercase tracking-wider">Bersertifikat</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= ADVANTAGES SECTION ================= */}
      <section id="advantages" className="py-12 bg-white border-y border-slate-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

      {/* ================= SERVICES & PACKAGES SECTION ================= */}
      <section id="services" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto space-y-2 mb-10">
          <h2 className="text-2xl font-black text-slate-900">Rekomendasi Paket Layanan AC</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Pilih Jasa Yang Sesuai dengan Kebutuhan Anda</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Cuci AC Rutin', desc: 'Pembersihan evaporator, filter, blower, & outdoor unit agar AC bersih & dingin maksimal.', price: 'Rp 75.000', label: 'Terpopuler' },
            { title: 'Bongkar Pasang AC', desc: 'Pemindahan lokasi unit AC lama atau pemasangan AC baru secara aman tanpa kebocoran.', price: 'Rp 250.000', label: 'Bestseller' },
            { title: 'Isi Ulang Freon R32', desc: 'Pengisian ulang tekanan cairan pendingin agar sistem bekerja optimal & hembusan udara beku.', price: 'Rp 150.000', label: 'Rekomendasi' },
            { title: 'Perbaikan AC Rusak', desc: 'Deteksi & servis kerusakan AC mati total, kompresor bising, sensor error, dll.', price: 'Hubungi Admin', label: 'Terpercaya' },
          ].map((srv, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-left flex flex-col justify-between hover:border-blue-500 hover:shadow-md transition">
              <div>
                <span className="text-[8px] bg-blue-50 border border-blue-150 text-blue-700 font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  {srv.label}
                </span>
                <h4 className="font-extrabold text-sm text-slate-800 mt-2.5">{srv.title}</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{srv.desc}</p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-black text-blue-700 font-mono">{srv.price}</span>
                <button
                  onClick={() => {
                    setLayanan(srv.title);
                    handleQuickContact('install');
                  }}
                  className="bg-slate-900 hover:bg-blue-600 text-white font-bold text-[9px] px-2.5 py-1.5 rounded-lg uppercase tracking-wider transition cursor-pointer"
                >
                  Pilih
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= SOLUTIONS BANNER SECTION ================= */}
      <section className="py-12 bg-slate-900 text-white border-y border-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="text-left space-y-6">
            <h2 className="text-3xl font-black leading-tight text-white">Solusi AC Terbaik untuk Rumah dan Kantor Anda</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Jasa AC Bergaransi | Berdiri Sejak Tahun 2013</p>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Jika AC Anda sering bermasalah (evaporator membeku, air menetes di kamar, mati sendiri), jangan tunggu hingga kompresor terbakar. Tim Sugar AC menyediakan solusi diagnosa akurat, reparasi kelistrikan AC, penggantian kapasitor, dinamo fan, hingga cuci besar (*chemical cleaning*).
            </p>
            <div className="flex gap-4 items-center bg-white/5 border border-white/10 p-4 rounded-2xl max-w-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-black">
                📞
              </div>
              <div>
                <span className="text-[8px] text-slate-400 font-bold uppercase block tracking-wider">Layanan Telepon 24 Jam</span>
                <a href="tel:+6281284976852" className="text-xs font-black text-white hover:text-blue-400 transition font-mono">+62 812 8497 6852</a>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden p-2 shadow-2xl">
            <img 
              src="/solutions_banner.png" 
              alt="Sugar AC Quality Services banner" 
              className="w-full rounded-2xl aspect-video object-cover"
            />
          </div>
        </div>
      </section>

      {/* ================= BOOKING FORM SECTION ================= */}
      <section id="booking-form" className="py-12 max-w-2xl mx-auto px-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-5">
          <div className="text-center space-y-1">
            <span className="text-[8px] bg-blue-50 border border-blue-150 text-blue-700 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Booking Online
            </span>
            <h3 className="text-lg font-black text-slate-800">Form Pemesanan {businessName}</h3>
            <p className="text-[10px] text-slate-400 font-semibold">Isi formulir pesanan di bawah ini dengan lengkap & jelas</p>
          </div>

          {isSuccess && (
            <div className="bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
              <CheckCircle size={16} /> Pesanan berhasil dibuat! Mengalihkan Anda ke WhatsApp...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mb-1">Nama Lengkap</label>
              <input
                type="text"
                placeholder="Masukkan nama Anda..."
                value={nama}
                onChange={e => setNama(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-semibold"
                required
              />
            </div>

            <div>
              <label className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mb-1">No. WhatsApp / Telepon</label>
              <input
                type="tel"
                placeholder="Contoh: 08123456789..."
                value={telepon}
                onChange={e => setTelepon(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-semibold"
                required
              />
            </div>

            <div>
              <label className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mb-1">Email Anda</label>
              <input
                type="email"
                placeholder="Masukkan email aktif..."
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mb-1">Pilih Layanan Jasa</label>
                <select
                  value={layanan}
                  onChange={e => setLayanan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-850 text-xs px-3 py-2.5 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold"
                >
                  <option value="Cuci AC Rutin">Cuci AC Rutin</option>
                  <option value="Bongkar Pasang AC">Bongkar Pasang AC</option>
                  <option value="Isi Ulang Freon R32">Isi Ulang Freon R32</option>
                  <option value="Perbaikan AC Rusak">Perbaikan AC Rusak</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mb-1">Jumlah Unit AC</label>
                <input
                  type="number"
                  min={1}
                  value={jumlah}
                  onChange={e => setJumlah(Number(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-855 text-xs px-3 py-2.5 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mb-1">Keluhan / Catatan</label>
              <input
                type="text"
                placeholder="Contoh: AC kurang dingin, air menetes, bising..."
                value={keluhan}
                onChange={e => setKeluhan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-semibold"
              />
            </div>

            <div>
              <label className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mb-1">Alamat Lengkap Rumah</label>
              <textarea
                placeholder="Tuliskan alamat lengkap lokasi pengerjaan..."
                value={alamat}
                onChange={e => setAlamat(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-855 text-xs px-3 py-2.5 rounded-xl outline-none focus:bg-white focus:border-blue-500 h-20 resize-none font-semibold"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black text-xs py-3.5 rounded-2xl uppercase tracking-wider shadow-md shadow-blue-600/20 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader className="animate-spin" size={14} /> Memproses...
                </>
              ) : (
                'Buat Pesanan & Teruskan ke WA'
              )}
            </button>
          </form>
        </div>
      </section>

      {/* ================= MOBILE STICKY FOOTER ================= */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-950 text-white border-t border-slate-900 py-2.5 px-4 block md:hidden">
        <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-bold">
          <button
            onClick={() => handleQuickContact('phone')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition"
          >
            <Phone size={16} className="text-blue-450" />
            <span>Telepon</span>
          </button>
          
          <button
            onClick={() => handleQuickContact('install')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition"
          >
            <Wrench size={16} className="text-blue-450" />
            <span>Pasang AC</span>
          </button>

          <button
            onClick={() => handleQuickContact('trade')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition"
          >
            <Compass size={16} className="text-blue-450" />
            <span>Jual Beli AC</span>
          </button>

          <button
            onClick={() => handleQuickContact('wa')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition"
          >
            <MessageCircle size={16} className="text-emerald-400" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
