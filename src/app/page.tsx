'use client';

import Link from 'next/link'
import { ShoppingCart, Package, Users, BarChart3, Cookie, Cake } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Header from '@/components/Header'
import { usePermissions } from '@/hooks/usePermissions'

export default function Home() {
  const permissions = usePermissions();
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="container mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
              Sistema de Gestión de Pastelería
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Gestiona tu pastelería de forma eficiente con nuestro sistema integral
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Punto de Venta - Vitrina */}
            <Link href="/pos/vitrina" className="group">
              <div className="card p-6 hover:shadow-lg transition-all group-hover:scale-105 transform">
                <div className="flex items-center justify-between mb-4">
                  <Cookie className="h-8 w-8 text-primary-600" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">POS</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  Vitrina
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Punto de venta para productos tradicionales: galletas, pasteles, panes
                </p>
              </div>
            </Link>

            {/* Cake Bar */}
            <Link href="/pos/cake-bar" className="group">
              <div className="card p-6 hover:shadow-lg transition-all group-hover:scale-105 transform">
                <div className="flex items-center justify-between mb-4">
                  <Cake className="h-8 w-8 text-primary-600" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">POS</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  Cake Bar
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Pasteles personalizados con opciones limitadas y precios predefinidos
                </p>
              </div>
            </Link>

            {/* Pedidos Personalizados */}
            <Link href="/orders/custom" className="group">
              <div className="card p-6 hover:shadow-lg transition-all group-hover:scale-105 transform">
                <div className="flex items-center justify-between mb-4">
                  <ShoppingCart className="h-8 w-8 text-primary-600" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Pedidos</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  Pedidos Personalizados
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Gestión de pedidos completamente personalizados con cotización dinámica
                </p>
              </div>
            </Link>

            {/* Inventario - Solo para admin y managers */}
            {permissions.canViewInventory && (
              <Link href="/inventory" className="group block lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
                  <div className="flex items-center mb-4">
                    <Package className="w-8 h-8 text-blue-600 mr-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600">
                      Gestión de Inventario
                    </h2>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200">
                    Administra productos, categorías, ingredientes y stock con control completo
                  </p>
                </div>
              </Link>
            )}

            {/* Panel Administrativo - Solo para administradores */}
            {permissions.canAccessAdmin && (
              <Link href="/admin" className="group">
                <div className="card p-6 hover:shadow-lg transition-all group-hover:scale-105 transform">
                  <div className="flex items-center justify-between mb-4">
                    <BarChart3 className="h-8 w-8 text-primary-600" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Admin</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                    Panel Administrativo
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Reportes, cierre de caja y gestión general del negocio
                  </p>
                </div>
              </Link>
            )}

            {/* Panel de Empleados */}
            <Link href="/employee" className="group">
              <div className="card p-6 hover:shadow-lg transition-all group-hover:scale-105 transform">
                <div className="flex items-center justify-between mb-4">
                  <Users className="h-8 w-8 text-green-600" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Personal</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  Panel de Empleado
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Check-in/out, tiempo de comida y control de jornada personal
                </p>
              </div>
            </Link>

            {/* Gestión de Usuarios - Solo para admin */}
            {permissions.canAccessAdmin && (
              <Link href="/admin/employees" className="group">
                <div className="card p-6 hover:shadow-lg transition-all group-hover:scale-105 transform">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="h-8 w-8 text-purple-600" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Admin</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                    Usuarios
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Gestión de empleados y permisos del sistema
                  </p>
                </div>
              </Link>
            )}
          </div>

          <div className="mt-16 text-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Características Principales
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    Gestión unificada de caja para todos los tipos de venta
                  </span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    Sistema de cotización automática para pedidos personalizados
                  </span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    Control de inventario en tiempo real
                  </span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    Reportes detallados y cierre de caja automático
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}