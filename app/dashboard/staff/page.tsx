'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/auth-context';
import { Role } from '@/types';
import MobileFrame from '@/components/MobileFrame';
import KaryawanDashboard from '@/components/KaryawanDashboard';

export default function KaryawanPage() {
  const router = useRouter();
  const { activeUser, logout, isLoading } = useApp();

  useEffect(() => {
    if (isLoading) return;

    if (!activeUser || activeUser.role !== Role.STAFF) {
      router.push('/login');
    }
  }, [activeUser, isLoading, router]);

  if (isLoading || !activeUser) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <MobileFrame activeUser={activeUser} onLogout={logout}>
      <KaryawanDashboard />
    </MobileFrame>
  );
}
