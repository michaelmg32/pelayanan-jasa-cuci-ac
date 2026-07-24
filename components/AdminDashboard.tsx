'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { User, Order, OrderStatus, Role, ACModel, ACCategory, ACService, ACAddon, AddonTransaction } from '@/types';
import * as api from '@/lib/api';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });
import {
  LogOut,
  ClipboardList,
  UserCheck,
  CheckCircle,
  Calendar,
  MapPin,
  Phone,
  AlertCircle,
  Wrench,
  Search,
  Users,
  DollarSign,
  UserCog,
  Shield,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Lock,
  Building,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  CornerDownRight,
  Loader,
  Star,
  User as UserIcon,
  Mail,
  ShieldCheck,
  Camera,
  Check,
  MessageCircle,
  MoreVertical,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Download,
  Clock,
  Tag,
  UserPlus
} from 'lucide-react';
import { useApp } from '@/lib/auth-context';

type TabType = 'JOBS_TRACKER' | 'MASTER_DATA' | 'USER_MANAGEMENT' | 'PROFIL' | 'VOUCHERS';

export default function AdminDashboard() {
  const {
    activeUser, setActiveUser,
    orders, setOrders,
    users, setUsers,
    models, setModels,
    categories, setCategories,
    services, setServices,
    servicePrices, setServicePrices,
    addons, setAddons,
    regions,
    logout,
    showAlert,
    appSettings
  } = useApp();
  const alert = showAlert;
  const [inspectedPhoto, setInspectedPhoto] = useState<string | null>(null);
  const [verifyingUser, setVerifyingUser] = useState<User | null>(null);
  // Extract staff members from users and sort by rating & jobs done
  const staffList = users.filter(u => u.role === Role.STAFF && u.status === 'active');
  const sortedStaffList = useMemo(() => {
    return staffList.map(staff => {
      const staffOrders = orders.filter(o => o.assignedTo === staff.id && o.status === OrderStatus.SELESAI);
      const jobsDone = staffOrders.length;
      const ratedOrders = staffOrders.filter(o => typeof o.rating === 'number');
      const avgRating = ratedOrders.length > 0
        ? ratedOrders.reduce((acc, curr) => acc + (curr.rating as number), 0) / ratedOrders.length
        : 0;
      return { ...staff, jobsDone, avgRating };
    }).sort((a, b) => {
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
      return b.jobsDone - a.jobsDone;
    });
  }, [staffList, orders]);
  const allUsers = users;

  // WhatsApp Invoice Link generator
  const getWhatsAppInvoiceLink = (order: Order) => {
    let phone = order.customerPhone || '';
    phone = phone.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }

    let serviceName = 'Jasa Layanan AC';
    if (Array.isArray(order.acDetail) && order.acDetail.length > 0) {
      serviceName = order.acDetail.map(s => `${s.quantity || 0}x ${s.serviceType === 'none' ? s.category : s.serviceType} (${s.acType || ''})`).join(', ');
    } else if (order.acDetail) {
      serviceName = `${(order.acDetail as any).quantity || 0}x ${(order.acDetail as any).serviceType === 'none' ? (order.acDetail as any).category : (order.acDetail as any).serviceType} (${(order.acDetail as any).acType || ''})`;
    }

    let addonsUsedParsed: any[] = [];
    if (order.addonsUsed) {
      if (typeof order.addonsUsed === 'string') {
        try {
          addonsUsedParsed = JSON.parse(order.addonsUsed);
        } catch (e) {
          console.error('Error parsing addonsUsed:', e);
        }
      } else if (Array.isArray(order.addonsUsed)) {
        addonsUsedParsed = order.addonsUsed;
      }
    }

    let totalAddonsSales = 0;
    let addonsText = '';
    if (addonsUsedParsed && addonsUsedParsed.length > 0) {
      addonsText = '\n*Perlengkapan Tambahan:*\n';
      addonsUsedParsed.forEach(ad => {
        const unitPrice = Number(ad.price || 0);
        const qty = Number(ad.quantity || 0);
        const subTotal = unitPrice * qty;
        totalAddonsSales += subTotal;
        addonsText += `- ${ad.name} (${qty}x @ Rp${unitPrice.toLocaleString('id-ID')}): Rp${subTotal.toLocaleString('id-ID')}\n`;
      });
      addonsText += `*Total Perlengkapan:* Rp${totalAddonsSales.toLocaleString('id-ID')}\n`;
    }

    const grandTotal = order.finalPrice || (Number(order.serviceCost || 0) + totalAddonsSales);

    const message = `Halo Kak *${order.customerName}*,\n\nBerikut adalah rincian tagihan/invoice untuk pengerjaan AC Anda oleh *CoolAir Pro*:\n\n*Order ID:* ${order.id}\n*Tanggal Pengerjaan:* ${order.scheduledDate} (${order.scheduledTime})\n*Layanan:* ${serviceName}\n\n*Rincian Biaya:*\n- Jasa Utama: Rp${Number(order.serviceCost || 0).toLocaleString('id-ID')}${addonsText}\n*Grand Total:* *Rp${Number(grandTotal).toLocaleString('id-ID')}*\n\n*Status:* ✅ *LUNAS*\n\nTerima kasih telah mempercayakan CoolAir Pro untuk kenyamanan AC Anda! 🙏❄️`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const handleSendInvoice = async (order: Order) => {
    setIsLoading(true);
    try {
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        apiUrl = apiUrl.replace(/localhost|127\.0\.0\.1/, window.location.hostname);
      }

      console.log('Sending invoice request for order:', order.id);
      const response = await fetch(`${apiUrl}/orders/${order.id}/send-invoice`, {
        method: 'POST'
      });

      if (response.ok) {
        alert('✓ Invoice berhasil dikirim secara otomatis via WhatsApp (Fonnte)!');

        // Update local state
        setOrders(prevOrders =>
          prevOrders.map(o => o.id === order.id ? { ...o, invoiceSent: true } : o)
        );

        if (selectedOrderDetail && selectedOrderDetail.id === order.id) {
          setSelectedOrderDetail(prev => prev ? { ...prev, invoiceSent: true } : null);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to send invoice via Fonnte, falling back to manual wa.me:', errorData);

        // Fallback to manual wa.me
        window.open(getWhatsAppInvoiceLink(order), '_blank');

        // Mark as sent in DB
        await api.updateOrder(order.id, { invoiceSent: true });

        // Update local state
        setOrders(prevOrders =>
          prevOrders.map(o => o.id === order.id ? { ...o, invoiceSent: true } : o)
        );

        if (selectedOrderDetail && selectedOrderDetail.id === order.id) {
          setSelectedOrderDetail(prev => prev ? { ...prev, invoiceSent: true } : null);
        }
        alert('✓ Fonnte gagal. Dialihkan ke WhatsApp manual, status diperbarui.');
      }
    } catch (err) {
      console.error('Error sending invoice:', err);
      // Fallback to manual wa.me
      window.open(getWhatsAppInvoiceLink(order), '_blank');
      alert('✓ Dialihkan ke WhatsApp manual.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state for async operations
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<TabType>('JOBS_TRACKER');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [accessibleRegions, setAccessibleRegions] = useState<any[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  useEffect(() => {
    if (activeUser?.region_id) {
      setSelectedRegion(localStorage.getItem('activeRegionId') || activeUser.region_id);
    }
  }, [activeUser]);

  useEffect(() => {
    if (activeUser && (activeUser.role === Role.ADMIN || activeUser.role === Role.KEUANGAN)) {
      api.fetchAccessibleRegions().then(regions => {
        setAccessibleRegions(regions);
      }).catch(err => console.error("Error fetching accessible regions:", err));
    }
  }, [activeUser]);
  // Admin Profile States
  const [profileViewMode, setProfileViewMode] = useState<'readonly' | 'edit-profile' | 'edit-password'>('readonly');
  const [editProfileName, setEditProfileName] = useState(activeUser?.name || '');
  const [editProfilePhone, setEditProfilePhone] = useState(activeUser?.phone || '');
  const [editProfileAddress, setEditProfileAddress] = useState(activeUser?.address || '');
  const [editProfilePhoto, setEditProfilePhoto] = useState(activeUser?.photo || '');
  const [editOldPassword, setEditOldPassword] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [saveProfileSuccess, setSaveProfileSuccess] = useState(false);
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Voucher Management States
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null);

  const [vchCode, setVchCode] = useState('');
  const [vchName, setVchName] = useState('');
  const [vchDiscountType, setVchDiscountType] = useState<'percentage' | 'fixed'>('fixed');
  const [vchDiscountValue, setVchDiscountValue] = useState(0);
  const [vchMinOrderAmount, setVchMinOrderAmount] = useState(0);
  const [vchMaxDiscountAmount, setVchMaxDiscountAmount] = useState<number | ''>('');
  const [vchStartDate, setVchStartDate] = useState('');
  const [vchEndDate, setVchEndDate] = useState('');
  const [vchMaxUsesTotal, setVchMaxUsesTotal] = useState<number | ''>('');
  const [vchNewUserOnly, setVchNewUserOnly] = useState(false);
  const [vchIsActive, setVchIsActive] = useState(true);

  const loadVouchers = async () => {
    try {
      setLoadingVouchers(true);
      const data = await api.fetchVouchers(activeUser?.region_id);
      setVouchers(data);
    } catch (err) {
      console.error('Error loading vouchers:', err);
    } finally {
      setLoadingVouchers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'VOUCHERS') {
      loadVouchers();
    }
  }, [activeTab]);

  const handleOpenVoucherModal = (vch: any | null = null) => {
    setSelectedVoucher(vch);
    if (vch) {
      setVchCode(vch.code);
      setVchName(vch.name);
      setVchDiscountType(vch.discount_type);
      setVchDiscountValue(Number(vch.discount_value));
      setVchMinOrderAmount(Number(vch.min_order_amount));
      setVchMaxDiscountAmount(vch.max_discount_amount !== null ? Number(vch.max_discount_amount) : '');
      setVchStartDate(vch.start_date ? vch.start_date.substring(0, 16).replace(' ', 'T') : '');
      setVchEndDate(vch.end_date ? vch.end_date.substring(0, 16).replace(' ', 'T') : '');
      setVchMaxUsesTotal(vch.max_uses_total !== null ? Number(vch.max_uses_total) : '');
      setVchNewUserOnly(!!vch.new_user_only);
      setVchIsActive(!!vch.is_active);
    } else {
      setVchCode('');
      setVchName('');
      setVchDiscountType('fixed');
      setVchDiscountValue(0);
      setVchMinOrderAmount(0);
      setVchMaxDiscountAmount('');
      const now = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(now.getMonth() + 1);
      setVchStartDate(now.toISOString().substring(0, 16));
      setVchEndDate(nextMonth.toISOString().substring(0, 16));
      setVchMaxUsesTotal('');
      setVchNewUserOnly(false);
      setVchIsActive(true);
    }
    setShowVoucherModal(true);
  };

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vchCode.trim() || !vchName.trim()) {
      alert('❌ Kode dan Nama voucher wajib diisi.');
      return;
    }

    const payload = {
      code: vchCode.toUpperCase().trim(),
      name: vchName.trim(),
      discount_type: vchDiscountType,
      discount_value: Number(vchDiscountValue),
      min_order_amount: Number(vchMinOrderAmount),
      max_discount_amount: vchMaxDiscountAmount === '' ? null : Number(vchMaxDiscountAmount),
      start_date: vchStartDate.replace('T', ' '),
      end_date: vchEndDate.replace('T', ' '),
      max_uses_total: vchMaxUsesTotal === '' ? null : Number(vchMaxUsesTotal),
      new_user_only: vchNewUserOnly,
      is_active: vchIsActive,
      region_id: activeUser?.region_id
    };

    try {
      setIsLoading(true);
      if (selectedVoucher) {
        await api.updateVoucher(selectedVoucher.id, payload);
        alert('✓ Voucher berhasil diperbarui!');
      } else {
        await api.createVoucher(payload);
        alert('✓ Voucher baru berhasil ditambahkan!');
      }
      setShowVoucherModal(false);
      loadVouchers();
    } catch (err: any) {
      alert(`❌ Gagal menyimpan voucher: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVoucher = async (id: string, code: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus voucher "${code}"?`)) return;
    try {
      setIsLoading(true);
      await api.deleteVoucher(id);
      alert('✓ Voucher berhasil dihapus!');
      loadVouchers();
    } catch (err: any) {
      alert(`❌ Gagal menghapus voucher: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync edits when user props update
  useEffect(() => {
    if (activeUser) {
      setEditProfileName(activeUser.name || '');
      setEditProfilePhone(activeUser.phone || '');
      setEditProfileAddress(activeUser.address || '');
      setEditProfilePhoto(activeUser.photo || '');
    }
  }, [activeUser]);

  

  // Client-side image compression
  const compressImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/webp', quality);
          resolve(compressedBase64);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 600, 600, 0.75);
        setEditProfilePhoto(compressedBase64);
      } catch (err) {
        console.error('Error compressing profile image:', err);
        alert('❌ Gagal memproses foto profil. Silakan coba lagi.');
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProfileName.trim()) {
      setProfileErrorMsg('Nama tidak boleh kosong');
      return;
    }
    try {
      setIsLoading(true);
      setProfileErrorMsg('');
      const updatedUser = await api.updateUser(activeUser!.id, {
        name: editProfileName.trim(),
        email: activeUser!.email,
        phone: editProfilePhone.trim(),
        role: activeUser!.role,
        address: editProfileAddress.trim(),
        photo: editProfilePhoto,
      });
      setActiveUser(updatedUser);
      setEditProfilePhoto(updatedUser.photo || '');
      setSaveProfileSuccess(true);
      setProfileViewMode('readonly');
      setTimeout(() => setSaveProfileSuccess(false), 2500);
    } catch (error: any) {
      setProfileErrorMsg(error?.message || 'Gagal memperbarui profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editNewPassword !== editConfirmPassword) {
      setProfileErrorMsg('Password baru dan konfirmasi tidak cocok');
      return;
    }
    if (editNewPassword.length < 6) {
      setProfileErrorMsg('Password baru minimal 6 karakter');
      return;
    }
    try {
      setIsLoading(true);
      setProfileErrorMsg('');
      await api.updatePassword(activeUser!.id, {
        oldPassword: editOldPassword,
        newPassword: editNewPassword,
      });
      setSaveProfileSuccess(true);
      setProfileViewMode('readonly');
      setEditOldPassword('');
      setEditNewPassword('');
      setEditConfirmPassword('');
      setTimeout(() => setSaveProfileSuccess(false), 3000);
    } catch (error: any) {
      setProfileErrorMsg(error?.message || 'Gagal mengganti password');
    } finally {
      setIsLoading(false);
    }
  };

  // Job status filter
  const [statusFilter, setStatusFilter] = useState<OrderStatus>(OrderStatus.MENUNGGU);

  // Selected order for staff allocation
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState<Order | null>(null);
  // Selected order for detailed modal view
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [tempScheduledDate, setTempScheduledDate] = useState<string>('');
  const [tempScheduledTime, setTempScheduledTime] = useState<string>('');

  useEffect(() => {
    if (selectedOrderForAssign) {
      setTempScheduledDate(selectedOrderForAssign.scheduledDate || '');
      setTempScheduledTime(selectedOrderForAssign.scheduledTime || '09:00');
    }
  }, [selectedOrderForAssign]);

  // Searches
  const [userSearch, setUserSearch] = useState('');
  const [jobsSearch, setJobsSearch] = useState('');
  const [jobsStartDate, setJobsStartDate] = useState('');
  const [jobsEndDate, setJobsEndDate] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);

  // Admin New Order Modal State
  const [showAdminOrderModal, setShowAdminOrderModal] = useState(false);
  const [adminOrderStep, setAdminOrderStep] = useState(1);
  const [adminOrderType, setAdminOrderType] = useState<'existing' | 'new'>('existing');
  const [adminOrderSelectedUser, setAdminOrderSelectedUser] = useState<any | null>(null);
  const [adminUserSearchQuery, setAdminUserSearchQuery] = useState('');
  const [adminShowUserDropdown, setAdminShowUserDropdown] = useState(false);
  const [adminOrderNewUserName, setAdminOrderNewUserName] = useState('');
  const [adminOrderNewUserPhone, setAdminOrderNewUserPhone] = useState('');
  const [adminOrderSuccessId, setAdminOrderSuccessId] = useState<string | null>(null);
  const [adminOrderMagicLink, setAdminOrderMagicLink] = useState('');
  const [adminOrderConfirmError, setAdminOrderConfirmError] = useState('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Booking Form State for Admin
  const [adminSelectedModel, setAdminSelectedModel] = useState('');
  const [adminSelectedCategory, setAdminSelectedCategory] = useState('');
  const [adminSelectedService, setAdminSelectedService] = useState('');
  const [adminQuantity, setAdminQuantity] = useState(1);
  const [adminAddress, setAdminAddress] = useState('');
  const [adminLat, setAdminLat] = useState<number | undefined>(undefined);
  const [adminLng, setAdminLng] = useState<number | undefined>(undefined);
  const [adminDate, setAdminDate] = useState('');
  const [adminTime, setAdminTime] = useState('09:00');
  const [adminNotes, setAdminNotes] = useState('');
  const [adminCartServices, setAdminCartServices] = useState<any[]>([]);
  const [showAdminMapPicker, setShowAdminMapPicker] = useState(false);



  // Add User State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<Role>(Role.STAFF);
  const [regKtp, setRegKtp] = useState('');
  const [regSelfie, setRegSelfie] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Editing User state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<Role>(Role.USER);
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editStatus, setEditStatus] = useState<string>('active');

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });

  // Timezone-safe local date formatter helper
  const getLocalDateOnly = (dateInput: any) => {
    if (!dateInput) return '';
    if (dateInput instanceof Date) {
      const year = dateInput.getFullYear();
      const month = String(dateInput.getMonth() + 1).padStart(2, '0');
      const day = String(dateInput.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    const str = String(dateInput).trim();
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match && !str.includes('T') && !str.endsWith('Z')) {
      return match[0];
    }
    const d = new Date(str);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Performance State
  const [performanceDate, setPerformanceDate] = useState(getLocalDateOnly(new Date()));
  const [performanceEndDate, setPerformanceEndDate] = useState(getLocalDateOnly(new Date()));
  const [expandedPerformanceStaffId, setExpandedPerformanceStaffId] = useState<string | null>(null);

  // Master Data Editing State
  const [activeMasterSubTab, setActiveMasterSubTab] = useState<'MODELS' | 'CATEGORIES' | 'SERVICES' | 'ADDONS'>('MODELS');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  // Form add-new states for master data
  const [newModelName, setNewModelName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');
  const [newCategoryHasServices, setNewCategoryHasServices] = useState(true);

  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('');
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [activePriceServiceId, setActivePriceServiceId] = useState<string | null>(null);
  const [editingPrices, setEditingPrices] = useState<Record<string, number>>({});

  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState(0);
  const [newAddonHpp, setNewAddonHpp] = useState(0);

  // Addon Inventory states
  const [activeAddonSubTab, setActiveAddonSubTab] = useState<'KATALOG' | 'TRANSAKSI'>('KATALOG');
  const [selectedAddonForPurchase, setSelectedAddonForPurchase] = useState<ACAddon | null>(null);
  const [purchaseQty, setPurchaseQty] = useState<number>(0);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [purchaseNotes, setPurchaseNotes] = useState<string>('');
  const [addonTransactions, setAddonTransactions] = useState<AddonTransaction[]>([]);
  const [addonTxFilter, setAddonTxFilter] = useState<string>('ALL');

  // Komprehensif Pembelian Barang Modal
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [purchaseItems, setPurchaseItems] = useState<Array<{
    addonId: string;
    qty: number;
    hpp: number;
  }>>([]);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'LUNAS' | 'BELUM'>('LUNAS');
  const [purchaseSearchInputs, setPurchaseSearchInputs] = useState<Array<string>>([]);
  const [purchaseOpenDropdown, setPurchaseOpenDropdown] = useState<number | null>(null);

  // Edit inline states for master data
  const [editingMasterId, setEditingMasterId] = useState<string | null>(null);
  const [editingMasterType, setEditingMasterType] = useState<'MODELS' | 'CATEGORIES' | 'SERVICES' | 'ADDONS' | null>(null);
  const [editMasterField1, setEditMasterField1] = useState('');
  const [editMasterField2, setEditMasterField2] = useState<number | boolean>(0);
  const [editMasterField3, setEditMasterField3] = useState('');
  const [editMasterField4, setEditMasterField4] = useState<number>(0);

  // Helper formats
  const formatRupiah = (num: any) => {
    if (!num && num !== 0 && num !== '0') return 'Rp0';
    return 'Rp' + Number(num || 0).toLocaleString('id-ID');
  };

  const handleExportCSV = () => {
    try {
      const exportOrders = orders.filter(o => {
        if (jobsStartDate || jobsEndDate) {
          const orderDateStr = o.completedAt || o.scheduledDate || o.createdAt;
          if (orderDateStr) {
            const orderDate = getLocalDateOnly(orderDateStr);
            if (jobsStartDate && orderDate < jobsStartDate) return false;
            if (jobsEndDate && orderDate > jobsEndDate) return false;
          }
        }
        return true;
      });

      if (exportOrders.length === 0) {
        alert('⚠️ Tidak ada pesanan untuk diekspor pada rentang tanggal yang dipilih.');
        return;
      }

      const headers = [
        'ID Pesanan',
        'Tanggal Jadwal',
        'Waktu Jadwal',
        'Status Pesanan',
        'Nama Pelanggan',
        'No. WA Pelanggan',
        'Alamat',
        'Rincian Jasa AC',
        'Sparepart/Addons Terpakai',
        'Biaya Jasa (Rp)',
        'Biaya Sparepart (Rp)',
        'Total Biaya (Rp)',
        'Metode Pembayaran',
        'Status Pembayaran',
        'Teknisi',
        'Catatan Pengerjaan',
        'Rating (Bintang)',
        'Ulasan Umpan Balik',
        'Tanggal Dibuat',
        'Alasan Batal'
      ];

      const escapeCSV = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = String(val);
        return `"${str.replace(/"/g, '""')}"`;
      };

      const rows = exportOrders.map(o => {
        const acDetailStr = Array.isArray(o.acDetail)
          ? o.acDetail.map(s => `${s.quantity}x ${s.serviceType === 'none' ? s.category : s.serviceType} (${s.acType || ''})`).join('; ')
          : o.acDetail ? `${(o.acDetail as any).quantity || 1}x ${(o.acDetail as any).serviceType === 'none' ? (o.acDetail as any).category : (o.acDetail as any).serviceType} (${(o.acDetail as any).acType || ''})` : '';

        const addonsStr = (o.addonsUsed || [])
          .map(addon => `${addon.quantity}x ${addon.name} (@Rp${addon.price.toLocaleString('id-ID')})`)
          .join('; ');

        return [
          escapeCSV(o.id),
          escapeCSV(o.scheduledDate),
          escapeCSV(o.scheduledTime),
          escapeCSV(o.status.replace('_', ' ')),
          escapeCSV(o.customerName),
          escapeCSV(o.customerPhone),
          escapeCSV(o.address),
          escapeCSV(acDetailStr),
          escapeCSV(addonsStr),
          o.serviceCost || 0,
          o.addonsCost || 0,
          o.finalPrice || o.totalCost || ((o.serviceCost || 0) + (o.addonsCost || 0)) || 0,
          escapeCSV(o.paymentMethod || 'TUNAI'),
          escapeCSV(o.paymentStatus || 'PAID'),
          escapeCSV(o.assignedEmployeeName || '-'),
          escapeCSV(o.completionNotes || '-'),
          o.rating !== undefined ? o.rating : '-',
          escapeCSV(o.ratingNotes || '-'),
          escapeCSV(o.createdAt ? new Date(o.createdAt).toLocaleString('id-ID') : ''),
          escapeCSV(o.cancelReason || '-')
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
      ].join('\n');

      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      
      const dateRangeStr = jobsStartDate && jobsEndDate
        ? `_${jobsStartDate}_sd_${jobsEndDate}`
        : jobsStartDate
          ? `_dari_${jobsStartDate}`
          : jobsEndDate
            ? `_hingga_${jobsEndDate}`
            : '_semua_tanggal';
      
      link.setAttribute('download', `Laporan_Pesanan${dateRangeStr}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`✅ Berhasil mengekspor ${exportOrders.length} pesanan ke file CSV.`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('❌ Gagal mengekspor laporan. Silakan coba lagi.');
    }
  };

  // Filter orders according to selection
  const filteredOrders = orders.filter(o => {
    // 1. Status Filter
    if (o.status !== statusFilter) return false;

    // 2. Search Filter (Name, Phone, ID)
    if (jobsSearch) {
      const q = jobsSearch.toLowerCase();
      const matchName = o.customerName?.toLowerCase().includes(q);
      const matchPhone = o.customerPhone?.toLowerCase().includes(q);
      const matchId = o.id?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchId) return false;
    }

    // 3. Date Range Filter removed from UI list filter

    return true;
  }).sort((a, b) => {
    // Sort so newest is at the top (descending)
    const dateA = new Date(a.createdAt || a.scheduledDate || 0).getTime();
    const dateB = new Date(b.createdAt || b.scheduledDate || 0).getTime();
    return dateB - dateA;
  });

  // Calculate average rating for each staff member based on orders
  const getStaffStats = (staffId: string) => {
    const staffRatings = orders
      .filter(o => o.assignedTo === staffId && o.rating !== undefined)
      .map(o => o.rating as number);

    if (staffRatings.length === 0) {
      return { avgRating: 0, count: 0, text: 'Belum dinilai' };
    }

    const sum = staffRatings.reduce((a, b) => a + b, 0);
    const avg = sum / staffRatings.length;
    return {
      avgRating: avg,
      count: staffRatings.length,
      text: `${avg.toFixed(1)} ★ (${staffRatings.length} Ulasan)`
    };
  };

  // Trigger allocation
  const handleAssignSubmit = async (orderId: string) => {
    if (!selectedStaffId) {
      setErrorMsg('Pilih salah satu teknisi terlebih dahulu.');
      return;
    }

    try {
      setIsLoading(true);
      const selectedStaff = users.find(u => u.id === selectedStaffId);
      if (!selectedStaff) {
        setErrorMsg('Staff tidak ditemukan');
        return;
      }

      const updatePayload: any = {
        assignedTo: selectedStaffId,
        assignedEmployeeName: selectedStaff.name,
        status: OrderStatus.DITUGASKAN,
        workerCancelReason: null // clear any pending cancel request
      };

      if (!selectedOrderForAssign) return;
      const isDateChanged = tempScheduledDate !== selectedOrderForAssign.scheduledDate || tempScheduledTime !== selectedOrderForAssign.scheduledTime;

      if (isDateChanged) {
        updatePayload.status = OrderStatus.MENUNGGU;
        updatePayload.proposedDate = tempScheduledDate;
        updatePayload.proposedTime = tempScheduledTime;
        updatePayload.rescheduleStatus = 'PENDING';
      } else {
        updatePayload.scheduledDate = tempScheduledDate;
        updatePayload.scheduledTime = tempScheduledTime;
      }

      await api.updateOrder(orderId, updatePayload);

      // Update local state
      const updatedOrder = orders.find(o => o.id === orderId);
      if (updatedOrder) {
        Object.assign(updatedOrder, updatePayload);
        updatedOrder.workerCancelReason = undefined; // clear it locally
        setOrders([...orders]);
      }

      setErrorMsg('');
      setSelectedStaffId('');
      setSelectedOrderForAssign(null);

      if (isDateChanged) {
        alert('✅ Pengajuan perubahan jadwal berhasil dikirim. Menunggu persetujuan pelanggan.');
      } else {
        alert('✅ Teknisi berhasil ditugaskan ke order ini');
      }
    } catch (error) {
      console.error('Error assigning staff:', error);
      setErrorMsg('Gagal menugaskan teknisi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Admin Cancel Order
  const handleCancelOrderAdmin = async (orderId: string) => {
    try {
      setIsLoading(true);
      await api.updateOrder(orderId, {
        status: OrderStatus.DIBATALKAN,
        cancelReason: 'Dibatalkan oleh Admin'
      });

      const updatedOrder = orders.find(o => o.id === orderId);
      if (updatedOrder) {
        updatedOrder.status = OrderStatus.DIBATALKAN;
        updatedOrder.cancelReason = 'Dibatalkan oleh Admin';
        setOrders([...orders]);
      }
      alert('✅ Pesanan berhasil dibatalkan');
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('❌ Gagal membatalkan pesanan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdminOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (adminCartServices.length === 0) {
      setAdminOrderConfirmError('Silakan pilih setidaknya 1 layanan.');
      return;
    }
    if (!adminAddress) {
      setAdminOrderConfirmError('Alamat pengerjaan wajib diisi.');
      return;
    }
    
    setIsCreatingOrder(true);
    setAdminOrderConfirmError('');

    try {
      let finalUserId = adminOrderSelectedUser?.id;

      if (adminOrderType === 'new') {
        if (!adminOrderNewUserName || !adminOrderNewUserPhone) {
          setAdminOrderConfirmError('Nama dan Nomor Telepon wajib diisi.');
          setIsCreatingOrder(false);
          return;
        }
        
        const newUser = await api.createUser({
          name: adminOrderNewUserName,
          phone: adminOrderNewUserPhone,
          password: 'sugar123',
          role: Role.USER,
          region_id: undefined // Pelanggan dibuat secara global (bisa order di cabang mana saja)
        });
        finalUserId = newUser.id;
        
        const magicLink = `${window.location.origin}/login?m_phone=${encodeURIComponent(adminOrderNewUserPhone)}&m_pass=sugar123`;
        setAdminOrderMagicLink(magicLink);
      }

      if (!finalUserId) {
         setAdminOrderConfirmError('Pelanggan harus dipilih atau dibuat.');
         setIsCreatingOrder(false);
         return;
      }

      const customerName = adminOrderType === 'existing' ? adminOrderSelectedUser?.name : adminOrderNewUserName;
      const customerPhone = adminOrderType === 'existing' ? adminOrderSelectedUser?.phone : adminOrderNewUserPhone;

      const totalCost = adminCartServices.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
      const newOrder = {
        id: `ord_${Date.now()}`,
        customerId: finalUserId,
        customerName: customerName || 'Pelanggan',
        customerPhone: customerPhone || '-',
        status: OrderStatus.MENUNGGU,
        totalCost,
        serviceCost: totalCost,
        address: adminAddress,
        lat: adminLat,
        lng: adminLng,
        latitude: adminLat,
        longitude: adminLng,
        scheduledDate: adminDate,
        scheduledTime: adminTime,
        notes: adminNotes,
        acDetail: adminCartServices.map(item => ({
          acId: item.acId || 'manual',
          acName: item.acName || 'AC Umum',
          acType: item.acType,
          category: item.category,
          serviceType: item.serviceType,
          categoryId: item.categoryId,
          quantity: item.quantity,
          price: item.price
        })),
        createdAt: new Date().toISOString(),
        region_id: activeUser?.region_id
      };

      const res = await api.createOrder(newOrder);
      
      setAdminCartServices([]);
      setAdminDate('');
      setAdminTime('09:00');
      setAdminNotes('');
      setAdminAddress('');
      
      const updatedOrders = await api.fetchOrders();
      setOrders(updatedOrders);
      
      setAdminOrderSuccessId(res.id || newOrder.id);
      setAdminOrderStep(3);
    } catch (err: any) {
      setAdminOrderConfirmError(err.message || 'Gagal membuat pesanan.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Admin Verification for Worker Cancel Request
  const handleApproveCancelRequest = async (orderId: string, reason: string) => {
    try {
      setIsLoading(true);
      await api.updateOrder(orderId, {
        status: OrderStatus.DIBATALKAN,
        cancelReason: `Dibatalkan oleh Teknisi: ${reason}`,
        workerCancelReason: null
      });
      const updatedOrder = orders.find(o => o.id === orderId);
      if (updatedOrder) {
        updatedOrder.status = OrderStatus.DIBATALKAN;
        updatedOrder.cancelReason = `Dibatalkan oleh Teknisi: ${reason}`;
        updatedOrder.workerCancelReason = undefined;
        setOrders([...orders]);
      }
      alert('✅ Pembatalan disetujui');
    } catch (error) {
      console.error('Error approving cancel:', error);
      alert('❌ Gagal menyetujui pembatalan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectCancelRequest = async (orderId: string) => {
    try {
      setIsLoading(true);
      await api.updateOrder(orderId, {
        workerCancelReason: null
      });
      const updatedOrder = orders.find(o => o.id === orderId);
      if (updatedOrder) {
        updatedOrder.workerCancelReason = undefined;
        setOrders([...orders]);
      }
      alert('✅ Pengajuan pembatalan ditolak. Teknisi harus melanjutkan pekerjaan.');
    } catch (error) {
      console.error('Error rejecting cancel:', error);
      alert('❌ Gagal menolak pembatalan');
    } finally {
      setIsLoading(false);
    }
  };

  // User Actions
  const handleRegKtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRegKtp(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRegSelfie(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateUser = async () => {
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg('Nama, Email, dan Password wajib diisi.');
      return;
    }
    try {
      setIsRegistering(true);
      setErrorMsg('');
      const payload = {
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        role: regRole,
        region_id: activeUser?.region_id || null, // Force admin's region
        ktpPhoto: regRole === Role.STAFF ? regKtp : null,
        selfiePhoto: regRole === Role.STAFF ? regSelfie : null,
      };
      await api.createUser(payload);
      
      // Reset form and reload
      setRegName('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
      setRegRole(Role.STAFF);
      setRegKtp('');
      setRegSelfie('');
      setShowAddUserModal(false);
      window.location.reload();
    } catch (e: any) {
      setErrorMsg(e.message || 'Gagal menambahkan pengguna baru.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSaveUserEdit = async (userId: string) => {
    try {
      setIsLoading(true);
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) {
        setErrorMsg('User tidak ditemukan');
        return;
      }

      // Security check: Admin cannot edit Owner or Admin
      if (targetUser.role === Role.OWNER || targetUser.role === Role.ADMIN) {
        setErrorMsg('Anda tidak memiliki wewenang untuk mengedit role Owner atau sesama Admin.');
        alert('❌ Anda tidak memiliki wewenang untuk mengedit role Owner atau sesama Admin.');
        return;
      }

      // Security check: Admin cannot assign Owner role
      if (editRole === Role.OWNER) {
        setErrorMsg('Anda tidak memiliki wewenang untuk memberikan role Owner.');
        alert('❌ Anda tidak memiliki wewenang untuk memberikan role Owner.');
        return;
      }

      const updatePayload = {
        name: targetUser.name, // Send existing name
        email: targetUser.email, // Send existing email (required by backend)
        role: editRole,
        phone: editPhone,
        status: editStatus,
        // Note: address is not stored in database yet
      };

      await api.updateUser(userId, updatePayload);

      // Update local state
      const updatedUser = users.find(u => u.id === userId);
      if (updatedUser) {
        updatedUser.role = editRole;
        updatedUser.phone = editPhone;
        updatedUser.address = editAddress;
        updatedUser.status = editStatus;
        setUsers([...users]);
      }

      setErrorMsg('');
      setEditingUserId(null);
      alert('✅ Data pengguna berhasil diperbarui');
    } catch (error: any) {
      console.error('Error updating user:', error);
      const errorMsg = error?.message || 'Gagal memperbarui data pengguna';
      setErrorMsg(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      setIsLoading(true);
      const res = await api.activateUser(userId);
      alert(`✅ Akun Karyawan ${res.name} berhasil diaktifkan!`);
      // Update local users state
      setUsers(users.map(u => u.id === userId ? { ...u, status: 'active' } : u));
      setVerifyingUser(null);
    } catch (error: any) {
      console.error(error);
      alert(`❌ Gagal mengaktifkan user: ${error?.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditUser = (target: User) => {
    if (target.role === Role.OWNER) {
      alert('⚠️ Anda tidak memiliki wewenang untuk mengedit role Owner.');
      return;
    }
    setEditingUserId(target.id);
    setEditRole(target.role);
    setEditPhone(target.phone || '');
    setEditAddress(target.address || '');
    setEditStatus(target.status || 'active');
  };

  // Master Data handlers - CREATE/UPDATE MODELS
  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim()) return;

    try {
      setIsLoading(true);
      const newModel = await api.createModel({ name: newModelName });
      setModels([...models, newModel]);
      setNewModelName('');
      setErrorMsg('');
      alert('✅ Model AC berhasil ditambahkan');
    } catch (error) {
      console.error('Error adding model:', error);
      setErrorMsg('Gagal menambahkan model');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteModel = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Model AC',
      message: 'Hapus model AC ini? (Tidak dapat dibatalkan)',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          await api.deleteModel(id);
          setModels(models.filter(m => m.id !== id));
          setErrorMsg('');
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Error deleting model:', error);
          setErrorMsg('Gagal menghapus model');
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // Master Data handlers - CREATE/UPDATE CATEGORIES
  const handleCategoryIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 200, 200, 0.8);
        setNewCategoryIcon(compressedBase64);
      } catch (err) {
        console.error('Error compressing category icon:', err);
      }
    }
  };

  const handleEditCategoryIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 200, 200, 0.8);
        setEditMasterField3(compressedBase64);
      } catch (err) {
        console.error('Error compressing category icon:', err);
      }
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      setIsLoading(true);
      const newCategory = await api.createCategory({
        name: newCategoryName,
        icon: newCategoryIcon || null,
        hasServices: newCategoryHasServices
      });
      setCategories([...categories, newCategory]);
      setNewCategoryName('');
      setNewCategoryIcon('');
      setNewCategoryHasServices(true);
      setErrorMsg('');
      alert('✅ Kategori AC berhasil ditambahkan');
    } catch (error) {
      console.error('Error adding category:', error);
      setErrorMsg('Gagal menambahkan kategori');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Kategori',
      message: 'Hapus kategori ini? (Tidak dapat dibatalkan)',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          await api.deleteCategory(id);
          setCategories(categories.filter(c => c.id !== id));
          setErrorMsg('');
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Error deleting category:', error);
          setErrorMsg('Gagal menghapus kategori');
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // Master Data handlers - CREATE/UPDATE SERVICES
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || !newServiceCategory) {
      setErrorMsg('Lengkapi semua field layanan');
      return;
    }

    try {
      setIsLoading(true);
      const newService = await api.createService({
        name: newServiceName,
        categoryId: newServiceCategory
      });
      setServices([...services, newService]);
      setNewServiceName('');
      setErrorMsg('');
      alert('✅ Jenis pelayanan berhasil ditambahkan');
    } catch (error) {
      console.error('Error adding service:', error);
      setErrorMsg('Gagal menambahkan layanan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Layanan',
      message: 'Hapus jenis pelayanan ini? (Tidak dapat dibatalkan)',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          await api.deleteService(id);
          setServices(services.filter(s => s.id !== id));
          setErrorMsg('');
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Error deleting service:', error);
          setErrorMsg('Gagal menghapus layanan');
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // Master Data handlers - CREATE/UPDATE ADDONS
  const handleAddAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddonName.trim()) {
      setErrorMsg('Lengkapi nama addon');
      return;
    }

    try {
      setIsLoading(true);
      const newAddon = await api.createAddon({
        name: newAddonName,
        price: newAddonPrice,
        hpp: newAddonHpp
      });
      setAddons([...addons, newAddon]);
      setNewAddonName('');
      setNewAddonPrice(0);
      setNewAddonHpp(0);
      setErrorMsg('');
      alert('✅ Item persediaan berhasil ditambahkan');
    } catch (error) {
      console.error('Error adding addon:', error);
      setErrorMsg('Gagal menambahkan addon');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddon = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Addon',
      message: 'Hapus item persediaan/sparepart ini? (Tidak dapat dibatalkan)',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          await api.deleteAddon(id);
          setAddons(addons.filter(a => a.id !== id));
          setErrorMsg('');
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Error deleting addon:', error);
          setErrorMsg('Gagal menghapus addon');
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const fetchTransactions = async (addonId?: string) => {
    try {
      setIsLoading(true);
      const data = await api.fetchAddonTransactions(addonId === 'ALL' ? undefined : addonId);
      setAddonTransactions(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeMasterSubTab === 'ADDONS' && activeAddonSubTab === 'TRANSAKSI') {
      fetchTransactions(addonTxFilter);
    }
  }, [activeMasterSubTab, activeAddonSubTab, addonTxFilter]);

  const handlePurchaseAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddonForPurchase) return;
    if (purchaseQty <= 0) {
      alert('⚠️ Jumlah pembelian harus lebih dari 0');
      return;
    }
    if (purchasePrice <= 0) {
      alert('⚠️ Harga unit harus lebih dari 0');
      return;
    }

    try {
      setIsLoading(true);
      const result = await api.purchaseAddon(selectedAddonForPurchase.id, {
        qty: purchaseQty,
        price: purchasePrice,
        notes: purchaseNotes
      });

      // Update addons state in UI
      setAddons(addons.map(a =>
        a.id === selectedAddonForPurchase.id
          ? { ...a, stock: result.newStock, hpp: result.newHpp }
          : a
      ));

      // Reset states
      setSelectedAddonForPurchase(null);
      setPurchaseQty(0);
      setPurchasePrice(0);
      setPurchaseNotes('');
      alert('✅ Berhasil mencatat pembelian stok baru');

      if (activeAddonSubTab === 'TRANSAKSI') {
        fetchTransactions(addonTxFilter);
      }
    } catch (err: any) {
      console.error('Error purchasing addon:', err);
      alert(`❌ Gagal mencatat pembelian: ${err.message || 'Error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMasterEdit = async (id: string) => {
    try {
      setIsLoading(true);

      // Determine what type of master data we're editing
      if (editingMasterType === 'MODELS') {
        await api.updateModel(id, { name: editMasterField1 });
        const updated = models.map(m => m.id === id ? { ...m, name: editMasterField1 } : m);
        setModels(updated);
      } else if (editingMasterType === 'CATEGORIES') {
        await api.updateCategory(id, { name: editMasterField1, icon: editMasterField3 || undefined, hasServices: editMasterField2 });
        const updated = categories.map(c => c.id === id ? { ...c, name: editMasterField1, icon: editMasterField3 || undefined, hasServices: editMasterField2 as boolean } : c);
        setCategories(updated);
      } else if (editingMasterType === 'SERVICES') {
        await api.updateService(id, { name: editMasterField1, categoryId: editMasterField3 });
        const updated = services.map(s => s.id === id ? { ...s, name: editMasterField1, categoryId: editMasterField3 } : s);
        setServices(updated);
      } else if (editingMasterType === 'ADDONS') {
        await api.updateAddon(id, { name: editMasterField1, price: editMasterField2, hpp: editMasterField4 });
        const updated = addons.map(a => a.id === id ? { ...a, name: editMasterField1, price: editMasterField2 as number, hpp: editMasterField4 } : a);
        setAddons(updated);
      }

      setErrorMsg('');
      setEditingMasterId(null);
      alert('✅ Data master berhasil diperbarui');
    } catch (error) {
      console.error('Error updating master data:', error);
      setErrorMsg('Gagal memperbarui data master');
    } finally {
      setIsLoading(false);
    }
  };

  const startEditMaster = (type: 'MODELS' | 'CATEGORIES' | 'SERVICES' | 'ADDONS', id: string, f1: string, f2: number | boolean, f3 = '', f4 = 0) => {
    setEditingMasterType(type);
    setEditingMasterId(id);
    setEditMasterField1(f1);
    setEditMasterField2(f2);
    setEditMasterField3(f3);
    setEditMasterField4(f4);
  };

  if (!activeUser) return null;

    const filteredModels = models.filter((m: any) => !activeUser?.region_id || m.region_id === activeUser.region_id);
  const filteredCategories = categories.filter((c: any) => !activeUser?.region_id || c.region_id === activeUser.region_id);
  const filteredServices = services.filter((s: any) => !activeUser?.region_id || s.region_id === activeUser.region_id);
  const filteredAddons = addons.filter((a: any) => !activeUser?.region_id || a.region_id === activeUser.region_id);
return (
    <div className="flex-1 flex flex-col bg-slate-100 text-slate-800 text-left min-h-0 h-full overflow-hidden">
      {/* GLOBAL HEADER BAR WITH THREE-DOTS MENU */}
      <div className="bg-slate-900 text-white px-5 pt-4 pb-12 shrink-0 shadow-md rounded-b-[32px] flex justify-between items-start z-30 relative overflow-hidden">
        {/* Logo, Business Name & Slogan */}
        <div className="flex items-center gap-3">
          <a href="/" className="w-14 h-14 bg-gradient-to-tr from-rose-500 to-orange-400 rounded-2xl shadow-xl shadow-rose-900/20 flex items-center justify-center text-white mb-3 transform -rotate-6 hover:rotate-0 transition duration-300 relative z-10 overflow-hidden border-2 border-white/50 cursor-pointer block">
            {appSettings?.['GLOBAL']?.business_logo ? (
              <img src={appSettings['GLOBAL'].business_logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </a>
          <div className="text-left flex items-center gap-2.5">
            <div>
              <h1 className="text-sm font-black leading-none">{appSettings?.['GLOBAL']?.business_name || 'CoolAir Pro'}</h1>
              <p className="text-[9px] text-blue-200 mt-1">Sistem Layanan AC Profesional | Admin</p>
            </div>
            {activeUser?.region_id && (
              <>
                {accessibleRegions.length > 1 ? (
                  <select
                    className="bg-indigo-600 text-white text-[9px] font-black px-2 py-1 rounded-lg border border-indigo-400 outline-none uppercase tracking-wider shadow-sm ml-1 cursor-pointer hover:bg-indigo-700 transition"
                    value={selectedRegion}
                    onChange={(e) => {
                      setSelectedRegion(e.target.value);
                      localStorage.setItem('activeRegionId', e.target.value);
                      window.location.reload();
                    }}
                  >
                    {accessibleRegions.map(r => (
                      <option key={r.id} value={r.id} className="bg-white text-slate-800">{r.name}</option>
                    ))}
                  </select>
                ) : (
                  <span className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white text-[8px] font-black px-2.5 py-1 rounded-full border border-indigo-400/20 uppercase tracking-widest ml-1 shadow-sm">
                    Region: {regions?.find(r => r.id === activeUser.region_id)?.name || activeUser.region_id}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ===================== CONTROL TABS SYSTEM (NEW GRID ICON) ===================== */}
      <div className="px-5 -mt-8 relative z-40 shrink-0 mb-2">
        <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/40 border border-slate-100/60 p-4 md:p-5">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-y-5 gap-x-2">
            
            <div onClick={() => setActiveTab('JOBS_TRACKER')} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all group">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors ${activeTab === 'JOBS_TRACKER' ? 'bg-blue-100 text-blue-600 border border-blue-200 shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}>
                <ClipboardList size={24} strokeWidth={2.5} />
              </div>
              <span className={`text-[9px] font-extrabold text-center uppercase tracking-wider ${activeTab === 'JOBS_TRACKER' ? 'text-blue-700' : 'text-slate-500 group-hover:text-slate-700'}`}>Pantauan Jasa</span>
            </div>

            <div onClick={() => { setActiveTab('MASTER_DATA'); if (categories.length > 0) setNewServiceCategory(categories[0].id); }} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all group">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors ${activeTab === 'MASTER_DATA' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}>
                <Wrench size={24} strokeWidth={2.5} />
              </div>
              <span className={`text-[9px] font-extrabold text-center uppercase tracking-wider ${activeTab === 'MASTER_DATA' ? 'text-emerald-700' : 'text-slate-500 group-hover:text-slate-700'}`}>Master Data</span>
            </div>

            <div onClick={() => setActiveTab('USER_MANAGEMENT')} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all group">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors ${activeTab === 'USER_MANAGEMENT' ? 'bg-orange-100 text-orange-600 border border-orange-200 shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}>
                <UserCog size={24} strokeWidth={2.5} />
              </div>
              <span className={`text-[9px] font-extrabold text-center uppercase tracking-wider ${activeTab === 'USER_MANAGEMENT' ? 'text-orange-700' : 'text-slate-500 group-hover:text-slate-700'}`}>Edit Pengguna</span>
            </div>

            <div onClick={() => setActiveTab('VOUCHERS')} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all group">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors ${activeTab === 'VOUCHERS' ? 'bg-violet-100 text-violet-600 border border-violet-200 shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}>
                <Tag size={24} strokeWidth={2.5} />
              </div>
              <span className={`text-[9px] font-extrabold text-center uppercase tracking-wider ${activeTab === 'VOUCHERS' ? 'text-violet-700' : 'text-slate-500 group-hover:text-slate-700'}`}>Kelola Voucher</span>
            </div>

            <div onClick={() => setActiveTab('PROFIL')} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all group">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors ${activeTab === 'PROFIL' ? 'bg-indigo-100 text-indigo-600 border border-indigo-200 shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}>
                <UserIcon size={24} strokeWidth={2.5} />
              </div>
              <span className={`text-[9px] font-extrabold text-center uppercase tracking-wider ${activeTab === 'PROFIL' ? 'text-indigo-700' : 'text-slate-500 group-hover:text-slate-700'}`}>Profil</span>
            </div>

            <div onClick={() => setShowLogoutConfirm(true)} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all group">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100 transition-colors">
                <LogOut size={24} strokeWidth={2.5} />
              </div>
              <span className="text-[9px] font-extrabold text-center uppercase tracking-wider text-rose-600 group-hover:text-rose-700">Keluar</span>
            </div>

          </div>
        </div>
      </div>

      {/* ===================== TAB BODY (SCROLLABLE Area) ===================== */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0 space-y-4">

        {/* ===================== TAB 1: OPERATIONAL JOBS TRACKER ===================== */}
        {activeTab === 'JOBS_TRACKER' && (
          <div className="space-y-4">

            {/* Search and Date Filter */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, no telp, atau ID order..."
                  value={jobsSearch}
                  onChange={(e) => setJobsSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm pl-9 pr-4 py-2 rounded-lg focus:border-indigo-500 focus:bg-white outline-none transition"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => setShowAdminOrderModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <Plus size={13} /> Buat Pesanan Baru
                </button>
                <button
                  type="button"
                  onClick={() => setShowExportModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 uppercase shadow-sm cursor-pointer whitespace-nowrap"
                  title="Ekspor laporan pesanan ke format CSV"
                >
                  <Download size={13} /> Ekspor CSV
                </button>
              </div>
            </div>

            {/* Horizontal state filter */}
            <div className="flex overflow-x-auto flex-nowrap gap-1 bg-white p-1.5 rounded-xl border border-slate-200">
              {Object.values(OrderStatus).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 text-[10.5px] font-black rounded-lg transition uppercase whitespace-nowrap shrink-0 ${statusFilter === st ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                >
                  {st.replace('_', ' ')} ({orders.filter(o => o.status === st).length})
                </button>
              ))}
            </div>

            {/* List area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrders.length === 0 ? (
                <div className="bg-white border text-center p-8 rounded-2xl col-span-full space-y-2">
                  <span className="text-xl">📋</span>
                  <p className="font-extrabold text-xs text-slate-800 uppercase tracking-widest">Tidak Ada Pesanan Terindeks</p>
                  <p className="text-[11px] text-slate-400">Tidak ada penugasan yang sesuai dengan filter yang Anda tunjuk.</p>
                </div>
              ) : (
                filteredOrders.map(order => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderDetail(order)}
                    className="bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md hover:-translate-y-0.5 transition duration-200 cursor-pointer rounded-2xl p-4 shadow-xs space-y-3 relative text-left"
                  >

                    {/* Order status pill header */}
                    <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                      <div>
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wider">{order.id}</span>
                        <h4 className="font-extrabold text-xs text-slate-850 mt-1.5 uppercase tracking-normal">
                          {Array.isArray(order.acDetail) 
                            ? order.acDetail.map(s => `${s.quantity} Unit x ${s.serviceType === 'none' ? s.category : s.serviceType}`).join(', ') 
                            : order.acDetail ? `${(order.acDetail as any).quantity} Unit x ${(order.acDetail as any).serviceType === 'none' ? (order.acDetail as any).category : (order.acDetail as any).serviceType}` : 'Detail tidak tersedia'}
                        </h4>
                      </div>
                      <span className={`text-[8.5px] px-2 py-0.6 font-black uppercase rounded tracking-wider border ${order.status === OrderStatus.MENUNGGU ? 'bg-amber-50 border-amber-200 text-amber-800' :
                        order.status === OrderStatus.DITUGASKAN ? 'bg-cyan-50 border-cyan-200 text-cyan-800' :
                          order.status === OrderStatus.CEK_LAYANAN ? 'bg-blue-50 border-blue-200 text-blue-800' :
                            order.status === OrderStatus.PENGERJAAN ? 'bg-purple-50 border-purple-200 text-purple-800' :
                              order.status === OrderStatus.PAYMENT ? 'bg-rose-50 border-rose-200 text-rose-850' :
                                'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Client Info details */}
                    <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                      <div>👤 Pemesan: <strong className="text-slate-800">{order.customerName}</strong> (<span className="font-mono">{order.customerPhone}</span>)</div>
                      <div>📅 Jadwal Mulai: <strong>{order.scheduledDate}</strong> pukul <strong className="font-mono">{order.scheduledTime}</strong></div>
                      {order.rescheduleStatus === 'PENDING' && (
                        <div className="mt-1.5 text-[9.5px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-start gap-1">
                          <span className="shrink-0 mt-0.5">⏳</span>
                          <div>
                            <strong>Menunggu Persetujuan Pelanggan</strong><br />
                            Usulan perubahan ke: {order.proposedDate} pkl {order.proposedTime}
                          </div>
                        </div>
                      )}
                      {order.rescheduleStatus === 'REJECTED' && order.status === OrderStatus.DIBATALKAN && (
                        <div className="mt-1.5 text-[9.5px] text-red-700 bg-red-50 p-2 rounded-lg border border-red-200 flex items-start gap-1">
                          <span className="shrink-0 mt-0.5">❌</span>
                          <div>
                            <strong>Perubahan Jadwal Ditolak</strong><br />
                            Pesanan dibatalkan oleh pelanggan.
                          </div>
                        </div>
                      )}
                      {order.status === OrderStatus.DIBATALKAN && order.cancelReason && order.rescheduleStatus !== 'REJECTED' && (
                        <div className="mt-1.5 text-[9.5px] text-red-700 bg-red-50 p-2 rounded-lg border border-red-200 flex items-start gap-1">
                          <span className="shrink-0 mt-0.5">🛑</span>
                          <div>
                            <strong>Pesanan Dibatalkan</strong><br />
                            Alasan: {order.cancelReason}
                          </div>
                        </div>
                      )}
                      <div className="truncate flex items-start gap-1">
                        <span className="shrink-0 mt-0.5">📍</span>
                        <div>
                          <span>Alamat Fisik: <span className="text-slate-800 font-semibold">{order.address}</span></span>
                          {(order.latitude || order.lat) && (order.longitude || order.lng) && (
                            <a
                              href={`https://www.google.com/maps?q=${order.latitude || order.lat},${order.longitude || order.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1 flex w-fit items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-[9px] font-bold hover:bg-indigo-200 transition"
                            >
                              Buka di Google Maps
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Staff Allocated info */}
                    {order.assignedEmployeeName ? (
                      <div className="flex flex-col gap-2 bg-slate-100 border border-slate-200 p-3 rounded-xl">
                        <div className="flex items-center gap-2 text-[10.5px]">
                          <span className="font-bold text-slate-500">Teknisi Lapangan:</span>
                          <div 
                            className="w-5 h-5 rounded-full overflow-hidden border bg-white shrink-0 flex items-center justify-center font-bold text-[9px] text-indigo-750 cursor-pointer hover:opacity-80 transition"
                            onClick={(e) => {
                              e.stopPropagation();
                              const photo = users?.find(u => u.id === order.assignedTo)?.photo;
                              if (photo) setInspectedPhoto(photo);
                            }}
                          >
                            {users?.find(u => u.id === order.assignedTo)?.photo ? (
                              <img src={users.find(u => u.id === order.assignedTo)?.photo} alt="Teknisi" className="w-full h-full object-cover" />
                            ) : (
                              order.assignedEmployeeName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="font-extrabold text-slate-800">{order.assignedEmployeeName}</span>
                          <span className="text-[8px] bg-indigo-50 border border-indigo-150 text-indigo-700 px-1.5 rounded uppercase font-black tracking-widest ml-auto">
                            Tersedia
                          </span>
                        </div>
                        {order.workerCancelReason && (
                          <div className="bg-red-50 border border-red-200 p-2.5 rounded-lg space-y-2">
                            <div className="text-[10px] text-red-800 font-medium">
                              <span className="font-black block uppercase tracking-wider mb-0.5">⚠️ Pengajuan Batal dari Teknisi</span>
                              Alasan: <strong className="font-bold">{order.workerCancelReason}</strong>
                            </div>
                            <div className="flex gap-1.5 mt-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectCancelRequest(order.id);
                                }}
                                className="flex-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[8.5px] font-black py-1.5 rounded-lg uppercase tracking-wider transition"
                              >
                                Tolak
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrderForAssign(order);
                                }}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-[8.5px] font-black py-1.5 rounded-lg uppercase tracking-wider transition"
                              >
                                Ganti Teknisi
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApproveCancelRequest(order.id, order.workerCancelReason!);
                                }}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[8.5px] font-black py-1.5 rounded-lg uppercase tracking-wider transition"
                              >
                                Setujui Batal
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : order.status !== OrderStatus.DIBATALKAN ? (
                      <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl flex items-center justify-between">
                        <span className="text-[10.5px] font-bold text-amber-800">⚠️ Belum dialokasi teknisi</span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDialog({
                                isOpen: true,
                                title: 'Batalkan Pesanan',
                                message: 'Yakin ingin membatalkan pesanan ini?',
                                onConfirm: () => {
                                  handleCancelOrderAdmin(order.id);
                                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                }
                              });
                            }}
                            className="bg-white hover:bg-red-50 text-red-600 border border-red-200 text-[9px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider transition cursor-pointer"
                          >
                            Batalkan
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrderForAssign(order);
                            }}
                            className="bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider transition cursor-pointer"
                          >
                            Tugaskan
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {/* Grand total info */}
                    <div className="border-t border-slate-100 pt-2.5 space-y-1.5 text-[10.5px] text-slate-600 font-semibold text-left">
                      <div className="flex justify-between items-center">
                        <span>💳 Metode Pembayaran:</span>
                        {order.paymentMethod === 'TRANSFER' ? (
                          <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 text-[8.5px] px-1.5 py-0.5 rounded font-black uppercase">
                            TRANSFER (XENDIT)
                          </span>
                        ) : order.paymentMethod === 'CASH' ? (
                          <span className="bg-emerald-50 border border-emerald-150 text-emerald-700 text-[8.5px] px-1.5 py-0.5 rounded font-black uppercase">
                            TUNAI (CASH)
                          </span>
                        ) : (
                          <span className="bg-slate-100 border border-slate-200 text-slate-650 text-[8.5px] px-1.5 py-0.5 rounded font-black uppercase">
                            💵 TUNAI
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span>📊 Status Pembayaran:</span>
                        {order.paymentStatus === 'PAID' || order.status === OrderStatus.SELESAI ? (
                          <span className="bg-emerald-500 text-white text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                            LUNAS
                          </span>
                        ) : (
                          <span className="bg-amber-50 border border-amber-300 text-amber-800 text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                            PENDING / BELUM LUNAS
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 font-black">
                      <span className="text-[10px] uppercase text-slate-400 tracking-wider">Total Jasa:</span>
                      <div className="text-right">
                        <span className="text-xs font-mono text-indigo-700">{formatRupiah(order.finalPrice || (Number(order.serviceCost || 0) + Number(order.addonsCost || 0) - Number(order.voucher_discount || 0)))}</span>
                        {Number(order.voucher_discount || 0) > 0 && (
                          <span className="block text-[9px] text-red-500 font-bold mt-0.5">Voucher: -{formatRupiah(order.voucher_discount)}</span>
                        )}
                      </div>
                    </div>

                    {order.status === OrderStatus.SELESAI && (
                      <div className="pt-2 border-t border-slate-100 mt-2 flex items-center justify-between gap-2 flex-wrap">
                        {order.invoiceSent ? (
                          <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded">
                            ✓ Invoice Terkirim
                          </span>
                        ) : (
                          <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-250 px-2 py-0.5 rounded animate-pulse">
                            ⏳ Belum Dikirim
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 2: MASTER DATABASE MANAGER ===================== */}
        {activeTab === 'MASTER_DATA' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
            <div className="border-b border-slate-200 pb-2 flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="font-extrabold text-sm uppercase text-slate-800">Master Database Operasional</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Tambah, ubah, dan hapus konfigurasi dasar AC di sini</p>
              </div>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                {['MODELS', 'CATEGORIES'].map((sub) => (
                  <button
                    key={sub}
                    onClick={() => {
                      setActiveMasterSubTab(sub as any);
                      setEditingMasterId(null);
                    }}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition ${activeMasterSubTab === sub ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-850'
                      }`}
                  >
                    {sub === 'MODELS' ? 'Model AC' : 'Kategori Jasa'}
                  </button>
                ))}
              </div>
            </div>

            {/* MODELS */}
            {activeMasterSubTab === 'MODELS' && (
              <div className="space-y-4">
                <form onSubmit={handleAddModel} className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Masukkan nama model AC baru..."
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-indigo-500 font-semibold"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-4 py-2 rounded-xl uppercase flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus size={15} /> Tambah
                  </button>
                </form>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[9px] border-b border-slate-200">
                      <tr>
                        <th className="p-3">Nama Model</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredModels.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800">{m.name}</td>
                          <td className="p-3 text-right flex justify-end gap-1.5">
                            <button onClick={() => startEditMaster('MODELS', m.id, m.name, 0)} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg border border-indigo-100 transition"><Edit size={13} /></button>
                            <button onClick={() => handleDeleteModel(m.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg border border-red-100 transition"><Trash2 size={13} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CATEGORIES */}
            {activeMasterSubTab === 'CATEGORIES' && (
              <div className="space-y-4">
                <form onSubmit={handleAddCategory} className="bg-slate-50 border p-4 rounded-xl space-y-3">
                  <span className="text-[9px] font-black uppercase text-indigo-600 block tracking-widest">TAMBAH KATEGORI BARU</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nama kategori..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-850 text-xs px-3 py-2 rounded-xl outline-none focus:border-indigo-500 font-bold"
                      required
                    />
                    <div className="flex items-center gap-2">
                      {newCategoryIcon && (
                        <div className="w-8 h-8 rounded shrink-0 overflow-hidden bg-slate-100 border border-slate-200">
                          <img src={newCategoryIcon} alt="Icon Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCategoryIconChange}
                        className="w-full text-[10px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-750 hover:file:bg-indigo-100 cursor-pointer bg-white border border-slate-200 rounded-xl px-2 py-1.5"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black py-2.5 rounded-xl uppercase flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Plus size={14} /> Daftarkan Kategori
                  </button>
                </form>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[9px] border-b border-slate-200">
                      <tr>
                        <th className="p-3">Kategori AC</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredCategories.map(c => (
                        <React.Fragment key={c.id}>
                          <tr
                            className={`hover:bg-slate-50/50 cursor-pointer transition ${expandedCategoryId === c.id ? 'bg-indigo-50/50' : ''}`}
                            onClick={() => {
                              setExpandedCategoryId(expandedCategoryId === c.id ? null : c.id);
                              setNewServiceCategory(expandedCategoryId === c.id ? '' : c.id);
                            }}
                          >
                            <td className="p-3 font-extrabold text-slate-800 flex items-center gap-2">
                              {c.icon && <img src={c.icon} alt={c.name} className="w-6 h-6 object-cover rounded mr-1" />}
                              {c.name}
                              <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                                {services.filter(s => s.categoryId === c.id).length} Layanan
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => startEditMaster('CATEGORIES', c.id, c.name, c.hasServices, c.icon)} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg border border-indigo-100 transition"><Edit size={13} /></button>
                                <button onClick={() => handleDeleteCategory(c.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg border border-red-100 transition"><Trash2 size={13} /></button>
                              </div>
                            </td>
                          </tr>
                          {expandedCategoryId === c.id && (
                            <tr className="bg-slate-50/80">
                              <td colSpan={2} className="p-4 border-t border-slate-200">
                                <div className="space-y-4">
                                  <form onSubmit={handleAddService} className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl space-y-3">
                                    <span className="text-[9px] font-black uppercase text-indigo-600 block tracking-widest">TAMBAH LAYANAN UNTUK {c.name.toUpperCase()}</span>
                                    <div className="grid grid-cols-1 gap-3">
                                      <input
                                        type="text"
                                        placeholder="Nama layanan..."
                                        value={newServiceName}
                                        onChange={(e) => setNewServiceName(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none focus:border-indigo-500 font-bold"
                                        required
                                      />
                                    </div>
                                    <button
                                      type="submit"
                                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black py-2 rounded-xl uppercase flex items-center justify-center gap-1 transition cursor-pointer"
                                    >
                                      <Plus size={13} /> Tambahkan Layanan
                                    </button>
                                  </form>

                                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-xs text-left">
                                      <thead className="bg-slate-100 text-slate-500 font-extrabold uppercase tracking-wider text-[9px]">
                                        <tr>
                                          <th className="p-2.5 px-3">Nama Layanan</th>
                                          <th className="p-2.5 px-3 text-right">Aksi</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {services.filter(s => s.categoryId === c.id).length === 0 ? (
                                          <tr>
                                            <td colSpan={2} className="p-4 text-center text-slate-400 font-medium text-xs">Belum ada layanan di kategori ini</td>
                                          </tr>
                                        ) : (
                                          services.filter(s => s.categoryId === c.id).map(s => (
                                            <tr key={s.id} className="hover:bg-slate-50">
                                              <td className="p-2.5 px-3 font-extrabold text-slate-800">{s.name}</td>
                                              <td className="p-2.5 px-3 text-right flex justify-end gap-1.5">
                                                <button onClick={(e) => {
                                                  e.stopPropagation();
                                                  const initialPrices: Record<string, number> = {};
                                                  servicePrices.filter(sp => sp.serviceId === s.id).forEach(sp => {
                                                    initialPrices[sp.modelId] = sp.price;
                                                  });
                                                  setEditingPrices(initialPrices);
                                                  setActivePriceServiceId(s.id);
                                                  setShowPriceModal(true);
                                                }} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[9px] px-2 py-1 rounded border border-indigo-200 transition">Atur Harga Model</button>
                                                <button onClick={(e) => { e.stopPropagation(); startEditMaster('SERVICES', s.id, s.name, 0, s.categoryId); }} className="text-indigo-600 hover:bg-indigo-100 p-1 rounded-lg transition"><Edit size={12} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteService(s.id); }} className="text-red-500 hover:bg-red-100 p-1 rounded-lg transition"><Trash2 size={12} /></button>
                                              </td>
                                            </tr>
                                          ))
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


          </div>
        )}

        {/* ===================== TAB 3: USER MANAGEMENT ===================== */}
        {activeTab === 'USER_MANAGEMENT' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="font-extrabold text-sm uppercase text-slate-800">Manajemen Akses & Pengguna</h3>
                <p className="text-[11px] text-slate-500 mt-1">Edit hak akses/peran pengguna</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari user..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs pl-10 pr-3.5 py-2 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs uppercase rounded-xl hover:bg-emerald-700 transition-colors w-full sm:w-auto whitespace-nowrap"
                >
                  + Tambah Pengguna
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
              {allUsers.filter(u => u.role !== Role.USER && u.name.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                <div key={u.id} className="p-4 hover:bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-left">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs uppercase overflow-hidden">
                        {u.photo ? (
                          <img src={u.photo} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          u.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-xs text-slate-800">{u.name}</h4>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${u.role === Role.ADMIN ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            u.role === Role.OWNER ? 'bg-indigo-50 text-indigo-750 border-indigo-200' :
                              u.role === Role.STAFF ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                u.role === Role.KEUANGAN ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                            {u.role}
                          </span>
                          {u.role === Role.STAFF && (
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                              u.status === 'inactive' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                              u.status === 'archived' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}>
                              {u.status === 'inactive' ? 'MENUNGGU VERIFIKASI' :
                               u.status === 'archived' ? 'DIARSIPKAN (NONAKTIF)' :
                               'AKTIF'}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">{u.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {u.role === Role.STAFF && u.status === 'inactive' && (
                      <button
                        type="button"
                        onClick={() => setVerifyingUser(u)}
                        className="bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 text-[10.5px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1 uppercase transition cursor-pointer"
                      >
                        <ShieldCheck size={12} /> Verifikasi
                      </button>
                    )}
                    {u.role !== Role.OWNER && (
                      <button
                        type="button"
                        onClick={() => startEditUser(u)}
                        className="bg-indigo-50 border border-indigo-150 text-indigo-700 hover:bg-indigo-100 text-[10.5px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1 uppercase transition cursor-pointer"
                      >
                        <Edit size={12} /> Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* ===================== TAB: VOUCHERS ===================== */}
        {activeTab === 'VOUCHERS' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm uppercase text-slate-800">Kelola Voucher Diskon</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Atur kode voucher promo diskon untuk wilayah/cabang Anda</p>
              </div>
              <button
                onClick={() => handleOpenVoucherModal()}
                className="bg-slate-900 text-white font-extrabold text-[10px] py-2.5 px-4 rounded-xl uppercase flex items-center gap-1.5 hover:bg-slate-800 transition cursor-pointer shadow-sm"
              >
                <Plus size={13} />
                <span>Tambah Voucher</span>
              </button>
            </div>

            {loadingVouchers ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3 bg-white border border-slate-200 rounded-2xl">
                <Loader className="animate-spin text-indigo-600" size={24} />
                <span className="text-xs text-slate-500 font-bold">Memuat daftar voucher...</span>
              </div>
            ) : vouchers.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Tag size={24} />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">Belum Ada Voucher</h4>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-normal">
                    Buat kode promo voucher pertama Anda untuk meningkatkan transaksi pelanggan di wilayah ini.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenVoucherModal()}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] py-2 px-4 rounded-xl uppercase transition cursor-pointer"
                >
                  Buat Voucher Sekarang
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vouchers.map((vch) => {
                  const now = new Date();
                  const isExpired = now > new Date(vch.end_date);
                  const isNotStarted = now < new Date(vch.start_date);
                  const isLive = vch.is_active && !isExpired && !isNotStarted;

                  return (
                    <div key={vch.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative flex flex-col justify-between hover:shadow-md transition">
                      <div>
                        {/* Status Badges */}
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-xs font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                            {vch.code}
                          </span>
                          <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isLive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            isExpired ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                            isNotStarted ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            'bg-slate-50 text-slate-500 border border-slate-100'
                          }`}>
                            {isLive ? 'Aktif' : isExpired ? 'Expired' : isNotStarted ? 'Masa Datang' : 'Nonaktif'}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-xs text-slate-800 mt-3">{vch.name}</h4>
                        
                        <div className="mt-2 space-y-1.5 text-[11px] text-slate-650">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Potongan:</span>
                            <strong className="text-slate-800">
                              {vch.discount_type === 'fixed' 
                                ? `Rp ${Number(vch.discount_value).toLocaleString('id-ID')}` 
                                : `${Number(vch.discount_value)}%`}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Min. Transaksi:</span>
                            <span className="font-bold text-slate-700">Rp {Number(vch.min_order_amount).toLocaleString('id-ID')}</span>
                          </div>
                          {vch.discount_type === 'percentage' && vch.max_discount_amount && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Maks. Potongan:</span>
                              <span className="font-bold text-slate-700">Rp {Number(vch.max_discount_amount).toLocaleString('id-ID')}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-400">Berlaku s/d:</span>
                            <span className="font-mono text-slate-700 text-[10px]">
                              {new Date(vch.end_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {/* Labels for options */}
                        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
                          {vch.new_user_only === 1 && (
                            <span className="text-[8px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
                              🆕 Pengguna Baru
                            </span>
                          )}
                          {vch.max_uses_total !== null && (
                            <span className="text-[8px] font-black uppercase text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                              👥 Kuota: {vch.max_uses_total}
                            </span>
                          )}
                          <span className="text-[8px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            📍 {vch.regionName || 'Cabang'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4 pt-2">
                        <button
                          onClick={() => handleOpenVoucherModal(vch)}
                          className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-[9px] py-2 rounded-xl uppercase flex items-center justify-center gap-1 border border-slate-150 transition cursor-pointer"
                        >
                          <Edit size={10} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteVoucher(vch.id, vch.code)}
                          className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-[9px] py-2 rounded-xl uppercase flex items-center justify-center gap-1 border border-rose-100 transition cursor-pointer"
                        >
                          <Trash2 size={10} />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VOUCHER CREATE/EDIT MODAL */}
            {showVoucherModal && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-zoom-in">
                  <div className="px-5 py-4 border-b flex justify-between items-center bg-slate-900 text-white">
                    <div>
                      <span className="text-[8px] bg-indigo-650 px-2 py-0.5 rounded font-black uppercase text-white">Voucher System</span>
                      <h4 className="text-sm font-extrabold text-white mt-1">{selectedVoucher ? 'Edit Voucher Diskon' : 'Tambah Voucher Baru'}</h4>
                    </div>
                    <button
                      onClick={() => setShowVoucherModal(false)}
                      className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveVoucher} className="p-5 space-y-4 text-left max-h-[80vh] overflow-y-auto">
                    <div>
                      <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Kode Voucher</label>
                      <input
                        type="text"
                        value={vchCode}
                        onChange={e => setVchCode(e.target.value)}
                        placeholder="CONTOH: PROMOAC10"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-slate-900 transition uppercase font-mono font-bold"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Nama Voucher</label>
                      <input
                        type="text"
                        value={vchName}
                        onChange={e => setVchName(e.target.value)}
                        placeholder="Nama promo, misal: Promo Awal Tahun"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-slate-900 transition font-bold"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Tipe Potongan</label>
                        <select
                          value={vchDiscountType}
                          onChange={e => setVchDiscountType(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none"
                          disabled={isLoading}
                        >
                          <option value="fixed">Nominal Tetap (Rupiah)</option>
                          <option value="percentage">Persentase (%)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Nilai Diskon</label>
                        <input
                          type="number"
                          value={vchDiscountValue}
                          onChange={e => setVchDiscountValue(Number(e.target.value))}
                          placeholder={vchDiscountType === 'fixed' ? 'Nominal Rp' : 'Persen %'}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-slate-900 transition font-bold"
                          min="1"
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Min. Transaksi (Rp)</label>
                        <input
                          type="number"
                          value={vchMinOrderAmount}
                          onChange={e => setVchMinOrderAmount(Number(e.target.value))}
                          placeholder="Min belanja pelanggan"
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none"
                          min="0"
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Maks. Potongan (Rp)</label>
                        <input
                          type="number"
                          value={vchMaxDiscountAmount}
                          onChange={e => setVchMaxDiscountAmount(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="Kosongkan jika tak dibatasi"
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none"
                          min="0"
                          disabled={isLoading || vchDiscountType === 'fixed'}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Mulai Berlaku</label>
                        <input
                          type="datetime-local"
                          value={vchStartDate}
                          onChange={e => setVchStartDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[11px] px-2.5 py-2 rounded-xl outline-none"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Selesai Berlaku</label>
                        <input
                          type="datetime-local"
                          value={vchEndDate}
                          onChange={e => setVchEndDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[11px] px-2.5 py-2 rounded-xl outline-none"
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Kuota Pemakaian Total</label>
                      <input
                        type="number"
                        value={vchMaxUsesTotal}
                        onChange={e => setVchMaxUsesTotal(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Jumlah kuota voucher (Kosongkan jika tak dibatasi)"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none"
                        min="1"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="flex flex-col gap-3 py-2 border-t border-b border-slate-100">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={vchNewUserOnly}
                          onChange={e => setVchNewUserOnly(e.target.checked)}
                          className="rounded text-indigo-650 border-slate-300 focus:ring-indigo-500 h-4 w-4"
                          disabled={isLoading}
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Khusus Pengguna Baru</span>
                          <span className="text-[10px] text-slate-400 block -mt-0.5">Hanya berlaku untuk pesanan pertama user di wilayah ini</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={vchIsActive}
                          onChange={e => setVchIsActive(e.target.checked)}
                          className="rounded text-indigo-650 border-slate-300 focus:ring-indigo-500 h-4 w-4"
                          disabled={isLoading}
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Voucher Aktif</span>
                          <span className="text-[10px] text-slate-400 block -mt-0.5">Aktifkan voucher ini agar dapat dicari & divalidasi</span>
                        </div>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowVoucherModal(false)}
                        disabled={isLoading}
                        className="w-full bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-600 font-extrabold text-[10px] py-3 rounded-xl uppercase cursor-pointer transition text-center"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-slate-900 disabled:bg-slate-400 text-white font-extrabold text-[10px] py-3 rounded-xl uppercase cursor-pointer flex items-center justify-center gap-2 transition shadow-md"
                      >
                        {isLoading && <Loader size={12} className="animate-spin" />}
                        {isLoading ? 'Menyimpan...' : 'Simpan Voucher'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 4: PROFIL ===================== */}
        {activeTab === 'PROFIL' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 max-w-2xl mx-auto shadow-sm">
            <div className="flex justify-between items-center px-1 border-b pb-3 border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm uppercase text-slate-800">Profil Saya</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Atur informasi akun administrator Anda</p>
              </div>
              <span className="bg-rose-50 border border-rose-200 text-rose-700 text-[8.5px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                ADMINISTRATOR
              </span>
            </div>

            {saveProfileSuccess && (
              <div className="bg-emerald-100 border border-emerald-200 p-2.5 rounded-xl text-[11px] text-emerald-850 font-bold flex items-center gap-2">
                <Check size={14} /> Profil berhasil diperbarui!
              </div>
            )}

            {profileErrorMsg && (
              <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-[11px] text-rose-750 font-semibold flex items-center gap-2">
                <X size={14} /> {profileErrorMsg}
              </div>
            )}

            {profileViewMode === 'readonly' && (
              <div className="space-y-5">
                <div className="flex flex-col items-center justify-center pb-4 border-b border-slate-150">
                  <div className="w-20 h-20 bg-indigo-100 text-indigo-700 font-black text-lg flex items-center justify-center rounded-2xl shadow-sm border overflow-hidden">
                    {activeUser.photo ? (
                      <img src={activeUser.photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      activeUser.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-850 mt-2">{activeUser.name}</h4>
                  <p className="text-[10px] text-slate-400 font-medium">{activeUser.email}</p>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b pb-3 border-slate-50">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{activeUser.name}</p>
                    </div>
                    <UserIcon size={16} className="text-slate-350" />
                  </div>

                  <div className="flex items-center justify-between border-b pb-3 border-slate-50">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No. Handphone</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{activeUser.phone || <span className="italic text-slate-400">Belum diatur</span>}</p>
                    </div>
                    <Phone size={16} className="text-slate-350" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Alamat Rumah</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{activeUser.address || <span className="italic text-slate-400">Belum diatur</span>}</p>
                    </div>
                    <MapPin size={16} className="text-slate-350" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3">
                  <button
                    onClick={() => { setProfileErrorMsg(''); setProfileViewMode('edit-profile'); }}
                    className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[10px] py-2.5 rounded-xl uppercase transition cursor-pointer"
                  >
                    Edit Profil
                  </button>
                  <button
                    onClick={() => { setProfileErrorMsg(''); setProfileViewMode('edit-password'); }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] py-2.5 rounded-xl uppercase transition cursor-pointer"
                  >
                    Ubah Password
                  </button>
                </div>
              </div>
            )}

            {profileViewMode === 'edit-profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Profile Photo Upload */}
                <div className="space-y-2 pb-2 border-b border-slate-100">
                  <label className="text-[9.5px] text-slate-400 font-bold uppercase block">Foto Profil</label>
                  <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-150">
                    <div className="w-14 h-14 bg-slate-200 text-slate-500 rounded-2xl flex items-center justify-center overflow-hidden border">
                      {editProfilePhoto ? (
                        <img src={editProfilePhoto} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold">No Photo</span>
                      )}
                    </div>
                    <div className="flex-grow text-left">
                      <span className="text-[10px] text-slate-650 font-bold block mb-1">Unggah Foto Profil</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoChange}
                        className="w-full text-[10px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-750 hover:file:bg-indigo-100 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={editProfileName}
                    onChange={(e) => setEditProfileName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 disabled:opacity-50 transition"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div>
                  <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">No. Handphone</label>
                  <input
                    type="text"
                    value={editProfilePhone}
                    onChange={(e) => setEditProfilePhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 disabled:opacity-50 transition"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Alamat Rumah</label>
                  <textarea
                    value={editProfileAddress}
                    onChange={(e) => setEditProfileAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none focus:border-indigo-500 h-16 resize-none disabled:opacity-50 transition"
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setProfileViewMode('readonly')}
                    disabled={isLoading}
                    className="w-full bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-650 font-extrabold text-[10px] py-3 rounded-xl uppercase cursor-pointer transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-750 disabled:bg-slate-400 text-white font-extrabold text-[10px] py-3 rounded-xl uppercase cursor-pointer flex items-center justify-center gap-2 transition shadow-md"
                  >
                    {isLoading && <Loader size={12} className="animate-spin" />}
                    {isLoading ? 'Menyimpan...' : 'Simpan Profil'}
                  </button>
                </div>
              </form>
            )}

            {profileViewMode === 'edit-password' && (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2 mb-2">
                  <ShieldCheck size={16} className="text-indigo-605 shrink-0 mt-0.5" />
                  <p className="text-[9.5px] text-slate-500 font-medium leading-relaxed">
                    Silakan masukkan password lama Anda untuk memverifikasi perubahan password baru.
                  </p>
                </div>

                <div>
                  <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Password Lama</label>
                  <input
                    type="password"
                    value={editOldPassword}
                    onChange={(e) => setEditOldPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 transition"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Password Baru</label>
                  <input
                    type="password"
                    value={editNewPassword}
                    onChange={(e) => setEditNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 transition"
                    disabled={isLoading}
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Konfirmasi Password Baru</label>
                  <input
                    type="password"
                    value={editConfirmPassword}
                    onChange={(e) => setEditConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 transition"
                    disabled={isLoading}
                    required
                    minLength={6}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileViewMode('readonly');
                      setEditOldPassword('');
                      setEditNewPassword('');
                      setEditConfirmPassword('');
                      setProfileErrorMsg('');
                    }}
                    disabled={isLoading}
                    className="w-full bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-650 font-extrabold text-[10px] py-3 rounded-xl uppercase cursor-pointer transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-750 disabled:bg-slate-400 text-white font-extrabold text-[10px] py-3 rounded-xl uppercase cursor-pointer flex items-center justify-center gap-2 transition shadow-md"
                  >
                    {isLoading && <Loader size={12} className="animate-spin" />}
                    {isLoading ? 'Menyimpan...' : 'Ubah Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* ===================== PURCHASE ADDON MODAL ===================== */}
      {selectedAddonForPurchase && (
        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-left">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <div>
                <h4 className="font-black text-xs uppercase tracking-wide">Beli Stok Addon / Sparepart</h4>
                <p className="text-[9.5px] text-slate-400 mt-1">Barang: {selectedAddonForPurchase.name}</p>
              </div>
              <button
                onClick={() => setSelectedAddonForPurchase(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-850 transition cursor-pointer"
                disabled={isLoading}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handlePurchaseAddon} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Jumlah Pembelian</label>
                  <input
                    type="number"
                    value={purchaseQty || ''}
                    onChange={(e) => setPurchaseQty(parseInt(e.target.value) || 0)}
                    min={1}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 font-mono font-extrabold"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div>
                  <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Harga Beli Unit</label>
                  <input
                    type="number"
                    value={purchasePrice || ''}
                    onChange={(e) => setPurchasePrice(parseInt(e.target.value) || 0)}
                    min={0}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 font-mono font-extrabold"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Catatan Pembelian</label>
                <textarea
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  placeholder="Misal: Beli di Toko AC Berkah, Nota #889"
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 font-semibold"
                  rows={2}
                  disabled={isLoading}
                />
              </div>

              {/* Real-time Moving Average Cost Calculation Preview */}
              <div className="bg-indigo-50/70 border border-indigo-150 p-3.5 rounded-xl space-y-2">
                <span className="text-[9px] font-black uppercase text-indigo-700 tracking-wider block border-b border-indigo-100 pb-1.5">🧮 Live Simulasi Moving Average HPP</span>

                <div className="grid grid-cols-2 gap-2 text-[10.5px] font-bold text-slate-700">
                  <div>
                    <span className="text-[9px] font-black text-slate-450 block uppercase tracking-wide">Stok Saat Ini:</span>
                    <span>{selectedAddonForPurchase.stock ?? 0} Unit</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-450 block uppercase tracking-wide">HPP Saat Ini:</span>
                    <span className="font-mono">{formatRupiah(selectedAddonForPurchase.hpp || 0)}</span>
                  </div>
                  <div className="border-t border-slate-200/55 pt-1.5 mt-0.5">
                    <span className="text-[9px] font-black text-slate-450 block uppercase tracking-wide">Stok Akhir:</span>
                    <span className="text-indigo-700 font-extrabold">
                      {(selectedAddonForPurchase.stock ?? 0) + (purchaseQty || 0)} Unit
                    </span>
                  </div>
                  <div className="border-t border-slate-200/55 pt-1.5 mt-0.5">
                    <span className="text-[9px] font-black text-slate-450 block uppercase tracking-wide">HPP Baru (Moving Avg):</span>
                    <span className="text-indigo-700 font-extrabold font-mono">
                      {(() => {
                        const curStock = selectedAddonForPurchase.stock ?? 0;
                        const curHpp = selectedAddonForPurchase.hpp ?? 0;
                        const addQty = purchaseQty || 0;
                        const addPrice = purchasePrice || 0;
                        let newHpp = addPrice;
                        if (curStock > 0) {
                          newHpp = ((curStock * curHpp) + (addQty * addPrice)) / (curStock + addQty);
                        }
                        return formatRupiah(Math.round(newHpp * 100) / 100);
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAddonForPurchase(null)}
                  disabled={isLoading}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-650 font-black text-xs px-4 py-2.5 rounded-xl uppercase transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-750 disabled:bg-slate-350 text-white font-black text-xs px-4 py-2.5 rounded-xl uppercase transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
                >
                  {isLoading && <Loader size={14} className="animate-spin" />}
                  {isLoading ? 'Menyimpan...' : 'Simpan Pembelian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== FORM PEMBELIAN BARANG KOMPREHENSIF ===================== */}
      {showPurchaseForm && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl text-left my-8">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white sticky top-0">
              <div>
                <h4 className="font-black text-xs uppercase tracking-wide">Form Pembelian Barang</h4>
                <p className="text-[9.5px] text-slate-400 mt-1">Tambahkan barang yang akan dibeli</p>
              </div>
              <button
                onClick={() => {
                  setShowPurchaseForm(false);
                  setPurchaseItems([]);
                  setPurchaseSearchInputs([]);
                  setPurchaseOpenDropdown(null);
                }}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-850 transition cursor-pointer"
                disabled={isLoading}
              >
                <X size={15} />
              </button>
            </div>

            <form className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* DAFTAR ITEM PEMBELIAN */}
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black uppercase text-slate-700 tracking-wide">Daftar Barang Pembelian</label>
                  <button
                    type="button"
                    onClick={() => {
                      setPurchaseItems([...purchaseItems, { addonId: '', qty: 1, hpp: 0 }]);
                      setPurchaseSearchInputs([...purchaseSearchInputs, '']);
                    }}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[9px] font-black px-2.5 py-1 rounded-lg border border-emerald-250 transition cursor-pointer"
                  >
                    + Tambah Barang
                  </button>
                </div>

                {purchaseItems.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 text-center text-slate-500 text-xs">
                    Belum ada barang. Klik "Tambah Barang" untuk menambahkan item.
                  </div>
                ) : (
                  <div className="space-y-2 bg-slate-50 border border-slate-150 rounded-xl p-3">
                    {purchaseItems.map((item, idx) => {
                      const selectedAddon = addons.find(a => a.id === item.addonId);
                      const grandTotal = item.qty * item.hpp;
                      const hppOld = selectedAddon?.hpp || 0;

                      return (
                        <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                          <div className="grid grid-cols-1 gap-2">
                            {/* Row 1: Pilih Barang & Qty */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="relative">
                                <label className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">Nama Barang</label>
                                <input
                                  type="text"
                                  placeholder="Cari barang..."
                                  value={purchaseSearchInputs[idx] || ''}
                                  onChange={(e) => {
                                    const newSearchInputs = [...purchaseSearchInputs];
                                    newSearchInputs[idx] = e.target.value;
                                    setPurchaseSearchInputs(newSearchInputs);
                                    setPurchaseOpenDropdown(idx);
                                  }}
                                  onFocus={() => setPurchaseOpenDropdown(idx)}
                                  onBlur={() => setTimeout(() => setPurchaseOpenDropdown(null), 200)}
                                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-2 py-1.5 rounded-lg outline-none focus:border-indigo-500 font-semibold"
                                />

                                {purchaseOpenDropdown === idx && (
                                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                    {addons
                                      .filter(addon =>
                                        addon.name.toLowerCase().includes((purchaseSearchInputs[idx] || '').toLowerCase())
                                      )
                                      .map(addon => (
                                        <button
                                          key={addon.id}
                                          type="button"
                                          onClick={() => {
                                            const newItems = [...purchaseItems];
                                            newItems[idx] = {
                                              addonId: addon.id,
                                              qty: item.qty,
                                              hpp: addon.hpp || 0
                                            };
                                            setPurchaseItems(newItems);

                                            const newSearchInputs = [...purchaseSearchInputs];
                                            newSearchInputs[idx] = addon.name;
                                            setPurchaseSearchInputs(newSearchInputs);
                                            setPurchaseOpenDropdown(null);
                                          }}
                                          className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 border-b border-slate-100 last:border-b-0 font-semibold text-slate-800 transition"
                                        >
                                          <div className="flex justify-between items-center">
                                            <span>{addon.name}</span>
                                            <span className="text-[9px] text-slate-400 font-mono">{formatRupiah(addon.hpp || 0)}</span>
                                          </div>
                                        </button>
                                      ))
                                    }
                                    {addons.filter(addon =>
                                      addon.name.toLowerCase().includes((purchaseSearchInputs[idx] || '').toLowerCase())
                                    ).length === 0 && (
                                        <div className="px-3 py-2 text-[8px] text-slate-400 text-center">
                                          Barang tidak ditemukan
                                        </div>
                                      )}
                                  </div>
                                )}
                              </div>

                              <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">Jumlah Beli</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={item.qty}
                                  onChange={(e) => {
                                    const newItems = [...purchaseItems];
                                    newItems[idx].qty = parseInt(e.target.value) || 1;
                                    setPurchaseItems(newItems);
                                  }}
                                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-2 py-1.5 rounded-lg outline-none focus:border-indigo-500 font-mono font-bold"
                                  required
                                />
                              </div>

                              <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">HPP (Harga Beli Unit)</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={item.hpp}
                                  onChange={(e) => {
                                    const newItems = [...purchaseItems];
                                    newItems[idx].hpp = parseInt(e.target.value) || 0;
                                    setPurchaseItems(newItems);
                                  }}
                                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-2 py-1.5 rounded-lg outline-none focus:border-indigo-500 font-mono font-bold"
                                  required
                                />
                              </div>
                            </div>

                            {/* Row 2: Info HPP Lama & Grand Total */}
                            {selectedAddon && (
                              <div className="grid grid-cols-3 gap-2 text-xs bg-indigo-50 p-2 rounded-lg border border-indigo-150">
                                <div>
                                  <span className="text-[8px] font-black text-indigo-600 uppercase block">HPP Lama</span>
                                  <span className="font-mono font-bold text-indigo-700">{formatRupiah(hppOld)}</span>
                                </div>
                                <div>
                                  <span className="text-[8px] font-black text-indigo-600 uppercase block">Grand Total</span>
                                  <span className="font-mono font-bold text-indigo-700">{formatRupiah(grandTotal)}</span>
                                </div>
                                <div className="text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPurchaseItems(purchaseItems.filter((_, i) => i !== idx));
                                      setPurchaseSearchInputs(purchaseSearchInputs.filter((_, i) => i !== idx));
                                    }}
                                    className="text-red-500 hover:bg-red-50 p-1 rounded border border-red-200 w-full text-[8px] font-bold uppercase"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* TOTAL KESELURUHAN */}
              {purchaseItems.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-indigo-700 uppercase">Total Pembelian (Semua Barang)</span>
                    <span className="text-lg font-mono font-black text-indigo-700">
                      {formatRupiah(purchaseItems.reduce((sum, item) => sum + (item.qty * item.hpp), 0))}
                    </span>
                  </div>
                </div>
              )}

              {/* PEMBAYARAN */}
              {purchaseItems.length > 0 && (
                <div className="space-y-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <label className="text-[10px] font-black uppercase text-slate-700 tracking-wide block">Informasi Pembayaran</label>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Total Pembelian</label>
                      <div className="w-full bg-amber-100 border border-amber-300 text-slate-800 text-xs px-3 py-2 rounded-lg font-mono font-bold text-amber-900">
                        {formatRupiah(purchaseItems.reduce((sum, item) => sum + (item.qty * item.hpp), 0))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Status</label>
                      <div className="w-full bg-emerald-100 border border-emerald-300 text-slate-800 text-xs px-3 py-2 rounded-lg font-bold text-emerald-900">
                        ✓ Lunas
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BUTTONS */}
              <div className="flex gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowPurchaseForm(false);
                    setPurchaseItems([]);
                    setPurchaseSearchInputs([]);
                    setPurchaseOpenDropdown(null);
                  }}
                  disabled={isLoading}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-650 font-black text-xs px-4 py-3 rounded-xl uppercase transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (purchaseItems.length === 0) {
                      alert('Silakan tambahkan minimal satu barang');
                      return;
                    }

                    setIsLoading(true);
                    try {
                      // Simpan setiap pembelian barang
                      for (const item of purchaseItems) {
                        await api.purchaseAddon(item.addonId, {
                          qty: item.qty,
                          price: item.hpp,
                          notes: `Pembelian barang - Status: LUNAS`
                        });
                      }

                      // Update addons & transaksi secara realtime
                      try {
                        const updatedAddons = await api.fetchAddons();
                        setAddons(updatedAddons);
                        await fetchTransactions(addonTxFilter);
                      } catch (err) {
                        console.error('Error updating addon stock and transactions:', err);
                      }

                      alert('Pembelian barang berhasil disimpan!');
                      setShowPurchaseForm(false);
                      setPurchaseItems([]);
                      setPurchaseSearchInputs([]);
                      setPurchaseOpenDropdown(null);
                    } catch (err: any) {
                      alert('Error: ' + err.message);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading || purchaseItems.length === 0}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-750 disabled:bg-slate-350 text-white font-black text-xs px-4 py-3 rounded-xl uppercase transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
                >
                  {isLoading && <Loader size={14} className="animate-spin" />}
                  {isLoading ? 'Menyimpan...' : 'Simpan Pembelian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== EDIT MASTER DATA MODAL ===================== */}
      {editingMasterId && (
        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl text-left">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <div>
                <h4 className="font-black text-xs uppercase tracking-wide">Edit {editingMasterType}</h4>
                <p className="text-[9.5px] text-slate-400 mt-1">ID: {editingMasterId}</p>
              </div>
              <button
                onClick={() => {
                  setEditingMasterId(null);
                  setErrorMsg('');
                }}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                disabled={isLoading}
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">
                  {editingMasterType === 'MODELS' && 'Nama Model'}
                  {editingMasterType === 'CATEGORIES' && 'Nama Kategori'}
                  {editingMasterType === 'SERVICES' && 'Nama Layanan'}
                  {editingMasterType === 'ADDONS' && 'Nama Item'}
                </label>
                <input
                  type="text"
                  value={editMasterField1}
                  onChange={(e) => setEditMasterField1(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500"
                  disabled={isLoading}
                />
              </div>

              {editingMasterType === 'CATEGORIES' && (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="hasServices"
                      checked={editMasterField2 as boolean}
                      onChange={(e) => setEditMasterField2(e.target.checked)}
                      className="w-4 h-4"
                      disabled={isLoading}
                    />
                    <label htmlFor="hasServices" className="text-[10px] text-slate-700 font-semibold">
                      Kategori ini memiliki layanan khusus
                    </label>
                  </div>
                  <div className="mt-2">
                    <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Icon (Opsional)</label>
                    <div className="flex items-center gap-2">
                      {editMasterField3 && (
                        <div className="w-8 h-8 rounded shrink-0 overflow-hidden bg-slate-100 border border-slate-200">
                          <img src={editMasterField3 as string} alt="Icon Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditCategoryIconChange}
                        className="w-full text-[10px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-750 hover:file:bg-indigo-100 cursor-pointer bg-white border border-slate-200 rounded-xl px-2 py-1.5"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </>
              )}

              {editingMasterType === 'SERVICES' && (
                <>
                  <div>
                    <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Harga</label>
                    <input
                      type="number"
                      value={typeof editMasterField2 === 'number' ? editMasterField2 : ''}
                      onChange={(e) => setEditMasterField2(parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Kategori</label>
                    <select
                      value={editMasterField3}
                      onChange={(e) => setEditMasterField3(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 font-semibold"
                      disabled={isLoading}
                    >
                      <option value="">-- Pilih Kategori --</option>
                      {filteredCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {editingMasterType === 'ADDONS' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Harga Modal (HPP)</label>
                    <input
                      type="number"
                      value={editMasterField4}
                      onChange={(e) => setEditMasterField4(parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Harga Jual</label>
                    <input
                      type="number"
                      value={typeof editMasterField2 === 'number' ? editMasterField2 : ''}
                      onChange={(e) => setEditMasterField2(parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-[10px] p-2 rounded-lg font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingMasterId(null);
                    setErrorMsg('');
                  }}
                  disabled={isLoading}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 text-slate-800 font-black text-xs px-4 py-2.5 rounded-xl uppercase transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleSaveMasterEdit(editingMasterId)}
                  disabled={isLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-xs px-4 py-2.5 rounded-xl uppercase transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader size={14} className="animate-spin" />}
                  {isLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== ALLOCATION MODAL ===================== */}
      {selectedOrderForAssign && (
        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-left animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <div>
                <h4 className="font-black text-xs uppercase tracking-wide">Delegasi Kerja Staff</h4>
                <p className="text-[9.5px] text-slate-400 mt-1">ID: {selectedOrderForAssign.id}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedOrderForAssign(null);
                  setSelectedStaffId('');
                  setErrorMsg('');
                }}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                disabled={isLoading}
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="text-[10.5px] text-slate-600 bg-slate-50 p-2.5 rounded-xl font-medium">
                <div>🛠️ Jasa: {Array.isArray(selectedOrderForAssign.acDetail) ? selectedOrderForAssign.acDetail.reduce((sum, s) => sum + (s.quantity || 0), 0) : (selectedOrderForAssign.acDetail as any).quantity} Unit</div>
                <div>👤 Pelanggan: {selectedOrderForAssign.customerName}</div>
                <div>📍 Alamat: {selectedOrderForAssign.address}</div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Pilih Teknisi Cabang</label>
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1.5 scrollbar-thin scrollbar-thumb-slate-200">
                  {sortedStaffList.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed">
                      Tidak ada staf teknisi aktif di wilayah ini.
                    </div>
                  ) : (
                    sortedStaffList.map(staff => {
                      const isSelected = selectedStaffId === staff.id;
                      return (
                        <div
                          key={staff.id}
                          onClick={() => !isLoading && setSelectedStaffId(staff.id)}
                          className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                            isSelected 
                              ? 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/10 shadow-sm' 
                              : 'bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50/40 shadow-xs'
                          } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          {/* Face Avatar */}
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                            {staff.photo ? (
                              <img src={staff.photo} alt={staff.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-black text-slate-500 uppercase">{staff.name.charAt(0)}</span>
                            )}
                          </div>

                          {/* Staff Info */}
                          <div className="flex-grow min-w-0 text-left">
                            <span className="font-extrabold text-xs text-slate-800 block truncate">{staff.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-amber-600 bg-amber-50 border border-amber-105 px-1.5 py-0.5 rounded-md">
                                ⭐ {staff.avgRating > 0 ? staff.avgRating.toFixed(1) : '-'}
                              </span>
                              <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-105 px-1.5 py-0.5 rounded-md">
                                🛠️ {staff.jobsDone} Selesai
                              </span>
                            </div>
                          </div>

                          {/* Selected Checkbox Indicator */}
                          <div className="shrink-0">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-200 ${
                              isSelected 
                                ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-sm' 
                                : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <Check size={11} strokeWidth={3} />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={tempScheduledDate}
                    onChange={(e) => setTempScheduledDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Waktu</label>
                  <input
                    type="time"
                    value={tempScheduledTime}
                    onChange={(e) => setTempScheduledTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-[10px] p-2 rounded-lg font-medium">
                  {errorMsg}
                </div>
              )}

              <button
                onClick={() => handleAssignSubmit(selectedOrderForAssign.id)}
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-xs px-4 py-2.5 rounded-xl uppercase transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading && <Loader size={14} className="animate-spin" />}
                {isLoading ? 'Memproses...' : 'Delegasikan Tugas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== EDIT USER MODAL ===================== */}
      {editingUserId && (
        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl text-left">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <div>
                <h4 className="font-black text-xs uppercase tracking-wide">Edit Profil Pengguna</h4>
                <p className="text-[9.5px] text-slate-400 mt-1">{users.find(u => u.id === editingUserId)?.name}</p>
              </div>
              <button
                onClick={() => {
                  setEditingUserId(null);
                  setErrorMsg('');
                }}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                disabled={isLoading}
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 font-extrabold"
                  disabled={isLoading}
                >
                  <option value={Role.USER}>Pelanggan</option>
                  <option value={Role.STAFF}>Staff/Teknisi</option>
                  <option value={Role.ADMIN}>Admin</option>
                  <option value={Role.KEUANGAN}>Keuangan</option>
                </select>
                <p className="text-[8.5px] text-slate-400 mt-1 font-medium">Ubah peran pengguna (kecuali Owner).</p>
              </div>

              <div>
                <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Status Akun</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 font-extrabold"
                  disabled={isLoading}
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Menunggu Verifikasi (Inactive)</option>
                  <option value="archived">Diarsipkan (Archived / Nonaktif)</option>
                </select>
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-[10px] p-2 rounded-lg font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingUserId(null);
                    setErrorMsg('');
                  }}
                  disabled={isLoading}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 text-slate-800 font-black text-xs px-4 py-2.5 rounded-xl uppercase transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleSaveUserEdit(editingUserId)}
                  disabled={isLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-xs px-4 py-2.5 rounded-xl uppercase transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader size={14} className="animate-spin" />}
                  {isLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== ORDER DETAIL MODAL ===================== */}
      {selectedOrderDetail && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl text-left max-h-[90vh] flex flex-col my-8">

            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-950 text-white shrink-0">
              <div>
                <h4 className="font-black text-xs uppercase tracking-wider">Detail Lengkap Pekerjaan</h4>
                <p className="text-[9.5px] text-slate-400 mt-1 font-mono">{selectedOrderDetail.id}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[8.5px] px-2 py-0.6 font-black uppercase rounded tracking-wider border ${selectedOrderDetail.status === OrderStatus.MENUNGGU ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' :
                  selectedOrderDetail.status === OrderStatus.DITUGASKAN ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' :
                    selectedOrderDetail.status === OrderStatus.CEK_LAYANAN ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' :
                      selectedOrderDetail.status === OrderStatus.PENGERJAAN ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' :
                        selectedOrderDetail.status === OrderStatus.PAYMENT ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' :
                          'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  }`}>
                  {selectedOrderDetail.status.replace('_', ' ')}
                </span>
                <button
                  onClick={() => setSelectedOrderDetail(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-700">

              {/* 1. Informasi Utama */}
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-2 text-xs">
                <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest block border-b pb-1.5 mb-2">📋 Rincian Jadwal & Waktu</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 font-bold block text-[9.5px]">Tanggal Mulai:</span>
                    <span className="font-extrabold text-slate-800">{selectedOrderDetail.scheduledDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[9.5px]">Pukul Estimasi:</span>
                    <span className="font-extrabold text-slate-850 font-mono">{selectedOrderDetail.scheduledTime} WIB</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[9.5px]">Dibuat Pada:</span>
                    <span className="text-slate-600 font-mono">{new Date(selectedOrderDetail.createdAt).toLocaleString('id-ID')}</span>
                  </div>
                  {selectedOrderDetail.completedAt && (
                    <div>
                      <span className="text-slate-400 font-bold block text-[9.5px]">Selesai Pada:</span>
                      <span className="text-emerald-700 font-mono font-bold">{new Date(selectedOrderDetail.completedAt).toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Pemesan & Alamat */}
              <div className="space-y-2 text-xs">
                <h5 className="text-[9px] font-black text-indigo-700 uppercase tracking-widest block border-b pb-1.5">👤 Pelanggan & Lokasi Penugasan</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-3 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <div>Nama Pelanggan: <strong className="text-slate-800">{selectedOrderDetail.customerName}</strong></div>
                    <div>Nomor Telepon: <a href={`tel:${selectedOrderDetail.customerPhone}`} className="text-indigo-650 hover:underline font-mono font-bold">{selectedOrderDetail.customerPhone}</a></div>
                  </div>
                  <div className="space-y-1 text-left">
                    <div>Alamat Penugasan:</div>
                    <p className="font-semibold text-slate-800 leading-normal">{selectedOrderDetail.address}</p>
                    {(selectedOrderDetail.latitude || selectedOrderDetail.lat) && (selectedOrderDetail.longitude || selectedOrderDetail.lng) && (
                      <a
                        href={`https://www.google.com/maps?q=${selectedOrderDetail.latitude || selectedOrderDetail.lat},${selectedOrderDetail.longitude || selectedOrderDetail.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex w-fit items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition shadow-sm"
                      >
                        📍 Peta Lokasi (Google Maps)
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Detail Jasa AC */}
              <div className="space-y-2 text-xs">
                <h5 className="text-[9px] font-black text-indigo-700 uppercase tracking-widest block border-b pb-1.5">🛠️ Rincian Jasa & Model AC</h5>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-2">
                  {Array.isArray(selectedOrderDetail.acDetail) ? (
                    selectedOrderDetail.acDetail.map((item, idx) => (
                      <div key={idx} className="mb-2 last:mb-0 border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                        <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 font-extrabold text-slate-800 text-[11px] mb-1">
                          <span>{item.category} - {item.serviceType === 'none' ? 'Umum' : item.serviceType}</span>
                          <span className="text-indigo-700 font-mono">{item.quantity} Unit</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block text-[9.5px]">Tipe/Model AC Pelanggan:</span>
                          <span className="font-extrabold text-slate-700 uppercase">{item.acType || 'Tidak Diisi'}</span>
                        </div>
                      </div>
                    ))
                  ) : selectedOrderDetail.acDetail && (
                    <div className="mb-2 border-b border-slate-100 pb-2">
                      <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 font-extrabold text-slate-800 text-[11px] mb-1">
                        <span>{(selectedOrderDetail.acDetail as any).category} - {(selectedOrderDetail.acDetail as any).serviceType === 'none' ? 'Umum' : (selectedOrderDetail.acDetail as any).serviceType}</span>
                        <span className="text-indigo-700 font-mono">{(selectedOrderDetail.acDetail as any).quantity} Unit</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[9.5px]">Tipe/Model AC Pelanggan:</span>
                        <span className="font-extrabold text-slate-700 uppercase">{(selectedOrderDetail.acDetail as any).acType || 'Tidak Diisi'}</span>
                      </div>
                    </div>
                  )}
                  {selectedOrderDetail.notes && (
                    <div className="bg-white p-2 rounded-lg border border-slate-100/50">
                      <span className="text-slate-400 font-bold block text-[9.5px]">Catatan Khusus Pelanggan:</span>
                      <p className="italic text-slate-650 leading-relaxed mt-0.5 font-medium">"{selectedOrderDetail.notes}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Petugas Teknisi */}
              <div className="space-y-2 text-xs">
                <h5 className="text-[9px] font-black text-indigo-700 uppercase tracking-widest block border-b pb-1.5">👥 Teknisi Lapangan</h5>
                <div className="bg-white p-3 rounded-xl border border-slate-100">
                  {selectedOrderDetail.assignedEmployeeName ? (
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-9 h-9 bg-indigo-50 border border-indigo-200 text-indigo-700 font-black flex items-center justify-center rounded-lg uppercase overflow-hidden cursor-pointer hover:opacity-80 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          const photo = users?.find(u => u.id === selectedOrderDetail.assignedTo)?.photo;
                          if (photo) setInspectedPhoto(photo);
                        }}
                      >
                        {users?.find(u => u.id === selectedOrderDetail.assignedTo)?.photo ? (
                          <img src={users.find(u => u.id === selectedOrderDetail.assignedTo)?.photo} alt="Teknisi" className="w-full h-full object-cover" />
                        ) : (
                          selectedOrderDetail.assignedEmployeeName.charAt(0)
                        )}
                      </div>
                      <div>
                        <strong className="text-slate-800 text-xs block font-extrabold">{selectedOrderDetail.assignedEmployeeName}</strong>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">TEKNISI UTAMA PRO</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-amber-700 font-bold italic block text-[10px]">⚠️ Belum ada staff didelegasikan ke tugas ini.</p>
                  )}
                </div>
              </div>

              {/* 5. Dokumentasi Kerja (Before After Photos) */}
              <div className="space-y-3 text-xs">
                <h5 className="text-[9px] font-black text-indigo-700 uppercase tracking-widest block border-b pb-1.5">📸 Dokumentasi Hasil Kerja Lapangan (Sebelum vs Sesudah)</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Before */}
                  <div className="space-y-1.5 text-center">
                    <span className="text-[9px] font-black bg-amber-500/10 text-amber-700 border border-amber-300/40 px-2 py-0.5 rounded uppercase block tracking-wider w-fit mx-auto">
                      Foto Sebelum (Before)
                    </span>
                    {selectedOrderDetail.photoBefore ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center max-h-56 shadow-sm">
                        <img
                          src={selectedOrderDetail.photoBefore}
                          alt="Foto Sebelum Pengerjaan"
                          className="w-full h-full object-contain cursor-zoom-in"
                          onClick={() => {
                            if (typeof window !== 'undefined') window.open(selectedOrderDetail.photoBefore, '_blank');
                          }}
                        />
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-dashed border-slate-250 rounded-xl p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5 aspect-video max-h-56">
                        <span>📷</span>
                        <span>Foto Sebelum tidak terlampir</span>
                      </div>
                    )}
                  </div>

                  {/* After */}
                  <div className="space-y-1.5 text-center">
                    <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-700 border border-emerald-300/40 px-2 py-0.5 rounded uppercase block tracking-wider w-fit mx-auto">
                      Foto Sesudah (After)
                    </span>
                    {selectedOrderDetail.photoAfter ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center max-h-56 shadow-sm">
                        <img
                          src={selectedOrderDetail.photoAfter}
                          alt="Foto Sesudah Pengerjaan"
                          className="w-full h-full object-contain cursor-zoom-in"
                          onClick={() => {
                            if (typeof window !== 'undefined') window.open(selectedOrderDetail.photoAfter, '_blank');
                          }}
                        />
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-dashed border-slate-250 rounded-xl p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5 aspect-video max-h-56">
                        <span>📷</span>
                        <span>Foto Sesudah tidak terlampir</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedOrderDetail.completionNotes && (
                  <div className="bg-slate-50 border border-slate-200/50 p-3 rounded-xl text-left mt-2">
                    <span className="text-slate-400 font-bold block text-[9.5px]">Laporan Kerja Teknisi:</span>
                    <p className="italic text-slate-700 font-semibold mt-0.5 leading-relaxed">"{selectedOrderDetail.completionNotes}"</p>
                  </div>
                )}
              </div>

              {/* 6. Ulasan Rating */}
              {selectedOrderDetail.rating !== undefined && selectedOrderDetail.rating !== null && (
                <div className="space-y-2 text-xs">
                  <h5 className="text-[9px] font-black text-indigo-700 uppercase tracking-widest block border-b pb-1.5">⭐ Penilaian Hasil Kerja Dari Pelanggan</h5>
                  <div className="bg-amber-500/5 border border-amber-500/20 p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
                    <div>
                      <span className="text-[9px] text-amber-700 font-black uppercase tracking-wider block mb-1">Feedback Ulasan</span>
                      {selectedOrderDetail.ratingNotes ? (
                        <p className="italic text-slate-800 font-bold leading-normal">"{selectedOrderDetail.ratingNotes}"</p>
                      ) : (
                        <span className="text-slate-400 italic font-medium">Bintang diberikan tanpa ulasan tulisan.</span>
                      )}
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      {[1, 2, 3, 4, 5].map((st) => (
                        <Star key={st} size={15} className={st <= (selectedOrderDetail.rating || 0) ? 'fill-amber-500 text-amber-500' : 'text-slate-200'} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 7. Informasi Pembayaran */}
              <div className="space-y-2 text-xs">
                <h5 className="text-[9px] font-black text-indigo-700 uppercase tracking-widest block border-b pb-1.5">💳 Detail Transaksi & Pembayaran</h5>
                <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-slate-400 font-bold block text-[9.5px]">Metode Pembayaran:</span>
                      {selectedOrderDetail.paymentMethod === 'TRANSFER' ? (
                        <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 text-[8.5px] px-2 py-0.5 rounded font-black uppercase block w-fit mt-1">
                          TRANSFER (XENDIT)
                        </span>
                      ) : selectedOrderDetail.paymentMethod === 'CASH' ? (
                        <span className="bg-emerald-50 border border-emerald-150 text-emerald-700 text-[8.5px] px-2 py-0.5 rounded font-black uppercase block w-fit mt-1">
                          TUNAI (CASH)
                        </span>
                      ) : (
                        <span className="bg-slate-100 border border-slate-200 text-slate-650 text-[8.5px] px-2 py-0.5 rounded font-black uppercase block w-fit mt-1">
                          💵 TUNAI
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[9.5px]">Status Pelunasan:</span>
                      {selectedOrderDetail.paymentStatus === 'PAID' || selectedOrderDetail.status === OrderStatus.SELESAI ? (
                        <span className="bg-emerald-500 text-white text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-wider block w-fit mt-1">
                          LUNAS
                        </span>
                      ) : (
                        <span className="bg-amber-50 border border-amber-300 text-amber-800 text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-wider block w-fit mt-1">
                          BELUM LUNAS / PENDING
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bukti Pembayaran Transfer (Payment Proof) */}
                  {selectedOrderDetail.paymentMethod === 'TRANSFER' && (
                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 space-y-2">
                      <span className="text-slate-450 font-black block text-[8px] uppercase tracking-wider">Bukti Pembayaran Transfer:</span>
                      {selectedOrderDetail.paymentProof ? (
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center max-h-56 shadow-sm mx-auto">
                          <img
                            src={selectedOrderDetail.paymentProof}
                            alt="Bukti Pembayaran"
                            className="w-full h-full object-contain cursor-zoom-in"
                            onClick={() => {
                              if (typeof window !== 'undefined') window.open(selectedOrderDetail.paymentProof, '_blank');
                            }}
                          />
                        </div>
                      ) : (
                        <span className="text-slate-400 italic block text-[10px]">Belum mengunggah bukti pembayaran.</span>
                      )}
                    </div>
                  )}

                  {/* Breakdown cost */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Harga Layanan Dasar ({Array.isArray(selectedOrderDetail.acDetail) ? selectedOrderDetail.acDetail.reduce((sum, s) => sum + (s.quantity || 0), 0) : (selectedOrderDetail.acDetail as any)?.quantity} Unit):</span>
                      <span className="font-mono font-semibold">{formatRupiah(selectedOrderDetail.serviceCost)}</span>
                    </div>
                    {selectedOrderDetail.addonsUsed && selectedOrderDetail.addonsUsed.length > 0 && (
                      <div className="space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[9px] text-slate-400 font-black uppercase block">Perlengkapan Tambahan:</span>
                        {selectedOrderDetail.addonsUsed.map((ad, idx) => (
                          <div key={idx} className="flex justify-between text-[10.5px]">
                            <span className="text-slate-500">• {ad.name} ({ad.quantity}x)</span>
                            <span className="font-mono font-medium">{formatRupiah(ad.price * ad.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {Number(selectedOrderDetail.voucher_discount || 0) > 0 && (
                      <div className="flex justify-between text-red-600 font-bold mt-1 text-[11px]">
                        <span>Diskon Voucher ({selectedOrderDetail.voucher_code})</span>
                        <span className="font-mono">-{formatRupiah(selectedOrderDetail.voucher_discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-slate-800 border-t pt-2 mt-1">
                      <span className="text-[11px] uppercase tracking-wider">Grand Total Pembayaran:</span>
                      <span className="text-indigo-700 font-mono text-xs">{formatRupiah(Math.max(0, Number(selectedOrderDetail.serviceCost || 0) + Number(selectedOrderDetail.addonsCost || 0) - Number(selectedOrderDetail.voucher_discount || 0)))}</span>
                    </div>
                    {/* {selectedOrderDetail.margin !== undefined && selectedOrderDetail.margin !== null && (
                      <div className="flex justify-between font-bold text-emerald-750 bg-emerald-50 border border-emerald-100 p-2 rounded-lg mt-2">
                        <span className="text-[10.5px] uppercase">Margin Keuntungan:</span>
                        <span className="font-mono text-[11.5px]">{formatRupiah(selectedOrderDetail.margin)}</span>
                      </div>
                    )} */}
                  </div>
                  {selectedOrderDetail.status === OrderStatus.SELESAI && (
                    <div className="pt-3 border-t border-slate-100 mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Status Invoice:</span>
                        {selectedOrderDetail.invoiceSent ? (
                          <span className="bg-emerald-50 border border-emerald-250 text-emerald-800 text-[8.5px] px-2.5 py-0.5 rounded font-black uppercase">
                            ✓ Terkirim
                          </span>
                        ) : (
                          <span className="bg-amber-50 border border-amber-200 text-amber-700 text-[8.5px] px-2.5 py-0.5 rounded font-black uppercase animate-pulse">
                            ⏳ Belum Dikirim
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSendInvoice(selectedOrderDetail)}
                        className={`flex items-center justify-center gap-2 w-full font-extrabold text-[11px] py-2.5 rounded-xl uppercase tracking-wider transition duration-200 shadow-md cursor-pointer ${selectedOrderDetail.invoiceSent
                          ? 'bg-slate-150 hover:bg-slate-200 text-slate-550 border border-slate-250 shadow-slate-200/10'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10'
                          }`}
                      >
                        <MessageCircle size={14} />
                        Kirim Invoice via WhatsApp
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end">
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="bg-slate-900 hover:bg-slate-850 text-white font-black text-xs px-5 py-2.5 rounded-xl uppercase tracking-wider transition cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===================== CONFIRMATION MODAL ===================== */}
      {confirmDialog.isOpen && (
        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl text-left">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-red-600 text-white">
              <h4 className="font-black text-xs uppercase tracking-wide flex items-center gap-2"><AlertCircle size={14} /> {confirmDialog.title}</h4>
              <button onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} className="p-1 rounded-full text-red-200 hover:bg-red-700 transition cursor-pointer">
                <X size={15} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-slate-600 text-xs font-semibold">{confirmDialog.message}</p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 text-[10px] font-black uppercase text-white bg-red-500 hover:bg-red-600 rounded-xl transition shadow-md shadow-red-500/20 cursor-pointer flex items-center gap-1"
                disabled={isLoading}
              >
                <Trash2 size={13} /> {confirmDialog.title.includes('Batalkan') ? 'Batalkan' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ===================== PRICE MODAL ===================== */}
      {showPriceModal && activePriceServiceId && (
        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-left flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white shrink-0">
              <h4 className="font-black text-xs uppercase tracking-wide flex items-center gap-2">
                <DollarSign size={14} /> Atur Harga Model AC
              </h4>
              <button onClick={() => setShowPriceModal(false)} className="p-1 rounded-full text-indigo-200 hover:bg-indigo-700 transition cursor-pointer">
                <X size={15} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 bg-slate-50">
              <p className="text-[10px] text-slate-500 font-semibold mb-4">
                Layanan: <strong className="text-slate-800 text-xs">{services.find(s => s.id === activePriceServiceId)?.name}</strong>
              </p>
              
              <div className="space-y-3">
                {filteredModels.map(m => (
                  <div key={m.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs font-bold text-slate-800">{m.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">Rp</span>
                      <input
                        type="number"
                        value={editingPrices[m.id] !== undefined ? editingPrices[m.id] : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : parseInt(e.target.value);
                          setEditingPrices(prev => ({
                            ...prev,
                            [m.id]: val as number
                          }));
                        }}
                        className="w-32 bg-slate-50 border border-slate-200 text-slate-800 text-xs px-2 py-1.5 rounded-lg outline-none focus:border-indigo-500 font-mono font-extrabold text-right"
                        placeholder="Harga"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setShowPriceModal(false)}
                className="px-4 py-2 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer border border-slate-200"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const pricesArray = Object.entries(editingPrices)
                      .filter(([_, price]) => price !== undefined && (price as any) !== '' && !isNaN(Number(price)))
                      .map(([modelId, price]) => ({
                        modelId,
                        price: Number(price)
                      }));
                      
                    await api.updateServicePricesBulk(activePriceServiceId, pricesArray);
                    
                    const updatedPrices = await api.fetchServicePrices();
                    setServicePrices(updatedPrices);
                    
                    setShowPriceModal(false);
                    alert('✅ Harga per model berhasil disimpan!');
                  } catch (err) {
                    console.error(err);
                    alert('❌ Gagal menyimpan harga.');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="px-4 py-2 text-[10px] font-black uppercase text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-500/20 cursor-pointer flex items-center gap-1"
                disabled={isLoading}
              >
                <Save size={13} /> {isLoading ? 'Menyimpan...' : 'Simpan Harga'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* PHOTO INSPECTION MODAL */}
      {inspectedPhoto && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fade-in" onClick={() => setInspectedPhoto(null)}>
          <div className="relative max-w-sm w-full animate-scale-in" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setInspectedPhoto(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer transition"
            >
              <X size={20} />
            </button>
            <img src={inspectedPhoto} alt="Inspected Photo" className="w-full h-auto rounded-2xl shadow-2xl border-4 border-white" />
          </div>
        </div>
      )}

      {/* EMPLOYEE VERIFICATION MODAL */}
      {verifyingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-left max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white shrink-0">
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5"><ShieldCheck size={14} className="text-amber-400" /> Verifikasi Dokumen Karyawan</h4>
                <p className="text-[10px] text-slate-400 mt-1">Tinjau data KTP & Selfie Karyawan baru</p>
              </div>
              <button
                onClick={() => setVerifyingUser(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-800 transition cursor-pointer"
                disabled={isLoading}
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-grow">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                <div className="grid grid-cols-3 text-xs gap-y-2.5">
                  <span className="font-bold text-slate-400">Nama:</span>
                  <span className="col-span-2 font-extrabold text-slate-800">{verifyingUser.name}</span>

                  <span className="font-bold text-slate-400">Email:</span>
                  <span className="col-span-2 font-mono font-bold text-slate-700 text-[11px] break-all">{verifyingUser.email}</span>

                  <span className="font-bold text-slate-400">WhatsApp:</span>
                  <span className="col-span-2 font-black text-slate-800">{verifyingUser.phone || '-'}</span>

                  <span className="font-bold text-slate-400">Alamat:</span>
                  <span className="col-span-2 font-bold text-slate-600 leading-relaxed text-[11px]">{verifyingUser.address || '-'}</span>
                </div>
              </div>

              {/* Photos Section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-center">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Foto KTP</span>
                  {verifyingUser.ktpPhoto ? (
                    <div 
                      onClick={() => setInspectedPhoto(verifyingUser.ktpPhoto!)}
                      className="border border-slate-200 rounded-2xl overflow-hidden aspect-video bg-slate-100 cursor-pointer shadow-sm hover:shadow transition relative group"
                    >
                      <img src={verifyingUser.ktpPhoto} alt="KTP" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition duration-200">
                        Klik untuk Zoom
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-300 rounded-2xl aspect-video bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400">
                      Foto KTP Tidak Ada
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-center">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Foto Selfie</span>
                  {verifyingUser.selfiePhoto ? (
                    <div 
                      onClick={() => setInspectedPhoto(verifyingUser.selfiePhoto!)}
                      className="border border-slate-200 rounded-2xl overflow-hidden aspect-video bg-slate-100 cursor-pointer shadow-sm hover:shadow transition relative group"
                    >
                      <img src={verifyingUser.selfiePhoto} alt="Selfie" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition duration-200">
                        Klik untuk Zoom
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-300 rounded-2xl aspect-video bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400">
                      Foto Selfie Tidak Ada
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2.5 shrink-0">
              <button
                onClick={() => setVerifyingUser(null)}
                disabled={isLoading}
                className="flex-1 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 text-slate-700 text-xs font-black py-2.5 rounded-xl uppercase transition cursor-pointer text-center"
              >
                Tutup
              </button>
              <button
                onClick={() => handleActivateUser(verifyingUser.id)}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 text-white text-xs font-black py-2.5 rounded-xl uppercase transition shadow-md shadow-emerald-500/15 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader size={13} className="animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Check size={13} /> Setujui & Aktifkan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export CSV Date Range Modal */}
      {showAdminOrderModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden relative">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between p-5 md:px-8 border-b border-slate-100 bg-slate-50 shrink-0">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                <Plus size={20} className="text-indigo-600" />
                Buat Pesanan Baru
              </h3>
              <button 
                onClick={() => {
                  setShowAdminOrderModal(false);
                  setAdminOrderStep(1);
                  setAdminOrderSuccessId(null);
                  setAdminCartServices([]);
                  setAdminOrderConfirmError('');
                }} 
                className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 md:px-8 bg-white">
              {adminOrderConfirmError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-xs font-medium flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{adminOrderConfirmError}</span>
                </div>
              )}

              {/* STEP 1: PILIH PELANGGAN */}
              {adminOrderStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <button
                      type="button"
                      onClick={() => setAdminOrderType('existing')}
                      className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all flex flex-col items-center justify-center gap-2 ${adminOrderType === 'existing' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300'}`}
                    >
                      <UserIcon size={24} className={adminOrderType === 'existing' ? 'text-indigo-600' : 'text-slate-400'} />
                      Pelanggan Ada
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminOrderType('new')}
                      className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all flex flex-col items-center justify-center gap-2 ${adminOrderType === 'new' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300'}`}
                    >
                      <UserPlus size={24} className={adminOrderType === 'new' ? 'text-indigo-600' : 'text-slate-400'} />
                      Pelanggan Baru
                    </button>
                  </div>

                  {adminOrderType === 'existing' ? (
                    <div className="space-y-2 relative">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Pilih Pelanggan dari Data</label>
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Cari nama atau nomor telepon..."
                          value={adminUserSearchQuery}
                          onFocus={() => setAdminShowUserDropdown(true)}
                          onChange={e => {
                            setAdminUserSearchQuery(e.target.value);
                            setAdminShowUserDropdown(true);
                            if (!e.target.value) setAdminOrderSelectedUser(null);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:border-indigo-500 outline-none"
                        />
                      </div>
                      
                      {adminShowUserDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                          {users.filter(u => u.role === Role.USER && (u.name.toLowerCase().includes(adminUserSearchQuery.toLowerCase()) || (u.phone || '').includes(adminUserSearchQuery))).map(u => (
                            <button
                              key={u.id}
                              type="button"
                              className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-100 last:border-0 focus:outline-none focus:bg-indigo-50 transition"
                              onClick={() => {
                                setAdminOrderSelectedUser(u);
                                setAdminUserSearchQuery(`${u.name} (${u.phone || u.email})`);
                                setAdminShowUserDropdown(false);
                                setAdminAddress(u.address || '');
                                setAdminLat(u.lat);
                                setAdminLng(u.lng);
                              }}
                            >
                              <p className="font-bold text-slate-800 text-sm">{u.name}</p>
                              <p className="text-xs text-slate-500">{u.phone || u.email}</p>
                            </button>
                          ))}
                          {users.filter(u => u.role === Role.USER && (u.name.toLowerCase().includes(adminUserSearchQuery.toLowerCase()) || (u.phone || '').includes(adminUserSearchQuery))).length === 0 && (
                            <div className="p-4 text-center text-slate-500 text-sm">Pelanggan tidak ditemukan.</div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-800 text-xs flex gap-3 items-start">
                        <Sparkles size={16} className="shrink-0 mt-0.5 text-blue-600" />
                        <p>Akun pelanggan akan dibuatkan secara otomatis. Magic Link akan diberikan di langkah akhir untuk dikirimkan ke WhatsApp pelanggan.</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nama Lengkap</label>
                        <input
                          type="text"
                          value={adminOrderNewUserName}
                          onChange={e => setAdminOrderNewUserName(e.target.value)}
                          placeholder="Nama pelanggan"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nomor Telepon (WhatsApp)</label>
                        <input
                          type="text"
                          value={adminOrderNewUserPhone}
                          onChange={e => setAdminOrderNewUserPhone(e.target.value)}
                          placeholder="0812xxxxxx"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: DETAIL PESANAN */}
              {adminOrderStep === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                    <h4 className="font-bold text-indigo-900 mb-3 text-sm">Keranjang Layanan</h4>
                    {adminCartServices.length === 0 ? (
                      <div className="text-center py-4 border-2 border-dashed border-indigo-200 rounded-lg text-indigo-400 text-xs">Belum ada layanan dipilih</div>
                    ) : (
                      <div className="space-y-2 mb-3">
                        {adminCartServices.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-indigo-50 shadow-sm">
                            <div>
                              <p className="text-xs font-bold text-slate-800">{item.serviceType} <span className="text-indigo-600">({item.quantity}x)</span></p>
                              <p className="text-[10px] text-slate-500">{item.acType} - {item.category}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono font-semibold text-slate-700">{formatRupiah(item.price * item.quantity)}</span>
                              <button onClick={() => setAdminCartServices(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 p-1">
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick Add Service Form */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 mt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Merek AC</label>
                           <select value={adminSelectedModel} onChange={e => setAdminSelectedModel(e.target.value)} className="w-full border-slate-200 rounded-md text-xs py-2">
                            <option value="">- Merek -</option>
                            {models.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Tipe</label>
                          <select value={adminSelectedCategory} onChange={e => setAdminSelectedCategory(e.target.value)} className="w-full border-slate-200 rounded-md text-xs py-2">
                            <option value="">- Tipe -</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Layanan</label>
                          <select 
                            value={adminSelectedService} 
                            onChange={e => setAdminSelectedService(e.target.value)} 
                            className="w-full border-slate-200 rounded-md text-xs py-2 disabled:bg-slate-100 disabled:text-slate-400"
                            disabled={!adminSelectedCategory}
                          >
                            <option value="">- Pilih Layanan -</option>
                            {services
                              .filter(s => {
                                const cat = categories.find(c => c.name === adminSelectedCategory);
                                return cat ? s.categoryId === cat.id : false;
                              })
                              .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-between items-end gap-3 mt-2">
                        <div className="w-24">
                          <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Jumlah</label>
                          <input type="number" min="1" value={adminQuantity} onChange={e => setAdminQuantity(parseInt(e.target.value))} className="w-full border-slate-200 rounded-md text-xs py-2" />
                        </div>
                        <button 
                          onClick={() => {
                            if (!adminSelectedModel || !adminSelectedCategory || !adminSelectedService) return;
                            const svc = services.find(s => String(s.id) === String(adminSelectedService));
                            const cat = categories.find(c => String(c.name) === String(adminSelectedCategory));
                            const model = models.find(m => String(m.name) === String(adminSelectedModel));
                            if (svc && cat) {
                              const priceEntry = servicePrices.find(sp => String(sp.serviceId) === String(svc.id) && String(sp.modelId) === String(model?.id));
                              const resolvedPrice = priceEntry ? priceEntry.price : svc.price;
                              if (resolvedPrice === 0) {
                                alert('❌ Maaf, harga untuk layanan dan tipe AC ini belum tersedia (Rp0). Pastikan harga sudah diatur di menu Edit Master Data.');
                                return;
                              }

                              let linkedAcId = undefined;
                              let linkedAcName = undefined;

                              setAdminCartServices(prev => [...prev, {
                                acType: adminSelectedModel,
                                category: adminSelectedCategory,
                                categoryId: cat.id,
                                serviceType: svc.name,
                                quantity: adminQuantity,
                                price: resolvedPrice,
                                acId: linkedAcId || 'manual',
                                acName: linkedAcName || 'AC Umum'
                              }]);
                              setAdminSelectedService('');
                            }
                          }}
                          className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold text-xs py-2.5 px-4 rounded-xl transition flex-1 border border-indigo-200"
                        >
                          + Tambah
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tanggal</label>
                      <input type="date" value={adminDate} onChange={e => setAdminDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none" min={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Waktu</label>
                      <input type="time" value={adminTime} onChange={e => setAdminTime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Lokasi (Peta Interaktif)</label>
                    <button
                      type="button"
                      onClick={() => setShowAdminMapPicker(true)}
                      className="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border border-indigo-200 font-bold text-[10.5px] py-2 rounded-xl uppercase flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm"
                    >
                      <MapPin size={13} />
                      Pilih dari Peta Pintar
                    </button>
                    {adminLat !== undefined && adminLat !== null && adminLng !== undefined && adminLng !== null && (
                      <p className="text-[10px] text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Titik lokasi tersimpan: {adminLat.toFixed(5)}, {adminLng.toFixed(5)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Alamat Pengerjaan (Detail)</label>
                    <textarea
                      value={adminAddress}
                      onChange={e => setAdminAddress(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none resize-none"
                      placeholder="Detail alamat pengerjaan..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Catatan Tambahan</label>
                    <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none resize-none" placeholder="Catatan untuk teknisi (opsional)..." />
                  </div>
                </div>
              )}

              {/* STEP 3: SUCCESS & MAGIC LINK */}
              {adminOrderStep === 3 && (
                <div className="py-8 px-4 text-center animate-scale-in">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <Check size={40} className="text-emerald-500 relative z-10 animate-bounce-in" style={{ animationDelay: '200ms' }} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2">Pesanan Berhasil!</h3>
                  <p className="text-slate-500 mb-6">ID Pesanan: <strong className="text-slate-800">{adminOrderSuccessId}</strong></p>

                  {adminOrderMagicLink && (
                    <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl text-left max-w-sm mx-auto shadow-sm">
                      <p className="text-sm font-bold text-blue-900 mb-1">🔗 Magic Link Pelanggan</p>
                      <p className="text-xs text-blue-700 mb-3 leading-relaxed">Akun baru berhasil dibuat. Salin dan kirimkan link ini agar pelanggan dapat login otomatis ke akunnya.</p>
                      
                      <div className="flex bg-white border border-blue-200 rounded-lg overflow-hidden">
                        <input type="text" readOnly value={adminOrderMagicLink} className="flex-1 text-[10px] px-3 py-2 bg-slate-50 text-slate-600 outline-none" />
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(adminOrderMagicLink);
                            alert('Magic Link disalin!');
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-xs font-bold transition"
                        >
                          Salin
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex justify-center">
                    <button 
                      onClick={() => {
                        setShowAdminOrderModal(false);
                        setAdminOrderStep(1);
                        setAdminOrderSuccessId(null);
                        setAdminOrderMagicLink('');
                      }} 
                      className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-700 transition"
                    >
                      Selesai
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer (Only for Step 1 and 2) */}
            {adminOrderStep !== 3 && (
              <div className="p-5 md:px-8 bg-slate-50 border-t border-slate-100 shrink-0 flex justify-end gap-3">
                {adminOrderStep === 1 && (
                  <>
                    <button onClick={() => setShowAdminOrderModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition text-sm">Batal</button>
                    <button 
                      onClick={() => {
                        if (adminOrderType === 'existing' && !adminOrderSelectedUser) {
                          setAdminOrderConfirmError('Pelanggan wajib dipilih.');
                          return;
                        }
                        if (adminOrderType === 'new' && (!adminOrderNewUserName || !adminOrderNewUserPhone)) {
                          setAdminOrderConfirmError('Nama dan Telepon wajib diisi.');
                          return;
                        }
                        setAdminOrderConfirmError('');
                        setAdminOrderStep(2);
                      }} 
                      className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition text-sm"
                    >
                      Lanjut ke Layanan
                    </button>
                  </>
                )}
                {adminOrderStep === 2 && (
                  <>
                    <button onClick={() => setAdminOrderStep(1)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition text-sm">Kembali</button>
                    <button 
                      onClick={handleCreateAdminOrder}
                      disabled={isCreatingOrder || adminCartServices.length === 0}
                      className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition flex items-center gap-2 text-sm disabled:opacity-50"
                    >
                      {isCreatingOrder ? <><Loader size={16} className="animate-spin" /> Memproses...</> : 'Buat Pesanan'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-4 bg-emerald-600 text-white flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Download size={16} /> Ekspor Data CSV
                </h4>
                <p className="text-[10px] text-emerald-100 mt-0.5">Pilih rentang waktu data yang ingin diunduh</p>
              </div>
              <button onClick={() => setShowExportModal(false)} className="p-1 hover:bg-emerald-500 rounded-full transition cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal Mulai</label>
                <input
                  type="date"
                  value={jobsStartDate}
                  onChange={(e) => setJobsStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-3 py-2.5 rounded-xl focus:border-emerald-500 focus:bg-white outline-none transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal Akhir</label>
                <input
                  type="date"
                  value={jobsEndDate}
                  onChange={(e) => setJobsEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-3 py-2.5 rounded-xl focus:border-emerald-500 focus:bg-white outline-none transition"
                />
              </div>
              <p className="text-[9.5px] text-slate-500 italic text-center mt-2">
                Kosongkan tanggal jika ingin mengunduh seluruh data pesanan.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2.5">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-black py-2.5 rounded-xl uppercase transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  handleExportCSV();
                  setShowExportModal(false);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 rounded-xl uppercase transition shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download size={13} /> Unduh CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Tambah Pengguna */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <UserPlus size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">Tambah Pengguna Baru</h3>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Buat akun untuk karyawan atau admin</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition border"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-xl text-xs font-semibold mb-4">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 ml-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 ml-1">Email</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition"
                    placeholder="email@contoh.com"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 ml-1">Nomor WhatsApp</label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition"
                    placeholder="081234567890"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 ml-1">Kata Sandi (Password)</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition"
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 mt-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 ml-1">Peran (Role)</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as Role)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition"
                  >
                    <option value={Role.STAFF}>STAFF (Karyawan/Teknisi)</option>
                    <option value={Role.ADMIN}>ADMIN (Pengurus Cabang)</option>
                    <option value={Role.KEUANGAN}>KEUANGAN (Divisi Keuangan)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 ml-1">Wilayah Cabang</label>
                  <select
                    value={activeUser?.region_id || ''}
                    disabled
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value={activeUser?.region_id || ''}>CABANG ANDA SAAT INI</option>
                  </select>
                </div>
              </div>

              {regRole === Role.STAFF && (
                <div className="space-y-4 pt-2 border-t border-slate-100 mt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block ml-1">Unggah KTP</label>
                      <div className="flex flex-col gap-2">
                        {regKtp && (
                          <div className="w-full h-24 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                            <img src={regKtp} alt="KTP Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleRegKtpChange}
                          className="w-full text-[10px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block ml-1">Foto Selfie Karyawan</label>
                      <div className="flex flex-col gap-2">
                        {regSelfie && (
                          <div className="w-full h-24 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                            <img src={regSelfie} alt="Selfie Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleRegSelfieChange}
                          className="w-full text-[10px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div className="p-4 sm:p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-xs uppercase rounded-xl hover:bg-slate-50 transition"
                disabled={isRegistering}
              >
                Batal
              </button>
              <button
                onClick={handleCreateUser}
                disabled={isRegistering || !regName || !regEmail || !regPassword}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase rounded-xl disabled:bg-slate-300 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {isRegistering ? (
                  <>
                    <Loader size={14} className="animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <UserPlus size={14} /> Buat Akun
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ADMIN MAP PICKER MODAL */}
      {showAdminMapPicker && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <div>
                <h3 className="font-bold text-slate-800">Pilih Titik Lokasi</h3>
                <p className="text-xs text-slate-500">Sesuaikan pin lokasi dengan alamat pengerjaan</p>
              </div>
              <button 
                onClick={() => setShowAdminMapPicker(false)}
                className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 relative bg-slate-100">
              <MapPicker 
                onLocationSelect={(addr, lat, lng) => {
                  setAdminLat(lat);
                  setAdminLng(lng);
                  if (addr) setAdminAddress(addr);
                  setShowAdminMapPicker(false);
                }} 
                onCancel={() => setShowAdminMapPicker(false)} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={32} className="text-rose-500" />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2">Keluar dari Akun?</h3>
              <p className="text-sm text-slate-500 mb-6">Anda harus login kembali untuk masuk ke dashboard Admin.</p>
              
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowLogoutConfirm(false)} className="py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Batal</button>
                <button onClick={() => { setShowLogoutConfirm(false); logout(); }} className="py-3 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-500/30 transition">Ya, Keluar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
