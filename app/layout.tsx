import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'Pelayanan Jasa Cuci AC',
  description: 'Sistem Manajemen Layanan Cuci AC',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
