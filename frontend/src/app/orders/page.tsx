'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter,
  Package,
  Store,
  Building2,
  Calendar,
  DollarSign
} from 'lucide-react';

interface Order {
  id: number;
  order_number: string;
  order_type: 'purchase' | 'sales' | 'transfer';
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: string;
  order_date: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  store_name?: string;
  store_code?: string;
  warehouse_name?: string;
  warehouse_code?: string;
  created_by_name: string;
  items_count: string;
  created_at: string;
  updated_at: string;
}

interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function OrdersPage() {
  const { userProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });

  useEffect(() => {
    fetchOrders();
  }, [currentPage, selectedStatus, selectedType]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = userProfile?.role === 'store' ? 'store-token' : 
                   userProfile?.role === 'warehouse' ? 'warehouse-token' : 'admin-token';
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      if (selectedStatus) {
        params.append('status', selectedStatus);
      }

      if (selectedType) {
        params.append('orderType', selectedType);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data: OrdersResponse = await response.json();
        setOrders(data.orders);
        setPagination(data.pagination);
      } else {
        throw new Error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Package className="h-4 w-4" />;
      case 'sales':
        return <ShoppingCart className="h-4 w-4" />;
      case 'transfer':
        return <Building2 className="h-4 w-4" />;
      default:
        return <ShoppingCart className="h-4 w-4" />;
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
        <Button onClick={fetchOrders}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">
            Manage purchase orders, sales orders, and transfers
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Order
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="w-48">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="w-48">
              <Label htmlFor="type">Order Type</Label>
              <select
                id="type"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="purchase">Purchase Orders</option>
                <option value="sales">Sales Orders</option>
                <option value="transfer">Transfer Orders</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {getTypeIcon(order.order_type)}
                  <div>
                    <CardTitle className="text-lg">{order.order_number}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(order.order_date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-lg font-bold text-green-600">
                      <DollarSign className="h-4 w-4" />
                      {parseFloat(order.total_amount).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Order Type</div>
                  <div className="font-medium capitalize">{order.order_type} Order</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Location</div>
                  <div className="font-medium flex items-center gap-2">
                    {order.store_name ? (
                      <>
                        <Store className="h-4 w-4 text-blue-500" />
                        {order.store_name}
                      </>
                    ) : order.warehouse_name ? (
                      <>
                        <Building2 className="h-4 w-4 text-purple-500" />
                        {order.warehouse_name}
                      </>
                    ) : (
                      'N/A'
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Items</div>
                  <div className="font-medium">{order.items_count} items</div>
                </div>
              </div>

              {order.customer_name && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-500">Customer</div>
                  <div className="font-medium">{order.customer_name}</div>
                  {order.customer_email && (
                    <div className="text-sm text-gray-600">{order.customer_email}</div>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Created by {order.created_by_name} on {new Date(order.created_at).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  {order.status === 'pending' && (
                    <Button size="sm">
                      Process Order
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {orders.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600 mb-4">
              {selectedStatus || selectedType 
                ? 'Try adjusting your filters to see more orders.'
                : 'Get started by creating your first order.'}
            </p>
            <Button className="flex items-center gap-2 mx-auto">
              <Plus className="h-4 w-4" />
              Create Your First Order
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card>
          <CardContent className="flex justify-between items-center py-4">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} orders
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setCurrentPage(pagination.page - 1)}
              >
                Previous
              </Button>
              <span className="px-3 py-1 text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setCurrentPage(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
