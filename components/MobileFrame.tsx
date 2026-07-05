'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User as UserIcon, LogOut } from 'lucide-react';
import { User } from '@/types';
import { useApp } from '@/lib/auth-context';

interface MobileFrameProps {
  children: React.ReactNode;
  activeUser: User | null;
  onLogout: () => void;
  hideHeader?: boolean;
}

// Production Mode - Clean Professional Layout
export default function MobileFrame({
  children,
  activeUser,
  onLogout,
  hideHeader = false,
}: MobileFrameProps) {
  const { appSettings } = useApp();

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-800 flex flex-col font-sans selection:bg-blue-500 selection:text-white overflow-hidden">
      {/* Header */}
      {!hideHeader && (
        <header className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md overflow-hidden">
              {appSettings?.['GLOBAL']?.business_logo ? (
                <img src={appSettings['GLOBAL'].business_logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">{appSettings?.['GLOBAL']?.business_name || 'CoolAir Pro'}</h1>
              <p className="text-xs text-slate-500">Sistem Layanan AC Profesional</p>
            </div>
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-4">
            {activeUser ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{activeUser.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{activeUser.role}</p>
                </div>
                <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-white flex items-center justify-center shrink-0 shadow-sm">
                  {activeUser.photo ? (
                    <img src={activeUser.photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                      <UserIcon size={18} />
                    </div>
                  )}
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600 hover:text-slate-900"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <UserIcon size={18} className="text-slate-400" />
              </div>
            )}
          </div>
        </div>
      </header>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="w-full flex-grow flex flex-col min-h-0">
          {children}
        </div>
      </main>
    </div>
  );
}
