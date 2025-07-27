'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  Warehouse, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { userProfile, logout } = useAuth();

  const getNavigationItems = () => {
    const storeItems = [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Sales', href: '/sales', icon: TrendingUp },
      { name: 'Inventory', href: '/inventory', icon: Warehouse },
      { name: 'HR', href: '/hr', icon: Users },
      { name: 'Finance', href: '/finance', icon: BarChart3 },
    ];

    if (userProfile?.role === 'headquarter') {
      const headquarterItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Products', href: '/products', icon: Package },
        { name: 'Inventory', href: '/inventory', icon: Warehouse },
        { name: 'Orders', href: '/orders', icon: ShoppingCart },
        { name: 'Customers', href: '/customers', icon: Users },
        { name: 'Reports', href: '/reports', icon: BarChart3 },
        { name: 'Settings', href: '/settings', icon: Settings }
      ];
      return headquarterItems;
    }

    if (userProfile?.role === 'warehouse') {
      return [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Products', href: '/products', icon: Package },
        { name: 'Inventory', href: '/inventory', icon: Warehouse },
        { name: 'Orders', href: '/orders', icon: ShoppingCart },
      ];
    }

    return storeItems;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b">
            <h1 className="text-xl font-bold text-gray-900">ERP System</h1>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b bg-gray-50">
            <div className="text-sm font-medium text-gray-900">
              {userProfile?.name}
            </div>
            <div className="text-xs text-gray-500 capitalize">
              {userProfile?.role} • {userProfile?.company.name}
            </div>
            {userProfile?.store && (
              <div className="text-xs text-gray-500">
                Store: {userProfile.store.name}
              </div>
            )}
            {userProfile?.warehouse && (
              <div className="text-xs text-gray-500">
                Warehouse: {userProfile.warehouse.name}
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  onClick={onClose}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:text-gray-900"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
