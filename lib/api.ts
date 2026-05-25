/**
 * API Service - Connect ke Backend MySQL Database
 * For use in Next.js Client Components
 */

import { Role } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// ===== AUTHENTICATION HELPERS =====
// Authentication handled via MySQL database sessions, no localStorage tokens
export const getAuthHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
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

// ===== USERS =====
export const fetchUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
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
    console.log('🔄 Updating user:', userId);
    console.log('📤 Payload:', userData);
    
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
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

// ===== ORDERS =====
export const fetchOrders = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
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
export const fetchModels = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/models`);
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
export const fetchCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`);
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
export const fetchServices = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/services`);
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

// ===== AC ADDONS =====
export const fetchAddons = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/addons`);
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
