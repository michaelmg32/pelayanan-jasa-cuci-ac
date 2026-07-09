'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/auth-context';
import { Role } from '@/types';
import GajiDashboard from '@/components/GajiDashboard';

export default function GajiAdminPage() {
  const router = useRouter();
  const { activeUser, isLoading } = useApp();

  useEffect(() => {
    if (isLoading) return;
    if (!activeUser || (activeUser.role !== Role.ADMIN && activeUser.role !== Role.OWNER)) {
      router.push('/login');
    }
  }, [activeUser, isLoading, router]);

  if (isLoading || !activeUser) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0c29, #302b63)',
        color: 'white',
        flexDirection: 'column',
        gap: '1rem',
        fontFamily: 'Inter, Segoe UI, sans-serif',
      }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid rgba(255,255,255,0.2)',
          borderTopColor: '#a78bfa',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Memuat Sistem Penggajian...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <GajiDashboard activeUser={activeUser} />;
}
