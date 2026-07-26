/**
 * API Service - Connect ke Backend MySQL Database
 * For use in Next.js Client Components
 */

import { Role } from '@/types';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
};

export const API_BASE_URL = getApiBaseUrl();

// ===== AUTHENTICATION HELPERS =====
// Authentication handled via MySQL database sessions, reading token from cookies
export const getAuthHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
  
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(c => c.trim().startsWith('auth_token='));
    if (tokenCookie) {
      const token = tokenCookie.trim().substring(11); // 'auth_token='.length === 11
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      headers['Authorization'] = 'Bearer dummy-jwt-token-123';
    }
    
    try {
      const activeRegion = localStorage.getItem('activeRegionId');
      if (activeRegion) {
        headers['X-Active-Region'] = activeRegion;
      }
    } catch (e) {}
  } else {
    headers['Authorization'] = 'Bearer dummy-jwt-token-123';
  }
  
  return headers;
};

// ===== ROLE MAPPING =====
const normalizeRole = (dbRole: string): string => {
  const roleMap: Record<string, string> = {
    'pelanggan': Role.USER,
    'customer': Role.USER,
    'karyawan': Role.STAFF,
    'staff': Role.STAFF,
    'admin': Role.ADMIN,
    'owner': Role.OWNER,
    'keuangan': Role.KEUANGAN,
    'finance': Role.KEUANGAN,
  };
  return roleMap[dbRole.toLowerCase()] || Role.USER;
};

export const normalizeUser = (user: any) => {
  return {
    ...user,
    role: normalizeRole(user.role),
  };
};

export const denormalizeRole = (frontendRole: string): string => {
  const roleMap: Record<string, string> = {
    [Role.USER]: 'pelanggan',
    [Role.STAFF]: 'karyawan',
    [Role.ADMIN]: 'admin',
    [Role.OWNER]: 'owner',
    [Role.KEUANGAN]: 'keuangan',
  };
  return roleMap[frontendRole] || 'pelanggan';
};


// ===== REGIONS =====
export const fetchRegions = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/regions`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to fetch regions');
    return await response.json();
  } catch (error) {
    console.error('Error fetching regions:', error);
    return [];
  }
};
export const createRegion = async (regionData: {name: string}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/regions`, {
      method: 'POST',
      headers: getAuthHeaders(), cache: 'no-store',
      body: JSON.stringify(regionData),
    });
    if (!response.ok) throw new Error('Failed to create region');
    return await response.json();
  } catch (error) { throw error; }
};
export const deleteRegion = async (regionId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/regions/${regionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(), cache: 'no-store',
    });
    if (!response.ok) throw new Error('Failed to delete region');
    return await response.json();
  } catch (error) { throw error; }
};

// ===== USERS =====
export const fetchUsers = async (region_id?: string) => {
  try {
    const url = region_id ? `${API_BASE_URL}/users?region_id=${region_id}` : `${API_BASE_URL}/users`;
    const response = await fetch(url, {
      headers: getAuthHeaders(), cache: 'no-store',
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    const users = await response.json();
    return users.map(normalizeUser);
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const createUser = async (userData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(), cache: 'no-store',
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to create user');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (userId: string, userData: any) => {
  try {
    const payload = { ...userData };
    if (payload.role) {
      payload.role = denormalizeRole(payload.role);
    }
    
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(), cache: 'no-store',
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Server response error:', response.status, errorData);
      throw new Error(errorData.error || `Failed to update user: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ User updated successfully:', result);
    return result;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const activateUser = async (userId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/activate`, {
      method: 'PUT',
      headers: getAuthHeaders(), cache: 'no-store',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Gagal mengaktifkan pengguna: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error activating user:', error);
    throw error;
  }
};

export const updatePassword = async (userId: string, passwordData: { oldPassword: string, newPassword: string }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/password`, {
      method: 'PUT',
      headers: getAuthHeaders(), cache: 'no-store',
      body: JSON.stringify(passwordData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Gagal update password: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

// ===== ORDERS =====
export const fetchOrders = async (region_id?: string) => {
  try {
    const url = region_id ? `${API_BASE_URL}/orders?region_id=${region_id}` : `${API_BASE_URL}/orders`;
    const response = await fetch(url, {
      headers: getAuthHeaders(), cache: 'no-store',
    });
    if (!response.ok) throw new Error('Failed to fetch orders');
    return await response.json();
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

export const createOrder = async (orderData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(), cache: 'no-store',
      body: JSON.stringify(orderData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create order: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const updateOrder = async (orderId: string, orderData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'PUT',
      headers: getAuthHeaders(), cache: 'no-store',
      body: JSON.stringify(orderData),
    });
    if (!response.ok) throw new Error('Failed to update order');
    return await response.json();
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};

// ===== AC MODELS =====
export const fetchModels = async (region_id?: string) => {
  try {
    const url = region_id ? `${API_BASE_URL}/models?region_id=${region_id}` : `${API_BASE_URL}/models`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to fetch models');
    return await response.json();
  } catch (error) {
    console.error('Error fetching models:', error);
    return [];
  }
};

export const createModel = async (modelData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/models`, {
      method: 'POST',
      headers: getAuthHeaders(), cache: 'no-store',
      body: JSON.stringify(modelData),
    });
    if (!response.ok) throw new Error('Failed to create model');
    return await response.json();
  } catch (error) {
    console.error('Error creating model:', error);
    throw error;
  }
};

export const updateModel = async (modelId: string, modelData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/models/${modelId}`, {
      method: 'PUT',
      headers: getAuthHeaders(), cache: 'no-store',
      body: JSON.stringify(modelData),
    });
    if (!response.ok) throw new Error('Failed to update model');
    return await response.json();
  } catch (error) {
    console.error('Error updating model:', error);
    throw error;
  }
};

export const deleteModel = async (modelId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/models/${modelId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(), cache: 'no-store',
    });
    if (!response.ok) throw new Error('Failed to delete model');
    return await response.json();
  } catch (error) {
    console.error('Error deleting model:', error);
    throw error;
  }
};

// ===== AC CATEGORIES =====
export const fetchCategories = async (region_id?: string) => {
  try {
    const url = region_id ? `${API_BASE_URL}/categories?region_id=${region_id}` : `${API_BASE_URL}/categories`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to fetch categories');
    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const createCategory = async (categoryData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: getAuthHeaders(), cache: 'no-store',
      body: JSON.stringify(categoryData),
    });
    if (!response.ok) throw new Error('Failed to create category');
    return await response.json();
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const updateCategory = async (categoryId: string, categoryData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
      method: 'PUT',
      headers: getAuthHeaders(), cache: 'no-store',
      body: JSON.stringify(categoryData),
    });
    if (!response.ok) throw new Error('Failed to update category');
    return await response.json();
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (categoryId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(), cache: 'no-store',
    });
    if (!response.ok) throw new Error('Failed to delete category');
    return await response.json();
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// ===== AC SERVICES =====
export const fetchServices = async (region_id?: string) => {
  try {
    const url = region_id ? `${API_BASE_URL}/services?region_id=${region_id}` : `${API_BASE_URL}/services`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to fetch services');
    return await response.json();
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

export const createService = async (serviceData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/services`, {
      method: 'POST',
      headers: getAuthHeaders(), cache: 'no-store',
      body: JSON.stringify(serviceData),
    });
    if (!response.ok) throw new Error('Failed to create service');
    return await response.json();
  } catch (error) {
    console.error('Error creating service:', error);
    throw error;
  }
};

export const updateService = async (serviceId: string, serviceData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
      method: 'PUT',
      headers: getAuthHeaders(), cache: 'no-store',
      body: JSON.stringify(serviceData),
    });
    if (!response.ok) throw new Error('Failed to update service');
    return await response.json();
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};

export const deleteService = async (serviceId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(), cache: 'no-store',
    });
    if (!response.ok) throw new Error('Failed to delete service');
    return await response.json();
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
};

// ===== AC SERVICE PRICES =====
export const fetchServicePrices = async (region_id?: string) => {
  try {
    const url = region_id ? `${API_BASE_URL}/service-prices?region_id=${region_id}` : `${API_BASE_URL}/service-prices`;
    const response = await fetch(url, {
      headers: getAuthHeaders(), cache: 'no-store',
    });
    if (!response.ok) throw new Error('Failed to fetch service prices');
    return await response.json();
  } catch (error) {
    console.error('Error fetching service prices:', error);
    return [];
  }
};

export const updateServicePricesBulk = async (serviceId: string, prices: any[]) => {
  try {
    const response = await fetch(`${API_BASE_URL}/service-prices/bulk`, {
      method: 'POST',
      headers: getAuthHeaders(), cache: 'no-store',
      body: JSON.stringify({ serviceId, prices }),
    });
    if (!response.ok) throw new Error('Failed to update service prices bulk');
    return await response.json();
  } catch (error) {
    console.error('Error updating service prices bulk:', error);
    throw error;
  }
};

// ===== AC ADDONS =====
export const fetchAddons = async (region_id?: string) => {
  try {
    const url = region_id ? `${API_BASE_URL}/addons?region_id=${region_id}` : `${API_BASE_URL}/addons`;
    const response = await fetch(url, { 
      headers: getAuthHeaders(),
      cache: 'no-store' 
    });
    if (!response.ok) throw new Error('Failed to fetch addons');
    return await response.json();
  } catch (error) {
    console.error('Error fetching addons:', error);
    return [];
  }
};

export const createAddon = async (addonData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/addons`, {
      method: 'POST',
      headers: getAuthHeaders(), cache: 'no-store',
      body: JSON.stringify(addonData),
    });
    if (!response.ok) throw new Error('Failed to create addon');
    return await response.json();
  } catch (error) {
    console.error('Error creating addon:', error);
    throw error;
  }
};

export const updateAddon = async (addonId: string, addonData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/addons/${addonId}`, {
      method: 'PUT',
      headers: getAuthHeaders(), cache: 'no-store',
      body: JSON.stringify(addonData),
    });
    if (!response.ok) throw new Error('Failed to update addon');
    return await response.json();
  } catch (error) {
    console.error('Error updating addon:', error);
    throw error;
  }
};

export const deleteAddon = async (addonId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/addons/${addonId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(), cache: 'no-store',
    });
    if (!response.ok) throw new Error('Failed to delete addon');
    return await response.json();
  } catch (error) {
    console.error('Error deleting addon:', error);
    throw error;
  }
};

export const purchaseAddon = async (addonId: string, purchaseData: { qty: number; price: number; notes?: string }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/addons/purchase`, {
      method: 'POST',
      headers: getAuthHeaders(), cache: 'no-store',
      body: JSON.stringify({ addonId, ...purchaseData }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to purchase addon');
    }
    return await response.json();
  } catch (error) {
    console.error('Error purchasing addon:', error);
    throw error;
  }
};

export const adjustAddons = async (adjustments: { addonId: string; systemStock: number; physicalStock: number; notes?: string }[]) => {
  try {
    const response = await fetch(`${API_BASE_URL}/addons/adjust`, {
      method: 'POST',
      headers: getAuthHeaders(), cache: 'no-store',
      body: JSON.stringify({ adjustments }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to adjust stock');
    }
    return await response.json();
  } catch (error) {
    console.error('Error adjusting stock:', error);
    throw error;
  }
};

// ===== FIXED ASSETS =====
export const fetchFixedAssets = async (region_id?: string) => {
  try {
    const url = region_id ? `${API_BASE_URL}/fixed-assets?region_id=${region_id}` : `${API_BASE_URL}/fixed-assets`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Failed to fetch fixed assets');
    return await response.json();
  } catch (error) {
    console.error('Error fetching fixed assets:', error);
    return [];
  }
};

export const createFixedAsset = async (assetData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/fixed-assets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      cache: 'no-store',
      body: JSON.stringify(assetData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create fixed asset');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating fixed asset:', error);
    throw error;
  }
};

export const updateFixedAsset = async (assetId: number, assetData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/fixed-assets/${assetId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      cache: 'no-store',
      body: JSON.stringify(assetData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update fixed asset');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating fixed asset:', error);
    throw error;
  }
};

export const deleteFixedAsset = async (assetId: number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/fixed-assets/${assetId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete fixed asset');
    }
    return await response.json();
  } catch (error) {
    console.error('Error deleting fixed asset:', error);
    throw error;
  }
};

export const fetchAddonTransactions = async (addonId?: string) => {
  try {
    const query = addonId ? `?addonId=${addonId}` : '';
    const response = await fetch(`${API_BASE_URL}/addons/transactions${query}`, {
      headers: getAuthHeaders(), cache: 'no-store',
    });
    if (!response.ok) throw new Error('Failed to fetch addon transactions');
    return await response.json();
  } catch (error) {
    console.error('Error fetching addon transactions:', error);
    return [];
  }
};


// ===== TEST CONNECTION =====
export const testConnection = async () => {
  try {
    const url = `${API_BASE_URL}/test-connection`;
    console.log('🔗 Connecting to:', url);
    const response = await fetch(url, { cache: 'no-store' });
    console.log('📡 Response status:', response.status);
    if (!response.ok) {
      console.error('❌ Connection failed with status:', response.status);
      throw new Error(`Failed to test connection: ${response.status}`);
    }
    const data = await response.json();
    console.log('✅ Connection successful:', data);
    return data;
  } catch (error) {
    console.error('❌ Error testing connection:', error);
    return null;
  }
};

// ===== APP CONFIG / SETTINGS =====
export const fetchSettings = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/settings`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to fetch settings');
    return await response.json();
  } catch (error) {
    console.error('Error fetching settings:', error);
    return { business_name: 'CoolAir Pro', business_logo: '' };
  }
};

export const updateSettings = async (settingsData: { 
  business_name?: string; 
  business_logo?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
  qris_image?: string;
  phone_number?: string;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(), cache: 'no-store',
      body: JSON.stringify(settingsData),
    });
    if (!response.ok) throw new Error('Failed to update settings');
    return await response.json();
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

// ===== ACTIVITY LOGS =====
export const fetchActivityLogs = async () => {
  return [];
};

// ===== VOUCHERS API =====
export const fetchVouchers = async (region_id?: string) => {
  try {
    const url = region_id ? `${API_BASE_URL}/vouchers?region_id=${region_id}` : `${API_BASE_URL}/vouchers`;
    const response = await fetch(url, {
      headers: getAuthHeaders(), cache: 'no-store',
    });
    if (!response.ok) throw new Error('Failed to fetch vouchers');
    return await response.json();
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    return [];
  }
};

export const createVoucher = async (voucherData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/vouchers`, {
      method: 'POST',
      headers: getAuthHeaders(), cache: 'no-store',
      body: JSON.stringify(voucherData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create voucher');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating voucher:', error);
    throw error;
  }
};

export const updateVoucher = async (voucherId: string, voucherData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/vouchers/${voucherId}`, {
      method: 'PUT',
      headers: getAuthHeaders(), cache: 'no-store',
      body: JSON.stringify(voucherData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update voucher');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating voucher:', error);
    throw error;
  }
};

export const deleteVoucher = async (voucherId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/vouchers/${voucherId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(), cache: 'no-store',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete voucher');
    }
    return await response.json();
  } catch (error) {
    console.error('Error deleting voucher:', error);
    throw error;
  }
};

export const validateVoucher = async (validationData: {
  code: string;
  region_id: string;
  userId: string;
  orderAmount: number;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/vouchers/validate`, {
      method: 'POST',
      headers: getAuthHeaders(), cache: 'no-store',
      body: JSON.stringify(validationData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Voucher tidak valid');
    }
    return await response.json();
  } catch (error) {
    console.error('Error validating voucher:', error);
    throw error;
  }
};

// =====================================================================
// PAYROLL SYSTEM API
// =====================================================================

// --- STAFF GRADES ---
export const fetchStaffGrades = async () => {
  const response = await fetch(`${API_BASE_URL}/staff-grades`, {
    headers: getAuthHeaders(), cache: 'no-store'
  });
  if (!response.ok) throw new Error('Gagal memuat data grade.');
  return await response.json();
};

export const createStaffGrade = async (data: {
  name: string;
  description: string;
  region_id?: string;
  leader_daily_base_salary: number;
  leader_daily_travel_allowance: number;
  leader_point_reward: number;
  member_daily_base_salary: number;
  member_daily_travel_allowance: number;
  member_point_reward: number;
}) => {
  const res = await fetch(`${API_BASE_URL}/staff-grades`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Gagal membuat grade');
  return res.json();
};

export const updateStaffGrade = async (id: string, data: {
  name: string;
  description: string;
  leader_daily_base_salary: number;
  leader_daily_travel_allowance: number;
  leader_point_reward: number;
  member_daily_base_salary: number;
  member_daily_travel_allowance: number;
  member_point_reward: number;
}) => {
  const res = await fetch(`${API_BASE_URL}/staff-grades/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Gagal update grade');
  return res.json();
};

export const deleteStaffGrade = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/staff-grades/${id}`, {
    method: 'DELETE', headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal menghapus grade.');
  }
  return await response.json();
};

export const assignGradeToUser = async (userId: string, gradeId: string | null) => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/grade`, {
    method: 'PUT', headers: getAuthHeaders(),
    body: JSON.stringify({ grade_id: gradeId }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal mengatur grade karyawan.');
  }
  return await response.json();
};

export const assignTeam = async (grade_id: string, leader_id: string, member_ids: string[]) => {
  const res = await fetch(`${API_BASE_URL}/staff/assign-team`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ grade_id, leader_id, member_ids }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Gagal update team');
  return res.json();
};

// --- SALARY ---
export const fetchSalaryStaff = async () => {
  const response = await fetch(`${API_BASE_URL}/salary/staff`, {
    headers: getAuthHeaders(), cache: 'no-store'
  });
  if (!response.ok) throw new Error('Gagal memuat data karyawan.');
  return await response.json();
};

export const previewSalary = async (period_month: string, region_id?: string) => {
  const response = await fetch(`${API_BASE_URL}/salary/generate`, {
    method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify({ period_month, region_id, commit: false }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal preview gaji.');
  }
  return await response.json();
};

export const generateSalary = async (period_month: string, region_id?: string) => {
  const response = await fetch(`${API_BASE_URL}/salary/generate`, {
    method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify({ period_month, region_id, commit: true }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal generate gaji.');
  }
  return await response.json();
};

export const fetchSalaryRecords = async (params?: { period_month?: string; staff_id?: string }) => {
  const query = new URLSearchParams();
  if (params?.period_month) query.set('period_month', params.period_month);
  if (params?.staff_id) query.set('staff_id', params.staff_id);
  const response = await fetch(`${API_BASE_URL}/salary/records?${query.toString()}`, {
    headers: getAuthHeaders(), cache: 'no-store'
  });
  if (!response.ok) throw new Error('Gagal memuat riwayat gaji.');
  return await response.json();
};

export const updateSalaryStatus = async (id: string, status: 'PENDING' | 'PAID', notes?: string) => {
  const response = await fetch(`${API_BASE_URL}/salary/records/${id}`, {
    method: 'PUT', headers: getAuthHeaders(),
    body: JSON.stringify({ status, notes }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal memperbarui status gaji.');
  }
  return await response.json();
};

export const fetchSalarySummary = async (year?: number) => {
  const query = year ? `?year=${year}` : '';
  const response = await fetch(`${API_BASE_URL}/salary/summary${query}`, {
    headers: getAuthHeaders(), cache: 'no-store'
  });
  if (!response.ok) throw new Error('Gagal memuat ringkasan gaji.');
  return await response.json();
};

export const updateStaffSalarySettings = async (id: string, salary_type: string, monthly_salary_date: number | null) => {
  const res = await fetch(`${API_BASE_URL}/users/${id}/salary-settings`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ salary_type, monthly_salary_date }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Gagal update pengaturan gaji');
  return res.json();
};

export const triggerMonthlySalaryProcessing = async () => {
  const res = await fetch(`${API_BASE_URL}/salary/process-monthly`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Gagal memproses gaji bulanan');
  return res.json();
};

export const fetchAccessibleRegions = async () => {
  const res = await fetch(`${API_BASE_URL}/accessible-regions`, { headers: getAuthHeaders(), cache: 'no-store' });
  if (!res.ok) throw new Error('Gagal memuat region');
  return res.json();
};

export const createSalaryAdjustment = async (data: { user_id: string, balance_type: 'salary'|'points', type: 'addition'|'deduction', amount: number, description: string }) => {
  const res = await fetch(`${API_BASE_URL}/salary-adjustments`, {
    method: 'POST',
    headers: getAuthHeaders(), cache: 'no-store',
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};
