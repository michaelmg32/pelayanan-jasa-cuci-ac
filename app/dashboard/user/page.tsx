'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/auth-context';
import { Role } from '@/types';
import MobileFrame from '@/components/MobileFrame';
import PelangganDashboard from '@/components/PelangganDashboard';

export default function PelangganPage() {
  const router = useRouter();
  const { activeUser, logout, isLoading } = useApp();

  useEffect(() => {
    if (isLoading) return;

    if (!activeUser || activeUser.role !== Role.USER) {
      router.push('/login');
    }
  }, [activeUser, isLoading, router]);

  if (isLoading || !activeUser) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <MobileFrame activeUser={activeUser} onLogout={logout} hideHeader={true}>
      <PelangganDashboard />
    </MobileFrame>
  );
}
