'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/auth-context';

export default function DashboardPage() {
  const router = useRouter();
  const { activeUser, isLoading } = useApp();

  useEffect(() => {
    if (isLoading) return;

    if (!activeUser) {
      router.push('/login');
    } else {
      const role = activeUser.role.toLowerCase();
      router.push(`/dashboard/${role}`);
    }
  }, [activeUser, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Loading...</h1>
      </div>
    </div>
  );
}
