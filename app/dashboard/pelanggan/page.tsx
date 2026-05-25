'use client';

// Redirect to /dashboard/user (both 'pelanggan' and 'user' are valid endpoints)
import { redirect } from 'next/navigation';

export default function PelangganRedirect() {
  redirect('/dashboard/user');
}
