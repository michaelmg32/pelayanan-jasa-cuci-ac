/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  OWNER = 'OWNER',
  KEUANGAN = 'KEUANGAN',
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
  region_id?: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  address?: string;
  lat?: number;
  lng?: number;
  photoUrl?: string;
  photo?: string;
  ktpPhoto?: string;
  selfiePhoto?: string;
  status?: string;
  is_leader?: boolean;
  leader_id?: string;
  salary_balance?: number;
  points_balance?: number;
  salary_type?: 'daily' | 'monthly';
  monthly_salary_date?: number | null;
  last_monthly_salary_paid?: string | null;
  grade_id?: string;
}

export interface ACModel {
  id: string;
  region_id?: string;
  name: string;
}

export interface ACCategory {
  id: string;
  region_id?: string;
  name: string;
  description?: string;
  icon?: string;
  hasServices: boolean; // Jika false, kategori ini tidak memiliki layanan khusus
}

export interface ACService {
  id: string;
  region_id?: string;
  categoryId: string;
  name: string;
  price: number;
}

export interface ACAddon {
  id: string;
  region_id?: string;
  name: string;
  price: number;
  hpp?: number;
  stock?: number;
}

export interface AddonTransaction {
  id: number;
  region_id?: string;
  addonId: string;
  addonName?: string;
  type: 'masuk' | 'keluar';
  qty: number;
  price: number;
  notes?: string;
  orderId?: string;
  createdAt: string;
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
  region_id?: string;
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
  }[];
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
  margin?: number;
  quantity?: number;
  hpp_orders?: number;
  finalPrice?: number;
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
  paymentProof?: string; // Base64 payment proof image
  bankName?: string; // Norek detail
  paymentInvoiceId?: string; // Xendit Invoice ID
  paymentUrl?: string; // Xendit Payment URL
  invoiceSent?: boolean;
  voucher_code?: string;
  voucher_discount?: number;
}

// =====================================================================
// PAYROLL SYSTEM TYPES
// =====================================================================

export interface StaffGrade {
  id: string;
  region_id: string;
  regionName?: string;
  name: string;
  description?: string;
  leader_daily_base_salary: number;
  leader_daily_travel_allowance: number;
  leader_point_reward: number;
  member_daily_base_salary: number;
  member_daily_travel_allowance: number;
  member_point_reward: number;
  leader_monthly_base_salary?: number;
  leader_monthly_travel_allowance?: number;
  member_monthly_base_salary?: number;
  member_monthly_travel_allowance?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalaryConfig {
  id: string;
  grade_id: string;
  region_id: string;
  base_salary: number;
  fixed_bonus: number;
  bonus_per_order: number;
}

export interface SalaryRecord {
  id: string;
  staff_id: string;
  staff_name: string;
  region_id: string;
  regionName?: string;
  grade_id?: string;
  grade_name?: string;
  period_month: string;
  base_salary: number;
  total_orders_completed: number;
  order_bonus: number;
  fixed_bonus: number;
  total_salary: number;
  status: 'PENDING' | 'PAID';
  notes?: string;
  paid_at?: string;
  generated_by?: string;
  createdAt?: string;
}

export interface SalarySummary {
  region_id: string;
  regionName: string;
  period_month: string;
  total_staff: number;
  total_salary_cost: number;
  total_base: number;
  total_order_bonus: number;
  total_fixed_bonus: number;
  paid_count: number;
  pending_count: number;
}

export interface StaffWithGrade {
  id: string;
  name: string;
  email: string;
  phone?: string;
  region_id?: string;
  regionName?: string;
  grade_id?: string;
  grade_name?: string;
  base_salary?: number;
  fixed_bonus?: number;
  bonus_per_order?: number;
}
