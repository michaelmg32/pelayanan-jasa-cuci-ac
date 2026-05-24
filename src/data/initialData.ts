/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Role, Order, OrderStatus, ACModel, ACCategory, ACService, ACAddon } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin1',
    email: 'admin@cuciac.com',
    name: 'Budi Hartono (Admin Ops)',
    role: Role.ADMIN,
    phone: '081234567890',
  },
  {
    id: 'usr_owner1',
    email: 'owner@cuciac.com',
    name: 'H. Suryadi (Owner CoolAir)',
    role: Role.OWNER,
    phone: '081299991111',
  },
  {
    id: 'usr_staff1',
    email: 'eko@cuciac.com',
    name: 'Eko Prasetyo (Teknisi Senior)',
    role: Role.STAFF,
    phone: '085711223344',
  },
  {
    id: 'usr_staff2',
    email: 'agus@cuciac.com',
    name: 'Agus Saputra (Teknisi)',
    role: Role.STAFF,
    phone: '081988776655',
  },
  {
    id: 'usr_staff3',
    email: 'dedi@cuciac.com',
    name: 'Dedi Wijaya (Teknisi)',
    role: Role.STAFF,
    phone: '081199887766',
  },
  {
    id: 'usr_user1',
    email: 'michael@gmail.com',
    name: 'Michael Gungun',
    role: Role.USER,
    phone: '081299998888',
    address: 'Jl. Kemang Raya No. 45, Jakarta Selatan',
  },
  {
    id: 'usr_user2',
    email: 'siti@gmail.com',
    name: 'Siti Aminah',
    role: Role.USER,
    phone: '085277771111',
    address: 'Apartemen Menteng Executive, Tower B, Lt. 12, Jakarta Pusat',
  }
];

export const INITIAL_MODELS: ACModel[] = [
  { id: 'mdl_1', name: 'Split Wall (AC Standard biasa)' },
  { id: 'mdl_2', name: 'Inverter AC Smart' },
  { id: 'mdl_3', name: 'Cassette AC (Ceiling)' },
  { id: 'mdl_4', name: 'Standing Floor AC Jumbo' },
  { id: 'mdl_5', name: 'Portable AC Mini' }
];

export const INITIAL_CATEGORIES: ACCategory[] = [
  { id: 'cat_cuci', name: 'Layanan Cuci AC', description: 'Perawatan rutin pencucian unit indoor & outdoor agar udara bersih dan dingin.', hasServices: true },
  { id: 'cat_freon', name: 'Mengisi / Tambah Freon', description: 'Pengisian ulang refrigerant freon yang berkurang atau habis.', hasServices: true },
  { id: 'cat_perbaikan', name: 'Perbaikan Kendala AC', description: 'Mengatasi AC bocor air, berisik, kompresor mati, atau mati total.', hasServices: true },
  { id: 'cat_bongkar_pasang', name: 'Bongkar Pasang AC', description: 'Pelepasan unit lama, pemasangan unit baru, maupun pemindahan lokasi.', hasServices: true },
  { id: 'cat_konsultasi', name: 'Inspeksi & Konsultasi', description: 'Kategori tanpa layanan khusus, pengecekan menyeluruh oleh teknisi langsung.', hasServices: false }
];

export const INITIAL_SERVICES: ACService[] = [
  // Cuci
  { id: 'srv_1', categoryId: 'cat_cuci', name: 'Cuci AC Rutin Standard', price: 75000 },
  { id: 'srv_2', categoryId: 'cat_cuci', name: 'Cuci Besar Overhaul (Turun Unit)', price: 150000 },
  
  // Freon
  { id: 'srv_3', categoryId: 'cat_freon', name: 'Isi Freon R32 (Full)', price: 200000 },
  { id: 'srv_4', categoryId: 'cat_freon', name: 'Isi Freon R410a (Full)', price: 220000 },
  { id: 'srv_5', categoryId: 'cat_freon', name: 'Tambah Freon R32 (Parsial)', price: 100000 },
  
  // Perbaikan
  { id: 'srv_6', categoryId: 'cat_perbaikan', name: 'Perbaikan Kebocoran Air Indoor', price: 120000 },
  { id: 'srv_7', categoryId: 'cat_perbaikan', name: 'Las Pipa Kebocoran Freon & Vakum', price: 250000 },
  
  // Bongkar Pasang
  { id: 'srv_8', categoryId: 'cat_bongkar_pasang', name: 'Bongkar Unit AC Saja', price: 90000 },
  { id: 'srv_9', categoryId: 'cat_bongkar_pasang', name: 'Pasang Unit AC Saja', price: 175000 }
];

export const INITIAL_ADDONS: ACAddon[] = [
  { id: 'add_1', name: 'Pipa AC Premium (per Meter)', price: 95000 },
  { id: 'add_2', name: 'Kabel Listrik NYM 3x2.5 (per Meter)', price: 25000 },
  { id: 'add_3', name: 'Selang Air Pembuangan Flexible (per Meter)', price: 15000 },
  { id: 'add_4', name: 'Braket Metal Outdoor AC', price: 75000 },
  { id: 'add_5', name: 'Kapasitor Kompresor 35uF (AC 1 PK)', price: 125000 },
  { id: 'add_6', name: 'Daktape Lem Pembungkus Pipa (per Roll)', price: 20050 }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-2026-001',
    customerId: 'usr_user2',
    customerName: 'Siti Aminah',
    customerPhone: '085277771111',
    address: 'Apartemen Menteng Executive, Tower B, Lt. 12, Jakarta Pusat',
    scheduledDate: '2026-05-23',
    scheduledTime: '09:00',
    acDetail: {
      acType: 'Split Wall (AC Standard biasa)',
      category: 'Layanan Cuci AC',
      serviceType: 'Cuci AC Rutin Standard',
      quantity: 2,
    },
    notes: 'AC di kamar tidur kurang berhembus kencang dan berdebu.',
    status: OrderStatus.MENUNGGU,
    createdAt: '2026-05-22T08:30:00Z',
    serviceCost: 150000,
    addonsCost: 0,
    totalCost: 150000,
  },
  {
    id: 'ORD-2026-002',
    customerId: 'usr_user1',
    customerName: 'Michael Gungun',
    customerPhone: '081299998888',
    address: 'Jl. Kemang Raya No. 45, Jakarta Selatan',
    scheduledDate: '2026-05-24',
    scheduledTime: '13:00',
    acDetail: {
      acType: 'Inverter AC Smart',
      category: 'Mengisi / Tambah Freon',
      serviceType: 'Tambah Freon R32 (Parsial)',
      quantity: 1,
    },
    notes: 'AC menyala tapi hembusannya hanya angin biasa saja.',
    status: OrderStatus.DITUGASKAN,
    assignedTo: 'usr_staff1',
    assignedEmployeeName: 'Eko Prasetyo (Teknisi Senior)',
    createdAt: '2026-05-23T09:15:00Z',
    serviceCost: 100000,
    addonsCost: 0,
    totalCost: 100000,
  },
  {
    id: 'ORD-2026-003',
    customerId: 'usr_user1',
    customerName: 'Michael Gungun',
    customerPhone: '081299998888',
    address: 'Jl. Kemang Raya No. 45, Jakarta Selatan',
    scheduledDate: '2026-05-20',
    scheduledTime: '10:00',
    acDetail: {
      acType: 'Split Wall (AC Standard biasa)',
      category: 'Layanan Cuci AC',
      serviceType: 'Cuci Besar Overhaul (Turun Unit)',
      quantity: 1,
    },
    notes: 'Sudah 1 tahun tidak dicuci turun unit. Berisik di bagian indoor.',
    status: OrderStatus.SELESAI,
    assignedTo: 'usr_staff2',
    assignedEmployeeName: 'Agus Saputra (Teknisi)',
    createdAt: '2026-05-19T07:00:00Z',
    completedAt: '2026-05-20T11:45:00Z',
    completionNotes: 'Pembersihan blower indoor total diturunkan. Mengganti kapasitor lemah.',
    serviceCost: 150000,
    addonsCost: 125000, // 1 x Kapasitor
    totalCost: 275000,
    rating: 5,
    ratingNotes: 'Pelayanan sangat profesional, ac kembali nyaring dan super dingin dingin dingin!',
    paymentMethod: 'CASH',
    paymentStatus: 'PAID',
    photoBefore: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=120&auto=format&fit=crop&q=60',
    photoAfter: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=120&auto=format&fit=crop&q=60',
    addonsUsed: [
      { id: 'add_5', name: 'Kapasitor Kompresor 35uF (AC 1 PK)', price: 125000, quantity: 1 }
    ]
  },
  {
    id: 'ORD-2026-004',
    customerId: 'usr_user2',
    customerName: 'Siti Aminah',
    customerPhone: '085277771111',
    address: 'Apartemen Menteng Executive, Tower B, Lt. 12, Jakarta Pusat',
    scheduledDate: '2026-05-21',
    scheduledTime: '15:30',
    acDetail: {
      acType: 'Split Wall (AC Standard biasa)',
      category: 'Perbaikan Kendala AC',
      serviceType: 'Perbaikan Kebocoran Air Indoor',
      quantity: 1,
    },
    notes: 'Air menetes terus di kamar utama sampai lantai basah.',
    status: OrderStatus.SELESAI,
    assignedTo: 'usr_staff1',
    assignedEmployeeName: 'Eko Prasetyo (Teknisi Senior)',
    createdAt: '2026-05-20T14:20:00Z',
    completedAt: '2026-05-21T17:00:00Z',
    completionNotes: 'Saluran pembuangan tersumbat lumut. Di-flush dan pipa ditambah 3 meter.',
    serviceCost: 120000,
    addonsCost: 45000, // 3 x Selang Air
    totalCost: 165000,
    rating: 4,
    ratingNotes: 'Teknisi ramah dan tepat waktu. Masalah bocor air teratasi.',
    paymentMethod: 'TRANSFER',
    paymentStatus: 'PAID',
    addonsUsed: [
      { id: 'add_3', name: 'Selang Air Pembuangan Flexible (per Meter)', price: 15000, quantity: 3 }
    ]
  },
  {
    id: 'ORD-2026-005',
    customerId: 'usr_user1',
    customerName: 'Michael Gungun',
    customerPhone: '081299998888',
    address: 'Jl. Kemang Raya No. 45, Jakarta Selatan',
    scheduledDate: '2026-05-18',
    scheduledTime: '11:00',
    acDetail: {
      acType: 'Cassette AC (Ceiling)',
      category: 'Mengisi / Tambah Freon',
      serviceType: 'Isi Freon R410a (Full)',
      quantity: 2,
    },
    status: OrderStatus.SELESAI,
    assignedTo: 'usr_staff2',
    assignedEmployeeName: 'Agus Saputra (Teknisi)',
    createdAt: '2026-05-17T09:00:00Z',
    completedAt: '2026-05-18T13:30:00Z',
    completionNotes: 'Isi freon full untuk 2 unit Cassette ruko.',
    serviceCost: 440000, // 2 x 220.000
    addonsCost: 0,
    totalCost: 440000,
    rating: 5,
    ratingNotes: 'Suasana ruangan ruko kembali sejuk cepat dingin.',
    paymentMethod: 'TRANSFER',
    paymentStatus: 'PAID'
  }
];
