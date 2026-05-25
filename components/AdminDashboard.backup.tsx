'use client';

import { useApp } from '@/lib/auth-context';

export default function AdminDashboard() {
  const { orders, users } = useApp();

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900">Total Orders</h3>
            <p className="text-3xl font-bold text-blue-600">{orders.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900">Total Users</h3>
            <p className="text-3xl font-bold text-green-600">{users.length}</p>
          </div>
        </div>

        <h3 className="text-lg font-semibold mt-6 mb-4">Semua Pesanan</h3>
        <div className="space-y-2">
          {orders.slice(0, 10).map(order => (
            <div key={order.id} className="border rounded-lg p-4">
              <p className="font-semibold">{order.id}</p>
              <p className="text-sm text-gray-600">{order.customerName} - {order.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
