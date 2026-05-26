'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Role } from '@/types';
import { Wind, Key, Mail, LogIn, UserPlus } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  onRegisterCustomer: (name: string, email: string, phone: string, address: string) => void;
  availableUsers: User[];
}

export default function LoginScreen({ onLogin, onRegisterCustomer, availableUsers }: LoginScreenProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Register state (Pelanggan)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Email tidak boleh kosong.');
      return;
    }
    
    if (!password.trim()) {
      setErrorMsg('Kata sandi tidak boleh kosong.');
      return;
    }

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
      setEmail('');
      setPassword('');
      
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
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !password.trim()) {
      setErrorMsg('Semua data wajib diisi.');
      return;
    }

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
          role: 'pelanggan'
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        setErrorMsg(data.error || 'Registrasi gagal. Silakan coba lagi.');
        return;
      }

      // Authentication handled via Context API and MySQL sessions
      setErrorMsg('');
      setRegName('');
      setRegEmail('');
      setRegPhone('');
      setRegAddress('');
      setPassword('');
      
      if (data.user) {
        if (data.token) {
          document.cookie = `auth_token=${data.token}; path=/; max-age=86400; SameSite=Lax`;
        }
        onLogin(data.user);
      }
    } catch (error) {
      console.error('Register error:', error);
      setErrorMsg('Kesalahan koneksi. Silakan periksa server.');
    }
  };

  const adminUsers = availableUsers.filter(u => u.role === Role.ADMIN);
  const staffUsers = availableUsers.filter(u => u.role === Role.STAFF);
  const pelangganUsers = availableUsers.filter(u => u.role === Role.USER);
  const ownerUsers = availableUsers.filter(u => u.role === Role.OWNER);
  // Variables above unused - kept for reference only

  return (
    <div className="w-full min-h-[calc(100vh-76px)] flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100/70 to-blue-50/30 p-4 sm:p-6 md:p-8 font-sans">
      <div className="w-full max-w-[460px] bg-white border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-200/40 p-6 sm:p-8 flex flex-col transition duration-300 hover:shadow-2xl hover:shadow-blue-500/5">
        
        {/* Brand Logo & Tagline */}
        <div className="flex flex-col items-center justify-center mb-6 shrink-0">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-3 transform hover:rotate-6 transition duration-300 cursor-pointer">
            <Wind size={28} className="text-white shrink-0 animate-pulse" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-800 leading-none">CoolAir Pro</h2>
          <p className="text-[10px] text-slate-400 font-bold tracking-wider mt-2 uppercase">Sistem Jasa AC Multi-Role Terpadu</p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 mb-5 relative">
          <button
            type="button"
            onClick={() => { setIsRegisterMode(false); setErrorMsg(''); }}
            className={`flex-1 text-center font-bold text-xs pb-3 transition duration-200 relative ${
              !isRegisterMode ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Masuk Akun
            {!isRegisterMode && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></span>
            )}
          </button>
          <button
            type="button"
            onClick={() => { setIsRegisterMode(true); setErrorMsg(''); }}
            className={`flex-1 text-center font-bold text-xs pb-3 transition duration-200 relative ${
              isRegisterMode ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Daftar Pelanggan
            {isRegisterMode && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></span>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-2xl mb-4 text-center font-semibold">
            {errorMsg}
          </div>
        )}

        {!isRegisterMode ? (
          /* LOGIN PANEL */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block ml-1">E-mail Pengguna</label>
              <div className="relative group">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                <input
                  type="email"
                  placeholder="name@company.com"
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
                <span className="text-[10px] text-slate-400 font-medium">Bebas</span>
              </div>
              <div className="relative group">
                <Key size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50/60 border border-slate-200 text-slate-800 text-sm pl-10 pr-4 py-3 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.98] text-sm flex items-center justify-center gap-2 transition duration-200 cursor-pointer"
            >
              <LogIn size={15} />
              Masuk Sekarang
            </button>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block ml-1">Nama Lengkap</label>
              <input
                type="text"
                placeholder="Michael Gungun"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full bg-slate-50/60 border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition duration-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block ml-1">E-mail</label>
              <input
                type="email"
                placeholder="michael@gmail.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full bg-slate-50/60 border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition duration-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block ml-1">No. Whatsapp</label>
              <input
                type="tel"
                placeholder="081299998888"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="w-full bg-slate-50/60 border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition duration-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block ml-1">Alamat Lengkap</label>
              <textarea
                placeholder="Jl. Kemang Raya No. 45, Jakarta Selatan"
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
                className="w-full bg-slate-50/60 border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition duration-200 h-16 resize-none"
                required
              ></textarea>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block ml-1">Kata Sandi</label>
              <div className="relative group">
                <Key size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50/60 border border-slate-200 text-slate-800 text-sm pl-10 pr-4 py-2.5 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition duration-200"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.98] text-sm flex items-center justify-center gap-2 transition duration-200 cursor-pointer"
            >
              <UserPlus size={15} />
              Daftar Sebagai Pelanggan
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
