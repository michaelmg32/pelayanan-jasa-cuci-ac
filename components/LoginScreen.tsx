'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Role } from '@/types';
import { Wind, Key, Mail, LogIn, UserPlus, Camera, Check, FileText, Phone, MapPin, User as UserIcon, X, Loader, Eye, EyeOff } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useApp } from '@/lib/auth-context';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  onRegisterCustomer: (name: string, email: string, phone: string, address: string) => void;
  availableUsers: User[];
}

export default function LoginScreen({ onLogin, onRegisterCustomer, availableUsers }: LoginScreenProps) {
  const { appSettings } = useApp();
  const [formMode, setFormMode] = useState<'login' | 'register_pelanggan' | 'forgot_password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');


  // Register state (Pelanggan & Karyawan)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [ktpPhoto, setKtpPhoto] = useState<string | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Google Sign-In Step-2 states
  const [showGoogleStep2, setShowGoogleStep2] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googlePhone, setGooglePhone] = useState('');
  const [googleAddress, setGoogleAddress] = useState('');
  const [googleKtp, setGoogleKtp] = useState<string | null>(null);
  const [googleSelfie, setGoogleSelfie] = useState<string | null>(null);

  // Client-side image compression to downsize massive photos

  // MAGIC LINK / AUTO LOGIN LOGIC
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const mPhone = urlParams.get('m_phone');
    const mPass = urlParams.get('m_pass');

    if (mPhone && mPass) {
      setEmail(mPhone);
      setPassword(mPass);
      setFormMode('login');

      const autoLogin = async () => {
        setIsLoading(true);
        try {
          let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
          if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            apiUrl = apiUrl.replace(/localhost|127\.0\.0\.1/, window.location.hostname);
          }
          const response = await fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: mPhone.trim(), password: mPass.trim() })
          });
          const data = await response.json();
          if (response.ok && data.user) {
            if (data.token) {
              document.cookie = `auth_token=${data.token}; path=/; max-age=86400; SameSite=Lax`;
            }
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            onLogin(data.user);
          } else {
            setErrorMsg(data.error || 'Magic link invalid atau kadaluarsa.');
            setIsLoading(false);
          }
        } catch (err) {
          setErrorMsg('Kesalahan koneksi saat menggunakan magic link.');
          setIsLoading(false);
        }
      };

      autoLogin();
    }
  }, [onLogin]);
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
          const compressedBase64 = canvas.toDataURL('image/webp', quality);
          resolve(compressedBase64);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 800, 800, 0.7);
        setter(compressed);
      } catch (err) {
        console.error('Error reading/compressing file:', err);
        setErrorMsg('Gagal membaca berkas gambar.');
      }
    }
  };

  // Debug Client ID
  console.log("GOOGLE CLIENT ID:", process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Email/Nomor Telepon tidak boleh kosong.');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Kata sandi tidak boleh kosong.');
      return;
    }

    setIsLoading(true);

    try {
      console.log('LoginScreen - Submitting login for email:', email.trim());
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        apiUrl = apiUrl.replace(/localhost|127\.0\.0\.1/, window.location.hostname);
      }
      console.log('LoginScreen - Using apiUrl:', apiUrl);
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });

      console.log('LoginScreen - Response status:', response.status);
      const data = await response.json();
      console.log('LoginScreen - Parsed data:', data);

      if (!response.ok) {
        setErrorMsg(data.error || 'Login gagal. Silakan coba lagi.');
        return;
      }

      // Authentication handled via Context API and MySQL sessions
      setErrorMsg('');

      if (data.user) {
        if (data.token) {
          document.cookie = `auth_token=${data.token}; path=/; max-age=86400; SameSite=Lax`;
        }
        console.log('LoginScreen - Success, calling onLogin with user:', data.user);
        onLogin(data.user);
      } else {
        console.warn('LoginScreen - Success response but data.user is missing!', data);
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMsg('Kesalahan koneksi. Silakan periksa server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorMsg('Email tidak boleh kosong.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setForgotSuccessMsg('');

    try {
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        apiUrl = apiUrl.replace(/localhost|127\.0\.0\.1/, window.location.hostname);
      }
      
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Gagal mengirim email reset.');
        return;
      }

      setForgotSuccessMsg(data.message || 'Link reset kata sandi telah dikirim ke email Anda!');
      setForgotEmail('');
    } catch (err) {
      console.error('Forgot password error:', err);
      setErrorMsg('Kesalahan koneksi. Silakan periksa server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isKaryawan = false;

    if (isKaryawan) {
      if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regAddress.trim() || !password.trim()) {
        setErrorMsg('Semua data wajib diisi.');
        return;
      }
      if (!ktpPhoto) {
        setErrorMsg('Foto KTP wajib diunggah.');
        return;
      }
      if (!selfiePhoto) {
        setErrorMsg('Foto Selfie wajib diunggah.');
        return;
      }
    } else {
      if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !password.trim()) {
        setErrorMsg('Semua data wajib diisi.');
        return;
      }
      if (!agreeTerms) {
        setErrorMsg('Anda harus menyetujui Syarat & Ketentuan serta Kebijakan Privasi.');
        return;
      }
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        apiUrl = apiUrl.replace(/localhost|127\.0\.0\.1/, window.location.hostname);
      }
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          address: regAddress.trim() || null,
          password: password.trim(),
          role: isKaryawan ? 'karyawan' : 'pelanggan',
          ktpPhoto: isKaryawan ? ktpPhoto : null,
          selfiePhoto: isKaryawan ? selfiePhoto : null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Registrasi gagal. Silakan coba lagi.');
        return;
      }

      setErrorMsg('');

      if (isKaryawan) {
        alert('Registrasi Karyawan berhasil! Akun Anda sedang menunggu verifikasi manual oleh Admin.');
        // Reset states
        setRegName('');
        setRegEmail('');
        setRegPhone('');
        setRegAddress('');
        setPassword('');
        setKtpPhoto(null);
        setSelfiePhoto(null);
        setFormMode('login');
      } else {
        if (data.user) {
          if (data.token) {
            document.cookie = `auth_token=${data.token}; path=/; max-age=86400; SameSite=Lax`;
          }
          onLogin(data.user);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMsg('Gagal mendaftar. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse: any) => {
    try {
      setIsLoading(true);
      setErrorMsg('');

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      if (!credentialResponse.credential) {
        throw new Error('Google credential token is missing.');
      }

      const targetRole = 'pelanggan';

      const response = await fetch(`${apiUrl}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: credentialResponse.credential,
          role: targetRole
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Login Google gagal. Silakan coba lagi.');
        return;
      }

      setErrorMsg('');

      if (data.isNewEmployee) {
        setGoogleEmail(data.email);
        setGoogleName(data.name || '');
        setShowGoogleStep2(true);
        return;
      }

      if (data.user) {
        if (data.token) {
          document.cookie = `auth_token=${data.token}; path=/; max-age=86400; SameSite=Lax`;
        }
        onLogin(data.user);
      }
    } catch (error) {
      console.error('Google login error:', error);
      setErrorMsg('Kesalahan koneksi dengan Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleName.trim() || !googlePhone.trim() || !googleAddress.trim()) {
      setErrorMsg('Semua data wajib diisi.');
      return;
    }
    if (!googleKtp) {
      setErrorMsg('Foto KTP wajib diunggah.');
      return;
    }
    if (!googleSelfie) {
      setErrorMsg('Foto Selfie wajib diunggah.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        apiUrl = apiUrl.replace(/localhost|127\.0\.0\.1/, window.location.hostname);
      }

      const randomPassword = Math.random().toString(36).substring(2, 12);

      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: googleName.trim(),
          email: googleEmail,
          phone: googlePhone.trim(),
          address: googleAddress.trim(),
          password: randomPassword,
          role: 'karyawan',
          ktpPhoto: googleKtp,
          selfiePhoto: googleSelfie
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Registrasi Google Karyawan gagal. Silakan coba lagi.');
        return;
      }

      setErrorMsg('');
      alert('Registrasi Karyawan berhasil! Silakan menunggu persetujuan/aktivasi manual oleh Admin.');

      // Reset step 2 states and modal
      setShowGoogleStep2(false);
      setGoogleEmail('');
      setGoogleName('');
      setGooglePhone('');
      setGoogleAddress('');
      setGoogleKtp(null);
      setGoogleSelfie(null);
      setFormMode('login');
    } catch (error) {
      console.error('Google step 2 registration error:', error);
      setErrorMsg('Gagal mengirim data tambahan Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const adminUsers = availableUsers.filter(u => u.role === Role.ADMIN);
  const staffUsers = availableUsers.filter(u => u.role === Role.STAFF);
  const pelangganUsers = availableUsers.filter(u => u.role === Role.USER);
  const ownerUsers = availableUsers.filter(u => u.role === Role.OWNER);
  // Variables above unused - kept for reference only

  return (
    <div className="w-full h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-slate-100/70 to-blue-50/30 p-4 sm:p-6 md:p-8 font-sans">
      <div className="min-h-full w-full flex items-center justify-center py-6">
        <div className="w-full max-w-[460px] bg-white border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-200/40 p-6 sm:p-8 flex flex-col transition duration-300 hover:shadow-2xl hover:shadow-blue-500/5">

          {/* Brand Logo & Tagline */}
          <div className="flex flex-col items-center justify-center mb-6 shrink-0">
            <a href="/" className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-3 transform hover:rotate-6 hover:scale-105 transition duration-300 cursor-pointer overflow-hidden block">
              {appSettings?.['GLOBAL']?.business_logo ? (
                <img src={appSettings['GLOBAL'].business_logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Wind size={28} className="text-white shrink-0 animate-pulse" />
              )}
            </a>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-800 leading-none">{appSettings?.['GLOBAL']?.business_name || 'CoolAir Pro'}</h2>
            <p className="text-[10px] text-slate-400 font-bold tracking-wider mt-2 uppercase">Sistem Jasa AC Multi-Role Terpadu</p>
          </div>

          {/* Tab Selection */}
          {formMode !== 'forgot_password' ? (
            <div className="flex border-b border-slate-100 mb-5 relative">
              <button
                type="button"
                onClick={() => { setFormMode('login'); setErrorMsg(''); setAgreeTerms(false); }}
                className={`flex-1 text-center font-bold text-[10.5px] pb-3 transition duration-200 relative ${formMode === 'login' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Masuk
                {formMode === 'login' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></span>
                )}
              </button>
              <button
                type="button"
                onClick={() => { setFormMode('register_pelanggan'); setErrorMsg(''); setAgreeTerms(false); }}
                className={`flex-1 text-center font-bold text-[10.5px] pb-3 transition duration-200 relative ${formMode === 'register_pelanggan' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Pelanggan
                {formMode === 'register_pelanggan' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></span>
                )}
              </button>
            </div>
          ) : (
            <div className="flex border-b border-slate-100 mb-5 relative justify-center">
              <span className="text-blue-600 font-extrabold text-[12px] pb-3 uppercase tracking-wider">
                Reset Kata Sandi
              </span>
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-2xl mb-4 text-center font-semibold animate-shake">
              {errorMsg}
            </div>
          )}

          {forgotSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs p-3 rounded-2xl mb-4 text-center font-semibold animate-pulse">
              {forgotSuccessMsg}
            </div>
          )}

          {formMode === 'login' ? (
            /* LOGIN PANEL */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block ml-1">E-mail / No. Telp</label>
                <div className="relative group">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                  <input
                    type="text"
                    placeholder="Masukkan Email atau No Telp"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50/60 border border-slate-200 text-slate-800 text-sm pl-10 pr-4 py-3 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition duration-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Kata Sandi</label>
                  <button
                    type="button"
                    onClick={() => { setFormMode('forgot_password'); setErrorMsg(''); setForgotSuccessMsg(''); }}
                    className="text-[10.5px] text-blue-600 hover:underline font-bold focus:outline-none cursor-pointer"
                  >
                    Lupa Kata Sandi?
                  </button>
                </div>
                <div className="relative group">
                  <Key size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50/60 border border-slate-200 text-slate-800 text-sm pl-10 pr-10 py-3 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
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
                    Memproses...
                  </>
                ) : (
                  <>
                    <LogIn size={15} />
                    Masuk Sekarang
                  </>
                )}
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-3 text-slate-400 text-[10px] uppercase font-bold tracking-widest">Atau</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div className="flex justify-center">
                <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE'}>
                  <GoogleLogin
                    onSuccess={handleGoogleLoginSuccess}
                    onError={() => setErrorMsg('Login dengan Google gagal.')}
                    theme="filled_blue"
                    shape="pill"
                  />
                </GoogleOAuthProvider>
              </div>
            </form>
          ) : formMode === 'register_pelanggan' ? (
            /* REGISTRATION FORM (PELANGGAN) */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block ml-1">Nama Lengkap</label>
                <div className="relative group">
                  <UserIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                  <input
                    type="text"
                    placeholder="Masukkan Nama Lengkap"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-slate-50/60 border border-slate-200 text-slate-800 text-sm pl-10 pr-4 py-2.5 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition duration-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block ml-1">E-mail</label>
                <div className="relative group">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                  <input
                    type="email"
                    placeholder="Masukkan Email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-slate-50/60 border border-slate-200 text-slate-800 text-sm pl-10 pr-4 py-2.5 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition duration-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block ml-1">No. Whatsapp</label>
                <div className="relative group">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                  <input
                    type="tel"
                    placeholder="Masukkan No. Whatsapp"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-slate-50/60 border border-slate-200 text-slate-800 text-sm pl-10 pr-4 py-2.5 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition duration-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block ml-1">Alamat Lengkap</label>
                <div className="relative group">
                  <MapPin size={15} className="absolute left-3.5 top-5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                  <textarea
                    placeholder="Masukkan Alamat Lengkap"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    className="w-full bg-slate-50/60 border border-slate-200 text-slate-800 text-sm pl-10 pr-4 py-2.5 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition duration-200 h-16 resize-none"
                    required
                  ></textarea>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block ml-1">Kata Sandi</label>
                <div className="relative group">
                  <Key size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50/60 border border-slate-200 text-slate-800 text-sm pl-10 pr-10 py-2.5 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-1.5 pb-1 text-left">
                <input
                  type="checkbox"
                  id="agree-terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer shrink-0"
                  required
                />
                <label htmlFor="agree-terms" className="text-[10.5px] text-slate-550 leading-relaxed font-semibold cursor-pointer select-none">
                  Saya menyetujui <button type="button" onClick={() => setShowTermsModal(true)} className="text-blue-600 hover:underline font-bold focus:outline-none cursor-pointer">Syarat & Ketentuan</button> dan <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-blue-600 hover:underline font-bold focus:outline-none cursor-pointer">Kebijakan Privasi</button> yang berlaku.
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full mt-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.98] text-sm flex items-center justify-center gap-2 transition duration-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isLoading ? (
                  <>
                    <Loader size={15} className="animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <UserPlus size={15} />
                    Daftar Sekarang
                  </>
                )}
              </button>
            </form>
          ) : formMode === 'forgot_password' ? (
            /* FORGOT PASSWORD FORM */
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed text-center px-1 mb-2">
                Masukkan alamat email Anda yang terdaftar. Kami akan mengirimkan tautan untuk menyetel ulang kata sandi Anda.
              </p>
              
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block ml-1">Alamat E-mail</label>
                <div className="relative group">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                  <input
                    type="email"
                    placeholder="Masukkan Email Anda"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
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
                    Mengirim...
                  </>
                ) : (
                  <>
                    Kirim Link Reset
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setFormMode('login'); setErrorMsg(''); setForgotSuccessMsg(''); }}
                className="w-full mt-1 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition duration-200 cursor-pointer"
              >
                Kembali ke Login
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {/* ===================== GOOGLE SIGN-IN STEP-2 MODAL FOR KARYAWAN ===================== */}
      {showGoogleStep2 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-[460px] bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 animate-slide-down">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm uppercase">Lengkapi Profil Karyawan</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">Daftar via Google: {googleEmail}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleStep2(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleGoogleStep2Submit} className="space-y-3.5 animate-slide-up">
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block ml-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="w-full bg-slate-50/60 border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition duration-200 font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block ml-1">No. WhatsApp</label>
                <input
                  type="tel"
                  placeholder="Masukkan No. Whatsapp Aktif"
                  value={googlePhone}
                  onChange={(e) => setGooglePhone(e.target.value)}
                  className="w-full bg-slate-50/60 border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition duration-200"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block ml-1">Alamat Lengkap</label>
                <textarea
                  placeholder="Masukkan Alamat Lengkap Sesuai KTP"
                  value={googleAddress}
                  onChange={(e) => setGoogleAddress(e.target.value)}
                  className="w-full bg-slate-50/60 border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition duration-200 h-16 resize-none"
                  required
                ></textarea>
              </div>

              {/* Step-2 photo uploads */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block ml-1">Foto KTP</label>
                  <label className={`w-full h-20 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${googleKtp ? 'border-emerald-500 bg-emerald-50/20 text-emerald-600' : 'border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-white text-slate-400 hover:text-blue-500'}`}>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setGoogleKtp)} className="hidden" />
                    {googleKtp ? (
                      <>
                        <Check size={16} className="mb-0.5 text-emerald-500 animate-bounce" />
                        <span className="text-[9px] font-bold text-emerald-600">KTP Terunggah</span>
                      </>
                    ) : (
                      <>
                        <Camera size={16} className="mb-0.5" />
                        <span className="text-[9px] font-bold">Unggah KTP</span>
                      </>
                    )}
                  </label>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block ml-1">Foto Selfie</label>
                  <label className={`w-full h-20 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${googleSelfie ? 'border-emerald-500 bg-emerald-50/20 text-emerald-600' : 'border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-white text-slate-400 hover:text-blue-500'}`}>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setGoogleSelfie)} className="hidden" />
                    {googleSelfie ? (
                      <>
                        <Check size={16} className="mb-0.5 text-emerald-500 animate-bounce" />
                        <span className="text-[9px] font-bold text-emerald-600">Selfie Terunggah</span>
                      </>
                    ) : (
                      <>
                        <Camera size={16} className="mb-0.5" />
                        <span className="text-[9px] font-bold">Unggah Selfie</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleStep2(false)}
                  disabled={isLoading}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold py-2.5 rounded-2xl transition duration-200 cursor-pointer uppercase font-black"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-2xl transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 uppercase font-black shadow-md"
                >
                  {isLoading ? (
                    <>
                      <Loader size={14} className="animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    'Kirim Data'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: SYARAT & KETENTUAN ===================== */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[550px] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden text-left">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white shrink-0">
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wider">Syarat & Ketentuan Layanan</h3>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed bg-slate-50 flex-grow font-semibold">
              <p>Selamat datang di Sugar AC. Dengan mendaftar atau menggunakan layanan kami, Anda menyetujui syarat dan ketentuan berikut:</p>
              
              <div className="space-y-2">
                <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-wide">1. Cakupan Jasa & Alamat</h4>
                <p className="text-slate-600 font-medium">Pelanggan wajib memberikan alamat yang lengkap, benar, dan memilih koordinat titik GPS secara akurat melalui peta agar memudahkan perjalanan teknisi.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-wide">2. Kebijakan Jadwal & Pembatalan</h4>
                <p className="text-slate-600 font-medium">Pemesanan jasa harus dikonfirmasi oleh Admin. Jika terjadi kendala operasional, kami berhak mengajukan usulan jadwal alternatif (reschedule). Pelanggan berhak menolak atau menyetujui usulan tersebut.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-wide">3. Garansi Layanan</h4>
                <p className="text-slate-600 font-medium">Kami menyediakan garansi pekerjaan cuci atau perbaikan AC selama 30 hari kalender terhitung sejak status order ditandai selesai. Garansi hanya berlaku untuk bagian pekerjaan yang sama.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-wide">4. Keamanan di Lokasi</h4>
                <p className="text-slate-600 font-medium">Pelanggan atau perwakilan dewasa wajib berada di lokasi untuk mendampingi dan mengawasi teknisi selama proses pemeriksaan dan pengerjaan fisik berlangsung.</p>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-white border-t border-slate-100 text-right shrink-0">
              <button
                type="button"
                onClick={() => {
                  setAgreeTerms(true);
                  setShowTermsModal(false);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] px-5 py-2.5 rounded-xl uppercase tracking-wider transition cursor-pointer shadow-md"
              >
                Setuju & Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: KEBIJAKAN PRIVASI ===================== */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[550px] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden text-left">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white shrink-0">
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wider">Kebijakan Privasi Sugar AC</h3>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed bg-slate-50 flex-grow font-semibold">
              <p>Kami sangat menghargai privasi informasi pribadi Anda. Kebijakan ini menjelaskan bagaimana data Anda dikumpulkan dan dilindungi:</p>
              
              <div className="space-y-2">
                <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-wide">1. Informasi Yang Kami Kumpulkan</h4>
                <p className="text-slate-600 font-medium">Kami mengumpulkan nama, alamat email, nomor telepon/WhatsApp, alamat pengerjaan, serta koordinat peta yang Anda tentukan secara sukarela saat pendaftaran atau pemesanan.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-wide">2. Penggunaan Data Koordinat GPS</h4>
                <p className="text-slate-600 font-medium">Informasi peta dan koordinat GPS hanya digunakan untuk membantu memetakan lokasi penugasan serta navigasi bagi teknisi Sugar AC menuju rumah/kantor Anda.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-wide">3. Kerahasiaan Data & Pihak Ketiga</h4>
                <p className="text-slate-600 font-medium">Seluruh data yang tersimpan tidak akan pernah dijual, disewakan, atau dibagikan kepada pihak ketiga di luar Sugar AC tanpa persetujuan tertulis dari Anda.</p>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-white border-t border-slate-100 text-right shrink-0">
              <button
                type="button"
                onClick={() => {
                  setAgreeTerms(true);
                  setShowPrivacyModal(false);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] px-5 py-2.5 rounded-xl uppercase tracking-wider transition cursor-pointer shadow-md"
              >
                Setuju & Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
