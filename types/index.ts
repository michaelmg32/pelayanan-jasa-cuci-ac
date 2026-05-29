/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  OWNER = 'OWNER',
}

export enum OrderStatus {
  MENUNGGU = 'MENUNGGU',       // Menunggu penunjukan staff
  DITUGASKAN = 'DITUGASKAN',   // Staff ditunjuk, dalam perjalanan
  CEK_LAYANAN = 'CEK_LAYANAN', // Staff sampai, cek kendala, input before photo
  PENGERJAAN = 'PENGERJAAN',   // Pengerjaan ac, input addons / perlengkapan & after photo
  PAYMENT = 'PAYMENT',         // Pembayaran cash (di-acc staff) atau transfer (norek bank)
  SELESAI = 'SELESAI',         // Selesai, ratings & feedback
  DIBATALKAN = 'DIBATALKAN',   // Pesanan dibatalkan (misal karena perubahan jadwal ditolak)
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  address?: string;
  lat?: number;
  lng?: number;
  photoUrl?: string;
  photo?: string;
}

export interface ACModel {
  id: string;
  name: string;
}

export interface ACCategory {
  id: string;
  name: string;
  description?: string;
  hasServices: boolean; // Jika false, kategori ini tidak memiliki layanan khusus
}

export interface ACService {
  id: string;
  categoryId: string;
  name: string;
  price: number;
}

export interface ACAddon {
  id: string;
  name: string;
  price: number;
  hpp?: number;
}

export interface SelectedAddon {
  id: string;
  name: string;
  price: number;
  quantity: number;
  hpp?: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  scheduledDate: string;
  scheduledTime: string;
  proposedDate?: string;
  proposedTime?: string;
  rescheduleStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  cancelReason?: string; // e.g. "Dibatalkan oleh Admin" or "Dibatalkan Pelanggan (Tolak Jadwal)"
  workerCancelReason?: string; // e.g. "Alamat tidak ditemukan"
  acDetail: {
    acType: string;       // Model AC (Daikin, Sharp, etc. atau tipe Split, Cassette)
    category: string;     // Kategori Jasa (Cuci AC, Perbaikan AC, dll)
    serviceType: string;  // Jenis Layanan (e.g. Cuci Rutin, Overhaul, none)
    quantity: number;
  };
  notes?: string;
  status: OrderStatus;
  assignedTo?: string; // ID Staff (Teknisi)
  assignedEmployeeName?: string;
  createdAt: string;
  completedAt?: string;
  completionNotes?: string;
  
  serviceCost: number; // Harga dasar layanan
  addonsCost: number;  // Total harga perlengkapan tambahan
  totalCost: number;   // serviceCost + addonsCost
  addonsUsed?: {
    id?: string;
    name: string;
    price: number;
    quantity: number;
    hpp?: number;
  }[];
  
  rating?: number; // 1-5 bintang
  ratingNotes?: string;
  
  photoBefore?: string; // Base64 before AC cleaning/maintenance
  photoAfter?: string;  // Base64 after AC cleaning/maintenance
  
  paymentMethod?: 'CASH' | 'TRANSFER';
  paymentStatus?: 'WAITING_APPROVAL' | 'PAID';
  bankName?: string; // Norek detail
  paymentInvoiceId?: string; // Xendit Invoice ID
  paymentUrl?: string; // Xendit Payment URL
  invoiceSent?: boolean;
}
