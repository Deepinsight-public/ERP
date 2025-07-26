'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Warehouse, 
  AlertTriangle, 
  Search, 
  Filter,
  Package,
  Store,
  Building2
} from 'lucide-react';

interface InventoryItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  unit_price: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  reorder_level: number;
  store_id?: number;
  warehouse_id?: number;
  store_name?: string;
  store_code?: string;
  warehouse_name?: string;
  warehouse_code?: string;
  last_updated: string;
}

interface InventoryResponse {
  inventory: InventoryItem[];
}

export default function InventoryPage() {
  const { userProfile } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');

  useEffect(() => {
    fetchInventory();
  }, [showLowStockOnly, selectedLocation]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = userProfile?.role === 'store' ? 'store-token' : 
                   userProfile?.role === 'warehouse' ? 'warehouse-token' : 'admin-token';
      
      const params = new URLSearchParams();

      if (showLowStockOnly) {
        params.append('lowStock', 'true');
      }

      if (selectedLocation) {
        if (selectedLocation.startsWith('store-')) {
          params.append('storeId', selectedLocation.replace('store-', ''));
        } else if (selectedLocation.startsWith('warehouse-')) {
          params.append('warehouseId', selectedLocation.replace('warehouse-', ''));
        }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data: InventoryResponse = await response.json();
        setInventory(data.inventory);
      } else {
        throw new Error('Failed to fetch inventory');
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= item.reorder_level) {
      return { status: 'low', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' };
    } else if (item.quantity <= item.reorder_level * 1.5) {
      return { status: 'medium', color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200' };
    }
    return { status: 'good', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' };
  };

  const canAdjustInventory = userProfile?.role === 'headquarter' || userProfile?.role === 'warehouse';

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
        <Button onClick={fetchInventory}>
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
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">
            Track stock levels across all locations
          </p>
        </div>
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
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="lowStock"
                checked={showLowStockOnly}
                onChange={(e) => setShowLowStockOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="lowStock" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Show Low Stock Only
              </Label>
            </div>

            {userProfile?.role === 'headquarter' && (
              <div className="w-64">
                <Label htmlFor="location">Location</Label>
                <select
                  id="location"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  <option value="">All Locations</option>
                  <option value="store-1">Downtown Store</option>
                  <option value="store-2">Mall Store</option>
                  <option value="warehouse-1">Main Warehouse</option>
                  <option value="warehouse-2">Secondary Warehouse</option>
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {inventory.map((item) => {
          const stockStatus = getStockStatus(item);
          return (
            <Card key={item.id} className={`${stockStatus.bgColor} border transition-shadow hover:shadow-lg`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{item.product_name}</CardTitle>
                    <CardDescription>SKU: {item.sku}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.store_name ? (
                      <Store className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Building2 className="h-4 w-4 text-purple-500" />
                    )}
                    <span className="text-sm font-medium">
                      {item.store_name || item.warehouse_name}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Stock Levels */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Total Stock</div>
                      <div className={`text-2xl font-bold ${stockStatus.color}`}>
                        {item.quantity}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Available</div>
                      <div className="text-2xl font-bold text-green-600">
                        {item.available_quantity}
                      </div>
                    </div>
                  </div>

                  {/* Reserved & Reorder Level */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Reserved</div>
                      <div className="font-medium">{item.reserved_quantity}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Reorder Level</div>
                      <div className="font-medium">{item.reorder_level}</div>
                    </div>
                  </div>

                  {/* Stock Status Alert */}
                  {stockStatus.status === 'low' && (
                    <div className="flex items-center gap-2 p-2 bg-red-100 rounded-md">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-800 font-medium">
                        Low Stock Alert
                      </span>
                    </div>
                  )}

                  {/* Price Info */}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Unit Price</span>
                      <span className="font-medium">${item.unit_price}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {canAdjustInventory && (
                    <div className="pt-2 border-t">
                      <Button variant="outline" size="sm" className="w-full">
                        Adjust Stock
                      </Button>
                    </div>
                  )}

                  {/* Last Updated */}
                  <div className="text-xs text-gray-500">
                    Updated: {new Date(item.last_updated).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {inventory.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Warehouse className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory found</h3>
            <p className="text-gray-600 mb-4">
              {showLowStockOnly 
                ? 'No low stock items found. Great job maintaining inventory levels!'
                : 'No inventory items found for the selected criteria.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
