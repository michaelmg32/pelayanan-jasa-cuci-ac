'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { User, Order, OrderStatus, Role, ACModel, ACCategory, ACService, ACAddon, AddonTransaction } from '@/types';
import * as api from '@/lib/api';
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
  ChevronUp
} from 'lucide-react';
import { useApp } from '@/lib/auth-context';

type TabType = 'JOBS_TRACKER' | 'MASTER_DATA' | 'USER_MANAGEMENT' | 'PROFIL' | 'STAFF_PERFORMANCE';

export default function AdminDashboard() {
  const {
    activeUser, setActiveUser,
    orders, setOrders,
    users, setUsers,
    models, setModels,
    categories, setCategories,
    services, setServices,
    addons, setAddons,
    logout,
    showAlert,
    appSettings
  } = useApp();
  const alert = showAlert;

  // Extract staff members from users and sort by rating & jobs done
  const staffList = users.filter(u => u.role === Role.STAFF);
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

    const serviceName = `${order.acDetail?.quantity || 0}x ${order.acDetail?.serviceType === 'none' ? order.acDetail?.category : order.acDetail?.serviceType
      } (${order.acDetail?.acType || ''})`;

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
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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

  // Sync edits when user props update
  useEffect(() => {
    if (activeUser) {
      setEditProfileName(activeUser.name || '');
      setEditProfilePhone(activeUser.phone || '');
      setEditProfileAddress(activeUser.address || '');
      setEditProfilePhoto(activeUser.photo || '');
    }
  }, [activeUser]);

  // Click-outside listener to close the three-dots menu dropdown
  useEffect(() => {
    if (!showMoreMenu) return;
    const handleOutsideClick = () => {
      setShowMoreMenu(false);
    };
    // Use timeout to prevent immediate closing during trigger click event propagation
    const timer = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [showMoreMenu]);

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
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
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
      await api.updateUser(activeUser!.id, {
        name: editProfileName.trim(),
        email: activeUser!.email,
        phone: editProfilePhone.trim(),
        role: activeUser!.role,
        address: editProfileAddress.trim(),
        photo: editProfilePhoto,
      });
      const updatedUser = {
        ...activeUser!,
        name: editProfileName.trim(),
        phone: editProfilePhone.trim(),
        address: editProfileAddress.trim(),
        photo: editProfilePhoto,
      };
      setActiveUser(updatedUser);
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

  // Editing User state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<Role>(Role.USER);
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

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

  // Performance State
  const [performanceDate, setPerformanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [performanceEndDate, setPerformanceEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedPerformanceStaffId, setExpandedPerformanceStaffId] = useState<string | null>(null);

  // Master Data Editing State
  const [activeMasterSubTab, setActiveMasterSubTab] = useState<'MODELS' | 'CATEGORIES' | 'SERVICES' | 'ADDONS'>('MODELS');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  // Form add-new states for master data
  const [newModelName, setNewModelName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryHasServices, setNewCategoryHasServices] = useState(true);

  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(0);
  const [newServiceCategory, setNewServiceCategory] = useState('');

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

    // 3. Date Range Filter
    if (jobsStartDate || jobsEndDate) {
      const orderDateStr = o.scheduledDate || o.createdAt;
      if (orderDateStr) {
        const orderDate = new Date(orderDateStr).toISOString().split('T')[0];
        if (jobsStartDate && orderDate < jobsStartDate) return false;
        if (jobsEndDate && orderDate > jobsEndDate) return false;
      }
    }

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
        // Note: address is not stored in database yet
      };

      await api.updateUser(userId, updatePayload);

      // Update local state
      const updatedUser = users.find(u => u.id === userId);
      if (updatedUser) {
        updatedUser.role = editRole;
        updatedUser.phone = editPhone;
        updatedUser.address = editAddress;
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

  const startEditUser = (target: User) => {
    if (target.role === Role.OWNER || target.role === Role.ADMIN) {
      alert('❌ Anda tidak memiliki wewenang untuk mengedit role Owner atau sesama Admin.');
      return;
    }
    setEditingUserId(target.id);
    setEditRole(target.role);
    setEditPhone(target.phone || '');
    setEditAddress(target.address || '');
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
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      setIsLoading(true);
      const newCategory = await api.createCategory({
        name: newCategoryName,
        hasServices: newCategoryHasServices
      });
      setCategories([...categories, newCategory]);
      setNewCategoryName('');
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
        price: newServicePrice,
        categoryId: newServiceCategory
      });
      setServices([...services, newService]);
      setNewServiceName('');
      setNewServicePrice(0);
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
        await api.updateCategory(id, { name: editMasterField1, hasServices: editMasterField2 });
        const updated = categories.map(c => c.id === id ? { ...c, name: editMasterField1, hasServices: editMasterField2 as boolean } : c);
        setCategories(updated);
      } else if (editingMasterType === 'SERVICES') {
        await api.updateService(id, { name: editMasterField1, price: editMasterField2, categoryId: editMasterField3 });
        const updated = services.map(s => s.id === id ? { ...s, name: editMasterField1, price: editMasterField2 as number, categoryId: editMasterField3 } : s);
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

  return (
    <div className="flex-1 flex flex-col bg-slate-100 text-slate-800 text-left min-h-0 h-full overflow-hidden">
      {/* GLOBAL HEADER BAR WITH THREE-DOTS MENU */}
      <div className="bg-slate-900 text-white px-5 py-4 shrink-0 shadow-md flex justify-between items-center z-30 relative">
        {/* Logo, Business Name & Slogan */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shadow-md overflow-hidden border border-white/20">
            {appSettings?.business_logo ? (
              <img src={appSettings.business_logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </div>
          <div className="text-left">
            <h1 className="text-sm font-black leading-none">{appSettings?.business_name || 'Sugar AC'}</h1>
            <p className="text-[9px] text-blue-200 mt-1">Sistem Layanan AC Profesional | Admin</p>
          </div>
        </div>

        {/* Three-dots menu button */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMoreMenu(prev => !prev);
            }}
            className="p-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer text-blue-200 hover:text-white"
          >
            <MoreVertical size={18} />
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 text-slate-800 text-left text-xs font-bold">
              <button
                onClick={() => {
                  setActiveTab('JOBS_TRACKER');
                  setShowMoreMenu(false);
                }}
                className={`w-full px-4 py-2 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer text-slate-700 ${activeTab !== 'PROFIL' ? 'text-indigo-600 bg-indigo-50/20 font-black' : ''}`}
              >
                <ClipboardList size={14} className={activeTab !== 'PROFIL' ? 'text-indigo-600' : 'text-slate-400'} />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('PROFIL');
                  setShowMoreMenu(false);
                }}
                className={`w-full px-4 py-2 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer text-slate-700 ${activeTab === 'PROFIL' ? 'text-indigo-600 bg-indigo-50/20 font-black' : ''}`}
              >
                <UserIcon size={14} className={activeTab === 'PROFIL' ? 'text-indigo-600' : 'text-slate-400'} />
                <span>Profile</span>
              </button>
              <hr className="my-1 border-slate-100" />
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  logout();
                }}
                className="w-full px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer text-rose-600"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===================== CONTROL TABS SYSTEM ===================== */}
      {activeTab !== 'PROFIL' && (
        <div className="bg-white border-b border-slate-200 px-4 py-0 sticky top-0 z-20 shrink-0 flex gap-1 overflow-x-auto flex-nowrap">
          <button
            onClick={() => setActiveTab('JOBS_TRACKER')}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'JOBS_TRACKER'
              ? 'text-slate-900 border-slate-900'
              : 'text-slate-600 border-transparent hover:text-slate-800'
              }`}
          >
            <span className="flex items-center gap-2">
              <ClipboardList size={15} />
              <span>Pantauan Jasa</span>
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('MASTER_DATA');
              if (categories.length > 0) setNewServiceCategory(categories[0].id);
            }}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'MASTER_DATA'
              ? 'text-slate-900 border-slate-900'
              : 'text-slate-600 border-transparent hover:text-slate-800'
              }`}
          >
            <span className="flex items-center gap-2">
              <Wrench size={15} />
              <span>Edit Master Data</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('USER_MANAGEMENT')}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'USER_MANAGEMENT'
              ? 'text-slate-900 border-slate-900'
              : 'text-slate-600 border-transparent hover:text-slate-800'
              }`}
          >
            <span className="flex items-center gap-2">
              <UserCog size={15} />
              <span>Edit Pengguna ({allUsers.length})</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('STAFF_PERFORMANCE')}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'STAFF_PERFORMANCE'
              ? 'text-slate-900 border-slate-900'
              : 'text-slate-600 border-transparent hover:text-slate-800'
              }`}
          >
            <span className="flex items-center gap-2">
              <BarChart2 size={15} />
              <span>Kinerja Staff</span>
            </span>
          </button>
        </div>
      )}

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
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="date"
                  value={jobsStartDate}
                  onChange={(e) => setJobsStartDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-sm px-3 py-2 rounded-lg focus:border-indigo-500 focus:bg-white outline-none transition"
                />
                <span className="text-slate-400 font-bold text-xs">S/D</span>
                <input
                  type="date"
                  value={jobsEndDate}
                  onChange={(e) => setJobsEndDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-sm px-3 py-2 rounded-lg focus:border-indigo-500 focus:bg-white outline-none transition"
                />
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
                          {order.acDetail ? `${order.acDetail.quantity} Unit x ${order.acDetail.serviceType === 'none' ? order.acDetail.category : order.acDetail.serviceType}` : 'Detail tidak tersedia'}
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
                          <div className="w-5 h-5 rounded-full overflow-hidden border bg-white shrink-0 flex items-center justify-center font-bold text-[9px] text-indigo-750">
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
                      <span className="text-xs font-mono text-indigo-700">{formatRupiah(order.finalPrice || (Number(order.serviceCost || 0) + Number(order.addonsCost || 0)))}</span>
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
                {['MODELS', 'CATEGORIES', 'ADDONS'].map((sub) => (
                  <button
                    key={sub}
                    onClick={() => {
                      setActiveMasterSubTab(sub as any);
                      setEditingMasterId(null);
                    }}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition ${activeMasterSubTab === sub ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-850'
                      }`}
                  >
                    {sub}
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
                      {models.map(m => (
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
                  <input
                    type="text"
                    placeholder="Nama kategori..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-850 text-xs px-3 py-2 rounded-xl outline-none focus:border-indigo-500 font-bold"
                    required
                  />
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
                      {categories.map(c => (
                        <React.Fragment key={c.id}>
                          <tr
                            className={`hover:bg-slate-50/50 cursor-pointer transition ${expandedCategoryId === c.id ? 'bg-indigo-50/50' : ''}`}
                            onClick={() => {
                              setExpandedCategoryId(expandedCategoryId === c.id ? null : c.id);
                              setNewServiceCategory(expandedCategoryId === c.id ? '' : c.id);
                            }}
                          >
                            <td className="p-3 font-extrabold text-slate-800 flex items-center gap-2">
                              {c.name}
                              <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                                {services.filter(s => s.categoryId === c.id).length} Layanan
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => startEditMaster('CATEGORIES', c.id, c.name, c.hasServices)} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg border border-indigo-100 transition"><Edit size={13} /></button>
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
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <input
                                        type="text"
                                        placeholder="Nama layanan..."
                                        value={newServiceName}
                                        onChange={(e) => setNewServiceName(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none focus:border-indigo-500 font-bold"
                                        required
                                      />
                                      <input
                                        type="number"
                                        value={newServicePrice || ''}
                                        onChange={(e) => setNewServicePrice(parseInt(e.target.value) || 0)}
                                        className="bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none focus:border-indigo-500 font-mono font-extrabold"
                                        placeholder="Harga (Rp)"
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
                                          <th className="p-2.5 px-3">Harga</th>
                                          <th className="p-2.5 px-3 text-right">Aksi</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {services.filter(s => s.categoryId === c.id).length === 0 ? (
                                          <tr>
                                            <td colSpan={3} className="p-4 text-center text-slate-400 font-medium text-xs">Belum ada layanan di kategori ini</td>
                                          </tr>
                                        ) : (
                                          services.filter(s => s.categoryId === c.id).map(s => (
                                            <tr key={s.id} className="hover:bg-slate-50">
                                              <td className="p-2.5 px-3 font-extrabold text-slate-800">{s.name}</td>
                                              <td className="p-2.5 px-3 font-mono text-indigo-700 font-bold">{formatRupiah(s.price)}</td>
                                              <td className="p-2.5 px-3 text-right flex justify-end gap-1.5">
                                                <button onClick={(e) => { e.stopPropagation(); startEditMaster('SERVICES', s.id, s.name, s.price, s.categoryId); }} className="text-indigo-600 hover:bg-indigo-100 p-1 rounded-lg transition"><Edit size={12} /></button>
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

            {/* ADDONS */}
            {activeMasterSubTab === 'ADDONS' && (
              <div className="space-y-4">
                {/* Addon Sub Tabs */}
                <div className="flex border-b border-slate-100 pb-2 justify-between items-center flex-wrap gap-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveAddonSubTab('KATALOG')}
                      className={`px-3 py-1.5 text-[9.5px] font-black uppercase rounded-lg transition duration-150 cursor-pointer ${activeAddonSubTab === 'KATALOG'
                        ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                        : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800'
                        }`}
                    >
                      Katalog & Stok
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAddonSubTab('TRANSAKSI')}
                      className={`px-3 py-1.5 text-[9.5px] font-black uppercase rounded-lg transition duration-150 cursor-pointer ${activeAddonSubTab === 'TRANSAKSI'
                        ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                        : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800'
                        }`}
                    >
                      Riwayat Transaksi
                    </button>
                  </div>

                  {activeAddonSubTab === 'TRANSAKSI' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Filter Barang:</span>
                      <select
                        value={addonTxFilter}
                        onChange={(e) => setAddonTxFilter(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-700 text-[10px] px-2 py-1 rounded-lg outline-none font-bold"
                      >
                        <option value="ALL">Semua Barang</option>
                        {addons.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowPurchaseForm(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black px-3 py-1.5 rounded-lg transition cursor-pointer shadow-sm whitespace-nowrap"
                      >
                        + Beli Barang
                      </button>
                    </div>
                  )}
                  {activeAddonSubTab === 'KATALOG' && (
                    <button
                      type="button"
                      onClick={() => setShowPurchaseForm(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black px-3 py-1.5 rounded-lg transition cursor-pointer shadow-sm"
                    >
                      + Beli Barang
                    </button>
                  )}
                </div>

                {/* KATALOG SUBTAB */}
                {activeAddonSubTab === 'KATALOG' && (
                  <div className="space-y-4">
                    <form onSubmit={handleAddAddon} className="flex flex-col sm:flex-row gap-3 bg-slate-50 border p-3 rounded-xl">
                      <input
                        type="text"
                        placeholder="Alat/Bahan..."
                        value={newAddonName}
                        onChange={(e) => setNewAddonName(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 text-slate-800 text-xs px-3.5 py-2 rounded-xl outline-none focus:border-indigo-500 font-semibold"
                        required
                      />
                      <input
                        type="number"
                        value={newAddonHpp || ''}
                        onChange={(e) => setNewAddonHpp(parseInt(e.target.value) || 0)}
                        className="bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none focus:border-indigo-500 font-mono font-bold"
                        placeholder="Harga Modal (HPP)"
                        required
                      />
                      <input
                        type="number"
                        value={newAddonPrice || ''}
                        onChange={(e) => setNewAddonPrice(parseInt(e.target.value) || 0)}
                        className="bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none focus:border-indigo-500 font-mono font-bold"
                        placeholder="Harga Jual"
                        required
                      />
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-4 py-2 rounded-xl uppercase flex items-center gap-1 transition cursor-pointer self-end shrink-0"
                      >
                        <Plus size={15} /> Tambah
                      </button>
                    </form>
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[9px] border-b border-slate-200">
                          <tr>
                            <th className="p-3">Nama Suku Cadang</th>
                            <th className="p-3">Stok</th>
                            <th className="p-3">Harga Modal (HPP)</th>
                            <th className="p-3">Harga Jual</th>
                            <th className="p-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {addons.map(a => {
                            const stockCount = a.stock ?? 0;
                            let stockColor = 'bg-emerald-50 border-emerald-200 text-emerald-700';
                            let stockLabel = 'Tersedia';
                            if (stockCount <= 0) {
                              stockColor = 'bg-rose-50 border-rose-200 text-rose-700 font-black';
                              stockLabel = 'Habis';
                            } else if (stockCount <= 5) {
                              stockColor = 'bg-amber-50 border-amber-200 text-amber-700 font-bold';
                              stockLabel = 'Menipis';
                            }

                            return (
                              <tr key={a.id} className="hover:bg-slate-50/50 transition">
                                <td className="p-3 font-extrabold text-slate-800">{a.name}</td>
                                <td className="p-3">
                                  <span className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded-lg text-[10px] ${stockColor}`}>
                                    <span className="font-extrabold font-mono">{stockCount}</span>
                                    <span className="text-[8.5px] uppercase tracking-wide opacity-80">({stockLabel})</span>
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className="font-mono text-amber-700 font-bold block">{formatRupiah(a.hpp || 0)}</span>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block -mt-0.5">Moving Avg</span>
                                </td>
                                <td className="p-3 font-mono text-indigo-700 font-bold">{formatRupiah(a.price)}</td>
                                <td className="p-3 text-right">
                                  <div className="flex justify-end gap-1.5">
                                    {/* <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedAddonForPurchase(a);
                                        setPurchasePrice(a.hpp || a.price);
                                        setPurchaseQty(10);
                                        setPurchaseNotes('');
                                      }}
                                      title="Beli Stok (Restock)"
                                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-1.5 rounded-lg border border-emerald-250 transition cursor-pointer"
                                    >
                                      📦 Beli Stok
                                    </button> */}
                                    <button
                                      onClick={() => startEditMaster('ADDONS', a.id, a.name, a.price, '', a.hpp || 0)}
                                      className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg border border-indigo-100 transition cursor-pointer"
                                    >
                                      <Edit size={13} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteAddon(a.id)}
                                      className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg border border-red-100 cursor-pointer"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TRANSAKSI SUBTAB */}
                {activeAddonSubTab === 'TRANSAKSI' && (
                  <div className="space-y-4">
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[9px] border-b border-slate-200">
                          <tr>
                            <th className="p-3">Tanggal & Waktu</th>
                            <th className="p-3">Nama Barang</th>
                            <th className="p-3">Tipe</th>
                            <th className="p-3 text-center">Jumlah</th>
                            <th className="p-3 text-right">Harga Unit</th>
                            <th className="p-3">Catatan / Order ID</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {addonTransactions.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-400 font-bold uppercase tracking-wider">Tidak ada riwayat transaksi ditemukan.</td>
                            </tr>
                          ) : (
                            addonTransactions.map(tx => (
                              <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                                <td className="p-3 text-slate-500 font-mono">{new Date(tx.createdAt).toLocaleString('id-ID')}</td>
                                <td className="p-3 font-extrabold text-slate-800">{tx.addonName}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider border ${tx.type === 'masuk'
                                    ? 'bg-emerald-50 border-emerald-250 text-emerald-700'
                                    : 'bg-rose-50 border-rose-250 text-rose-700'
                                    }`}>
                                    {tx.type === 'masuk' ? 'Masuk (Beli)' : 'Keluar (Pakai)'}
                                  </span>
                                </td>
                                <td className="p-3 text-center font-black text-slate-850">
                                  <span className="font-mono">{tx.qty}x</span>
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-slate-700">{formatRupiah(tx.price)}</td>
                                <td className="p-3 text-slate-600 font-semibold leading-relaxed">
                                  {tx.notes || '-'}
                                  {tx.orderId && (
                                    <span className="block text-[8.5px] text-indigo-600 font-mono mt-0.5">Order ID: {tx.orderId}</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
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
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
              {allUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                <div key={u.id} className="p-4 hover:bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-left">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs uppercase">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-xs text-slate-800">{u.name}</h4>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${u.role === Role.ADMIN ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            u.role === Role.OWNER ? 'bg-indigo-50 text-indigo-750 border-indigo-200' :
                              u.role === Role.STAFF ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                            {u.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">{u.email}</p>
                      </div>
                    </div>
                  </div>
                  {u.role !== Role.OWNER && u.role !== Role.ADMIN && (
                    <button
                      type="button"
                      onClick={() => startEditUser(u)}
                      className="bg-indigo-50 border border-indigo-150 text-indigo-700 hover:bg-indigo-100 text-[10.5px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1 uppercase transition cursor-pointer"
                    >
                      <Edit size={12} /> Edit
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB KINERJA STAFF ===================== */}
        {activeTab === 'STAFF_PERFORMANCE' && (
          <div className="p-4 space-y-4 max-w-4xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-slate-800 uppercase tracking-wide flex items-center gap-2"><BarChart2 size={18} className="text-indigo-600" /> Laporan Kinerja Staff</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-1">Pantau jumlah pesanan selesai, rating rata-rata, dan pemakaian sparepart / addons</p>
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3 shrink-0">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Rentang Tanggal:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={performanceDate}
                    onChange={(e) => setPerformanceDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                  />
                  <span className="text-[10px] font-bold text-slate-400">S/D</span>
                  <input
                    type="date"
                    value={performanceEndDate}
                    onChange={(e) => setPerformanceEndDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {users.filter(u => u.role === Role.STAFF).map(staff => {
                // Filter orders for this staff
                const staffOrders = orders.filter(o => {
                  if (o.assignedTo !== staff.id || o.status !== OrderStatus.SELESAI) return false;
                  const orderDateStr = o.completedAt || o.scheduledDate || o.createdAt;
                  const orderDate = new Date(orderDateStr).toISOString().split('T')[0];
                  return orderDate >= performanceDate && orderDate <= performanceEndDate;
                });

                const completedCount = staffOrders.length;
                const ratings = staffOrders.filter(o => typeof o.rating === 'number' && o.rating > 0).map(o => o.rating as number);
                const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '-';

                // Aggregate addons used by this staff on this date
                const addonsUsed = new Map<string, { name: string, qty: number, totalPrice: number }>();
                staffOrders.forEach(order => {
                  if (order.addonsUsed && Array.isArray(order.addonsUsed)) {
                    order.addonsUsed.forEach(addon => {
                      const existing = addonsUsed.get(addon.id || addon.name) || { name: addon.name, qty: 0, totalPrice: 0 };
                      existing.qty += addon.quantity;
                      existing.totalPrice += addon.price * addon.quantity;
                      addonsUsed.set(addon.id || addon.name, existing);
                    });
                  }
                });

                const addonsList = Array.from(addonsUsed.values());
                const isExpanded = expandedPerformanceStaffId === staff.id;

                return (
                  <div key={staff.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
                    <div
                      className="p-5 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/70"
                      onClick={() => setExpandedPerformanceStaffId(isExpanded ? null : staff.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xl shadow-inner overflow-hidden border-2 border-indigo-50 shrink-0">
                          {(staff.photoUrl || staff.photo) ? (
                            <img src={staff.photoUrl || staff.photo} alt={staff.name} className="w-full h-full object-cover" />
                          ) : (
                            staff.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800 text-sm">{staff.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase border border-slate-200 bg-white px-2 py-0.5 rounded-full">{staff.phone || 'No HP Belum Diset'}</span>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">STAFF TEKNISI</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center bg-white border border-slate-200 rounded-xl px-5 py-2.5 shadow-sm hidden md:block">
                          <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pesanan Selesai</span>
                          <span className="font-black text-2xl text-indigo-600">{completedCount}</span>
                        </div>
                        <div className="text-center bg-white border border-slate-200 rounded-xl px-5 py-2.5 shadow-sm min-w-[120px] hidden md:block">
                          <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Rating Rata-rata</span>
                          <span className="font-black text-2xl text-amber-500 flex items-center justify-center gap-1.5">
                            {avgRating !== '-' && <Star size={18} className="fill-amber-500 text-amber-500" />}
                            {avgRating}
                          </span>
                        </div>

                        {/* Mobile view metrics */}
                        <div className="md:hidden flex flex-col gap-1 items-end">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">Selesai: <span className="text-indigo-600 font-black">{completedCount}</span></div>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">Rating: <span className="text-amber-500 font-black">{avgRating}</span></div>
                        </div>

                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 md:ml-2">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                    </div>
                    {isExpanded && addonsList.length > 0 && (
                      <div className="p-5 bg-white animate-in slide-in-from-top-2">
                        <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Rincian Penggunaan Add-ons / Sparepart</h5>
                        <div className="border border-slate-100 rounded-xl overflow-hidden">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[9px] border-b border-slate-100">
                              <tr>
                                <th className="p-3">Nama Barang</th>
                                <th className="p-3 text-center">Jumlah Dipakai</th>
                                <th className="p-3 text-right">Total Penjualan Barang</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {addonsList.map((addon, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition">
                                  <td className="p-3 font-bold text-slate-800">{addon.name}</td>
                                  <td className="p-3 text-center font-black text-indigo-600">
                                    <span className="bg-indigo-50 px-2 py-0.5 rounded-lg">{addon.qty}x</span>
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold text-emerald-600">{formatRupiah(addon.totalPrice)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {isExpanded && addonsList.length === 0 && (
                      <div className="p-5 bg-white text-center border-t border-slate-50 animate-in slide-in-from-top-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tidak ada add-ons atau sparepart yang dicatat.</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {users.filter(u => u.role === Role.STAFF).length === 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 shadow-sm flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                    <UserIcon size={28} className="text-slate-300" />
                  </div>
                  <h4 className="font-black text-slate-700 uppercase mb-1">Belum ada staff/teknisi</h4>
                  <p className="font-medium text-[11px] max-w-sm">Anda belum menambahkan akun dengan peran STAFF. Buka tab Edit Pengguna untuk mendaftarkan teknisi baru.</p>
                </div>
              )}
            </div>
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
                      {categories.map(cat => (
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
        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl text-left">
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
                <div>🛠️ Jasa: {selectedOrderForAssign.acDetail.quantity} Unit</div>
                <div>👤 Pelanggan: {selectedOrderForAssign.customerName}</div>
                <div>📍 Alamat: {selectedOrderForAssign.address}</div>
              </div>

              <div>
                <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Pilih Teknisi</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 font-extrabold"
                  disabled={isLoading}
                >
                  <option value="">-- Pilih Staff --</option>
                  {sortedStaffList.map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} (⭐ {staff.avgRating.toFixed(1)} | 🛠️ {staff.jobsDone} Selesai)
                    </option>
                  ))}
                </select>
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
                  <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 font-extrabold text-slate-800 text-[11px]">
                    <span>{selectedOrderDetail.acDetail?.category} - {selectedOrderDetail.acDetail?.serviceType === 'none' ? 'Umum' : selectedOrderDetail.acDetail?.serviceType}</span>
                    <span className="text-indigo-700 font-mono">{selectedOrderDetail.acDetail?.quantity} Unit</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[9.5px]">Tipe/Model AC Pelanggan:</span>
                    <span className="font-extrabold text-slate-700 uppercase">{selectedOrderDetail.acDetail?.acType || 'Tidak Diisi'}</span>
                  </div>
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
                      <div className="w-9 h-9 bg-indigo-50 border border-indigo-200 text-indigo-700 font-black flex items-center justify-center rounded-lg uppercase overflow-hidden">
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
                      <span>Harga Layanan Dasar ({selectedOrderDetail.acDetail?.quantity} Unit):</span>
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
                    <div className="flex justify-between font-black text-slate-800 border-t pt-2 mt-1">
                      <span className="text-[11px] uppercase tracking-wider">Grand Total Pembayaran:</span>
                      <span className="text-indigo-700 font-mono text-xs">{formatRupiah(selectedOrderDetail.finalPrice || (Number(selectedOrderDetail.serviceCost || 0) + Number(selectedOrderDetail.addonsCost || 0)))}</span>
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
    </div>
  );
}
