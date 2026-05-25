'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/auth-context';

export default function Home() {
  const router = useRouter();
  const { activeUser, isLoading } = useApp();

  useEffect(() => {
    if (isLoading) return;

    if (activeUser) {
      const role = activeUser.role.toLowerCase();
      router.push(`/dashboard/${role}`);
    } else {
      router.push('/login');
    }
  }, [activeUser, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Loading...</h1>
        <p className="text-gray-500">Redirecting you to the appropriate page</p>
      </div>
    </div>
  );
}
