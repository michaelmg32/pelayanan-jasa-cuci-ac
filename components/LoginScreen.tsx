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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });

      const data = await response.json();
      
      if (!response.ok) {
        setErrorMsg(data.error || 'Login gagal. Silakan coba lagi.');
        return;
      }

      // Authentication handled via Context API and MySQL sessions
      setErrorMsg('');
      setEmail('');
      setPassword('');
      
      if (data.user) {
        onLogin(data.user);
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
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
    <div className="flex-grow flex flex-col justify-between overflow-y-auto bg-gradient-to-b from-slate-100 via-white to-slate-50 px-5 py-6 min-h-0 text-left">
      
      {/* Brand Logo & Tagline */}
      <div className="flex flex-col items-center justify-center pt-3 shrink-0">
        <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 mb-2">
          <Wind size={26} className="text-white shrink-0 animate-pulse" />
        </div>
        <h1 className="text-lg font-black tracking-tight text-slate-800 leading-none">CoolAir Pro</h1>
        <p className="text-[10px] text-slate-400 font-bold tracking-tight mt-1 uppercase">Sistem Jasa AC Multi-Role Terpadu</p>
      </div>

      {/* Main Authentication Card */}
      <div className="my-5 bg-white border border-slate-200/60 rounded-[20px] p-5 shadow-lg shadow-slate-100 shrink-0">
        <div className="flex border-b border-slate-100 mb-4 pb-2">
          <button
            type="button"
            onClick={() => { setIsRegisterMode(false); setErrorMsg(''); }}
            className={`flex-1 text-center font-bold text-xs pb-1.5 transition duration-150 ${
              !isRegisterMode ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Masuk Akun
          </button>
          <button
            type="button"
            onClick={() => { setIsRegisterMode(true); setErrorMsg(''); }}
            className={`flex-1 text-center font-bold text-xs pb-1.5 transition duration-150 ${
              isRegisterMode ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Daftar Pelanggan
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-[11px] p-2.5 rounded-xl mb-3 text-center font-semibold">
            {errorMsg}
          </div>
        )}

        {!isRegisterMode ? (
          /* LOGIN PANEL */
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">E-mail Pengguna</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs pl-9 pr-3 py-2.5 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition duration-150"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Kata Sandi</label>
                <span className="text-[8px] text-slate-400 font-medium">Bebas</span>
              </div>
              <div className="relative">
                <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs pl-9 pr-3 py-2.5 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition duration-150"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-2.5 rounded-xl shadow-md text-xs flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer"
            >
              <LogIn size={13} />
              Masuk Sekarang
            </button>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
            <div>
              <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Nama Lengkap</label>
              <input
                type="text"
                placeholder="Michael Gungun"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition"
                required
              />
            </div>

            <div>
              <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">E-mail</label>
              <input
                type="email"
                placeholder="michael@gmail.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition"
                required
              />
            </div>

            <div>
              <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">No. Whatsapp</label>
              <input
                type="tel"
                placeholder="081299998888"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition"
                required
              />
            </div>

            <div>
              <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Alamat Lengkap</label>
              <textarea
                placeholder="Jl. Kemang Raya No. 45, Jakarta Selatan"
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition h-12 resize-none"
                required
              ></textarea>
            </div>

            <div>
              <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Kata Sandi</label>
              <div className="relative">
                <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs pl-9 pr-3 py-2 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-2 rounded-xl shadow-md text-xs flex items-center justify-center gap-1 transition"
            >
              <UserPlus size={12} />
              Daftar Sebagai Pelanggan
            </button>
          </form>
        )}
      </div>

      {/* Quick Login Buttons - DISABLED FOR PRODUCTION SECURITY */}
      {/* 
      Fitur "Akses Cepat" hanya untuk development/demo.
      Untuk production: hapus section ini atau guard dengan NODE_ENV check.
      
      <div className="space-y-2 shrink-0">
        <div className="flex items-center gap-2 justify-center">
          <div className="h-px bg-slate-200 flex-1"></div>
          <span className="text-[8px] text-slate-400 uppercase tracking-widest font-black">Akses Cepat (Pilih Role)</span>
          <div className="h-px bg-slate-200 flex-1"></div>
        </div>
        ... quick login buttons ...
      </div>
      */}
    </div>
  );
}
