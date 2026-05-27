'use client';

import React, { useState, useEffect } from 'react';
import { User, Order, OrderStatus, Role, ACModel, ACCategory, ACService, ACAddon } from '@/types';
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
  Image,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  CornerDownRight,
  Loader,
  Star
} from 'lucide-react';
import { useApp } from '@/lib/auth-context';

type TabType = 'JOBS_TRACKER' | 'MASTER_DATA' | 'USER_MANAGEMENT';

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
    showAlert
  } = useApp();
  const alert = showAlert;

  // Extract staff members from users
  const staffList = users.filter(u => u.role === Role.STAFF);
  const allUsers = users;
  // Loading state for async operations
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<TabType>('JOBS_TRACKER');

  // Job status filter
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');

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

  // Editing User state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<Role>(Role.USER);
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  // Master Data Editing State
  const [activeMasterSubTab, setActiveMasterSubTab] = useState<'MODELS' | 'CATEGORIES' | 'SERVICES' | 'ADDONS'>('MODELS');

  // Form add-new states for master data
  const [newModelName, setNewModelName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryHasServices, setNewCategoryHasServices] = useState(true);

  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(0);
  const [newServiceCategory, setNewServiceCategory] = useState('');

  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState(0);

  // Edit inline states for master data
  const [editingMasterId, setEditingMasterId] = useState<string | null>(null);
  const [editMasterField1, setEditMasterField1] = useState('');
  const [editMasterField2, setEditMasterField2] = useState<number | boolean>(0);
  const [editMasterField3, setEditMasterField3] = useState('');

  // Helper formats
  const formatRupiah = (num: any) => {
    if (!num && num !== 0 && num !== '0') return 'Rp0';
    return 'Rp' + Number(num || 0).toLocaleString('id-ID');
  };

  // Filter orders according to selection
  const filteredOrders = orders.filter(o => {
    if (statusFilter === 'ALL') return true;
    return o.status === statusFilter;
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

      const updatePayload: Partial<Order> = {
        assignedTo: selectedStaffId,
        assignedEmployeeName: selectedStaff.name,
        status: OrderStatus.DITUGASKAN,
        scheduledDate: tempScheduledDate,
        scheduledTime: tempScheduledTime,
      };

      await api.updateOrder(orderId, updatePayload);

      // Update local state
      const updatedOrder = orders.find(o => o.id === orderId);
      if (updatedOrder) {
        Object.assign(updatedOrder, updatePayload);
        setOrders([...orders]);
      }

      setErrorMsg('');
      setSelectedStaffId('');
      setSelectedOrderForAssign(null);
      alert('✅ Teknisi berhasil ditugaskan ke order ini');
    } catch (error) {
      console.error('Error assigning staff:', error);
      setErrorMsg('Gagal menugaskan teknisi. Silakan coba lagi.');
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
    if (window.confirm('Hapus model AC ini? (Tidak dapat dibatalkan)')) {
      try {
        setIsLoading(true);
        await api.deleteModel(id);
        setModels(models.filter(m => m.id !== id));
        setErrorMsg('');
        alert('✅ Model AC berhasil dihapus');
      } catch (error) {
        console.error('Error deleting model:', error);
        setErrorMsg('Gagal menghapus model');
      } finally {
        setIsLoading(false);
      }
    }
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
    if (window.confirm('Hapus kategori ini? (Tidak dapat dibatalkan)')) {
      try {
        setIsLoading(true);
        await api.deleteCategory(id);
        setCategories(categories.filter(c => c.id !== id));
        setErrorMsg('');
        alert('✅ Kategori AC berhasil dihapus');
      } catch (error) {
        console.error('Error deleting category:', error);
        setErrorMsg('Gagal menghapus kategori');
      } finally {
        setIsLoading(false);
      }
    }
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
    if (window.confirm('Hapus jenis pelayanan ini? (Tidak dapat dibatalkan)')) {
      try {
        setIsLoading(true);
        await api.deleteService(id);
        setServices(services.filter(s => s.id !== id));
        setErrorMsg('');
        alert('✅ Jenis pelayanan berhasil dihapus');
      } catch (error) {
        console.error('Error deleting service:', error);
        setErrorMsg('Gagal menghapus layanan');
      } finally {
        setIsLoading(false);
      }
    }
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
        price: newAddonPrice
      });
      setAddons([...addons, newAddon]);
      setNewAddonName('');
      setNewAddonPrice(0);
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
    if (window.confirm('Hapus item persediaan/sparepart ini? (Tidak dapat dibatalkan)')) {
      try {
        setIsLoading(true);
        await api.deleteAddon(id);
        setAddons(addons.filter(a => a.id !== id));
        setErrorMsg('');
        alert('✅ Item persediaan berhasil dihapus');
      } catch (error) {
        console.error('Error deleting addon:', error);
        setErrorMsg('Gagal menghapus addon');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSaveMasterEdit = async (id: string) => {
    try {
      setIsLoading(true);

      // Determine what type of master data we're editing
      if (activeMasterSubTab === 'MODELS') {
        await api.updateModel(id, { name: editMasterField1 });
        const updated = models.map(m => m.id === id ? { ...m, name: editMasterField1 } : m);
        setModels(updated);
      } else if (activeMasterSubTab === 'CATEGORIES') {
        await api.updateCategory(id, { name: editMasterField1, hasServices: editMasterField2 });
        const updated = categories.map(c => c.id === id ? { ...c, name: editMasterField1, hasServices: editMasterField2 as boolean } : c);
        setCategories(updated);
      } else if (activeMasterSubTab === 'SERVICES') {
        await api.updateService(id, { name: editMasterField1, price: editMasterField2, categoryId: editMasterField3 });
        const updated = services.map(s => s.id === id ? { ...s, name: editMasterField1, price: editMasterField2 as number, categoryId: editMasterField3 } : s);
        setServices(updated);
      } else if (activeMasterSubTab === 'ADDONS') {
        await api.updateAddon(id, { name: editMasterField1, price: editMasterField2 });
        const updated = addons.map(a => a.id === id ? { ...a, name: editMasterField1, price: editMasterField2 as number } : a);
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

  const startEditMaster = (id: string, f1: string, f2: number | boolean, f3 = '') => {
    setEditingMasterId(id);
    setEditMasterField1(f1);
    setEditMasterField2(f2);
    setEditMasterField3(f3);
  };

  if (!activeUser) return null;

  return (
    <div className="flex-1 flex flex-col bg-slate-100 text-slate-800 text-left min-h-0 h-full overflow-hidden">

      {/* ===================== CONTROL HEADER ===================== */}
      <div className="bg-slate-900 px-5 py-4 shrink-0 shadow-md text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <span className="text-[8px] bg-indigo-600 text-white font-black px-2 py-0.5 rounded uppercase tracking-wider">
            Portal Administrator
          </span>
          <h2 className="text-base font-black mt-1 leading-none text-white">Dashboard Manajemen & Operasional</h2>
          <p className="text-[10px] text-slate-400 mt-1">Operator aktif: <strong className="text-white">{activeUser.name}</strong> ({activeUser.email})</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-black uppercase tracking-wider rounded-lg transition shrink-0 cursor-pointer"
        >
          Keluar Sesi
        </button>
      </div>

      {/* ===================== CONTROL TABS SYSTEM ===================== */}
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
            <span>Pantauan Jasa ({orders.length})</span>
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
      </div>

      {/* ===================== TAB BODY (SCROLLABLE Area) ===================== */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0 space-y-4">

        {/* ===================== TAB 1: OPERATIONAL JOBS TRACKER ===================== */}
        {activeTab === 'JOBS_TRACKER' && (
          <div className="space-y-4">

            {/* Horizontal state filter */}
            <div className="flex overflow-x-auto flex-nowrap gap-1 bg-white p-1.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 text-[10.5px] font-black rounded-lg transition uppercase whitespace-nowrap shrink-0 ${statusFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                  }`}
              >
                Semua ({orders.length})
              </button>
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
                      <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl text-[10.5px]">
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
                    ) : (
                    <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-amber-800">⚠️ Belum dialokasi teknisi</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrderForAssign(order);
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-white text-[9.5px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider transition cursor-pointer"
                      >
                        Tugaskan Staff
                      </button>
                    </div>
                    )}

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
                            💵 TUNAI / MANUAL (BAWAAN)
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
                      <span className="text-xs font-mono text-indigo-700">{formatRupiah(order.totalCost || order.serviceCost)}</span>
                    </div>
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
                {['MODELS', 'CATEGORIES', 'SERVICES', 'ADDONS'].map((sub) => (
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
                        <th className="p-3">ID</th>
                        <th className="p-3">Nama Model</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {models.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-slate-400">{m.id}</td>
                          <td className="p-3 font-bold text-slate-800">{m.name}</td>
                          <td className="p-3 text-right flex justify-end gap-1.5">
                            <button onClick={() => startEditMaster(m.id, m.name, 0)} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg border border-indigo-100 transition"><Edit size={13} /></button>
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
                        <th className="p-3">ID</th>
                        <th className="p-3">Kategori AC</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {categories.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-slate-400">{c.id}</td>
                          <td className="p-3 font-extrabold text-slate-800">{c.name}</td>
                          <td className="p-3 text-right flex justify-end gap-1.5">
                            <button onClick={() => startEditMaster(c.id, c.name, c.hasServices)} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg border border-indigo-100 transition"><Edit size={13} /></button>
                            <button onClick={() => handleDeleteCategory(c.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg border border-red-100 transition"><Trash2 size={13} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SERVICES */}
            {activeMasterSubTab === 'SERVICES' && (
              <div className="space-y-4">
                <form onSubmit={handleAddService} className="bg-slate-50 border p-4 rounded-xl space-y-3">
                  <span className="text-[9px] font-black uppercase text-indigo-600 block tracking-widest">TAMBAH JENIS PELAYANAN</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Nama layanan..."
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none focus:border-indigo-500 font-bold"
                      required
                    />
                    <input
                      type="number"
                      value={newServicePrice || ''}
                      onChange={(e) => setNewServicePrice(parseInt(e.target.value) || 0)}
                      className="bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none focus:border-indigo-500 font-mono font-extrabold"
                      placeholder="Harga (Rp)"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black py-2.5 rounded-xl uppercase flex items-center justify-center gap-1 transition"
                  >
                    <Plus size={14} /> Daftarkan Tarif
                  </button>
                </form>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[9px] border-b border-slate-200">
                      <tr>
                        <th className="p-3">Nama Layanan</th>
                        <th className="p-3">Kategori</th>
                        <th className="p-3">Harga</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {services.map(s => {
                        const cat = categories.find(c => c.id === s.categoryId);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-extrabold text-slate-800">{s.name}</td>
                            <td className="p-3 text-slate-500">{cat ? cat.name : 'Unknown'}</td>
                            <td className="p-3 font-mono text-indigo-700 font-bold">{formatRupiah(s.price)}</td>
                            <td className="p-3 text-right flex justify-end gap-1.5">
                              <button onClick={() => startEditMaster(s.id, s.name, s.price, s.categoryId)} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg border border-indigo-100 transition"><Edit size={13} /></button>
                              <button onClick={() => handleDeleteService(s.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg border border-red-100"><Trash2 size={13} /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ADDONS */}
            {activeMasterSubTab === 'ADDONS' && (
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
                    value={newAddonPrice || ''}
                    onChange={(e) => setNewAddonPrice(parseInt(e.target.value) || 0)}
                    className="bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none focus:border-indigo-500 font-mono font-bold"
                    placeholder="Harga Satuan"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-4 py-2 rounded-xl uppercase flex items-center gap-1 transition cursor-pointer self-end"
                  >
                    <Plus size={15} /> Tambah
                  </button>
                </form>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[9px] border-b border-slate-200">
                      <tr>
                        <th className="p-3">Nama Suku Cadang</th>
                        <th className="p-3 font-mono">ID</th>
                        <th className="p-3">Harga Satuan</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {addons.map(a => (
                        <tr key={a.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-extrabold text-slate-800">{a.name}</td>
                          <td className="p-3 font-mono text-slate-400 font-bold">{a.id}</td>
                          <td className="p-3 font-mono text-indigo-700 font-bold">{formatRupiah(a.price)}</td>
                          <td className="p-3 text-right flex justify-end gap-1.5">
                            <button onClick={() => startEditMaster(a.id, a.name, a.price)} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg border border-indigo-100 transition"><Edit size={13} /></button>
                            <button onClick={() => handleDeleteAddon(a.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg border border-red-100"><Trash2 size={13} /></button>
                          </td>
                        </tr>
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
                  <button
                    type="button"
                    onClick={() => startEditUser(u)}
                    className="bg-indigo-50 border border-indigo-150 text-indigo-700 hover:bg-indigo-100 text-[10.5px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1 uppercase transition cursor-pointer"
                  >
                    <Edit size={12} /> Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===================== EDIT MASTER DATA MODAL ===================== */}
      {editingMasterId && (
        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl text-left">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <div>
                <h4 className="font-black text-xs uppercase tracking-wide">Edit {activeMasterSubTab}</h4>
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
                  {activeMasterSubTab === 'MODELS' && 'Nama Model'}
                  {activeMasterSubTab === 'CATEGORIES' && 'Nama Kategori'}
                  {activeMasterSubTab === 'SERVICES' && 'Nama Layanan'}
                  {activeMasterSubTab === 'ADDONS' && 'Nama Item'}
                </label>
                <input
                  type="text"
                  value={editMasterField1}
                  onChange={(e) => setEditMasterField1(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500"
                  disabled={isLoading}
                />
              </div>

              {activeMasterSubTab === 'CATEGORIES' && (
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

              {activeMasterSubTab === 'SERVICES' && (
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

              {activeMasterSubTab === 'ADDONS' && (
                <div>
                  <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Harga Satuan</label>
                  <input
                    type="number"
                    value={typeof editMasterField2 === 'number' ? editMasterField2 : ''}
                    onChange={(e) => setEditMasterField2(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500"
                    disabled={isLoading}
                  />
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
                  {staffList.map(staff => (
                    <option key={staff.id} value={staff.id}>{staff.name} ({staff.email})</option>
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
                  <option value={Role.OWNER}>Owner</option>
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
                          💵 TUNAI / MANUAL (BAWAAN)
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
                      <span className="text-indigo-700 font-mono text-xs">{formatRupiah(selectedOrderDetail.totalCost || selectedOrderDetail.serviceCost)}</span>
                    </div>
                  </div>
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
    </div>
  );
}
