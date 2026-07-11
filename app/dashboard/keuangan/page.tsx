'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/auth-context';
import { Role } from '@/types';
import KeuanganDashboard from '@/components/KeuanganDashboard';

export default function KeuanganDashboardPage() {
  const router = useRouter();
  const { activeUser, isLoading } = useApp();

  useEffect(() => {
    if (!isLoading && (!activeUser || activeUser.role !== Role.KEUANGAN)) {
      router.push('/login');
    }
  }, [activeUser, isLoading, router]);

  if (isLoading || !activeUser || activeUser.role !== Role.KEUANGAN) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <h1 className="text-lg font-bold mb-2">Memvalidasi Akses...</h1>
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return <KeuanganDashboard />;
}
