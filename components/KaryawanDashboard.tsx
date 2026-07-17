'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/auth-context';
import { OrderStatus } from '@/types';
import * as api from '@/lib/api';
import {
  Home,
  Clock,
  Users,
  User as UserIcon,
  X,
  Sliders,
  Camera,
  Plus,
  Trash2,
  Star,
  Award,
  Loader,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Check,
  MoreVertical,
  LogOut,
  Printer,
  FileText,
} from 'lucide-react';

import dynamic from 'next/dynamic';
const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

export default function KaryawanDashboard() {
  const { activeUser, setActiveUser, orders, setOrders, addons, services, categories, logout, showAlert, appSettings, models, servicePrices } = useApp();
  const alert = showAlert;

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'profile' | 'gaji' | 'team'>('dashboard');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<any | null>(null);

  const [mySalary, setMySalary] = useState<any>(null);
  const [myTeam, setMyTeam] = useState<any[] | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const resSalary = await fetch('/api/staff/my-salary', { headers: api.getAuthHeaders() });
        if (resSalary.ok) setMySalary((await resSalary.json()).data);
        else setApiError('Gagal memuat data gaji. (Pastikan backend sudah di-deploy)');
        
        const resTeam = await fetch('/api/staff/team', { headers: api.getAuthHeaders() });
        if (resTeam.ok) {
          const teamData = await resTeam.json();
          setMyTeam(Array.isArray(teamData) ? teamData : (teamData.team || []));
        }
      } catch (err) {
        setApiError('Koneksi ke server gagal.');
      }
    };
    if (activeUser) fetchInfo();
  }, [activeUser]);

  const handleClaim = async (type: 'daily_salary' | 'points', amount: number) => {
    if (!window.confirm(`Ajukan klaim ${type === 'daily_salary' ? 'Gaji & Uang Jalan' : 'Poin'}?`)) return;
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: api.getAuthHeaders(),
        body: JSON.stringify({ type, amount, points_claimed: type === 'points' ? amount : 0 })
      });
      if (res.ok) {
        alert('Klaim berhasil diajukan dan menunggu persetujuan keuangan.');
        const resSalary = await fetch('/api/staff/my-salary', { headers: api.getAuthHeaders() });
        if (resSalary.ok) setMySalary((await resSalary.json()).data);
      } else {
        alert('Gagal mengajukan klaim.');
      }
    } catch (e) {
      alert('Error saat mengajukan klaim.');
    }
  };


  // Work panel modal
  const [activeWorkingTask, setActiveWorkingTask] = useState<any | null>(null);

  // Cancellation modal
  const [activeCancelOrderId, setActiveCancelOrderId] = useState<string | null>(null);
  const [cancelReasonText, setCancelReasonText] = useState('');

  // Service editing states (CEK_LAYANAN stage)
  const [editingServiceOrderId, setEditingServiceOrderId] = useState<string | null>(null);
  const [editCartServices, setEditCartServices] = useState<{ category: string; serviceType: string; quantity: number; acType: string }[]>([]);

  // Addons states (PENGERJAAN stage)
  const [addonsUsed, setAddonsUsed] = useState<{ id: string; name: string; price: number; quantity: number; hpp?: number }[]>([]);
  const [selectedAddonId, setSelectedAddonId] = useState('');
  const [addonQuantity, setAddonQuantity] = useState(1);

  const [photoBeforeUrl, setPhotoBeforeUrl] = useState('');
  const [photoAfterUrl, setPhotoAfterUrl] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [paymentProofs, setPaymentProofs] = useState<{ [orderId: string]: string }>({});













  // Profile edit states
  const [editName, setEditName] = useState(activeUser?.name || '');
  const [editPhone, setEditPhone] = useState(activeUser?.phone || '');
  const [editAddress, setEditAddress] = useState(activeUser?.address || '');
  const [editLat, setEditLat] = useState<number | undefined>(activeUser?.lat);
  const [editLng, setEditLng] = useState<number | undefined>(activeUser?.lng);
  const [editPhoto, setEditPhoto] = useState<string>(activeUser?.photo || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Added for new Profile View Modes
  const [profileViewMode, setProfileViewMode] = useState<'readonly' | 'edit-profile' | 'edit-password'>('readonly');
  const [showProfileMapPicker, setShowProfileMapPicker] = useState(false);
  const [editOldPassword, setEditOldPassword] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');

  useEffect(() => {
    if (activeUser) {
      setEditName(activeUser.name);
      setEditPhone(activeUser.phone || '');
      setEditAddress(activeUser.address || '');
      setEditLat(activeUser.lat);
      setEditLng(activeUser.lng);
      setEditPhoto(activeUser.photo || '');
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

  if (!activeUser) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const activeTasks = orders.filter(o => o.assignedTo === activeUser.id && o.status !== OrderStatus.SELESAI && o.status !== OrderStatus.DIBATALKAN && o.status !== OrderStatus.MENUNGGU).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  const completedTasks = orders.filter(o => o.assignedTo === activeUser.id && o.status === OrderStatus.SELESAI).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const formatRupiah = (num: any) => {
    return 'Rp' + Number(num || 0).toLocaleString('id-ID');
  };

  const handlePrintReceipt = (task: any) => {
    try {
      const businessName = appSettings?.['GLOBAL']?.business_name || 'CoolAir Pro';
      const businessLogo = appSettings?.['GLOBAL']?.business_logo || '';

      const formatRupiahText = (num: any) => {
        if (!num && num !== 0 && num !== '0') return 'Rp0';
        return 'Rp' + Number(num || 0).toLocaleString('id-ID');
      };

      const finalAmount = Math.max(0, (task.serviceCost || 0) + (task.addonsCost || 0) - (task.voucher_discount || 0)) || task.totalCost || 0;

      // Build acDetails HTML safely
      let acDetailsList = '';
      if (Array.isArray(task.acDetail)) {
        acDetailsList = task.acDetail.map((ac: any) => {
          const typeStr = ac.acType || '';
          const catStr = ac.category || '';
          const svcStr = ac.serviceType === 'none' ? '' : ` (${ac.serviceType})`;
          return `
            <div class="item-row">
              <span>${ac.quantity}x ${catStr}${svcStr}</span>
            </div>
            <div class="item-sub" style="padding-left: 10px; font-size: 8.5px; color: #555; margin-bottom: 4px;">
              Tipe: ${typeStr}
            </div>
          `;
        }).join('');
      } else if (task.acDetail) {
        const ac = task.acDetail as any;
        const typeStr = ac.acType || '';
        const catStr = ac.category || '';
        const svcStr = ac.serviceType === 'none' ? '' : ` (${ac.serviceType})`;
        acDetailsList = `
          <div class="item-row">
            <span>${ac.quantity || 1}x ${catStr}${svcStr}</span>
          </div>
          <div class="item-sub" style="padding-left: 10px; font-size: 8.5px; color: #555; margin-bottom: 4px;">
            Tipe: ${typeStr}
          </div>
        `;
      }

      // Build addons HTML
      const addonsList = (task.addonsUsed || []).map((addon: any) => {
        return `
          <div class="item-row">
            <span>${addon.quantity}x ${addon.name}</span>
            <span class="text-right font-mono">${formatRupiahText(addon.price * addon.quantity)}</span>
          </div>
          <div style="font-size: 8.5px; padding-left: 10px; color: #555; margin-bottom: 2px;">
            @ ${formatRupiahText(addon.price)}
          </div>
        `;
      }).join('');

      const printWindow = window.open('', '_blank', 'width=350,height=600');
      if (!printWindow) {
        alert('❌ Gagal membuka jendela cetak. Pastikan pop-up browser tidak diblokir.');
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Cetak Nota - ${task.id}</title>
            <style>
              @page {
                size: 58mm auto;
                margin: 0;
              }
              body {
                width: 48mm; /* printable width on standard 58mm printer */
                margin: 0 auto;
                padding: 10px 2px 20px 2px;
                font-family: 'Courier New', Courier, monospace;
                font-size: 10px;
                line-height: 1.3;
                color: #000;
                background-color: #fff;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .bold { font-weight: bold; }
              .divider { border-top: 1px dashed #000; margin: 6px 0; }
              .double-divider { border-top: 1px double #000; margin: 6px 0; }
              .item-row { display: flex; justify-content: space-between; align-items: flex-start; }
              .header-title { font-size: 13px; font-weight: bold; margin-bottom: 2px; }
              .header-subtitle { font-size: 8.5px; margin-bottom: 4px; }
              .receipt-info { font-size: 9px; margin-bottom: 8px; }
              .totals-section { font-size: 9.5px; }
              .footer { font-size: 8.5px; margin-top: 12px; }
            </style>
          </head>
          <body>
            <div class="text-center">
              ${businessLogo ? `<img src="${businessLogo}" style="max-height: 35px; max-width: 100%; margin-bottom: 4px; filter: grayscale(100%);" />` : ''}
              <div class="header-title">${businessName}</div>
              <div class="header-subtitle">Layanan AC Profesional & Terpercaya</div>
              <div class="divider"></div>
            </div>

            <div class="receipt-info">
              <div><strong>Nota ID :</strong> ${task.id}</div>
              <div><strong>Tanggal :</strong> ${task.scheduledDate} ${task.scheduledTime}</div>
              <div><strong>Teknisi :</strong> ${task.assignedEmployeeName || '-'}</div>
              <div class="divider"></div>
              <div><strong>Pelanggan:</strong> ${task.customerName}</div>
              <div><strong>No. Telp :</strong> ${task.customerPhone}</div>
              <div style="word-break: break-word;"><strong>Alamat   :</strong> ${task.address}</div>
            </div>

            <div class="double-divider"></div>
            <div class="bold" style="font-size: 9px; margin-bottom: 4px;">Rincian Layanan:</div>
            ${acDetailsList || '<div style="font-style: italic;">Tidak ada detail layanan</div>'}
            
            <div class="item-row font-mono bold" style="margin-top: 4px;">
              <span>Total Jasa AC</span>
              <span class="text-right">${formatRupiahText(task.serviceCost)}</span>
            </div>

            ${addonsList ? `
              <div class="divider"></div>
              <div class="bold" style="font-size: 9px; margin-bottom: 4px;">Sparepart / Addons:</div>
              ${addonsList}
              <div class="item-row font-mono bold" style="margin-top: 4px;">
                <span>Total Sparepart</span>
                <span class="text-right">${formatRupiahText(task.addonsCost)}</span>
              </div>
            ` : ''}

            <div class="double-divider"></div>

            <div class="totals-section bold">
              <div class="item-row">
                <span>TOTAL AKHIR</span>
                <span class="text-right font-mono" style="font-size: 11px;">${formatRupiahText(finalAmount)}</span>
              </div>
            </div>

            <div class="divider"></div>
            <div class="text-center footer">
              <div>Terima kasih atas kunjungan Anda</div>
              <div>Hubungi kami kembali untuk perawatan AC berkala</div>
              <div style="margin-top: 4px; font-size: 7px; color: #555;">Dicetak otomatis oleh Aplikasi</div>
            </div>
            
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error('Print receipt error:', error);
      alert('❌ Gagal mencetak nota. Silakan coba lagi.');
    }
  };

  // ==================== HANDLERS ====================

  // Client-side image compression to downsize massive photos
  const compressImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions keeping ratio
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

  // Profile update handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setErrorMsg('Nama tidak boleh kosong');
      return;
    }
    try {
      setIsLoading(true);
      setErrorMsg('');

      const updatedUser = await api.updateUser(activeUser!.id, {
        name: editName.trim(),
        email: activeUser!.email,
        phone: editPhone.trim(),
        role: activeUser!.role,
        address: editAddress.trim(),
        lat: editLat,
        lng: editLng,
        photo: editPhoto,
      });
      setActiveUser(updatedUser);
      setEditPhoto(updatedUser.photo || '');

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      setIsLoading(false);
      setProfileViewMode('readonly');
    } catch (error: any) {
      setErrorMsg(error?.message || 'Gagal memperbarui profil');
      setIsLoading(false);
    }
  };

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 600, 600, 0.75);
        setEditPhoto(compressedBase64);
      } catch (err) {
        console.error('Error compressing profile image:', err);
        alert('❌ Gagal memproses foto profil. Silakan coba lagi.');
      }
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOldPassword || !editNewPassword || !editConfirmPassword) {
      setErrorMsg('Semua kolom password wajib diisi');
      return;
    }
    if (editNewPassword !== editConfirmPassword) {
      setErrorMsg('Konfirmasi password baru tidak cocok');
      return;
    }
    if (editNewPassword.length < 6) {
      setErrorMsg('Password baru minimal 6 karakter');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg('');

      await api.updatePassword(activeUser!.id, {
        oldPassword: editOldPassword,
        newPassword: editNewPassword
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      setIsLoading(false);

      setEditOldPassword('');
      setEditNewPassword('');
      setEditConfirmPassword('');
      setProfileViewMode('readonly');
    } catch (error: any) {
      setErrorMsg(error?.message || 'Gagal memperbarui password');
      setIsLoading(false);
    }
  };

  // Edit service details (CEK_LAYANAN stage)
  const handleStartEditingService = (order: any) => {
    setEditingServiceOrderId(order.id);
    if (Array.isArray(order.acDetail) && order.acDetail.length > 0) {
      setEditCartServices(order.acDetail.map((item: any) => ({
        category: item.category || '',
        serviceType: item.serviceType || '',
        quantity: item.quantity || 1,
        acType: item.acType || '',
      })));
    } else if (order.acDetail) {
      setEditCartServices([{
        category: (order.acDetail as any).category || '',
        serviceType: (order.acDetail as any).serviceType || '',
        quantity: (order.acDetail as any).quantity || 1,
        acType: (order.acDetail as any).acType || '',
      }]);
    } else {
      setEditCartServices([]);
    }
  };

  const handleUpdateEditCart = (index: number, field: string, value: any) => {
    const updated = [...editCartServices];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'category') {
      const cat = categories.find(c => c.name === value);
      if (cat) {
        const subSrvs = services.filter(s => s.categoryId === cat.id);
        updated[index].serviceType = subSrvs.length > 0 ? subSrvs[0].name : '';
      }
    }
    setEditCartServices(updated);
  };

  const handleAddServiceToEditCart = () => {
    const defaultCat = categories.length > 0 ? categories[0] : null;
    const defaultSrv = defaultCat ? services.find(s => s.categoryId === defaultCat.id) : null;
    setEditCartServices(prev => [
      ...prev,
      {
        category: defaultCat ? defaultCat.name : '',
        serviceType: defaultSrv ? defaultSrv.name : '',
        quantity: 1,
        acType: ''
      }
    ]);
  };

  const handleRemoveServiceFromEditCart = (index: number) => {
    setEditCartServices(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveServiceUpdate = async (orderId: string) => {
    if (editCartServices.length === 0) {
      alert('Harus ada minimal 1 layanan.');
      return;
    }

    let newServiceCost = 0;
    const formattedAcDetails = editCartServices.map(cartItem => {
      let unitPrice = 50000;
      let categoryName = cartItem.category;
      let serviceTypeName = cartItem.serviceType || 'none';

      const matchedCategory = categories.find(c => c.name === cartItem.category);
      if (matchedCategory) {
        categoryName = matchedCategory.name;
        const matchedService = services.find(s => s.name === cartItem.serviceType && s.categoryId === matchedCategory.id);
        const matchModel = models.find(m => m.name === cartItem.acType);

        if (matchedCategory.hasServices && matchedService) {
          serviceTypeName = matchedService.name;
          if (matchModel) {
            const priceEntry = servicePrices.find(sp => sp.serviceId === matchedService.id && sp.modelId === matchModel.id);
            if (priceEntry) {
              unitPrice = priceEntry.price;
            } else {
              unitPrice = matchedService.price; // fallback if no specific model price found
            }
          } else {
            unitPrice = matchedService.price;
          }
        } else if (!matchedCategory.hasServices) {
          serviceTypeName = 'none';
          unitPrice = 50000; // Inspection price or default
        }
      }

      newServiceCost += unitPrice * cartItem.quantity;

      return {
        category: categoryName,
        serviceType: serviceTypeName,
        quantity: cartItem.quantity,
        acType: cartItem.acType
      };
    });

    const currentOrder = orders.find(o => o.id === orderId);
    if (!currentOrder) return;

    try {
      await api.updateOrder(orderId, {
        acDetail: formattedAcDetails,
        serviceCost: newServiceCost,
        totalCost: newServiceCost,
        finalPrice: Math.max(0, newServiceCost + (currentOrder.addonsCost || 0) - (currentOrder.voucher_discount || 0)),
        quantity: formattedAcDetails.reduce((sum, item) => sum + item.quantity, 0)
      });

      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === orderId
            ? {
              ...o,
              acDetail: formattedAcDetails,
              serviceCost: newServiceCost,
              totalCost: newServiceCost,
              finalPrice: Math.max(0, newServiceCost + (o.addonsCost || 0) - (o.voucher_discount || 0)),
              quantity: formattedAcDetails.reduce((sum, item) => sum + item.quantity, 0)
            }
            : o
        )
      );

      setEditingServiceOrderId(null);
      alert('✓ Detail jenis layanan berhasil disesuaikan!');
    } catch (error) {
      alert('❌ Gagal menyimpan layanan');
    }
  };

  const handleRequestCancelWorker = async () => {
    if (!activeCancelOrderId || !cancelReasonText.trim()) return;
    try {
      await api.updateOrder(activeCancelOrderId, { workerCancelReason: cancelReasonText.trim() });
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === activeCancelOrderId ? { ...o, workerCancelReason: cancelReasonText.trim() } : o
        )
      );
      alert('✓ Pengajuan pembatalan telah dikirim ke Admin untuk diverifikasi.');
      setActiveCancelOrderId(null);
      setCancelReasonText('');
    } catch (error) {
      alert('❌ Gagal mengirim pengajuan pembatalan');
    }
  };

  // Status transition: DITUGASKAN → CEK_LAYANAN
  const handleConfirmArrived = async (orderId: string) => {
    const task = orders.find(o => o.id === orderId);
    if (!task) return;

    try {
      const updatedOrder = await api.updateOrder(orderId, { 
        status: OrderStatus.CEK_LAYANAN
      });
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === orderId ? updatedOrder : o
        )
      );
      setPhotoBeforeUrl('');
      setPhotoAfterUrl('');
    } catch (error) {
      alert('❌ Gagal update status');
    }
  };

  const handleStartRepairAndWash = async (orderId: string) => {
    const task = orders.find(o => o.id === orderId);
    if (!task) return;
    
    // Validate that photoBefore is uploaded
    if (!photoBeforeUrl) {
      alert(`❌ Mohon upload foto kondisi awal (Before).`);
      return;
    }

    try {
      setIsLoading(true);

      const updatedOrder = await api.updateOrder(orderId, {
        status: OrderStatus.PENGERJAAN,
        photoBefore: photoBeforeUrl,
      });
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === orderId ? updatedOrder : o
        )
      );
      setPhotoBeforeUrl('');
      setPhotoAfterUrl('');
    } catch (error) {
      alert('❌ Gagal update status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendBillToCustomer = async (orderId: string) => {
    const task = orders.find(o => o.id === orderId);
    if (!task) return;

    // Validate photoAfter
    if (!photoAfterUrl) {
      alert(`❌ Mohon upload foto kondisi sesudah (After).`);
      return;
    }

    try {
      setIsLoading(true);
      const addonsCost = addonsUsed.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
      const serviceCost = task.serviceCost || 0;
      const totalCost = serviceCost;
      const finalPrice = Math.max(0, serviceCost + addonsCost - (task.voucher_discount || 0));

      const updatedOrder = await api.updateOrder(orderId, {
        status: OrderStatus.PAYMENT,
        photoAfter: photoAfterUrl,
        addonsCost,
        totalCost,
        finalPrice,
        paymentStatus: 'WAITING_APPROVAL',
        addonsUsed: addonsUsed,
      });

      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === orderId ? updatedOrder : o
        )
      );
      setActiveWorkingTask(null);
      setAddonsUsed([]);
      setSelectedAddonId('');
      setAddonQuantity(1);
      setPhotoBeforeUrl('');
      setPhotoAfterUrl('');
      setCompletionNotes('');
    } catch (error) {
      alert('❌ Gagal mengirim tagihan');
    } finally {
      setIsLoading(false);
    }
  };

  // Status transition: PAYMENT → SELESAI (Cash approval)
  const handleApproveCashReceived = async (orderId: string) => {
    try {
      await api.updateOrder(orderId, {
        status: OrderStatus.SELESAI,
        paymentStatus: 'PAID'
      });
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === orderId ? { ...o, status: OrderStatus.SELESAI, paymentStatus: 'PAID' } : o
        )
      );
      alert('✓ Pembayaran CASH lunas disetujui. Status pengerjaan: SELESAI!');
    } catch (error) {
      alert('❌ Gagal update status');
    }
  };

  const handleApproveTransferReceived = async (orderId: string) => {
    const proof = paymentProofs[orderId];
    if (!proof) {
      alert('❌ Harap unggah atau ambil foto bukti pembayaran terlebih dahulu!');
      return;
    }
    try {
      setIsLoading(true);
      await api.updateOrder(orderId, {
        status: OrderStatus.SELESAI,
        paymentStatus: 'PAID',
        paymentProof: proof
      });
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === orderId ? { ...o, status: OrderStatus.SELESAI, paymentStatus: 'PAID', paymentProof: proof } : o
        )
      );
      alert('✓ Bukti transfer berhasil diupload. Status pengerjaan: SELESAI!');
    } catch (error) {
      alert('❌ Gagal mengonfirmasi pembayaran transfer');
    } finally {
      setIsLoading(false);
    }
  };

  // Image upload handler with built-in compression to avoid EADDRINUSE/max_allowed_packet db errors
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Compress image to max 1000px width/height and 70% quality (ideal balance of detail and database size)
        const compressedBase64 = await compressImage(file, 1000, 1000, 0.7);
        if (type === 'before') {
          setPhotoBeforeUrl(compressedBase64);
        } else {
          setPhotoAfterUrl(compressedBase64);
        }
      } catch (err) {
        console.error('Error compressing image:', err);
        alert('❌ Gagal memproses gambar dari kamera HP. Silakan coba lagi.');
      }
    }
  };

  // Addon management
  const handleAddAddonItem = () => {
    if (!selectedAddonId) return;
    const match = addons.find(a => a.id === selectedAddonId);
    if (match) {
      const exists = addonsUsed.find(x => x.id === match.id);
      if (exists) {
        setAddonsUsed(prev => prev.map(x => x.id === match.id ? { ...x, quantity: x.quantity + addonQuantity } : x));
      } else {
        setAddonsUsed(prev => [...prev, { id: match.id, name: match.name, price: match.price, quantity: addonQuantity, hpp: match.hpp || 0 }]);
      }
      setSelectedAddonId('');
      setAddonQuantity(1);
    }
  };

  const handleRemoveAddonItem = (id: string) => {
    setAddonsUsed(prev => prev.filter(x => x.id !== id));
  };

  return (
    <>
      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative min-h-0 h-full">

        {/* GLOBAL HEADER BAR WITH THREE-DOTS MENU */}
        <div className="bg-slate-900 text-white px-5 py-4 shrink-0 shadow-md flex justify-between items-center z-20 relative">
          <div className="flex items-center gap-2">
            <a href="/" className="flex items-center gap-2 cursor-pointer block hover:opacity-80 transition">
              {appSettings?.['GLOBAL']?.business_logo ? (
                <img src={appSettings['GLOBAL'].business_logo} alt="Logo" className="w-6 h-6 rounded-lg object-cover" />
              ) : (
                <span className="text-sm font-black tracking-wider text-emerald-400">🟢 {appSettings?.['GLOBAL']?.business_name || 'CoolAir Pro'}</span>
              )}
            </a>
            <span className="text-xs font-black uppercase tracking-wider text-slate-350">| Portal Karyawan</span>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto pb-6 min-h-0 bg-slate-50">

        {/* UNIFIED HEADER & ICON GRID */}
        <div className="bg-slate-900 text-white rounded-b-[32px] pt-4 pb-12 px-5 shrink-0 relative shadow-lg">
          <span className="text-[8px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
             Departemen Teknisi Lapangan
          </span>
          <h2 className="text-xl font-extrabold text-white mt-2">Halo Sobat, {activeUser.name}!</h2>
          <p className="text-[10.5px] text-slate-300 mt-1">Status: <strong className="text-emerald-400">SIAP BEKERJA</strong></p>
        </div>

        {/* ICON NAVIGATION GRID */}
        <div className="px-5 -mt-8 relative z-10 shrink-0 mb-4">
          <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/40 border border-slate-100/60 p-4 md:p-5">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-y-5 gap-x-2">
              
              <div onClick={() => setActiveTab('dashboard')} className="flex flex-col items-center gap-2 cursor-pointer">
                <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center ${activeTab === 'dashboard' ? 'bg-blue-100 text-blue-600 border border-blue-200 shadow-sm' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                   <Home size={22} strokeWidth={2.5} />
                </div>
                <span className="text-[8px] font-extrabold text-slate-700 text-center uppercase tracking-wider">Penugasan</span>
              </div>
              
              <div onClick={() => setActiveTab('history')} className="flex flex-col items-center gap-2 cursor-pointer">
                <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center ${activeTab === 'history' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-sm' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                   <Clock size={22} strokeWidth={2.5} />
                </div>
                <span className="text-[8px] font-extrabold text-slate-700 text-center uppercase tracking-wider">Histori</span>
              </div>
              
              <div onClick={() => setActiveTab('profile')} className="flex flex-col items-center gap-2 cursor-pointer">
                <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center ${activeTab === 'profile' ? 'bg-purple-100 text-purple-600 border border-purple-200 shadow-sm' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                   <UserIcon size={22} strokeWidth={2.5} />
                </div>
                <span className="text-[8px] font-extrabold text-slate-700 text-center uppercase tracking-wider">Profil</span>
              </div>
              
              <div onClick={() => setActiveTab('gaji')} className="flex flex-col items-center gap-2 cursor-pointer">
                <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center ${activeTab === 'gaji' ? 'bg-amber-100 text-amber-600 border border-amber-200 shadow-sm' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                   <FileText size={22} strokeWidth={2.5} />
                </div>
                <span className="text-[8px] font-extrabold text-slate-700 text-center uppercase tracking-wider">Gaji & Poin</span>
              </div>

              {activeUser?.is_leader && (
                <div onClick={() => setActiveTab('team')} className="flex flex-col items-center gap-2 cursor-pointer">
                  <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center ${activeTab === 'team' ? 'bg-indigo-100 text-indigo-600 border border-indigo-200 shadow-sm' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                     <Users size={22} strokeWidth={2.5} />
                  </div>
                  <span className="text-[8px] font-extrabold text-slate-700 text-center uppercase tracking-wider">Kinerja Tim</span>
                </div>
              )}

              <div onClick={() => setShowLogoutConfirm(true)} className="flex flex-col items-center gap-2 cursor-pointer">
                <div className="w-12 h-12 rounded-[14px] flex items-center justify-center bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100">
                   <LogOut size={22} strokeWidth={2.5} />
                </div>
                <span className="text-[8px] font-extrabold text-slate-700 text-center uppercase tracking-wider">Keluar</span>
              </div>

            </div>
          </div>
        </div>

          {/* ==================== TAB 1: DASHBOARD ==================== */}
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in duration-300">
              <div className="px-5 space-y-4 pt-2">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider text-left pl-1">Daftar Kunjungan Service</h3>

                {activeTasks.length === 0 ? (
                  <div className="bg-white border rounded-2xl p-7 text-center space-y-3 shadow-xs">
                    <span className="text-xl">🛠️</span>
                    <p className="font-bold text-slate-850 text-xs uppercase">Jadwal Tugas Bersih!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeTasks.map(task => (
                      <div key={task.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5 text-left">

                        <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                          <div>
                            <span className="text-[8.5px] font-mono font-bold text-slate-400 bg-slate-50 px-1 py-0.5 border rounded uppercase tracking-wider">{task.id}</span>
                            <h4 className="font-extrabold text-xs text-slate-850 mt-1 uppercase">
                              {Array.isArray(task.acDetail)
                                ? task.acDetail.map(s => `${s.quantity} Unit x ${s.serviceType === 'none' ? s.category : s.serviceType}`).join(', ')
                                : task.acDetail ? `${(task.acDetail as any).quantity || 0} Unit x ${(task.acDetail as any).serviceType === 'none' ? (task.acDetail as any).category : (task.acDetail as any).serviceType}` : ''}
                            </h4>
                          </div>
                          <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${task.status === OrderStatus.DITUGASKAN ? 'bg-amber-50 border-amber-200 text-amber-800' :
                            task.status === OrderStatus.CEK_LAYANAN ? 'bg-blue-50 border-blue-200 text-blue-850' :
                              task.status === OrderStatus.PENGERJAAN ? 'bg-purple-50 border-purple-200 text-purple-800' :
                                'bg-indigo-50 border-indigo-200 text-indigo-750'
                            }`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="text-[10.5px] text-slate-500 font-medium space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/50">
                          <div>👤 {task.customerName} ({task.customerPhone})</div>
                          <div className="flex items-start gap-1">
                            <span className="shrink-0 mt-0.5">📍</span>
                            <div>
                              <span>{task.address}</span>
                              {(task.latitude || task.lat) && (task.longitude || task.lng) && (
                                <a
                                  href={`https://www.google.com/maps?q=${task.latitude || task.lat},${task.longitude || task.lng}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-1 flex w-fit items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-[9px] font-bold hover:bg-indigo-200 transition"
                                >
                                  Buka di Google Maps
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* ACTION BUTTONS PER STATUS */}
                        <div className="pt-2">
                          {task.status === OrderStatus.DITUGASKAN && (
                            <div className="space-y-2">
                              {task.workerCancelReason ? (
                                <div className="bg-amber-100 text-amber-800 p-3 rounded-xl text-xs font-bold text-center border border-amber-300">
                                  ⏳ Menunggu verifikasi admin untuk pembatalan...
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleConfirmArrived(task.id)}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 rounded-xl uppercase tracking-wider cursor-pointer transition"
                                  >
                                    Konfirmasi Tiba di Lokasi & Mulai Cek AC
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveCancelOrderId(task.id);
                                      setCancelReasonText('');
                                    }}
                                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-[10px] py-2 rounded-xl uppercase tracking-wider cursor-pointer transition"
                                  >
                                    Ajukan Pembatalan (Ada Kendala)
                                  </button>
                                </>
                              )}
                            </div>
                          )}

                          {task.status === OrderStatus.CEK_LAYANAN && (
                            <div className="space-y-3">
                              {/* Service adjustment */}
                              <div className="border border-amber-200 bg-amber-50/55 p-3.5 rounded-2xl space-y-2.5">
                                <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-wider text-amber-800">
                                  <span className="flex items-center gap-1">
                                    <Sliders size={12} />
                                    Kesesuaian Paket Jasa AC
                                  </span>
                                  {editingServiceOrderId !== task.id && (
                                    <button
                                      onClick={() => handleStartEditingService(task)}
                                      className="bg-amber-600 hover:bg-amber-700 text-white font-black text-[9px] px-2.5 py-1 rounded-lg cursor-pointer uppercase tracking-wide"
                                    >
                                      Sesuaikan Jasa
                                    </button>
                                  )}
                                </div>

                                {editingServiceOrderId === task.id ? (
                                  <div className="space-y-4 pt-2 text-[11px]">
                                    {editCartServices.map((cartItem, cIdx) => (
                                      <div key={cIdx} className="bg-white p-3 rounded-xl border border-slate-200 relative">
                                        {editCartServices.length > 1 && (
                                          <button
                                            onClick={() => handleRemoveServiceFromEditCart(cIdx)}
                                            className="absolute -top-2 -right-2 bg-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white p-1.5 rounded-full transition shadow-sm"
                                          >
                                            <X size={12} />
                                          </button>
                                        )}
                                        <div className="space-y-3">
                                          <div>
                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Kategori Jasa:</label>
                                            <select
                                              value={cartItem.category}
                                              onChange={(e) => handleUpdateEditCart(cIdx, 'category', e.target.value)}
                                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-xs text-slate-800 outline-none"
                                            >
                                              <option value="">-- Pilih Kategori --</option>
                                              {categories.map(c => (
                                                <option key={c.id} value={c.name}>{c.name}</option>
                                              ))}
                                            </select>
                                          </div>
                                          {categories.find(c => c.name === cartItem.category)?.hasServices && (
                                            <div>
                                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Jenis Jasa:</label>
                                              <select
                                                value={cartItem.serviceType}
                                                onChange={(e) => handleUpdateEditCart(cIdx, 'serviceType', e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-xs text-slate-800 outline-none"
                                              >
                                                <option value="">-- Pilih Jasa --</option>
                                                {services.filter(s => {
                                                  const cat = categories.find(c => c.name === cartItem.category);
                                                  return cat && s.categoryId === cat.id;
                                                }).map(s => (
                                                  <option key={s.id} value={s.name}>{s.name}</option>
                                                ))}
                                              </select>
                                            </div>
                                          )}
                                          <div>
                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tipe/Merek AC (Opsional):</label>
                                            <select
                                              value={cartItem.acType}
                                              onChange={(e) => handleUpdateEditCart(cIdx, 'acType', e.target.value)}
                                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-xs text-slate-800 outline-none"
                                            >
                                              <option value="">Umum / Tidak Diketahui</option>
                                              {models.map(m => (
                                                <option key={m.id} value={m.name}>{m.name}</option>
                                              ))}
                                            </select>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Jumlah Unit:</label>
                                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 h-7">
                                              <button
                                                onClick={() => handleUpdateEditCart(cIdx, 'quantity', Math.max(1, cartItem.quantity - 1))}
                                                className="text-slate-500 hover:text-slate-800 font-extrabold text-[14px] px-1 cursor-pointer"
                                              >
                                                -
                                              </button>
                                              <span className="text-xs font-mono font-black w-4 text-center">{cartItem.quantity}</span>
                                              <button
                                                onClick={() => handleUpdateEditCart(cIdx, 'quantity', cartItem.quantity + 1)}
                                                className="text-slate-500 hover:text-slate-800 font-extrabold text-[12px] px-1 cursor-pointer"
                                              >
                                                +
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}

                                    <button
                                      onClick={handleAddServiceToEditCart}
                                      className="w-full border-2 border-dashed border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 font-bold text-[10px] py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                                    >
                                      <Plus size={12} /> Tambah Layanan Lain
                                    </button>

                                    <div className="flex justify-end items-center gap-1.5 pt-3 border-t border-amber-200/50">
                                      <button
                                        onClick={() => setEditingServiceOrderId(null)}
                                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[9.5px] px-3 py-2 rounded-xl uppercase cursor-pointer"
                                      >
                                        Batal
                                      </button>
                                      <button
                                        onClick={() => handleSaveServiceUpdate(task.id)}
                                        className="bg-amber-600 hover:bg-amber-700 text-white font-black text-[9.5px] px-3.5 py-2 rounded-xl uppercase cursor-pointer"
                                      >
                                        Simpan
                                      </button>
                                    </div>
                                  </div>
                                ) : Array.isArray(task.acDetail) ? (
                                  <div className="text-[10.5px] font-medium text-slate-600 bg-white/75 p-3 rounded-xl border border-amber-100/40 space-y-2">
                                    {task.acDetail.map((item, idx) => (
                                      <div key={idx} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                                        <div>Kategori: <strong className="text-slate-850 font-bold">{item.category}</strong></div>
                                        <div>Layanan: <strong className="text-indigo-700 font-extrabold">{item.serviceType === 'none' ? 'Inspeksi' : item.serviceType}</strong></div>
                                        <div className="font-mono text-[10px] mt-1 text-slate-500">
                                          {item.quantity} Unit
                                        </div>
                                      </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100/70 font-mono text-[10px]">
                                      <span>Total Layanan</span>
                                      <strong className="text-emerald-700 font-black text-[11px]">{formatRupiah(task.serviceCost || 0)}</strong>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-[10.5px] font-medium text-slate-600 bg-white/75 p-3 rounded-xl border border-amber-100/40 space-y-1">
                                    <div>Kategori: <strong className="text-slate-850 font-bold">{(task.acDetail as any)?.category}</strong></div>
                                    <div>Layanan: <strong className="text-indigo-700 font-extrabold">{(task.acDetail as any)?.serviceType === 'none' ? 'Inspeksi' : (task.acDetail as any)?.serviceType}</strong></div>
                                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100/70 font-mono text-[10px]">
                                      <span>{(task.acDetail as any)?.quantity || 0} Unit x {formatRupiah((task.serviceCost || 0) / ((task.acDetail as any)?.quantity || 1))}</span>
                                      <strong className="text-emerald-700 font-black text-[11px]">{formatRupiah(task.serviceCost || 0)}</strong>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Photo BEFORE for Order */}
                              <div className="space-y-4">
                                <span className="text-[8.5px] font-black tracking-widest text-indigo-700 uppercase block">FOTO KONDISI AWAL KESELURUHAN (BEFORE)</span>
                                <div className="border border-indigo-100 bg-white p-3.5 rounded-xl space-y-3 shadow-xs">
                                  <div className="flex flex-col gap-2">
                                    <label className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-1.8 rounded-xl text-[9.5px] font-black uppercase justify-center cursor-pointer h-9">
                                      <Camera size={13} />
                                      Upload Foto Before
                                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'before')} className="hidden" />
                                    </label>

                                    {photoBeforeUrl && (
                                      <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                                        <img src={photoBeforeUrl} alt="Preview Before" className="w-full h-full object-contain" />
                                        <button
                                          type="button"
                                          onClick={() => setPhotoBeforeUrl('')}
                                          className="absolute top-1.5 right-1.5 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md cursor-pointer"
                                        >
                                          <X size={8} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {task.workerCancelReason ? (
                                <div className="bg-amber-100 text-amber-800 p-3 rounded-xl text-xs font-bold text-center border border-amber-300 mt-3">
                                  ⏳ Menunggu verifikasi admin untuk pembatalan...
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleStartRepairAndWash(task.id)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-extrabold text-xs py-2.5 rounded-xl uppercase tracking-wider cursor-pointer disabled:cursor-not-allowed mb-2"
                                  >
                                    Konfirmasi Selesai Ulasan & Mulai Kerja
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveCancelOrderId(task.id);
                                      setCancelReasonText('');
                                    }}
                                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-[10px] py-2 rounded-xl uppercase tracking-wider cursor-pointer transition"
                                  >
                                    Ajukan Pembatalan (Ada Kendala)
                                  </button>
                                </>
                              )}
                            </div>
                          )}

                          {task.status === OrderStatus.PENGERJAAN && (
                            <button
                              onClick={() => {
                                if (addons.length > 0) setSelectedAddonId(addons[0].id);
                                setActiveWorkingTask(task);
                                setAddonsUsed([]);
                                setCompletionNotes('');
                                setPhotoAfterUrl('');
                              }}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs py-2.5 rounded-xl uppercase tracking-wider cursor-pointer"
                            >
                              Buka Panel Pengerjaan & Input Sparepart
                            </button>
                          )}

                          {task.status === OrderStatus.PAYMENT && (
                            <div className="border border-slate-200 rounded-xl p-3 bg-indigo-50/40 space-y-2.5 text-[11px] text-slate-700">
                              <span className="text-[8px] font-black uppercase text-indigo-700 block tracking-widest">Status Pelunasan Tagihan</span>
                              <div className="flex justify-between">
                                <span>Mekanisme:</span>
                                <strong className="text-slate-800 uppercase">{task.paymentMethod === 'TRANSFER' ? 'TRANSFER' : 'TUNAI'}</strong>
                              </div>
                              <div className="flex flex-col gap-1 bg-white p-2 rounded-lg border">
                                <div className="flex justify-between items-center text-[10.5px] text-slate-500">
                                  <span>Total Jasa:</span>
                                  <span className="font-mono">{formatRupiah(Number(task.serviceCost || 0) + Number(task.addonsCost || 0))}</span>
                                </div>
                                {Number(task.voucher_discount || 0) > 0 && (
                                  <div className="flex justify-between items-center text-[10px] text-red-500 font-bold">
                                    <span>Voucher ({task.voucher_code})</span>
                                    <span className="font-mono">-{formatRupiah(task.voucher_discount)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between items-center border-t pt-1 mt-0.5">
                                  <span className="font-bold">Tagihan:</span>
                                  <strong className="text-indigo-700 font-mono text-[11.5px]">{formatRupiah(Math.max(0, (task.serviceCost || 0) + (task.addonsCost || 0) - (task.voucher_discount || 0)) || task.totalCost || 0)}</strong>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handlePrintReceipt(task)}
                                className="w-full bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold text-[10px] py-2 rounded-lg uppercase tracking-wide cursor-pointer flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                              >
                                <Printer size={13} /> Cetak Nota (58mm)
                              </button>

                              {task.paymentMethod === 'CASH' || !task.paymentMethod ? (
                                <div className="space-y-1.5 pt-1">
                                  <p className="text-[10px] text-amber-800 leading-normal font-semibold">⚠️ Pembayaran Tunai. Konfirmasi kelayakan uang?</p>
                                  {task.paymentStatus === 'PAID' ? (
                                    <div className="bg-emerald-100 text-emerald-800 p-2 rounded-lg text-[10px] font-bold text-center">
                                      ✓ CASH LUNAS DI-APPROVE
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleApproveCashReceived(task.id)}
                                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] py-2 rounded-lg uppercase cursor-pointer"
                                    >
                                      Konfirmasi Terima Cash Lunas
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-2.5 pt-1">
                                  <p className="text-[10px] text-indigo-800 leading-normal font-semibold">🏦 Pembayaran Transfer / QRIS. Unggah Bukti Transaksi:</p>

                                  {paymentProofs[task.id] ? (
                                    <div className="space-y-2">
                                      <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 aspect-video max-h-40 flex items-center justify-center">
                                        <img src={paymentProofs[task.id]} alt="Bukti Transfer" className="w-full h-full object-contain" />
                                        <button
                                          type="button"
                                          onClick={() => setPaymentProofs(prev => {
                                            const updated = { ...prev };
                                            delete updated[task.id];
                                            return updated;
                                          })}
                                          className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition shadow"
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>

                                      <button
                                        onClick={() => handleApproveTransferReceived(task.id)}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] py-2 rounded-lg uppercase cursor-pointer"
                                      >
                                        Konfirmasi Terima Pembayaran Transfer
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center border border-dashed border-indigo-200 rounded-xl p-4 bg-white hover:bg-indigo-50/20 transition relative">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            try {
                                              const compressedBase64 = await compressImage(file, 1000, 1000, 0.7);
                                              setPaymentProofs(prev => ({ ...prev, [task.id]: compressedBase64 }));
                                            } catch (err) {
                                              console.error('Error compressing payment proof:', err);
                                              alert('❌ Gagal memproses gambar bukti transfer. Silakan coba lagi.');
                                            }
                                          }
                                        }}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                      />
                                      <div className="text-center space-y-1">
                                        <Camera size={18} className="mx-auto text-indigo-500" />
                                        <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-wide block">Ambil atau Pilih Foto Bukti</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}


          {/* ==================== TAB: GAJI & POIN ==================== */}
          {activeTab === 'gaji' && (
            <div className="p-4 space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider pl-1 mb-2">Transparansi Pendapatan</h3>
              
              {!mySalary && !apiError ? (
                <div className="flex justify-center items-center h-40">
                  <Loader className="animate-spin text-emerald-500" size={32} />
                </div>
              ) : apiError ? (
                <div className="bg-rose-50 text-rose-600 p-5 rounded-2xl text-center text-xs font-bold border border-rose-200 shadow-sm">
                  ⚠️ {apiError}
                </div>
              ) : (
                <>
                  {/* Saldo Tersedia */}
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-sm border border-emerald-700 p-5 text-white">
                    <h3 className="font-extrabold text-emerald-100 text-[10px] uppercase tracking-widest mb-3">Total Saldo Belum Diklaim</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-emerald-100/80 text-[10px] font-bold block mb-0.5">Saldo Gaji Utama</span>
                        <span className="text-xl font-black">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(mySalary.salary_balance || 0)}</span>
                      </div>
                      <div className="border-l border-emerald-400/30 pl-4">
                        <span className="text-emerald-100/80 text-[10px] font-bold block mb-0.5">Saldo Poin Bonus</span>
                        <span className="text-xl font-black">{mySalary.points_balance || 0}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-emerald-500/50 flex flex-col gap-2">
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleClaim('daily_salary', Number(mySalary.salary_balance))}
                          disabled={mySalary?.claims?.some((c: any) => c.status === 'pending' && c.type === 'daily_salary') || !mySalary.salary_balance || Number(mySalary.salary_balance) <= 0}
                          className="flex-1 bg-white text-emerald-700 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {mySalary?.claims?.some((c: any) => c.status === 'pending' && c.type === 'daily_salary') ? 'Menunggu...' : 'Klaim Gaji'}
                        </button>
                        <button 
                          onClick={() => handleClaim('points', Number(mySalary.points_balance))}
                          disabled={mySalary?.claims?.some((c: any) => c.status === 'pending' && c.type === 'points') || !mySalary.points_balance || Number(mySalary.points_balance) < 100}
                          className="flex-1 bg-teal-800 text-white py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-teal-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {mySalary?.claims?.some((c: any) => c.status === 'pending' && c.type === 'points') ? 'Menunggu...' : 'Klaim Poin'}
                        </button>
                      </div>
                      {(!mySalary.points_balance || Number(mySalary.points_balance) < 100) && (
                        <p className="text-[9px] text-emerald-100/70 text-right italic">*Klaim poin membutuhkan minimal saldo 100 poin</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-600 text-xs uppercase tracking-wider mb-4">Histori Perubahan Saldo (30 Hari Terakhir)</h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {mySalary.history?.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-sm">Belum ada histori.</div>
                      ) : (
                        mySalary.history?.map((h: any, i: number) => (
                          <div key={h.id || i} className="flex justify-between items-center p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                            <div>
                              <div className="font-bold text-slate-700 text-sm">{h.title}</div>
                              <div className="text-[10px] text-slate-500 mt-1">{new Date(h.date).toLocaleString('id-ID', {day: 'numeric', month:'short', hour:'2-digit', minute:'2-digit'})} • {h.notes}</div>
                            </div>
                            <div className="text-right">
                              <div className={`font-black ${h.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {h.amount > 0 ? '+' : ''}{h.type.includes('poin') ? `${h.amount} Poin` : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(h.amount)}
                              </div>
                              {h.status === 'pending' && <span className="text-[9px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase mt-1 inline-block">Pending</span>}
                              {h.status === 'rejected' && <span className="text-[9px] font-bold bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full uppercase mt-1 inline-block">Ditolak</span>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ==================== TAB: KINERJA TIM ==================== */}
          {activeTab === 'team' && (
            <div className="p-4 space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider pl-1 mb-2">Kinerja Anggota Tim (Bulan Ini)</h3>
              
              {!myTeam ? (
                 <div className="flex justify-center items-center h-40">
                   <Loader className="animate-spin text-emerald-500" size={32} />
                 </div>
              ) : myTeam.length === 0 ? (
                <div className="bg-white border rounded-2xl p-7 text-center space-y-3 shadow-xs">
                  <span className="text-xl">👥</span>
                  <p className="font-bold text-slate-850 text-xs uppercase">Belum ada anggota tim di bawah Anda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myTeam.map(member => (
                    <div key={member.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-slate-800 uppercase">{member.name}</h4>
                          <p className="text-[10px] text-slate-500 font-medium">{member.phone || '-'}</p>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${member.status === 'aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {member.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="text-center border-r border-slate-200">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Bintang</span>
                          <span className="font-bold text-sm text-amber-500 flex items-center justify-center gap-1">
                            <Star size={12} fill="currentColor" /> {member.avg_rating || '0.0'}
                          </span>
                        </div>
                        <div className="text-center border-r border-slate-200">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">AC Selesai</span>
                          <span className="font-bold text-sm text-slate-800">{member.total_ac_serviced} Unit</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Poin</span>
                          <span className="font-bold text-sm text-blue-600 flex items-center justify-center gap-1">
                            <Award size={12} /> {member.points_balance || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 2: HISTORY ==================== */}
          {activeTab === 'history' && (
            <div>
              <div className="px-5 py-2 space-y-4 animate-in fade-in duration-300">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider text-left pl-1">Data Pekerjaan Masa Lalu</h3>

                {completedTasks.length === 0 ? (
                  <div className="bg-white border rounded-2xl p-8 text-center space-y-3">
                    <span className="text-xl">📊</span>
                    <p className="font-extrabold text-xs uppercase">Belum Ada Histori</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedTasks.map(task => (
                      <div 
                        key={task.id} 
                        className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 cursor-pointer hover:shadow-md transition"
                        onClick={() => setSelectedHistoryOrder(task)}
                      >
                        <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                          <div>
                            <span className="text-[8px] font-mono text-slate-400 font-bold block">{task.id}</span>
                            <h4 className="font-bold text-xs text-slate-800 mt-0.5">{task.customerName}</h4>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-emerald-600 block">{formatRupiah(Math.max(0, Number(task.serviceCost || 0) + Number(task.addonsCost || 0) - Number(task.voucher_discount || 0)))}</span>
                            {Number(task.voucher_discount || 0) > 0 && (
                              <span className="block text-[8px] text-red-500 font-bold mt-0.5">Voucher: -{formatRupiah(task.voucher_discount)}</span>
                            )}
                            <span className="text-[8px] bg-emerald-50 text-emerald-600 font-black uppercase px-1.5 block mt-0.5 w-fit ml-auto">CLOSED</span>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-500 font-medium space-y-0.5">
                          <div>🔧 Jasa: {Array.isArray(task.acDetail)
                            ? task.acDetail.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0) + ' Unit'
                            : `${(task.acDetail as any)?.quantity || 0} Unit x ${(task.acDetail as any)?.serviceType === 'none' ? (task.acDetail as any)?.category : (task.acDetail as any)?.serviceType}`}</div>
                          <div>📅 Selesai: {task.scheduledDate}</div>
                          {task.status !== OrderStatus.DIBATALKAN && (
                            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                              <span>💳 Pembayaran:</span>
                              {task.paymentMethod === 'TRANSFER' ? (
                                <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 text-[8.5px] px-1.5 py-0.5 rounded font-black uppercase">
                                  TRANSFER (XENDIT)
                                </span>
                              ) : task.paymentMethod === 'CASH' ? (
                                <span className="bg-emerald-50 border border-emerald-150 text-emerald-700 text-[8.5px] px-1.5 py-0.5 rounded font-black uppercase">
                                  TUNAI (CASH)
                                </span>
                              ) : (
                                <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[8.5px] px-1.5 py-0.5 rounded font-black uppercase">
                                  💵 TUNAI
                                </span>
                              )}
                              <span className="bg-emerald-500 text-white text-[8px] px-1 py-0.5 rounded font-black uppercase tracking-wider">
                                LUNAS
                              </span>
                            </div>
                          )}
                          {task.completionNotes && <div className="italic text-slate-600 mt-1">"{task.completionNotes}"</div>}
                        </div>

                        {task.rating !== undefined && (
                          <div className="bg-amber-500/10 border border-amber-500/25 p-2.5 rounded-lg flex items-center justify-between">
                            <div>
                              <span className="text-[8px] text-amber-700 font-black uppercase block">Rating</span>
                              {task.ratingNotes && <p className="italic text-[10px] text-amber-900 font-bold mt-1">"{task.ratingNotes}"</p>}
                            </div>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((st) => (
                                <Star key={st} size={11} className={st <= (task.rating || 0) ? 'fill-amber-500 text-amber-500' : 'text-slate-200'} />
                              ))}
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handlePrintReceipt(task); }}
                          className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-extrabold text-[9.5px] py-2 rounded-lg uppercase tracking-wide cursor-pointer flex items-center justify-center gap-1 transition"
                        >
                          <Printer size={12} /> Cetak Ulang Nota (58mm)
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== TAB 3: PROFILE ==================== */}
          {activeTab === 'profile' && (
            <div>
              <div className="px-5 py-5 space-y-5 animate-in fade-in duration-300 max-w-2xl mx-auto">
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider pl-1 mb-2">Profil Karyawan</h3>
                {saveSuccess && (
                  <div className="bg-emerald-100 border border-emerald-250 p-2.5 rounded-xl text-[11px] text-emerald-800 font-bold flex items-center gap-2">
                    <Check size={14} /> Profil berhasil diperbarui!
                  </div>
                )}

                {errorMsg && (
                  <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-[11px] text-rose-700 font-semibold flex items-center gap-2">
                    <X size={14} /> {errorMsg}
                  </div>
                )}

                {profileViewMode === 'readonly' && (
                  <div className="bg-white border p-5 rounded-2xl shadow-xs space-y-5">
                    {activeUser.photo && (
                      <div className="flex justify-center pb-2">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border shadow-sm">
                          <img src={activeUser.photo} alt="Profile Picture" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{activeUser.name}</p>
                        </div>
                        <UserIcon size={18} className="text-slate-300" />
                      </div>

                      <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Terdaftar</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{activeUser.email}</p>
                        </div>
                        <Mail size={18} className="text-slate-300" />
                      </div>

                      <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nomor Handphone</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{activeUser.phone || <span className="italic text-slate-400 text-xs">Belum diatur</span>}</p>
                        </div>
                        <Phone size={18} className="text-slate-300" />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Alamat Rumah</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{activeUser.address || <span className="italic text-slate-400 text-xs">Belum diatur</span>}</p>
                        </div>
                        <MapPin size={18} className="text-slate-300" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3">
                      <button
                        onClick={() => { setErrorMsg(''); setProfileViewMode('edit-profile'); }}
                        className="w-full bg-teal-50 hover:bg-teal-100 text-teal-700 font-extrabold text-[10px] py-2.5 rounded-xl uppercase transition cursor-pointer"
                      >
                        Edit Profil
                      </button>
                      <button
                        onClick={() => { setErrorMsg(''); setProfileViewMode('edit-password'); }}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] py-2.5 rounded-xl uppercase transition cursor-pointer"
                      >
                        Ubah Password
                      </button>
                    </div>
                  </div>
                )}

                {profileViewMode === 'edit-profile' && (
                  <form onSubmit={handleSaveProfile} className="bg-white border p-5 rounded-2xl shadow-xs space-y-4">
                    {/* Foto Profil Upload */}
                    <div className="space-y-2 pb-2">
                      <label className="text-[9.5px] text-slate-400 font-bold uppercase block">Foto Profil</label>
                      <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <div className="w-14 h-14 bg-slate-200 text-slate-500 rounded-2xl flex items-center justify-center overflow-hidden border">
                          {editPhoto ? (
                            <img src={editPhoto} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-bold">No Photo</span>
                          )}
                        </div>
                        <div className="flex-grow text-left">
                          <span className="text-[10px] text-slate-600 font-bold block mb-1">Pilih Foto Diri</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePhotoChange}
                            className="w-full text-[10px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Nama Lengkap</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-teal-500 disabled:opacity-50 transition"
                        disabled={isLoading}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">No. Handphone</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-teal-500 disabled:opacity-50 transition"
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <label className="text-[9.5px] text-slate-400 font-bold uppercase block mb-1">Alamat Rumah</label>
                      <div className="flex gap-2">
                        <textarea
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none focus:border-teal-500 h-16 resize-none disabled:opacity-50 transition"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowProfileMapPicker(true)}
                          className="bg-teal-50 text-teal-600 border border-teal-200 rounded-xl px-3 flex flex-col items-center justify-center gap-1 hover:bg-teal-100 transition cursor-pointer"
                        >
                          <MapPin size={16} />
                          <span className="text-[8px] font-black uppercase">Peta</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setProfileViewMode('readonly')}
                        disabled={isLoading}
                        className="w-full bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-600 font-extrabold text-[10px] py-3 rounded-xl uppercase cursor-pointer transition"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white font-extrabold text-[10px] py-3 rounded-xl uppercase cursor-pointer flex items-center justify-center gap-2 transition shadow-md"
                      >
                        {isLoading && <Loader size={12} className="animate-spin" />}
                        {isLoading ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </div>
                  </form>
                )}

                {profileViewMode === 'edit-password' && (
                  <form onSubmit={handleUpdatePassword} className="bg-white border p-5 rounded-2xl shadow-xs space-y-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2 mb-2">
                      <ShieldCheck size={16} className="text-teal-600 shrink-0 mt-0.5" />
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
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-teal-500 transition"
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
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-teal-500 transition"
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
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-teal-500 transition"
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
                          setErrorMsg('');
                        }}
                        disabled={isLoading}
                        className="w-full bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-600 font-extrabold text-[10px] py-3 rounded-xl uppercase cursor-pointer transition"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-slate-900 disabled:bg-slate-400 text-white font-extrabold text-[10px] py-3 rounded-xl uppercase cursor-pointer flex items-center justify-center gap-2 transition shadow-md"
                      >
                        {isLoading && <Loader size={12} className="animate-spin" />}
                        {isLoading ? 'Menyimpan...' : 'Ubah Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

        </div>

        {/* WORK PANEL MODAL (PENGERJAAN STAGE) */}
        {activeWorkingTask && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex flex-col justify-end z-50 animate-in slide-in-from-bottom duration-300 pt-10">
            <div className="bg-white rounded-t-[24px] flex flex-col max-h-[calc(100%-2.5rem)] overflow-hidden shadow-2xl">

              <div className="px-5 py-4 border-b flex justify-between items-center bg-slate-900 text-white shrink-0">
                <div>
                  <span className="text-[8px] bg-purple-600 px-1.5 py-0.5 rounded font-black uppercase">Pengerjaan</span>
                  <h4 className="text-sm font-extrabold text-white mt-1">ID: {activeWorkingTask.id}</h4>
                </div>
                <button
                  onClick={() => setActiveWorkingTask(null)}
                  className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 pb-12 bg-slate-50">

                <div className="bg-white border rounded-xl p-3 text-[10.5px] text-slate-600">
                  <div>⚙️ Layanan: <strong>{Array.isArray(activeWorkingTask.acDetail)
                    ? activeWorkingTask.acDetail.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0) + ' Unit'
                    : `${(activeWorkingTask.acDetail as any)?.quantity || 0} Unit x ${(activeWorkingTask.acDetail as any)?.serviceType === 'none' ? (activeWorkingTask.acDetail as any)?.category : (activeWorkingTask.acDetail as any)?.serviceType}`}</strong></div>
                </div>

                {/* Photo AFTER & Notes for Order */}
                <div className="space-y-4">
                  <span className="text-[8.5px] font-black uppercase text-purple-600 tracking-wider block">1. Foto Selesai (After) Keseluruhan</span>
                  <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-3 shadow-xs">
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-1.8 rounded-xl text-[9px] font-black uppercase justify-center cursor-pointer h-9">
                        <Camera size={13} />
                        Upload Foto After
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'after')} className="hidden" />
                      </label>

                      {photoAfterUrl && (
                        <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                          <img src={photoAfterUrl} alt="Preview After" className="w-full h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setPhotoAfterUrl('')}
                            className="absolute top-1.5 right-1.5 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md cursor-pointer"
                          >
                            <X size={8} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <textarea
                        placeholder="Catatan pengerjaan secara keseluruhan..."
                        value={completionNotes}
                        onChange={e => setCompletionNotes(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-lg outline-none h-16 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Addons */}
                <div className="bg-white border rounded-xl p-3.5 space-y-3">
                  <span className="text-[8.5px] font-black uppercase text-purple-600 tracking-wider block">2. Sparepart Digunakan</span>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedAddonId}
                      onChange={(e) => setSelectedAddonId(e.target.value)}
                      className="flex-1 bg-slate-50 border text-xs p-2 rounded-xl outline-none font-bold"
                    >
                      {addons.map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({formatRupiah(a.price)})</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setAddonQuantity(Math.max(1, addonQuantity - 1))}
                        className="w-8 h-8 bg-slate-100 border rounded-lg font-bold text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs bg-white font-extrabold border rounded">{addonQuantity}</span>
                      <button
                        onClick={() => setAddonQuantity(Math.min(10, addonQuantity + 1))}
                        className="w-8 h-8 bg-slate-100 border rounded-lg font-bold text-xs cursor-pointer"
                      >
                        +
                      </button>
                      <button
                        onClick={handleAddAddonItem}
                        className="bg-purple-600 text-white font-black text-[10px] py-2 px-3 rounded-lg cursor-pointer"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1.5 border-t border-slate-100">
                    {addonsUsed.length === 0 ? (
                      <span className="text-[9.5px] text-slate-400 font-bold italic block">Belum ada sparepart tambahan.</span>
                    ) : (
                      <div className="space-y-1.5">
                        {addonsUsed.map(add => (
                          <div key={add.id} className="flex justify-between items-center text-[10.5px]">
                            <span className="font-semibold text-slate-700">• {add.name} (x{add.quantity}) {formatRupiah(add.price)}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-800">{formatRupiah(add.price * add.quantity)}</span>
                              <button
                                onClick={() => handleRemoveAddonItem(add.id)}
                                className="text-red-500 hover:bg-red-50 p-1 rounded cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Completion notes */}
                <div>
                  <label className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mb-1">3. Catatan Penyelesaian</label>
                  <textarea
                    placeholder="Contoh: Selesai menyemprot, membersihkan filter, isi freon 0.5 amp..."
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs p-3 rounded-xl outline-none h-20 resize-none font-medium leading-relaxed"
                  />
                </div>

                <button
                  onClick={() => handleSendBillToCustomer(activeWorkingTask.id)}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs py-3.5 rounded-xl uppercase tracking-widest cursor-pointer shadow-md"
                >
                  Kirim Tagihan Layanan ke Pelanggan
                </button>

              </div>
            </div>
          </div>
        )}

      </div>

      {/* Cancellation Modal */}
      {activeCancelOrderId && (
        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 backdrop-blur-sm">
          <div className="bg-white border rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl text-left scale-in-center">
            <div className="p-5 border-b border-slate-100 bg-rose-50/50 flex justify-between items-center">
              <div>
                <h4 className="font-black text-sm text-rose-700 uppercase tracking-wide">Ajukan Pembatalan</h4>
                <p className="text-[10px] text-rose-500 mt-1 font-semibold">Berikan alasan rinci kepada admin</p>
              </div>
              <button
                onClick={() => setActiveCancelOrderId(null)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-200 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block mb-1.5">Alasan Kendala</label>
                <textarea
                  autoFocus
                  placeholder="Contoh: Alamat tidak ditemukan, pelanggan tidak ada di rumah, alat rusak..."
                  value={cancelReasonText}
                  onChange={(e) => setCancelReasonText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs p-3.5 rounded-xl outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 h-28 resize-none font-medium leading-relaxed transition-all text-slate-700"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveCancelOrderId(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[11px] py-3 rounded-xl uppercase tracking-wider cursor-pointer transition"
                >
                  Kembali
                </button>
                <button
                  onClick={handleRequestCancelWorker}
                  disabled={!cancelReasonText.trim()}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-black text-[11px] py-3 rounded-xl uppercase tracking-wider cursor-pointer shadow-md transition disabled:cursor-not-allowed"
                >
                  Kirim Ajuan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Map Picker Modal for Profile */}
      {showProfileMapPicker && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden animate-in fade-in duration-300">
          <MapPicker
            onLocationSelect={(address, lat, lng) => {
              setEditAddress(address);
              setEditLat(lat);
              setEditLng(lng);
              setShowProfileMapPicker(false);
            }}
            onCancel={() => setShowProfileMapPicker(false)}
          />
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-2">
              <LogOut size={32} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Keluar dari Akun?</h3>
              <p className="text-xs font-medium text-slate-500 mt-2">Anda harus login kembali untuk mengakses pekerjaan Anda.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => setShowLogoutConfirm(false)} className="py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Batal</button>
              <button onClick={() => { setShowLogoutConfirm(false); logout(); }} className="py-3 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-500/30 transition">Ya, Keluar</button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER DETAIL MODAL */}
      {selectedHistoryOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedHistoryOrder(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="p-4 bg-emerald-600 text-white flex justify-between items-center shrink-0">
              <div>
                <h4 className="font-black text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={16} /> Detail Pesanan
                </h4>
                <p className="text-[10px] text-emerald-200 mt-0.5 font-mono">{selectedHistoryOrder.id}</p>
              </div>
              <button onClick={() => setSelectedHistoryOrder(null)} className="p-1 hover:bg-emerald-500 rounded-full transition cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 text-slate-700 text-xs">
              
              {/* Header Status */}
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Status Pesanan</span>
                  <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded mt-1 inline-block ${selectedHistoryOrder.status === OrderStatus.DIBATALKAN ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                    {selectedHistoryOrder.status === OrderStatus.DIBATALKAN ? 'DIBATALKAN' : 'SELESAI'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Tanggal Selesai</span>
                  <span className="font-bold text-slate-700 mt-1 block">{selectedHistoryOrder.completedAt ? new Date(selectedHistoryOrder.completedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : selectedHistoryOrder.scheduledDate}</span>
                </div>
              </div>

              {/* Worker / Customer Info */}
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Pelanggan</span>
                <div className="font-bold bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <UserIcon size={14} className="text-slate-400" />
                    {selectedHistoryOrder.customerName}
                  </div>
                  <div className="flex items-start gap-2 mt-1 text-[10.5px] font-medium text-slate-500">
                    <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{selectedHistoryOrder.address}</span>
                  </div>
                </div>
              </div>

              {/* Service Items */}
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Detail Jasa AC</span>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-2">
                  {Array.isArray(selectedHistoryOrder.acDetail) ? (
                    selectedHistoryOrder.acDetail.map((detail: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center border-b border-slate-200/60 pb-2 last:border-0 last:pb-0">
                        <div>
                          <span className="font-bold text-slate-800">{detail.serviceType === 'none' ? detail.category : detail.serviceType}</span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">{detail.acType}</span>
                        </div>
                        <span className="font-black text-slate-700">{detail.quantity} Unit</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-800">{(selectedHistoryOrder.acDetail as any)?.serviceType === 'none' ? (selectedHistoryOrder.acDetail as any)?.category : (selectedHistoryOrder.acDetail as any)?.serviceType}</span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">{(selectedHistoryOrder.acDetail as any)?.acType}</span>
                      </div>
                      <span className="font-black text-slate-700">{(selectedHistoryOrder.acDetail as any)?.quantity} Unit</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Addons Used */}
              {selectedHistoryOrder.addonsUsed && selectedHistoryOrder.addonsUsed.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Perlengkapan Tambahan</span>
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl space-y-1.5">
                    {selectedHistoryOrder.addonsUsed.map((ad: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-[10.5px]">
                        <span className="text-amber-800 font-medium">🔧 {ad.name} ({ad.quantity}x)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Costs */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Biaya Jasa</span>
                  <span className="font-mono">{formatRupiah(selectedHistoryOrder.serviceCost)}</span>
                </div>
                {selectedHistoryOrder.addonsCost > 0 && (
                  <div className="flex justify-between text-[11px] text-slate-600 mt-1">
                    <span>Biaya Perlengkapan Tambahan</span>
                    <span className="font-mono">{formatRupiah(selectedHistoryOrder.addonsCost)}</span>
                  </div>
                )}
                {Number(selectedHistoryOrder.voucher_discount || 0) > 0 && (
                  <div className="flex justify-between text-[11px] text-red-650 font-bold mt-1">
                    <span>Diskon Voucher ({selectedHistoryOrder.voucher_code})</span>
                    <span className="font-mono">-{formatRupiah(selectedHistoryOrder.voucher_discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-emerald-700 text-sm mt-2 pt-2 border-t border-slate-200">
                  <span>Total Harga Layanan</span>
                  <span className="font-mono">{formatRupiah(Math.max(0, Number(selectedHistoryOrder.serviceCost || 0) + Number(selectedHistoryOrder.addonsCost || 0) - Number(selectedHistoryOrder.voucher_discount || 0)))}</span>
                </div>
              </div>

              {/* Notes & Rating */}
              {selectedHistoryOrder.completionNotes && (
                <div className="space-y-1 pt-2">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Catatan Anda</span>
                  <p className="italic text-slate-600 bg-slate-50 p-2 rounded-lg text-[10.5px] border border-slate-100">"{selectedHistoryOrder.completionNotes}"</p>
                </div>
              )}

              {selectedHistoryOrder.cancelReason && (
                <div className="space-y-1 pt-2">
                  <span className="text-[9px] font-black uppercase text-red-400 tracking-wider">Alasan Batal</span>
                  <p className="text-red-700 bg-red-50 p-2 rounded-lg text-[10.5px] border border-red-100 font-bold">"{selectedHistoryOrder.cancelReason}"</p>
                </div>
              )}

            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setSelectedHistoryOrder(null)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-3 rounded-xl uppercase tracking-wider transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}


    </>
  );
}
