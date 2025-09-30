'use client';

import Link from 'next/link'
import { ShoppingCart, Package, Users, BarChart3, Cookie, Cake, Store, Settings } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Header from '@/components/Header'
import { usePermissions } from '@/hooks/usePermissions'

export default function Home() {
  const permissions = usePermissions();
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">

          {/* Sección Principal: POS */}
          <div className="mb-16">
            <div className="flex items-center mb-8">
              <div className="bg-red-100 p-2 rounded-lg mr-3">
                <Store className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Punto de Venta</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Vitrina */}
              <Link href="/pos/vitrina" className="group">
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 hover:shadow-xl hover:border-red-300 transition-all duration-300 transform group-hover:scale-105">
                  <div className="text-center">
                    <div className="bg-red-100 p-4 rounded-2xl w-16 h-16 mx-auto mb-6 group-hover:bg-red-200 transition-colors">
                      <Cookie className="w-8 h-8 text-red-600 mx-auto" />
                    </div>
                    <div className="bg-red-50 px-3 py-1 rounded-full text-xs font-medium text-red-600 mb-4 inline-block">
                      POS
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Vitrina</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Punto de venta para productos tradicionales: galletas, pasteles, panes
                    </p>
                  </div>
                </div>
              </Link>

              {/* Cake Bar */}
              <Link href="/pos/cake-bar" className="group">
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 hover:shadow-xl hover:border-red-300 transition-all duration-300 transform group-hover:scale-105">
                  <div className="text-center">
                    <div className="bg-red-100 p-4 rounded-2xl w-16 h-16 mx-auto mb-6 group-hover:bg-red-200 transition-colors">
                      <Cake className="w-8 h-8 text-red-600 mx-auto" />
                    </div>
                    <div className="bg-red-50 px-3 py-1 rounded-full text-xs font-medium text-red-600 mb-4 inline-block">
                      POS
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Cake Bar</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Pasteles personalizados con opciones limitadas y precios predefinidos
                    </p>
                  </div>
                </div>
              </Link>

              {/* Pedidos Personalizados */}
              <Link href="/orders/custom" className="group">
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 hover:shadow-xl hover:border-red-300 transition-all duration-300 transform group-hover:scale-105">
                  <div className="text-center">
                    <div className="bg-red-100 p-4 rounded-2xl w-16 h-16 mx-auto mb-6 group-hover:bg-red-200 transition-colors">
                      <ShoppingCart className="w-8 h-8 text-red-600 mx-auto" />
                    </div>
                    <div className="bg-red-50 px-3 py-1 rounded-full text-xs font-medium text-red-600 mb-4 inline-block">
                      Pedidos
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Pedidos Personalizados</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Gestión de pedidos completamente personalizados con cotización dinámica
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Sección: Gestión */}
          <div className="mb-16">
            <div className="flex items-center mb-8">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Gestión</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Inventario - Solo para admin y managers */}
              {permissions.canViewInventory && (
                <Link href="/inventory" className="group">
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 h-full flex flex-col">
                    <div className="flex items-start mb-6">
                      <div className="bg-blue-100 p-3 rounded-xl mr-4 flex-shrink-0">
                        <Package className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="flex-grow">
                        <div className="bg-blue-50 px-3 py-1 rounded-full text-xs font-medium text-blue-600 mb-3 inline-block">
                          Gestión
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-3">
                          Gestión de Inventario
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          Administra productos, categorías, ingredientes y stock con control completo
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Panel Administrativo - Solo para administradores */}
              {permissions.canAccessAdmin && (
                <Link href="/admin" className="group">
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 hover:shadow-xl hover:border-orange-300 transition-all duration-300 h-full flex flex-col">
                    <div className="flex items-start mb-6">
                      <div className="bg-orange-100 p-3 rounded-xl mr-4 flex-shrink-0">
                        <BarChart3 className="w-8 h-8 text-orange-600" />
                      </div>
                      <div className="flex-grow">
                        <div className="bg-orange-50 px-3 py-1 rounded-full text-xs font-medium text-orange-600 mb-3 inline-block">
                          Admin
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors mb-3">
                          Panel Administrativo
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          Reportes, cierre de caja y gestión general del negocio
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* Sección: Personal */}
          <div className="mb-16">
            <div className="flex items-center mb-8">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Personal</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Panel de Empleados */}
              <Link href="/employee" className="group">
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 hover:shadow-xl hover:border-green-300 transition-all duration-300 h-full flex flex-col">
                  <div className="flex items-start mb-6">
                    <div className="bg-green-100 p-3 rounded-xl mr-4 flex-shrink-0">
                      <Users className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="flex-grow">
                      <div className="bg-green-50 px-3 py-1 rounded-full text-xs font-medium text-green-600 mb-3 inline-block">
                        Personal
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors mb-3">
                        Panel de Empleado
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        Check-in/out, tiempo de comida y control de jornada personal
                      </p>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Gestión de Usuarios - Solo para admin */}
              {permissions.canAccessAdmin && (
                <Link href="/admin/employees" className="group">
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 hover:shadow-xl hover:border-purple-300 transition-all duration-300 h-full flex flex-col">
                    <div className="flex items-start mb-6">
                      <div className="bg-purple-100 p-3 rounded-xl mr-4 flex-shrink-0">
                        <Settings className="w-8 h-8 text-purple-600" />
                      </div>
                      <div className="flex-grow">
                        <div className="bg-purple-50 px-3 py-1 rounded-full text-xs font-medium text-purple-600 mb-3 inline-block">
                          Admin
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors mb-3">
                          Usuarios
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          Gestión de empleados y permisos del sistema
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}