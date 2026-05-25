'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/auth-context';
import MobileFrame from '@/components/MobileFrame';
import LoginScreen from '@/components/LoginScreen';

export default function LoginPage() {
  const router = useRouter();
  const { activeUser, users, login, registerCustomer, logout, isLoading } = useApp();

  useEffect(() => {
    if (!isLoading && activeUser) {
      const role = activeUser.role.toLowerCase();
      router.push(`/dashboard/${role}`);
    }
  }, [activeUser, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <MobileFrame activeUser={null} onLogout={() => {}}>
      <LoginScreen 
        onLogin={login}
        onRegisterCustomer={registerCustomer}
        availableUsers={users}
      />
    </MobileFrame>
  );
}
