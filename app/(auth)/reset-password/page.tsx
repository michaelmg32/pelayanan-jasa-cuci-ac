'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Wind, Key, Loader, Lock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import MobileFrame from '@/components/MobileFrame';
import { useApp } from '@/lib/auth-context';

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { appSettings } = useApp();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMsg('Token reset kata sandi tidak ditemukan atau tidak valid.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setErrorMsg('Token reset tidak valid.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Kata sandi harus minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        apiUrl = apiUrl.replace(/localhost|127\.0\.0\.1/, window.location.hostname);
      }

      const response = await fetch(`${apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Gagal mereset kata sandi.');
        return;
      }

      setSuccessMsg('Kata sandi Anda berhasil diperbarui!');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      console.error('Reset password error:', err);
      setErrorMsg('Kesalahan koneksi. Silakan periksa server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-slate-100/70 to-blue-50/30 p-4 sm:p-6 md:p-8 font-sans">
      <div className="min-h-full w-full flex items-center justify-center py-6">
        <div className="w-full max-w-[460px] bg-white border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-200/40 p-6 sm:p-8 flex flex-col transition duration-300 hover:shadow-2xl hover:shadow-blue-500/5">
          
          {/* Brand Logo */}
          <div className="flex flex-col items-center justify-center mb-6 shrink-0">
            <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-3 cursor-default">
              {appSettings?.['GLOBAL']?.business_logo ? (
                <img src={appSettings['GLOBAL'].business_logo} alt="Logo" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <Wind size={28} className="text-white shrink-0 animate-pulse" />
              )}
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-800 leading-none">{appSettings?.['GLOBAL']?.business_name || 'CoolAir Pro'}</h2>
            <p className="text-[10px] text-slate-400 font-bold tracking-wider mt-2 uppercase">Reset Kata Sandi</p>
          </div>

          {/* Success State */}
          {successMsg ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <CheckCircle2 size={48} className="text-emerald-500 animate-bounce" />
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-slate-800 text-base">Sandi Berhasil Diubah!</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Kata sandi baru Anda berhasil disimpan. Anda akan diarahkan ke halaman login dalam beberapa detik...
                </p>
              </div>
              <div className="w-full pt-4">
                <button
                  onClick={() => router.push('/login')}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-3 px-4 rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] text-sm transition duration-200 cursor-pointer"
                >
                  Masuk Sekarang
                </button>
              </div>
            </div>
          ) : (
            /* Form Reset Sandi Baru */
            <div className="space-y-4">
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-2xl mb-2 text-center font-semibold flex items-center justify-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {token ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed text-center px-1 mb-2">
                    Silakan masukkan kata sandi baru Anda di bawah ini untuk mengamankan akun Anda.
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block ml-1">Kata Sandi Baru</label>
                    <div className="relative group">
                      <Key size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                      <input
                        type="password"
                        placeholder="Minimal 6 karakter"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50/60 border border-slate-200 text-slate-800 text-sm pl-10 pr-4 py-3 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition duration-200"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block ml-1">Konfirmasi Kata Sandi</label>
                    <div className="relative group">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                      <input
                        type="password"
                        placeholder="Ulangi kata sandi baru"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50/60 border border-slate-200 text-slate-800 text-sm pl-10 pr-4 py-3 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition duration-200"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full mt-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.98] text-sm flex items-center justify-center gap-2 transition duration-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {isLoading ? (
                      <>
                        <Loader size={15} className="animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        Simpan Kata Sandi
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <button
                    onClick={() => router.push('/login')}
                    className="w-full mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition duration-200 cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    Kembali ke Login
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <MobileFrame activeUser={null} onLogout={() => {}}>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-xl font-bold mb-2">Memuat halaman...</h1>
          </div>
        </div>
      }>
        <ResetPasswordFormContent />
      </Suspense>
    </MobileFrame>
  );
}
