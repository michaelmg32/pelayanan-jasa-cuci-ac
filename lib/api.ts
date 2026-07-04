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

const API_BASE_URL = getApiBaseUrl();

// ===== AUTHENTICATION HELPERS =====
// Authentication handled via MySQL database sessions, reading token from cookies
export const getAuthHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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
  };
  return roleMap[frontendRole] || 'pelanggan';
};


// ===== REGIONS =====
export const fetchRegions = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/regions`);
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Failed to create user');
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
    
    console.log('🔄 Updating user:', userId);
    console.log('📤 Payload:', payload);
    
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    
    console.log('📡 Response status:', response.status);
    
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
    const response = await fetch(url);
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
    const response = await fetch(url);
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
    const response = await fetch(url);
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
    const response = await fetch(url);
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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

export const fetchAddonTransactions = async (addonId?: string) => {
  try {
    const query = addonId ? `?addonId=${addonId}` : '';
    const response = await fetch(`${API_BASE_URL}/addons/transactions${query}`, {
      headers: getAuthHeaders(),
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
    const response = await fetch(url);
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
    const response = await fetch(`${API_BASE_URL}/settings`);
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
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
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
  try {
    const response = await fetch(`${API_BASE_URL}/activity-logs`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch activity logs');
    return await response.json();
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }
};
