'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Tag, 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Archive
} from 'lucide-react';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  totalCategories: number;
  recentChanges: number;
}

export default function InventoryDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    totalCategories: 0,
    recentChanges: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('/api/inventory/dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sections = [
    {
      title: 'Productos',
      description: 'Gestiona todos los productos de vitrina y cake bar',
      icon: Package,
      href: '/inventory/products',
      color: 'bg-blue-500',
      stats: `${stats.activeProducts}/${stats.totalProducts} activos`
    },
    {
      title: 'Categorías',
      description: 'Organiza y administra las categorías de productos',
      icon: Tag,
      href: '/inventory/categories',
      color: 'bg-green-500',
      stats: `${stats.totalCategories} categorías`
    },
    {
      title: 'Ingredientes',
      description: 'Control de materias primas y stock',
      icon: ShoppingCart,
      href: '/inventory/ingredients',
      color: 'bg-purple-500',
      stats: 'Stock disponible'
    },
    {
      title: 'Movimientos de Stock',
      description: 'Historial de entradas y salidas de inventario',
      icon: TrendingUp,
      href: '/inventory/stock-movements',
      color: 'bg-orange-500',
      stats: `${stats.recentChanges} recientes`
    },
    {
      title: 'Reportes',
      description: 'Genera reportes de inventario y ventas',
      icon: BarChart3,
      href: '/inventory/reports',
      color: 'bg-indigo-500',
      stats: 'Análisis completo'
    },
    {
      title: 'Productos Inactivos',
      description: 'Productos desactivados y archivados',
      icon: Archive,
      href: '/inventory/inactive',
      color: 'bg-gray-500',
      stats: `${stats.totalProducts - stats.activeProducts} inactivos`
    }
  ];

  const alerts = [
    {
      type: 'warning',
      message: `${stats.lowStockProducts} productos con stock bajo`,
      action: 'Ver productos',
      href: '/inventory/products?filter=low-stock'
    }
  ];

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Inventario
        </h1>
        <p className="text-gray-600">
          Administra productos, categorías, ingredientes y monitorea el stock
        </p>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alertas</h2>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
                  <span className="text-yellow-800">{alert.message}</span>
                </div>
                <Link
                  href={alert.href}
                  className="text-yellow-600 hover:text-yellow-800 font-medium"
                >
                  {alert.action}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/inventory/products/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Link>
          <Link
            href="/inventory/categories/new"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Categoría
          </Link>
          <Link
            href="/inventory/ingredients/new"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Ingrediente
          </Link>
          <Link
            href="/inventory/reports/generate"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Generar Reporte
          </Link>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.title}
              href={section.href}
              className="group block p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${section.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm text-gray-500 group-hover:text-gray-700">
                  {section.stats}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
                {section.title}
              </h3>
              <p className="text-gray-600 group-hover:text-gray-700">
                {section.description}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.totalProducts}</div>
          <div className="text-sm text-blue-600">Total Productos</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.activeProducts}</div>
          <div className="text-sm text-green-600">Productos Activos</div>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{stats.lowStockProducts}</div>
          <div className="text-sm text-yellow-600">Stock Bajo</div>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{stats.totalCategories}</div>
          <div className="text-sm text-purple-600">Categorías</div>
        </div>
      </div>
    </div>
  );
}