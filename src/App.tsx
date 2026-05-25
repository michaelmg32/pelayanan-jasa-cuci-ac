/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Role, OrderStatus, User, Order, ACModel, ACCategory, ACService, ACAddon } from './types';
import * as api from './services/api';
import { normalizeUser } from './services/api';
import MobileFrame from './components/MobileFrame';
import LoginScreen from './components/LoginScreen';
import PelangganDashboard from './components/PelangganDashboard';
import AdminDashboard from './components/AdminDashboard';
import KaryawanDashboard from './components/KaryawanDashboard';
import OwnerDashboard from './components/OwnerDashboard';

const LOCAL_STORAGE_ACTIVE_USER_KEY = 'ac_wash_service_active_user';
const LOCAL_STORAGE_ORDERS_KEY = 'ac_wash_service_orders';

export default function App() {
  // 1. Core States
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);

  // Master Lists State (from Database)
  const [models, setModels] = useState<ACModel[]>([]);
  const [categories, setCategories] = useState<ACCategory[]>([]);
  const [services, setServices] = useState<ACService[]>([]);
  const [addons, setAddons] = useState<ACAddon[]>([]);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState(false);

  // 2. Initialize Data from Database/API
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

        // Fetch users from database
        const fetchedUsers = await api.fetchUsers();
        setUsers(fetchedUsers);

        // Fetch orders from database
        const fetchedOrders = await api.fetchOrders();
        setOrders(fetchedOrders);

        // Fetch models from database
        const fetchedModels = await api.fetchModels();
        setModels(fetchedModels);

        // Fetch services from database
        const fetchedServices = await api.fetchServices();
        setServices(fetchedServices);

        // Fetch categories from database
        const fetchedCategories = await api.fetchCategories();
        setCategories(fetchedCategories);

        // Fetch addons from database
        const fetchedAddons = await api.fetchAddons();
        setAddons(fetchedAddons);

        // Restore active user from localStorage
        const savedActiveUser = localStorage.getItem(LOCAL_STORAGE_ACTIVE_USER_KEY);
        if (savedActiveUser) {
          try {
            const parsedUser = JSON.parse(savedActiveUser);
            // Normalize role in case it was stored with old format
            const normalizedUser = normalizeUser(parsedUser);
            setActiveUser(normalizedUser);
          } catch (e) {
            setActiveUser(null);
          }
        }
      } catch (error) {
        console.error('❌ Error initializing data from database:', error);
        // Keep states empty when database unavailable
        setUsers([]);
        setOrders([]);
        setModels([]);
        setCategories([]);
        setServices([]);
        setAddons([]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // Update State & Save to Database
  const updateUsersState = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    // TODO: Sync with API in future
  };

  const updateOrdersState = (updatedOrders: Order[]) => {
    setOrders(updatedOrders);
    // TODO: Sync with API in future
  };

  const updateActiveUserState = (user: User | null) => {
    if (user) {
      // Normalize user role before setting
      const normalizedUser = normalizeUser(user);
      setActiveUser(normalizedUser);
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_USER_KEY, JSON.stringify(normalizedUser));
    } else {
      setActiveUser(null);
      localStorage.removeItem(LOCAL_STORAGE_ACTIVE_USER_KEY);
    }
  };

  const updateModelsState = (updatedModels: ACModel[]) => {
    setModels(updatedModels);
    // TODO: Sync with API in future
  };

  const updateCategoriesState = (updatedCategories: ACCategory[]) => {
    setCategories(updatedCategories);
    // TODO: Sync with API in future
  };

  const updateServicesState = (updatedServices: ACService[]) => {
    setServices(updatedServices);
    // TODO: Sync with API in future
  };

  const updateAddonsState = (updatedAddons: ACAddon[]) => {
    setAddons(updatedAddons);
    // TODO: Sync with API in future
  };

  // 3. Auth Actions
  const handleLogin = (user: User) => {
    updateActiveUserState(user);
  };

  const handleLogout = () => {
    updateActiveUserState(null);
    // Clear JWT token from localStorage
    localStorage.removeItem('auth_token');
  };

  const handleRegisterCustomer = (name: string, email: string, phone: string, address: string) => {
    const newUser: User = {
      id: `usr_user_${Date.now()}`,
      email,
      name,
      role: Role.USER,
      phone,
      address,
    };

    // Save to database via API
    api.createUser({
      id: newUser.id,
      name,
      email,
      phone,
      role: 'pelanggan', // Database uses 'pelanggan' for customers
      password: 'default123', // Default password for new registrations
    }).then(createdUser => {
      console.log('✅ User registered successfully:', createdUser);
      const newUsersList = [...users, newUser];
      updateUsersState(newUsersList);
      updateActiveUserState(newUser); // Sign in immediately
    }).catch(error => {
      console.error('❌ Failed to register user:', error);
      // Still update local state if API fails (fallback)
      const newUsersList = [...users, newUser];
      updateUsersState(newUsersList);
      updateActiveUserState(newUser);
    });
  };

  // 4. Booking Order Action (Customer Side)
  const handleAddNewOrder = (
    orderData: {
      acType: string;
      category: string;
      serviceType: string;
      quantity: number;
      scheduledDate: string;
      scheduledTime: string;
      address: string;
      customerPhone: string;
      notes?: string;
      latitude?: number;
      longitude?: number;
    }
  ) => {
    if (!activeUser) return;

    // Calculate cost based on service type lookup
    let serviceCost = 50000; // default base/checkup price
    if (orderData.serviceType && orderData.serviceType !== 'none') {
      const match = services.find(s => s.name === orderData.serviceType);
      if (match) {
        serviceCost = match.price;
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
      acDetail: {
        acType: orderData.acType,
        category: orderData.category,
        serviceType: orderData.serviceType,
        quantity: orderData.quantity,
      },
      notes: orderData.notes,
      status: OrderStatus.MENUNGGU, // Start with Waiting (Menunggu)
      createdAt: new Date().toISOString(),
      serviceCost,
      addonsCost: 0,
      totalCost: serviceCost,
    };

    // Save to database via API
    api.createOrder({
      id: orderId,
      customerId: activeUser.id,
      workerId: null,
      status: 'pending', // Database uses 'pending' for MENUNGGU
      schedule: `${orderData.scheduledDate} ${orderData.scheduledTime}`,
      serviceIds: [orderData.serviceType],
      addonIds: [],
      notes: orderData.notes,
      totalPrice: serviceCost,
    }).then(createdOrder => {
      console.log('✅ Order created successfully:', createdOrder);
      const newOrdersList = [newOrder, ...orders];
      updateOrdersState(newOrdersList);
    }).catch(error => {
      console.error('❌ Failed to create order:', error);
      // Still update local state if API fails (fallback)
      const newOrdersList = [newOrder, ...orders];
      updateOrdersState(newOrdersList);
    });
  };

  // 5. Admin Allocation / Assignment Action
  const handleAssignEmployee = (orderId: string, staffId: string, staffName: string, extraPayload?: Partial<Order>) => {
    // Save to database via API
    api.updateOrder(orderId, {
      workerId: staffId,
      status: 'assigned', // Database uses 'assigned' for DITUGASKAN
      ...extraPayload,
    }).then(updatedOrder => {
      console.log('✅ Staff assigned successfully:', updatedOrder);
      setOrders(prevOrders => {
        const updatedOrdersList = prevOrders.map(o => {
          if (o.id === orderId) {
            return {
              ...o,
              status: OrderStatus.DITUGASKAN, // Becomes Ditugaskan
              assignedTo: staffId,
              assignedEmployeeName: staffName,
              ...extraPayload,
            };
          }
          return o;
        });
        localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updatedOrdersList));
        return updatedOrdersList;
      });
    }).catch(error => {
      console.error('❌ Failed to assign staff:', error);
      // Still update local state if API fails (fallback)
      setOrders(prevOrders => {
        const updatedOrdersList = prevOrders.map(o => {
          if (o.id === orderId) {
            return {
              ...o,
              status: OrderStatus.DITUGASKAN,
              assignedTo: staffId,
              assignedEmployeeName: staffName,
              ...extraPayload,
            };
          }
          return o;
        });
        localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updatedOrdersList));
        return updatedOrdersList;
      });
    });
  };

  // 6. Complex State/Status Machine for order updates
  const handleUpdateOrderStatus = (
    orderId: string,
    newStatus: OrderStatus,
    payload?: Partial<Order>
  ) => {
    // Map React status to database status
    const statusMap: Record<string, string> = {
      'MENUNGGU': 'pending',
      'DITUGASKAN': 'assigned',
      'CEK_LAYANAN': 'in_progress',
      'PENGERJAAN': 'in_progress',
      'PAYMENT': 'completed',
      'SELESAI': 'completed',
    };
    
    const dbStatus = statusMap[newStatus] || 'pending';

    // Save to database via API
    api.updateOrder(orderId, {
      status: dbStatus,
      totalPrice: payload?.totalCost,
      notes: payload?.notes,
    }).then(updatedOrder => {
      console.log('✅ Order status updated successfully:', updatedOrder);
      setOrders(prevOrders => {
        const updatedOrdersList = prevOrders.map(o => {
          if (o.id === orderId) {
            let updateObj: Partial<Order> = { status: newStatus, ...payload };
            
            if (newStatus === OrderStatus.CEK_LAYANAN) {
              // Photo before was added
              updateObj.photoBefore = payload?.photoBefore;
            } else if (newStatus === OrderStatus.PENGERJAAN) {
              // Photo after, addons cost and final cost calculation
              updateObj.photoAfter = payload?.photoAfter;
              if (payload?.addonsUsed) {
                const sumAddons = payload.addonsUsed.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
                updateObj.addonsCost = sumAddons;
                updateObj.totalCost = o.serviceCost + sumAddons;
              }
            } else if (newStatus === OrderStatus.PAYMENT) {
              // Setting payment mechanism details
              updateObj.paymentMethod = payload?.paymentMethod;
              updateObj.paymentStatus = payload?.paymentStatus;
              updateObj.bankName = payload?.bankName;
              updateObj.bankAccountNo = payload?.bankAccountNo;
              updateObj.bankAccountHolder = payload?.bankAccountHolder;
            } else if (newStatus === OrderStatus.SELESAI) {
              updateObj.completedAt = new Date().toISOString();
            }

            return { ...o, ...updateObj };
          }
          return o;
        });
        localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updatedOrdersList));
        return updatedOrdersList;
      });
    }).catch(error => {
      console.error('❌ Failed to update order status:', error);
      // Still update local state if API fails (fallback)
      setOrders(prevOrders => {
        const updatedOrdersList = prevOrders.map(o => {
          if (o.id === orderId) {
            let updateObj: Partial<Order> = { status: newStatus, ...payload };
            
            if (newStatus === OrderStatus.CEK_LAYANAN) {
              updateObj.photoBefore = payload?.photoBefore;
            } else if (newStatus === OrderStatus.PENGERJAAN) {
              updateObj.photoAfter = payload?.photoAfter;
              if (payload?.addonsUsed) {
                const sumAddons = payload.addonsUsed.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
                updateObj.addonsCost = sumAddons;
                updateObj.totalCost = o.serviceCost + sumAddons;
              }
            } else if (newStatus === OrderStatus.PAYMENT) {
              updateObj.paymentMethod = payload?.paymentMethod;
              updateObj.paymentStatus = payload?.paymentStatus;
              updateObj.bankName = payload?.bankName;
              updateObj.bankAccountNo = payload?.bankAccountNo;
              updateObj.bankAccountHolder = payload?.bankAccountHolder;
            } else if (newStatus === OrderStatus.SELESAI) {
              updateObj.completedAt = new Date().toISOString();
            }

            return { ...o, ...updateObj };
          }
          return o;
        });
        localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updatedOrdersList));
        return updatedOrdersList;
      });
    });
  };

  // 7. Core Rating / Appraisal Action
  const handleRateOrder = (orderId: string, rating: number, ratingNotes?: string) => {
    // Save to database via API
    api.updateOrder(orderId, {
      status: 'completed', // Database uses 'completed' for SELESAI
      notes: ratingNotes,
    }).then(updatedOrder => {
      console.log('✅ Order rated successfully:', updatedOrder);
      setOrders(prevOrders => {
        const updatedOrdersList = prevOrders.map(o => {
          if (o.id === orderId) {
            return {
              ...o,
              rating,
              ratingNotes: ratingNotes || '',
              status: OrderStatus.SELESAI, // End up here
              completedAt: o.completedAt || new Date().toISOString(),
            };
          }
          return o;
        });
        localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updatedOrdersList));
        return updatedOrdersList;
      });
    }).catch(error => {
      console.error('❌ Failed to rate order:', error);
      // Still update local state if API fails (fallback)
      setOrders(prevOrders => {
        const updatedOrdersList = prevOrders.map(o => {
          if (o.id === orderId) {
            return {
              ...o,
              rating,
              ratingNotes: ratingNotes || '',
              status: OrderStatus.SELESAI,
              completedAt: o.completedAt || new Date().toISOString(),
            };
          }
          return o;
        });
        localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updatedOrdersList));
        return updatedOrdersList;
      });
    });
  };

  // 8. Edit / Access Permission user listings
  const handleUpdateUserData = (userId: string, updatedData: Partial<User>) => {
    // Save to database via API
    api.updateUser(userId, updatedData).then(updated => {
      console.log('✅ User updated successfully:', updated);
      const updatedUsersList = users.map(u => {
        if (u.id === userId) {
          return { ...u, ...updatedData };
        }
        return u;
      });
      updateUsersState(updatedUsersList);

      if (activeUser && activeUser.id === userId) {
        updateActiveUserState({ ...activeUser, ...updatedData });
      }
    }).catch(error => {
      console.error('❌ Failed to update user:', error);
      // Still update local state if API fails (fallback)
      const updatedUsersList = users.map(u => {
        if (u.id === userId) {
          return { ...u, ...updatedData };
        }
        return u;
      });
      updateUsersState(updatedUsersList);

      if (activeUser && activeUser.id === userId) {
        updateActiveUserState({ ...activeUser, ...updatedData });
      }
    });
  };

  const staffList = users.filter(u => u.role === Role.STAFF);

  // Conditional Rendering dashboards
  const renderDashboard = () => {
    if (!activeUser) {
      return (
        <LoginScreen
          onLogin={handleLogin}
          onRegisterCustomer={handleRegisterCustomer}
          availableUsers={users}
        />
      );
    }

    switch (activeUser.role) {
      case Role.USER:
        return (
          <PelangganDashboard
            user={activeUser}
            orders={orders}
            models={models}
            categories={categories}
            services={services}
            addons={addons}
            onLogout={handleLogout}
            onAddNewOrder={handleAddNewOrder}
            onRateOrder={handleRateOrder}
            onUpdateUserData={handleUpdateUserData}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        );
      case Role.ADMIN:
        return (
          <AdminDashboard
            user={activeUser}
            orders={orders}
            staffList={staffList}
            allUsers={users}
            models={models}
            categories={categories}
            services={services}
            addons={addons}
            onLogout={handleLogout}
            onAssignStaffToOrder={handleAssignEmployee}
            onUpdateUserData={handleUpdateUserData}
            onUpdateModels={updateModelsState}
            onUpdateCategories={updateCategoriesState}
            onUpdateServices={updateServicesState}
            onUpdateAddons={updateAddonsState}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        );
      case Role.STAFF:
        return (
          <KaryawanDashboard
            user={activeUser}
            orders={orders}
            addons={addons}
            services={services}
            categories={categories}
            onLogout={handleLogout}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onUpdateUserData={handleUpdateUserData}
          />
        );
      case Role.OWNER:
        return (
          <OwnerDashboard
            user={activeUser}
            orders={orders}
            staffList={staffList}
            onLogout={handleLogout}
          />
        );
      default:
        return (
          <LoginScreen
            onLogin={handleLogin}
            onRegisterCustomer={handleRegisterCustomer}
            availableUsers={users}
          />
        );
    }
  };

  return (
    <MobileFrame
      activeUser={activeUser}
      onLogout={handleLogout}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-700 font-semibold">Loading data dari database...</p>
            <p className="text-sm text-gray-500 mt-2">
              {dbConnected ? '✅ Database terhubung' : '⚠️ Menggunakan data fallback'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {!dbConnected && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Perhatian:</strong> Database tidak terhubung. Menggunakan data lokal sementara.
                Pastikan backend server sudah berjalan di <code>npm run server</code>
              </p>
            </div>
          )}
          {renderDashboard()}
        </>
      )}
    </MobileFrame>
  );
}
