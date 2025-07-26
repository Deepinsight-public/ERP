'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  Warehouse, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle,
  Store,
  Building2
} from 'lucide-react';

interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  inventoryLocations: number;
  orders: {
    purchase: number;
    sales: number;
    transfer: number;
    total: number;
  };
  totalStores?: number;
  totalWarehouses?: number;
  recentOrders: any[];
}

interface LowStockItem {
  id: number;
  product_name: string;
  sku: string;
  quantity: number;
  reorder_level: number;
  store_name?: string;
  warehouse_name?: string;
}

export default function DashboardPage() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = userProfile?.role === 'store' ? 'store-token' : 
                   userProfile?.role === 'warehouse' ? 'warehouse-token' : 'admin-token';
      
      const [statsResponse, lowStockResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/low-stock`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (statsResponse.ok && lowStockResponse.ok) {
        const statsData = await statsResponse.json();
        const lowStockData = await lowStockResponse.json();
        
        setStats(statsData.stats);
        setLowStockItems(lowStockData.lowStockItems);
      } else {
        throw new Error('Failed to fetch dashboard data from API');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const getWelcomeMessage = () => {
    const role = userProfile?.role;
    switch (role) {
      case 'headquarter':
        return 'Headquarter Dashboard - Complete System Overview';
      case 'warehouse':
        return `Warehouse Dashboard - ${userProfile?.warehouse?.name || 'Warehouse'} Operations`;
      case 'store':
        return `Store Dashboard - ${userProfile?.store?.name || 'Store'} Operations`;
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{getWelcomeMessage()}</h1>
        <p className="text-gray-600">
          Welcome back, {userProfile?.name}. Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Active products in catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStock}</div>
            <p className="text-xs text-muted-foreground">Items across {stats?.inventoryLocations} locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.orders.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.orders.sales} sales, {stats?.orders.purchase} purchase
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Trend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12.5%</div>
            <p className="text-xs text-muted-foreground">vs last month</p>
          </CardContent>
        </Card>

        {/* Headquarter-only stats */}
        {userProfile?.role === 'headquarter' && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalStores}</div>
                <p className="text-xs text-muted-foreground">Active retail locations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Warehouses</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalWarehouses}</div>
                <p className="text-xs text-muted-foreground">Distribution centers</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Recent Activity & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest order activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium capitalize">{order.order_type} Order #{order.id}</div>
                    <div className="text-sm text-gray-600">
                      {order.store_name || order.warehouse_name} • {order.order_date}
                    </div>
                  </div>
                  <div className="font-bold">${order.total.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
              Low Stock Alert
            </CardTitle>
            <CardDescription>Items requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <div className="font-medium">{item.product_name}</div>
                    <div className="text-sm text-gray-600">
                      SKU: {item.sku} • {item.store_name || item.warehouse_name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-orange-600">{item.quantity} left</div>
                    <div className="text-xs text-gray-500">Min: {item.reorder_level}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
