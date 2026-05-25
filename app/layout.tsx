import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'Pelayanan Jasa Cuci AC',
  description: 'Sistem Manajemen Layanan Cuci AC',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
