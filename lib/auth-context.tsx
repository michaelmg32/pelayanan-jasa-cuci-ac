'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Role, OrderStatus, User, Order, ACModel, ACCategory, ACService, ACAddon } from '@/types';
import * as api from './api';
import CustomAlertDialog from '@/components/CustomAlertDialog';

interface AppContextType {
  // Users
  users: User[];
  setUsers: (users: User[]) => void;
  activeUser: User | null;
  setActiveUser: (user: User | null) => void;
  
  // Orders
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  
  // Master data
  regions: any[];
  setRegions: (regions: any[]) => void;
  models: ACModel[];
  setModels: (models: ACModel[]) => void;
  categories: ACCategory[];
  setCategories: (categories: ACCategory[]) => void;
  services: ACService[];
  setServices: (services: ACService[]) => void;
  servicePrices: any[];
  setServicePrices: (prices: any[]) => void;
  addons: ACAddon[];
  setAddons: (addons: ACAddon[]) => void;
  
  isLoading: boolean;
  dbConnected: boolean;
  appSettings: any;
  updateAppSettings: (
    business_name: string, 
    business_logo: string,
    bank_name?: string,
    bank_account_number?: string,
    bank_account_holder?: string,
    qris_image?: string
  ) => Promise<void>;
  
  // Actions
  login: (user: User) => void;
  logout: () => void;
  registerCustomer: (name: string, email: string, phone: string, address: string) => Promise<void>;
  addNewOrder: (orderData: any) => Promise<void>;
  assignEmployee: (orderId: string, staffId: string, staffName: string, extraPayload?: Partial<Order>) => Promise<void>;
  showAlert: (message: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Core States
  const [users, setUsers] = useState<User[]>([]);

  // Custom Alert state
  const [customAlert, setCustomAlert] = useState<{ message: string; isOpen: boolean }>({ message: '', isOpen: false });

  const showAlert = (message: string) => {
    console.log('🔔 showAlert called with message:', message);
    setCustomAlert({ message, isOpen: true });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.alert = (msg) => {
        console.log('🚨 Intercepted window.alert! Message:', msg);
        showAlert(String(msg));
      };
    }
  }, []);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeUser, setActiveUserState] = useState<User | null>(null);

  // Master Lists State
  const [regions, setRegions] = useState<any[]>([]);
  const [models, setModels] = useState<ACModel[]>([]);
  const [categories, setCategories] = useState<ACCategory[]>([]);
  const [services, setServices] = useState<ACService[]>([]);
  const [servicePrices, setServicePrices] = useState<any[]>([]);
  const [addons, setAddons] = useState<ACAddon[]>([]);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState(false);
  const [appSettings, setAppSettings] = useState<any>({});

  // Initialize data from database
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('📦 Fetching data from database...');
        
        // Test database connection
        const connectionTest = await api.testConnection();
        if (connectionTest) {
          setDbConnected(true);
          console.log('✅ Database connected!');
        } else {
          console.warn('⚠️ Database not connected, using fallback data');
          setDbConnected(false);
        }

        // Fetch all data
        const [fetchedRegions, fetchedUsers, fetchedOrders, fetchedModels, fetchedServices, fetchedCategories, fetchedAddons, fetchedSettings, fetchedServicePrices] = await Promise.all([
          api.fetchRegions ? api.fetchRegions() : Promise.resolve([]),
          api.fetchUsers(),
          api.fetchOrders(),
          api.fetchModels(),
          api.fetchServices(),
          api.fetchCategories(),
          api.fetchAddons(),
          api.fetchSettings(),
          api.fetchServicePrices(),
        ]);

        if (setRegions) setRegions(fetchedRegions);
        setUsers(fetchedUsers);
        setOrders(fetchedOrders);
        setModels(fetchedModels);
        setServices(fetchedServices);
        setServicePrices(fetchedServicePrices);
        setCategories(fetchedCategories);
        setAddons(fetchedAddons);
        if (fetchedSettings) { setAppSettings(fetchedSettings); }

        // Restore active user session from localStorage
        if (typeof window !== 'undefined') {
          const savedUserId = localStorage.getItem('active_user_id');
          if (savedUserId) {
            const matchedUser = fetchedUsers.find((u: User) => u.id === savedUserId);
            if (matchedUser) {
              setActiveUserState(matchedUser);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error initializing data from database:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // Realtime auto-refresh polling for orders & users (every 4 seconds)
  useEffect(() => {
    if (!dbConnected) return;

    const interval = setInterval(async () => {
      try {
        const [fetchedOrders, fetchedUsers] = await Promise.all([
          api.fetchOrders(),
          api.fetchUsers(),
        ]);

        if (fetchedOrders && Array.isArray(fetchedOrders)) {
          setOrders(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(fetchedOrders)) {
              return fetchedOrders;
            }
            return prev;
          });
        }

        if (fetchedUsers && Array.isArray(fetchedUsers)) {
          setUsers(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(fetchedUsers)) {
              return fetchedUsers;
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('❌ Error polling real-time updates:', error);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [dbConnected]);

  // Prevent zoom (pinch-to-zoom and double-tap) on mobile devices
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Dynamic Tab Title and Favicon based on settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (appSettings?.['GLOBAL']?.business_name) {
        document.title = `${appSettings['GLOBAL'].business_name} - Sistem Jasa AC`;
      }
      if (appSettings?.['GLOBAL']?.business_logo) {
        // Update Favicon
        let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'shortcut icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = appSettings['GLOBAL'].business_logo;

        // Update Apple Touch Icon (For Add to Home Screen)
        let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
        if (!appleLink) {
          appleLink = document.createElement('link');
          appleLink.rel = 'apple-touch-icon';
          document.getElementsByTagName('head')[0].appendChild(appleLink);
        }
        appleLink.href = appSettings['GLOBAL'].business_logo;
      }
    }
  }, [appSettings]);

  const updateAppSettings = async (
    business_name: string, 
    business_logo: string,
    bank_name?: string,
    bank_account_number?: string,
    bank_account_holder?: string,
    qris_image?: string
  ) => {
    try {
      await api.updateSettings({ 
        business_name, 
        business_logo,
        bank_name,
        bank_account_number,
        bank_account_holder,
        qris_image
      });
      // Re-fetch to get correct regional mappings
        const settingsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`);
        const fetchedSettings = await settingsRes.json();
        setAppSettings(fetchedSettings);
      showAlert('Pengaturan bisnis berhasil diperbarui!');
    } catch (error) {
      console.error('Failed to update app settings:', error);
      showAlert('Gagal memperbarui pengaturan bisnis.');
    }
  };

  // Action handlers
  const setActiveUser = (user: User | null) => {
    if (user) {
      const normalizedUser = api.normalizeUser(user);
      setActiveUserState(normalizedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('active_user_id', user.id);
      }
    } else {
      setActiveUserState(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('active_user_id');
      }
    }
  };

  const login = (user: User) => {
    setActiveUser(user);
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    setActiveUser(null);
  };

  const registerCustomer = async (name: string, email: string, phone: string, address: string) => {
    const newUser: User = {
      id: `usr_user_${Date.now()}`,
      email,
      name,
      role: Role.USER,
      phone,
      address,
    };

    try {
      await api.createUser({
        id: newUser.id,
        name,
        email,
        phone,
        role: 'pelanggan',
        password: 'default123',
      });
      setUsers([...users, newUser]);
      setActiveUser(newUser);
    } catch (error) {
      console.error('❌ Failed to register user:', error);
      setUsers([...users, newUser]);
      setActiveUser(newUser);
    }
  };

  const addNewOrder = async (orderData: any) => {
    if (!activeUser) return;

    let serviceCost = 0;
    if (orderData.serviceType && orderData.serviceType !== 'none') {
      const matchService = services.find(s => s.name === orderData.serviceType || s.id === orderData.serviceType);
      const matchModel = models.find(m => m.name === orderData.acType || m.id === orderData.acType);
      if (matchService && matchModel) {
        const priceEntry = servicePrices.find(sp => sp.serviceId === matchService.id && sp.modelId === matchModel.id);
        if (priceEntry) {
          serviceCost = priceEntry.price;
        }
      }
    }
    serviceCost = serviceCost * orderData.quantity;

    const year = new Date().getFullYear();
    const sequenceNum = String(orders.length + 1).padStart(3, '0');
    const orderId = `ORD-${year}-${sequenceNum}`;

    const newOrder: Order = {
      id: orderId,
      customerId: activeUser.id,
      customerName: activeUser.name,
      customerPhone: orderData.customerPhone,
      address: orderData.address,
      latitude: orderData.latitude,
      longitude: orderData.longitude,
      scheduledDate: orderData.scheduledDate,
      scheduledTime: orderData.scheduledTime,
      acDetail: orderData.acDetail || [{
        acType: orderData.acType,
        category: orderData.category,
        serviceType: orderData.serviceType,
        quantity: orderData.quantity,
      }],
      notes: orderData.notes,
      status: OrderStatus.MENUNGGU,
      createdAt: new Date().toISOString(),
      serviceCost,
      addonsCost: 0,
      totalCost: serviceCost,
    };

    try {
      await api.createOrder({
        id: orderId,
        customerId: activeUser.id,
        workerId: null,
        status: 'pending',
        schedule: `${orderData.scheduledDate} ${orderData.scheduledTime}`,
        serviceIds: [orderData.serviceType],
        addonIds: [],
        notes: orderData.notes,
        totalPrice: serviceCost,
      });
      setOrders([newOrder, ...orders]);
    } catch (error) {
      console.error('❌ Failed to create order:', error);
      setOrders([newOrder, ...orders]);
    }
  };

  const assignEmployee = async (orderId: string, staffId: string, staffName: string, extraPayload?: Partial<Order>) => {
    try {
      await api.updateOrder(orderId, {
        assignedTo: staffId,
        status: 'assigned',
        ...extraPayload,
      });
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === orderId
            ? {
                ...o,
                status: OrderStatus.DITUGASKAN,
                assignedTo: staffId,
                assignedEmployeeName: staffName,
                ...extraPayload,
              }
            : o
        )
      );
    } catch (error) {
      console.error('❌ Failed to assign staff:', error);
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === orderId
            ? {
                ...o,
                status: OrderStatus.DITUGASKAN,
                assignedTo: staffId,
                assignedEmployeeName: staffName,
                ...extraPayload,
              }
            : o
        )
      );
    }
  };

  return (
    <AppContext.Provider
      value={{
        users,
        setUsers,
        regions,
        setRegions,
        activeUser,
        setActiveUser,
        orders,
        setOrders,
        models,
        setModels,
        categories,
        setCategories,
        services,
        setServices,
        servicePrices,
        setServicePrices,
        addons,
        setAddons,
        isLoading,
        dbConnected,
        appSettings,
        updateAppSettings,
        login,
        logout,
        registerCustomer,
        addNewOrder,
        assignEmployee,
        showAlert,
      }}
    >
      {children}
      {customAlert.isOpen && (
        <CustomAlertDialog
          message={customAlert.message}
          onClose={() => setCustomAlert(prev => ({ ...prev, isOpen: false }))}
        />
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
