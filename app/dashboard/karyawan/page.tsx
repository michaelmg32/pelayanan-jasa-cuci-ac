'use client';

// Redirect to /dashboard/staff (both 'karyawan' and 'staff' are valid endpoints)
import { redirect } from 'next/navigation';

export default function KaryawanRedirect() {
  redirect('/dashboard/staff');
}
