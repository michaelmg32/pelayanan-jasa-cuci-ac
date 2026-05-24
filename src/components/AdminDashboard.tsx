/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Order, OrderStatus, Role, ACModel, ACCategory, ACService, ACAddon } from '../types';
import * as api from '../services/api';
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
  CornerDownRight
} from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  orders: Order[];
  staffList: User[];
  allUsers: User[];
  models: ACModel[];
  categories: ACCategory[];
  services: ACService[];
  addons: ACAddon[];
  onLogout: () => void;
  onAssignStaffToOrder: (orderId: string, staffId: string, staffName: string, extraPayload?: Partial<Order>) => void;
  onUpdateUserData: (userId: string, data: Partial<User>) => void;
  onUpdateModels: (updated: ACModel[]) => void;
  onUpdateCategories: (updated: ACCategory[]) => void;
  onUpdateServices: (updated: ACService[]) => void;
  onUpdateAddons: (updated: ACAddon[]) => void;
  onUpdateOrderStatus?: (orderId: string, status: OrderStatus, payload?: Partial<Order>) => void;
}

type TabType = 'JOBS_TRACKER' | 'MASTER_DATA' | 'USER_MANAGEMENT';

export default function AdminDashboard({
  user,
  orders,
  staffList,
  allUsers,
  models,
  categories,
  services,
  addons,
  onLogout,
  onAssignStaffToOrder,
  onUpdateUserData,
  onUpdateModels,
  onUpdateCategories,
  onUpdateServices,
  onUpdateAddons,
  onUpdateOrderStatus
}: AdminDashboardProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<TabType>('JOBS_TRACKER');
  
  // Job status filter
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  
  // Selected order for staff allocation
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState<Order | null>(null);
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
  const [masterSearch, setMasterSearch] = useState('');

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
  const formatRupiah = (num: number | undefined | null) => {
    if (!num && num !== 0) return 'Rp0';
    return 'Rp' + num.toLocaleString('id-ID');
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

  // Sort staff members by average rating (descending), putting highest first. Those without reviews come last.
  const sortedStaffList = [...staffList].sort((a, b) => {
    const statsA = getStaffStats(a.id);
    const statsB = getStaffStats(b.id);
    
    // Sort by rating descending
    if (statsB.avgRating !== statsA.avgRating) {
      return statsB.avgRating - statsA.avgRating;
    }
    // Then by number of reviews descending
    if (statsB.count !== statsA.count) {
      return statsB.count - statsA.count;
    }
    // Then alphabetically by name
    return a.name.localeCompare(b.name);
  });

  // Trigger allocation
  const handleAssignSubmit = (orderId: string) => {
    if (!selectedStaffId) {
      alert('Pilih salah satu teknisi terlebih dahulu.');
      return;
    }
    const staff = staffList.find(s => s.id === selectedStaffId);
    if (staff && selectedOrderForAssign) {
      const isScheduleChanged = 
        (tempScheduledDate && tempScheduledDate !== selectedOrderForAssign.scheduledDate) || 
        (tempScheduledTime && tempScheduledTime !== selectedOrderForAssign.scheduledTime);

      const extraPayload: Partial<Order> = isScheduleChanged ? {
        rescheduleDate: tempScheduledDate || selectedOrderForAssign.scheduledDate,
        rescheduleTime: tempScheduledTime || selectedOrderForAssign.scheduledTime,
        rescheduleStatus: 'PENDING'
      } : {
        scheduledDate: selectedOrderForAssign.scheduledDate,
        scheduledTime: selectedOrderForAssign.scheduledTime,
        rescheduleStatus: undefined,
        rescheduleDate: undefined,
        rescheduleTime: undefined
      };

      onAssignStaffToOrder(orderId, staff.id, staff.name, extraPayload);

      if (isScheduleChanged) {
        alert(`Teknisi berhasil dipilih! Namun karena ada perubahan jadwal, pengajuan jadwal baru (${tempScheduledDate || selectedOrderForAssign.scheduledDate} pukul ${tempScheduledTime || selectedOrderForAssign.scheduledTime}) akan dikirim terlebih dahulu untuk disetujui oleh pelanggan.`);
      } else {
        alert('Tugas didelegasikan dan jadwal kerja telah terkonfirmasi!');
      }

      setSelectedStaffId('');
      setSelectedOrderForAssign(null);
    }
  };

  // User Actions
  const handleSaveUserEdit = (userId: string) => {
    onUpdateUserData(userId, {
      role: editRole,
      phone: editPhone.trim(),
      address: editAddress.trim()
    });
    setEditingUserId(null);
  };

  const startEditUser = (target: User) => {
    setEditingUserId(target.id);
    setEditRole(target.role);
    setEditPhone(target.phone || '');
    setEditAddress(target.address || '');
  };

  // MASTER DATA MODIFIERS
  // 1. MODELS
  const handleAddModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim()) return;
    const newM: ACModel = { id: `mod_${Date.now()}`, name: newModelName.trim() };
    
    // Save to database via API
    api.createModel({
      id: newM.id,
      name: newM.name,
      manufacturer: ''
    }).then(created => {
      console.log('✅ Model created:', created);
      onUpdateModels([...models, newM]);
      setNewModelName('');
    }).catch(error => {
      console.error('❌ Failed to create model:', error);
      // Still update local state if API fails
      onUpdateModels([...models, newM]);
      setNewModelName('');
    });
  };

  const handleDeleteModel = (id: string) => {
    if (window.confirm('Hapus model AC ini?')) {
      // Delete from database via API
      api.deleteModel(id).then(deleted => {
        console.log('✅ Model deleted:', deleted);
        onUpdateModels(models.filter(m => m.id !== id));
      }).catch(error => {
        console.error('❌ Failed to delete model:', error);
        // Still update local state if API fails
        onUpdateModels(models.filter(m => m.id !== id));
      });
    }
  };

  // 2. CATEGORIES
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const newC: ACCategory = { 
      id: `cat_${Date.now()}`, 
      name: newCategoryName.trim(), 
      hasServices: newCategoryHasServices 
    };
    
    // Save to database via API
    api.createCategory({
      id: newC.id,
      name: newC.name,
      description: ''
    }).then(created => {
      console.log('✅ Category created:', created);
      onUpdateCategories([...categories, newC]);
      setNewCategoryName('');
    }).catch(error => {
      console.error('❌ Failed to create category:', error);
      // Still update local state if API fails
      onUpdateCategories([...categories, newC]);
      setNewCategoryName('');
    });
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm('Hapus kategori ini? Menghapus kategori juga dapat berdampak pada service terkait.')) {
      // Delete from database via API
      api.deleteCategory(id).then(deleted => {
        console.log('✅ Category deleted:', deleted);
        onUpdateCategories(categories.filter(c => c.id !== id));
      }).catch(error => {
        console.error('❌ Failed to delete category:', error);
        // Still update local state if API fails
        onUpdateCategories(categories.filter(c => c.id !== id));
      });
    }
  };

  // 3. SERVICES
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;
    const catId = newServiceCategory || (categories[0]?.id || '');
    const newS: ACService = {
      id: `srv_${Date.now()}`,
      categoryId: catId,
      name: newServiceName.trim(),
      price: newServicePrice
    };
    
    // Save to database via API
    api.createService({
      id: newS.id,
      name: newS.name,
      description: '',
      basePrice: newServicePrice,
      price: newServicePrice,
      duration: 60
    }).then(created => {
      console.log('✅ Service created:', created);
      onUpdateServices([...services, newS]);
      setNewServiceName('');
      setNewServicePrice(0);
    }).catch(error => {
      console.error('❌ Failed to create service:', error);
      // Still update local state if API fails
      onUpdateServices([...services, newS]);
      setNewServiceName('');
      setNewServicePrice(0);
    });
  };

  const handleDeleteService = (id: string) => {
    if (window.confirm('Hapus jenis pelayanan ini?')) {
      // Delete from database via API
      api.deleteService(id).then(deleted => {
        console.log('✅ Service deleted:', deleted);
        onUpdateServices(services.filter(s => s.id !== id));
      }).catch(error => {
        console.error('❌ Failed to delete service:', error);
        // Still update local state if API fails
        onUpdateServices(services.filter(s => s.id !== id));
      });
    }
  };

  // 4. ADDONS / SPAREPARTS
  const handleAddAddon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddonName.trim()) return;
    const newA: ACAddon = {
      id: `add_${Date.now()}`,
      name: newAddonName.trim(),
      price: newAddonPrice
    };
    
    // Save to database via API
    api.createAddon({
      id: newA.id,
      name: newA.name,
      description: '',
      price: newAddonPrice
    }).then(created => {
      console.log('✅ Addon created:', created);
      onUpdateAddons([...addons, newA]);
      setNewAddonName('');
      setNewAddonPrice(0);
    }).catch(error => {
      console.error('❌ Failed to create addon:', error);
      // Still update local state if API fails
      onUpdateAddons([...addons, newA]);
      setNewAddonName('');
      setNewAddonPrice(0);
    });
  };

  const handleDeleteAddon = (id: string) => {
    if (window.confirm('Hapus item persediaan/sparepart ini?')) {
      // Delete from database via API
      api.deleteAddon(id).then(deleted => {
        console.log('✅ Addon deleted:', deleted);
        onUpdateAddons(addons.filter(a => a.id !== id));
      }).catch(error => {
        console.error('❌ Failed to delete addon:', error);
        // Still update local state if API fails
        onUpdateAddons(addons.filter(a => a.id !== id));
      });
    }
  };

  // Inline Master Save
  const handleSaveMasterEdit = (id: string) => {
    if (activeMasterSubTab === 'MODELS') {
      // Save to database via API
      api.updateModel(id, {
        name: editMasterField1,
        manufacturer: ''
      }).then(updated => {
        console.log('✅ Model updated:', updated);
        onUpdateModels(models.map(m => m.id === id ? { ...m, name: editMasterField1 } : m));
        setEditingMasterId(null);
      }).catch(error => {
        console.error('❌ Failed to update model:', error);
        // Still update local state if API fails
        onUpdateModels(models.map(m => m.id === id ? { ...m, name: editMasterField1 } : m));
        setEditingMasterId(null);
      });
    } else if (activeMasterSubTab === 'CATEGORIES') {
      // Save to database via API
      api.updateCategory(id, {
        name: editMasterField1,
        description: ''
      }).then(updated => {
        console.log('✅ Category updated:', updated);
        onUpdateCategories(categories.map(c => c.id === id ? { ...c, name: editMasterField1, hasServices: editMasterField2 as boolean } : c));
        setEditingMasterId(null);
      }).catch(error => {
        console.error('❌ Failed to update category:', error);
        onUpdateCategories(categories.map(c => c.id === id ? { ...c, name: editMasterField1, hasServices: editMasterField2 as boolean } : c));
        setEditingMasterId(null);
      });
    } else if (activeMasterSubTab === 'SERVICES') {
      // Save to database via API
      api.updateService(id, {
        name: editMasterField1,
        description: '',
        basePrice: editMasterField2 as number,
        price: editMasterField2 as number,
        duration: 60
      }).then(updated => {
        console.log('✅ Service updated:', updated);
        onUpdateServices(services.map(s => s.id === id ? { ...s, name: editMasterField1, price: editMasterField2 as number, categoryId: editMasterField3 } : s));
        setEditingMasterId(null);
      }).catch(error => {
        console.error('❌ Failed to update service:', error);
        onUpdateServices(services.map(s => s.id === id ? { ...s, name: editMasterField1, price: editMasterField2 as number, categoryId: editMasterField3 } : s));
        setEditingMasterId(null);
      });
    } else if (activeMasterSubTab === 'ADDONS') {
      // Save to database via API
      api.updateAddon(id, {
        name: editMasterField1,
        description: '',
        price: editMasterField2 as number
      }).then(updated => {
        console.log('✅ Addon updated:', updated);
        onUpdateAddons(addons.map(a => a.id === id ? { ...a, name: editMasterField1, price: editMasterField2 as number } : a));
        setEditingMasterId(null);
      }).catch(error => {
        console.error('❌ Failed to update addon:', error);
        onUpdateAddons(addons.map(a => a.id === id ? { ...a, name: editMasterField1, price: editMasterField2 as number } : a));
        setEditingMasterId(null);
      });
    }
  };

  const startEditMaster = (id: string, f1: string, f2: number | boolean, f3 = '') => {
    setEditingMasterId(id);
    setEditMasterField1(f1);
    setEditMasterField2(f2);
    setEditMasterField3(f3);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-100 text-slate-800 text-left min-h-0 h-full">
      
      {/* ===================== NEW CONTROLHEADER ===================== */}
      <div className="bg-slate-900 px-5 py-4 shrink-0 shadow-md text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <span className="text-[8px] bg-indigo-600 text-white font-black px-2 py-0.5 rounded uppercase tracking-wider">
            Portal Administrator
          </span>
          <h2 className="text-base font-black mt-1 leading-none text-white">Dashboard Manajemen & Operasional</h2>
          <p className="text-[10px] text-slate-400 mt-1">Operator aktif: <strong className="text-white">{user.name}</strong> ({user.email})</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-black uppercase tracking-wider rounded-lg transition shrink-0 cursor-pointer"
        >
          Keluar Sesi
        </button>
      </div>

      {/* ===================== CONTROL TABS SYSTEM ===================== */}
      <div className="bg-white border-b border-slate-200 px-4 py-1.5 shrink-0 flex gap-2 overflow-x-auto flex-nowrap">
        <button
          onClick={() => setActiveTab('JOBS_TRACKER')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase rounded-lg transition leading-none whitespace-nowrap shrink-0 ${
            activeTab === 'JOBS_TRACKER' 
              ? 'bg-slate-900 text-white' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <ClipboardList size={13} />
          Pantauan Jasa ({orders.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('MASTER_DATA');
            if (categories.length > 0) setNewServiceCategory(categories[0].id);
          }}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase rounded-lg transition leading-none whitespace-nowrap shrink-0 ${
            activeTab === 'MASTER_DATA' 
              ? 'bg-slate-900 text-white' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <Wrench size={13} />
          Edit Master Data
        </button>

        <button
          onClick={() => setActiveTab('USER_MANAGEMENT')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase rounded-lg transition leading-none whitespace-nowrap shrink-0 ${
            activeTab === 'USER_MANAGEMENT' 
              ? 'bg-slate-900 text-white' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <UserCog size={13} />
          Edit Pengguna ({allUsers.length})
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
                className={`px-3 py-1 text-[10.5px] font-black rounded-lg transition uppercase whitespace-nowrap shrink-0 ${
                  statusFilter === 'ALL' ? 'bg-indigo-650 bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                Semua ({orders.length})
              </button>
              {Object.values(OrderStatus).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 text-[10.5px] font-black rounded-lg transition uppercase whitespace-nowrap shrink-0 ${
                    statusFilter === st ? 'bg-indigo-650 bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'
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
                  <p className="text-[11px] text-slate-400">Tidak ada penugasan yang sesuai dengan filter filter yang Anda tunjuk.</p>
                </div>
              ) : (
                filteredOrders.map(order => {
                  const hasMaterialAddons = order.addonsUsed && order.addonsUsed.length > 0;
                  return (
                    <div key={order.id} className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-xs space-y-4 relative">
                      
                      {/* Order status pill header */}
                      <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                        <div>
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wider">{order.id}</span>
                          <h4 className="font-extrabold text-xs text-slate-850 mt-1.5 uppercase tracking-normal">
                            {order.acDetail.quantity} Unit x {order.acDetail.serviceType === 'none' ? order.acDetail.category : order.acDetail.serviceType}
                          </h4>
                        </div>
                        <span className={`text-[8.5px] px-2 py-0.6 font-black uppercase rounded tracking-wider border ${
                          order.status === OrderStatus.MENUNGGU ? 'bg-amber-55 bg-amber-50 border-amber-250 border-amber-200 text-amber-800' :
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
                          <div className="mt-1.5 text-[9.5px] bg-indigo-50 text-indigo-805 p-2 rounded-lg border border-indigo-200 flex flex-col gap-0.5 animate-pulse">
                            <span className="font-extrabold uppercase text-[7.5px] text-indigo-600 block tracking-wider">⏳ MENUNGGU ACC JADWAL DARI PELANGGAN</span>
                            Pengajuan Jadwal Baru: <strong className="text-indigo-800">{order.rescheduleDate} pukul {order.rescheduleTime}</strong>
                          </div>
                        )}
                        {order.rescheduleStatus === 'REJECTED' && (
                          <div className="mt-1.5 text-[9.5px] bg-rose-50 text-rose-800 p-2 rounded-lg border border-rose-200 flex flex-col gap-0.5">
                            <span className="font-extrabold uppercase text-[7.5px] text-rose-600 block tracking-wider">❌ PERSUTUJUAN JADWAL BARU DITOLAK PELANGGAN</span>
                            Ada bentrok di tanggal: <strong className="text-rose-800">{order.rescheduleDate} pukul {order.rescheduleTime}</strong>. Hubungi pelanggan segera!
                          </div>
                        )}
                        {order.rescheduleStatus === 'ACCEPTED' && (
                          <div className="mt-1.5 text-[9.5px] bg-emerald-50 text-emerald-800 p-2 rounded-lg border border-emerald-250 flex flex-col gap-0.5">
                            <span className="font-extrabold uppercase text-[7.5px] text-emerald-700 block tracking-wider">✅ JADWAL BARU DI-ACC PELANGGAN</span>
                            Disepakati sesuai penyesuaian: <strong className="text-emerald-800">{order.scheduledDate} {order.scheduledTime}</strong>.
                          </div>
                        )}
                        <div className="truncate">📍 Alamat Fisik: <span className="text-slate-800 font-semibold">{order.address}</span></div>
                        {order.latitude !== undefined && (
                          <div className="text-[9.5px] text-indigo-650 font-semibold flex items-center gap-1 font-mono">
                            🌐 GPS Coordinates: L: {order.latitude} , B: {order.longitude}
                          </div>
                        )}
                        {order.notes && (
                          <div className="italic text-[10px] text-slate-400 pl-2 mt-1 border-l-2 bg-white/40 border-slate-300">
                            "Keluhan: {order.notes}"
                          </div>
                        )}
                      </div>

                      {/* Staff Allocated info */}
                      {order.assignedEmployeeName ? (
                        <div className="flex flex-col gap-2 text-left">
                          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl text-[10.5px]">
                            <span className="font-bold text-slate-500 mr-1">Teknisi Lapangan:</span>
                            <span className="font-extrabold text-slate-800">{order.assignedEmployeeName}</span>
                            <span className="text-[8px] bg-slate-200 bg-indigo-55 bg-indigo-50 border border-indigo-150 text-indigo-700 px-1.5 rounded uppercase font-black tracking-widest ml-auto">
                              Tersedia
                            </span>
                          </div>
                          {(order.status === OrderStatus.MENUNGGU || order.status === OrderStatus.DITUGASKAN || order.status === OrderStatus.CEK_LAYANAN) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrderForAssign(order);
                                setSelectedStaffId(order.assignedTo || '');
                              }}
                              className="text-indigo-600 hover:text-indigo-800 font-bold text-[10px] uppercase text-left tracking-wide pl-1 hover:underline cursor-pointer transition flex items-center gap-1"
                            >
                              ⚙️ Sesuaikan Jadwal / Ganti Teknisi
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl flex items-center justify-between">
                          <span className="text-[10.5px] font-bold text-amber-800 flex items-center gap-1">
                            ⚠️ Belum dialokasi teknisi
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForAssign(order)}
                            className="bg-amber-500 hover:bg-amber-600 text-white text-[9.5px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider transition cursor-pointer"
                          >
                            Tugaskan Staff
                          </button>
                        </div>
                      )}

                      {/* Photo Before and After view */}
                      {(order.photoBefore || order.photoAfter) && (
                        <div className="grid grid-cols-2 gap-2 p-2 rounded-xl border border-slate-100 bg-slate-50 text-[10px]">
                          {order.photoBefore && (
                            <div>
                              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">📷 Foto Sebelum (Before)</span>
                              <img src={order.photoBefore} alt="Before" className="w-full h-16 object-cover rounded mt-1 border" referrerPolicy="no-referrer" />
                            </div>
                          )}
                          {order.photoAfter && (
                            <div>
                              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">📷 Foto Sesudah (After)</span>
                              <img src={order.photoAfter} alt="After" className="w-full h-16 object-cover rounded mt-1 border" referrerPolicy="no-referrer" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Expenses components */}
                      {hasMaterialAddons && (
                        <div className="bg-rose-50/50 border border-rose-100 p-2.5 rounded-xl text-[10px] space-y-1.5 text-left text-slate-705 text-slate-700">
                          <span className="text-[8px] font-black tracking-widest uppercase block text-rose-600 leading-none">Material Sparepart Dipasang:</span>
                          <div className="space-y-0.5">
                            {order.addonsUsed!.map((ad, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[9.5px]">
                                <span>• {ad.name} (x{ad.quantity})</span>
                                <span className="font-mono font-bold text-slate-500">{formatRupiah(ad.price * ad.quantity)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Grand total info */}
                      <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 font-black">
                        <span className="text-[10px] uppercase text-slate-400 tracking-wider">Total Pendapatan Jasa:</span>
                        <div className="text-right">
                          <span className="text-xs font-mono text-indigo-705 text-indigo-700 block">
                            {formatRupiah(order.totalCost || order.serviceCost)}
                          </span>
                        </div>
                      </div>

                      {/* Payment statuses verification warnings */}
                      {order.status === OrderStatus.PAYMENT && (
                        <div className="bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-xl flex items-center justify-between text-[11px] text-indigo-800">
                          <span>Cara Bayar: <strong>{order.paymentMethod || 'TUNAI (Pending)'}</strong></span>
                          <span className={`text-[8.5px] px-1.5 py-0.5 font-bold rounded uppercase tracking-wider ${
                            order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800 border-emerald-250 border border-emerald-200' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {order.paymentStatus || 'WAITING'}
                          </span>
                        </div>
                      )}

                      {/* Completion Notes */}
                      {order.status === OrderStatus.SELESAI && order.rating !== undefined && (
                        <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-xl text-[10.5px] text-slate-700 flex justify-between items-center">
                          <div className="text-left">
                            <span className="text-[8px] text-amber-700 font-extrabold uppercase block tracking-wider">Hasil Rating Pelanggan</span>
                            {order.ratingNotes && <p className="italic text-[10px] mt-0.5 text-slate-500">"{order.ratingNotes}"</p>}
                          </div>
                          <div className="flex gap-0.5 shrink-0">
                            {[1, 2, 3, 4, 5].map((st) => (
                              <span key={st} className={`text-sm leading-none ${st <= order.rating! ? 'text-amber-550 text-amber-500' : 'text-slate-205 text-slate-200'}`}>★</span>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 2: MASTER DATABASE MANAGER ===================== */}
        {activeTab === 'MASTER_DATA' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-4">
            
            <div className="border-b border-slate-200 pb-2.5 flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="font-extrabold text-sm uppercase text-slate-800">Master Database Operasional</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Tambah, ubah, dan hapus konfigurasi dasar AC di sini</p>
              </div>

              {/* Sub navbar */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                {['MODELS', 'CATEGORIES', 'SERVICES', 'ADDONS'].map((sub) => (
                  <button
                    key={sub}
                    onClick={() => {
                      setActiveMasterSubTab(sub as any);
                      setEditingMasterId(null);
                    }}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition ${
                      activeMasterSubTab === sub ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-850'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub body 1: MODELS */}
            {activeMasterSubTab === 'MODELS' && (
              <div className="space-y-4">
                
                {/* Form Add */}
                <form onSubmit={handleAddModel} className="flex gap-3 text-left">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder="Masukkan nama model AC baru (contoh: AC Multi-S VRV)..."
                      value={newModelName}
                      onChange={(e) => setNewModelName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-indigo-500 font-semibold"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-4 py-2 rounded-xl uppercase flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus size={15} /> Tambah
                  </button>
                </form>

                {/* Table Data list */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[9px] border-b border-slate-200">
                      <tr>
                        <th className="p-3">ID Model</th>
                        <th className="p-3">Nama Model Unit AC</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {models.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-slate-450 tracking-tight text-slate-400">{m.id}</td>
                          <td className="p-3">
                            {editingMasterId === m.id ? (
                              <input 
                                type="text"
                                value={editMasterField1}
                                onChange={(e) => setEditMasterField1(e.target.value)}
                                className="bg-white border rounded px-2 py-1 font-bold text-xs outline-none focus:border-indigo-500"
                              />
                            ) : (
                              <span className="font-bold text-slate-800">{m.name}</span>
                            )}
                          </td>
                          <td className="p-3 text-right flex justify-end gap-1.5">
                            {editingMasterId === m.id ? (
                              <>
                                <button onClick={() => handleSaveMasterEdit(m.id)} className="bg-emerald-500 text-white p-1.5 rounded-lg hover:bg-emerald-600 transition"><Save size={13} /></button>
                                <button onClick={() => setEditingMasterId(null)} className="bg-slate-200 text-slate-650 p-1.5 rounded-lg hover:bg-slate-300 transition"><X size={13} /></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEditMaster(m.id, m.name, 0)} className="text-indigo-605 text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg border border-indigo-100 transition"><Edit size={13} /></button>
                                <button onClick={() => handleDeleteModel(m.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg border border-red-100 transition"><Trash2 size={13} /></button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* Sub body 2: CATEGORIES */}
            {activeMasterSubTab === 'CATEGORIES' && (
              <div className="space-y-4">
                
                {/* Form Add */}
                <form onSubmit={handleAddCategory} className="bg-slate-50 border p-4.5 rounded-xl space-y-3.5">
                  <span className="text-[9px] font-black uppercase text-indigo-600 block tracking-widest">FORM TAMBAH KATEGORI BARU</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">Nama Kategori</label>
                      <input 
                        type="text" 
                        placeholder="contoh: Ganti Suku Cadang..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-850 text-xs px-3 py-2 rounded-xl outline-none focus:border-indigo-500 font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">Memiliki Sub-Layanan Tersedia?</label>
                      <select
                        value={newCategoryHasServices ? 'true' : 'false'}
                        onChange={(e) => setNewCategoryHasServices(e.target.value === 'true')}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none focus:border-indigo-500 font-semibold"
                      >
                        <option value="true">Ya (Wajib pilih salah satu pelayanan)</option>
                        <option value="false">Tidak (Langsung Inspeksi - Harga Dasar flat-rate)</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-660 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black py-2.5 rounded-xl uppercase flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Plus size={14} /> Daftarkan Kategori Baru
                  </button>
                </form>

                {/* Table Data list */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[9px] border-b border-slate-200 animate-fade">
                      <tr>
                        <th className="p-3">ID Kategori</th>
                        <th className="p-3">Kategori AC</th>
                        <th className="p-3">Tipe Pengecekan</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {categories.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-slate-400">{c.id}</td>
                          <td className="p-3">
                            {editingMasterId === c.id ? (
                              <input 
                                type="text"
                                value={editMasterField1}
                                onChange={(e) => setEditMasterField1(e.target.value)}
                                className="bg-white border rounded px-2 py-0.8 font-bold text-xs outline-none focus:border-indigo-500"
                              />
                            ) : (
                              <span className="font-extrabold text-slate-800">{c.name}</span>
                            )}
                          </td>
                          <td className="p-3">
                            {editingMasterId === c.id ? (
                              <select
                                value={editMasterField2 ? 'true' : 'false'}
                                onChange={(e) => setEditMasterField2(e.target.value === 'true')}
                                className="bg-white border rounded px-1 text-xs py-0.5 outline-none"
                              >
                                <option value="true">Memiliki List Jasa</option>
                                <option value="false">Inspeksi Flat Rp50rb</option>
                              </select>
                            ) : (
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                c.hasServices ? 'bg-indigo-50 text-indigo-750' : 'bg-amber-50 text-amber-800'
                              }`}>
                                {c.hasServices ? 'Ada Pelayanan' : 'Flat-rate Cek'}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right flex justify-end gap-1.5">
                            {editingMasterId === c.id ? (
                              <>
                                <button onClick={() => handleSaveMasterEdit(c.id)} className="bg-emerald-500 text-white p-1.5 rounded-lg hover:bg-emerald-600 transition"><Save size={13} /></button>
                                <button onClick={() => setEditingMasterId(null)} className="bg-slate-200 text-slate-650 p-1.5 rounded-lg hover:bg-slate-300 transition"><X size={13} /></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEditMaster(c.id, c.name, c.hasServices)} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg border border-indigo-100 transition"><Edit size={13} /></button>
                                <button onClick={() => handleDeleteCategory(c.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg border border-red-100 transition"><Trash2 size={13} /></button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* Sub body 3: SERVICES */}
            {activeMasterSubTab === 'SERVICES' && (
              <div className="space-y-4">
                
                {/* Form Add */}
                <form onSubmit={handleAddService} className="bg-slate-50 border p-4.5 rounded-xl space-y-3">
                  <span className="text-[9px] font-black uppercase text-indigo-600 block tracking-widest">FORM TAMBAH JENIS PELAYANAN</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">Nama Layanan</label>
                      <input 
                        type="text" 
                        placeholder="contoh: Tambah Freon R32..."
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none focus:border-indigo-500 font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">Harga Jasa (Rp)</label>
                      <input 
                        type="number" 
                        value={newServicePrice || ''}
                        onChange={(e) => setNewServicePrice(parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none focus:border-indigo-500 font-mono font-extrabold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">Hubungkan ke Kategori</label>
                      <select
                        value={newServiceCategory}
                        onChange={(e) => setNewServiceCategory(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none focus:border-indigo-500 font-semibold"
                      >
                        {categories.filter(c => c.hasServices).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black py-2.5 rounded-xl uppercase flex items-center justify-center gap-1 transition"
                  >
                    <Plus size={14} /> Daftarkan Tarif Pelayanan AC
                  </button>
                </form>

                {/* Table Data list */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[9px] border-b border-slate-200">
                      <tr>
                        <th className="p-3">Nama Layanan</th>
                        <th className="p-3">Kategori Induk</th>
                        <th className="p-3">Harga Dasar</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {services.map(s => {
                        const cat = categories.find(c => c.id === s.categoryId);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/50">
                            <td className="p-3">
                              {editingMasterId === s.id ? (
                                <input 
                                  type="text"
                                  value={editMasterField1}
                                  onChange={(e) => setEditMasterField1(e.target.value)}
                                  className="bg-white border rounded px-2 py-1 font-bold text-xs"
                                />
                              ) : (
                                <span className="font-extrabold text-slate-800">{s.name}</span>
                              )}
                            </td>
                            <td className="p-3">
                              {editingMasterId === s.id ? (
                                <select
                                  value={editMasterField3}
                                  onChange={(e) => setEditMasterField3(e.target.value)}
                                  className="bg-white border rounded text-xs px-1"
                                >
                                  {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-slate-500">{cat ? cat.name : 'Unknown Kategori'}</span>
                              )}
                            </td>
                            <td className="p-3">
                              {editingMasterId === s.id ? (
                                <input 
                                  type="number"
                                  value={editMasterField2 as number}
                                  onChange={(e) => setEditMasterField2(parseInt(e.target.value) || 0)}
                                  className="bg-white border rounded px-2 py-0.5 text-xs font-bold w-24"
                                />
                              ) : (
                                <span className="font-mono text-indigo-700 font-bold">{formatRupiah(s.price)}</span>
                              )}
                            </td>
                            <td className="p-3 text-right flex justify-end gap-1.5">
                              {editingMasterId === s.id ? (
                                <>
                                  <button onClick={() => handleSaveMasterEdit(s.id)} className="bg-emerald-500 text-white p-1.5 rounded-lg hover:bg-emerald-600 transition"><Save size={13} /></button>
                                  <button onClick={() => setEditingMasterId(null)} className="bg-slate-200 text-slate-650 p-1.5 rounded-lg hover:bg-slate-300 transition"><X size={13} /></button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => startEditMaster(s.id, s.name, s.price, s.categoryId)} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg border border-indigo-100 transition"><Edit size={13} /></button>
                                  <button onClick={() => handleDeleteService(s.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg border border-red-100"><Trash2 size={13} /></button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* Sub body 4: ADDONS */}
            {activeMasterSubTab === 'ADDONS' && (
              <div className="space-y-4">
                
                {/* Form Add */}
                <form onSubmit={handleAddAddon} className="flex flex-col sm:flex-row gap-3 text-left bg-slate-50 border p-3 rounded-xl">
                  <div className="flex-1">
                    <label className="text-[9.5px] text-slate-405 font-bold uppercase tracking-wider block mb-1">Alat/Bahan (Sparepart)</label>
                    <input 
                      type="text" 
                      placeholder="contoh: Pipa AC per meter..."
                      value={newAddonName}
                      onChange={(e) => setNewAddonName(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3.5 py-2 rounded-xl outline-none focus:border-indigo-500 font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[9.5px] text-slate-405 font-bold uppercase tracking-wider block mb-1">Harga Satuan (Rp)</label>
                    <input 
                      type="number" 
                      value={newAddonPrice || ''}
                      onChange={(e) => setNewAddonPrice(parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none focus:border-indigo-500 font-mono font-bold"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-4 py-2 mt-auto.5.5 rounded-xl uppercase flex items-center gap-1 transition cursor-pointer self-end py-2.5"
                  >
                    <Plus size={15} /> Tambah Material
                  </button>
                </form>

                {/* Table Data list */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[9px] border-b border-slate-200">
                      <tr>
                        <th className="p-3">Nama Suku Cadang Jasa</th>
                        <th className="p-3 font-mono">ID Item</th>
                        <th className="p-3">Tarif Satuan Toko</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {addons.map(a => (
                        <tr key={a.id} className="hover:bg-slate-50/50">
                          <td className="p-3">
                            {editingMasterId === a.id ? (
                              <input 
                                type="text"
                                value={editMasterField1}
                                onChange={(e) => setEditMasterField1(e.target.value)}
                                className="bg-white border rounded px-2 py-1 font-bold text-xs outline-none"
                              />
                            ) : (
                              <span className="font-extrabold text-slate-800">{a.name}</span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-slate-400 font-bold">{a.id}</td>
                          <td className="p-3">
                            {editingMasterId === a.id ? (
                              <input 
                                type="number"
                                value={editMasterField2 as number}
                                onChange={(e) => setEditMasterField2(parseInt(e.target.value) || 0)}
                                className="bg-white border rounded px-2 py-0.5 text-xs font-bold font-mono text-indigo-700"
                              />
                            ) : (
                              <span className="font-mono text-indigo-700 font-bold">{formatRupiah(a.price)}</span>
                            )}
                          </td>
                          <td className="p-3 text-right flex justify-end gap-1.5 animate-fade">
                            {editingMasterId === a.id ? (
                              <>
                                <button onClick={() => handleSaveMasterEdit(a.id)} className="bg-emerald-500 text-white p-1.5 rounded-lg hover:bg-emerald-600 transition"><Save size={13} /></button>
                                <button onClick={() => setEditingMasterId(null)} className="bg-slate-200 text-slate-650 p-1.5 rounded-lg hover:bg-slate-300 transition"><X size={13} /></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEditMaster(a.id, a.name, a.price)} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg border border-indigo-100 transition"><Edit size={13} /></button>
                                <button onClick={() => handleDeleteAddon(a.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg border border-red-100"><Trash2 size={13} /></button>
                              </>
                            )}
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

        {/* ===================== TAB 3: REGISTERED USERS EDIT PANEL ===================== */}
        {activeTab === 'USER_MANAGEMENT' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-4">
            
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="font-extrabold text-sm uppercase text-slate-800">Manajemen Akses & Pengguna</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Ubah penugasan kewenangan, handphone, dan alamat fisik</p>
              </div>

              {/* Dynamic search bar */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari user (nama, telp)..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs pl-10 pr-3.5 py-2 rounded-xl outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* List members */}
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-150 divide-slate-200">
              {allUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                <div key={u.id} className="p-4 hover:bg-slate-55 hover:bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-left">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs uppercase leading-none">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-xs text-slate-800 leading-none">{u.name}</h4>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded leading-none border ${
                            u.role === Role.ADMIN ? 'bg-red-55 bg-rose-50 text-rose-700 border-rose-200' :
                            u.role === Role.OWNER ? 'bg-indigo-50 text-indigo-750 border-indigo-200' :
                            u.role === Role.STAFF ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {u.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">{u.email} • {u.phone || 'no phone'}</p>
                      </div>
                    </div>

                    {u.address && (
                      <p className="text-[10px] text-slate-500 font-medium pl-10 italic max-w-lg truncate block">
                        📍 Alamat: "{u.address}"
                      </p>
                    )}
                  </div>

                  {/* Operational controls */}
                  <div className="pl-10 sm:pl-0">
                    {editingUserId === u.id ? (
                      <div className="bg-slate-55 bg-slate-50 p-3 rounded-xl shadow-xs border border-slate-200/80 space-y-3">
                        <span className="text-[8px] font-black text-rose-600 tracking-wider block uppercase leading-none">Form Edit Role & Data Pengguna</span>
                        <div className="grid grid-cols-2 gap-2 text-left">
                          <div>
                            <label className="text-[9px] text-slate-400 font-bold block mb-1">Set Hak Akses</label>
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value as Role)}
                              className="bg-white border rounded text-xs px-2 py-1 outline-none font-bold"
                            >
                              <option value={Role.USER}>{Role.USER}</option>
                              <option value={Role.ADMIN}>{Role.ADMIN}</option>
                              <option value={Role.STAFF}>{Role.STAFF}</option>
                              <option value={Role.OWNER}>{Role.OWNER}</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-400 font-bold block mb-1">No. Handphone</label>
                            <input 
                              type="text"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="bg-white border rounded text-xs px-2 py-1 font-mono font-bold outline-none"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[9px] text-slate-400 font-bold block mb-1">Alamat Fisik</label>
                            <textarea
                              value={editAddress}
                              onChange={(e) => setEditAddress(e.target.value)}
                              className="w-full bg-white border rounded text-xs p-1.5 outline-none h-14 resize-none leading-normal font-medium"
                            ></textarea>
                          </div>
                        </div>

                        <div className="flex justify-end gap-1.5 pt-1">
                          <button 
                            onClick={() => handleSaveUserEdit(u.id)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] tracking-wide px-3 py-1 rounded shadow"
                          >
                            Simpan Cepat
                          </button>
                          <button 
                            onClick={() => setEditingUserId(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-[10px] px-3 py-1 rounded"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditUser(u)}
                        className="bg-indigo-50 border border-indigo-150 text-indigo-700 hover:bg-indigo-100 text-[10.5px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1 uppercase transition cursor-pointer"
                      >
                        <Edit size={12} />
                        Sunting Hak Akses
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

      {/* ===================== ALLOCATION MODAL POPUP (ASSIGN STAFF) ===================== */}
      {selectedOrderForAssign && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in scale-in duration-200 text-left">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <div>
                <h4 className="font-black text-xs uppercase tracking-wide leading-none">Delegasi Kerja Staff</h4>
                <p className="text-[9.5px] text-slate-400 mt-1 leading-none">ID Karcis: {selectedOrderForAssign.id}</p>
              </div>
              <button 
                onClick={() => {
                  setSelectedOrderForAssign(null);
                  setSelectedStaffId('');
                }}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-4.5 space-y-4">
              <div className="text-[10.5px] text-slate-600 space-y-1 bg-slate-55 bg-slate-50 p-2.5 rounded-xl text-left font-medium">
                <div>🛠️ Jasa: <strong>{selectedOrderForAssign.acDetail.quantity} Unit x {selectedOrderForAssign.acDetail.serviceType === 'none' ? selectedOrderForAssign.acDetail.category : selectedOrderForAssign.acDetail.serviceType}</strong></div>
                <div>👤 Pelanggan: {selectedOrderForAssign.customerName}</div>
                <div>📍 Alamat: {selectedOrderForAssign.address}</div>
              </div>

              <div>
                <label className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Pilih Teknisi Lapangan Tersedia</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 font-extrabold"
                >
                  <option value="">-- Pilih Salah Satu Teknisi --</option>
                  {sortedStaffList.map(emp => {
                    const stats = getStaffStats(emp.id);
                    return (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} — {stats.text}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Interactive Schedule Alignment Editor */}
              <div className="border border-indigo-100 bg-indigo-50/50 p-3 rounded-xl space-y-2.5 text-left">
                <span className="text-[8.5px] font-black tracking-widest text-indigo-700 uppercase block leading-none">SESUAIKAN JADWAL (JIKA ADA BENTROK)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Tanggal Baru:</label>
                    <input 
                      type="date"
                      value={tempScheduledDate}
                      onChange={(e) => setTempScheduledDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-[11px] px-2 py-1 rounded-lg outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Jam Kunjungan:</label>
                    <select
                      value={tempScheduledTime}
                      onChange={(e) => setTempScheduledTime(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-850 text-[11px] px-1.5 py-1 rounded-lg outline-none focus:border-indigo-500 font-semibold"
                    >
                      <option value="09:00">09:00 Pagi</option>
                      <option value="11:00">11:00 Siang</option>
                      <option value="13:00">13:00 Siang</option>
                      <option value="15:00">15:00 Sore</option>
                      <option value="17:00">17:00 Sore</option>
                    </select>
                  </div>
                </div>
                <p className="text-[8px] text-slate-400 leading-normal font-medium">
                  *Silakan hubungi customer di nomor teleponnya untuk koordinasi alternatif waktu jika teknisi pilihan berhalangan.
                </p>
              </div>

              <div className="flex gap-2 pt-2.5">
                <button
                  type="button"
                  onClick={() => handleAssignSubmit(selectedOrderForAssign.id)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider shadow hover:shadow-md transition cursor-pointer"
                >
                  Tugaskan & Kirim
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrderForAssign(null);
                    setSelectedStaffId('');
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-4 rounded-xl transition"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
