'use client';

import React, { useState } from 'react';
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
  TrendingUp,
  ChevronDown,
  ChevronRight,
  FileText,
  ClipboardList,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  QrCode,
  RotateCcw,
  Plus,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { userProfile, logout } = useAuth();
  const [expandedSections, setExpandedSections] = useState<string[]>(['reports']);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const getNavigationItems = () => {
    const storeNavigation = [
      {
        id: 'reports',
        name: 'Reports',
        icon: BarChart3,
        expandable: true,
        children: [
          { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
          { name: 'Inventory', href: '/reports/inventory', icon: Warehouse },
          { name: 'Sales Stats', href: '/reports/sales-stats', icon: TrendingUp },
          { name: 'Sales Summaries', href: '/reports/sales-summaries', icon: FileText },
          { name: 'Item Details Report', href: '/reports/item-details', icon: ClipboardList },
        ]
      },
      {
        id: 'sales',
        name: 'Sales Management',
        icon: ShoppingCart,
        expandable: true,
        children: [
          { name: 'New Retail Order', href: '/sales/new-order', icon: Plus },
          { name: 'Retail Orders List', href: '/sales/orders', icon: ClipboardList },
          { name: 'Customers', href: '/sales/customers', icon: Users },
          { name: 'Price Tag', href: '/sales/price-tag', icon: FileText },
        ]
      },
      {
        id: 'inventory',
        name: 'Inventory Management',
        icon: Warehouse,
        expandable: true,
        children: [
          { name: 'Store POs', href: '/inventory/store-pos', icon: FileText },
          { name: 'Search Inventory', href: '/inventory/search', icon: Search },
          { name: 'Products', href: '/inventory/products', icon: Package },
          { name: 'Transfer Out', href: '/inventory/transfer-out', icon: ArrowUpRight },
          { name: 'Transfer In', href: '/inventory/transfer-in', icon: ArrowDownLeft },
          { name: 'Barcodes(By PO2)', href: '/inventory/barcodes-po2', icon: QrCode },
          { name: 'Barcodes(By Category)', href: '/inventory/barcodes-category', icon: QrCode },
        ]
      },
      {
        id: 'after-sales',
        name: 'After Sales Management',
        icon: RotateCcw,
        expandable: true,
        children: [
          { name: 'Returns POs', href: '/after-sales/returns-pos', icon: FileText },
          { name: 'New Returns', href: '/after-sales/new-returns', icon: Plus },
          { name: 'Scrap', href: '/after-sales/scrap', icon: Trash2 },
        ]
      }
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
      return { type: 'simple', items: headquarterItems };
    }

    if (userProfile?.role === 'warehouse') {
      const warehouseItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Products', href: '/products', icon: Package },
        { name: 'Inventory', href: '/inventory', icon: Warehouse },
        { name: 'Orders', href: '/orders', icon: ShoppingCart },
      ];
      return { type: 'simple', items: warehouseItems };
    }

    return { type: 'expandable', sections: storeNavigation };
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigation = getNavigationItems();

  const renderSimpleNavigation = (items: any[]) => (
    <div className="space-y-2">
      {items.map((item) => {
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
    </div>
  );

  const renderExpandableNavigation = (sections: any[]) => (
    <div className="space-y-1">
      {sections.map((section) => {
        const isExpanded = expandedSections.includes(section.id);
        const SectionIcon = section.icon;
        
        return (
          <div key={section.id}>
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-300 hover:bg-slate-700 rounded-md transition-colors"
            >
              <div className="flex items-center">
                <SectionIcon className="mr-3 h-5 w-5" />
                {section.name}
              </div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            
            {isExpanded && (
              <div className="ml-6 mt-1 space-y-1">
                {section.children.map((child: any) => {
                  const isActive = pathname === child.href;
                  const ChildIcon = child.icon;
                  
                  return (
                    <Link
                      key={child.name}
                      href={child.href}
                      className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white font-medium'
                          : 'text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                      }`}
                      onClick={onClose}
                    >
                      {child.name === 'Overview' && isActive && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-3" />
                      )}
                      {!(child.name === 'Overview' && isActive) && (
                        <ChildIcon className="mr-3 h-4 w-4" />
                      )}
                      {child.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

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
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 text-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">A4L ERP/CRM</h1>
                <p className="text-xs text-slate-400">Pro v2.0 (beta)</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md text-slate-400 hover:text-slate-200"
            >
              ×
            </button>
          </div>

          {/* Store Management Header */}
          <div className="px-6 py-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              STORE MANAGEMENT
            </h2>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 pb-4">
            {navigation.type === 'simple' 
              ? renderSimpleNavigation(navigation.items || [])
              : renderExpandableNavigation(navigation.sections || [])
            }
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-slate-700">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
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
