'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  DollarSign, 
  ShoppingCart, 
  Cake, 
  Cookie, 
  Calculator,
  CreditCard,
  Banknote,
  Smartphone,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  Users,
  AlertTriangle,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Coffee,
  Timer,
  Bell,
  Settings
} from 'lucide-react'
import { PermissionGuard } from '@/hooks/usePermissions'
import ProtectedRoute from '@/components/ProtectedRoute'

interface DashboardData {
  period: string
  dateRange: {
    start: string
    end: string
  }
  sales: {
    total: number
    count: number
    average: number
    bySegment: Array<{
      type: string
      total: number
      count: number
    }>
    byPayment: Array<{
      method: string
      total: number
      count: number
    }>
    customOrders: {
      total: number
      count: number
    }
  }
  products: {
    topSelling: Array<{
      product: {
        id: number
        name: string
        price: number
        category: string
      }
      quantity: number
      revenue: number
      profit: number | null
    }>
  }
  trends: {
    dailySales: Array<{
      date: string
      vitrina: number
      cakeBar: number
      total: number
      count: number
    }>
  }
  operations: {
    activeCakeBarOrders: number
    activeEmployees: Array<any>
    systemAlerts: number
    unreadAlerts: Array<any>
  }
  cash: {
    currentRegister: any
    expenses: {
      total: number
      count: number
    }
  }
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute>
      <PermissionGuard permission="canAccessAdmin">
        <AdminDashboardContent />
      </PermissionGuard>
    </ProtectedRoute>
  )
}

function AdminDashboardContent() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('today')

  useEffect(() => {
    loadDashboardData()
  }, [period])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/admin/dashboard?period=${period}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      } else {
        const errorText = await response.text()
        setError(`Error ${response.status}: ${errorText || 'No se pudo cargar el dashboard'}`)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError('Error de conexión al cargar el dashboard')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'today': return 'Hoy'
      case 'week': return 'Últimos 7 días'
      case 'month': return 'Último mes'
      case 'year': return 'Último año'
      default: return 'Hoy'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || (!loading && !dashboardData)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            {error || 'Error al cargar los datos del dashboard'}
          </p>
          <button
            onClick={() => loadDashboardData()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return null // Esta condición no debería alcanzarse debido al check anterior
  }

  const totalSalesAllSegments = dashboardData.sales.total

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link 
                href="/" 
                className="flex items-center text-gray-600 hover:text-gray-800 mr-6"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver
              </Link>
              <div className="flex items-center">
                <div className="bg-blue-500 p-2 rounded-lg mr-3">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Panel Administrativo
                  </h1>
                  <p className="text-xs text-gray-500">
                    Dashboard ejecutivo y métricas
                  </p>
                </div>
              </div>
            </div>

            {/* Selector de período */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="today">Hoy</option>
                <option value="week">Últimos 7 días</option>
                <option value="month">Último mes</option>
                <option value="year">Último año</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Header del período */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Dashboard Ejecutivo - {getPeriodLabel(period)}
                </h2>
                <p className="text-gray-600 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Del {formatDate(dashboardData.dateRange.start)} al {formatDate(dashboardData.dateRange.end)}
                </p>
              </div>
              <Link 
                href="/admin/system-config"
                className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configuración
              </Link>
            </div>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total General */}
          <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <DollarSign className="w-5 h-5 mr-2 text-blue-100" />
                  <p className="text-blue-100 font-medium">Total General</p>
                </div>
                <p className="text-3xl font-bold mb-1">{formatCurrency(totalSalesAllSegments + dashboardData.sales.customOrders.total)}</p>
                <p className="text-blue-100 text-sm">
                  {dashboardData.sales.count + dashboardData.sales.customOrders.count} transacciones
                </p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Vitrina */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <p className="text-gray-600 font-medium">Vitrina</p>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {formatCurrency(dashboardData.sales.bySegment.find(s => s.type === 'VITRINA')?.total || 0)}
                </p>
                <p className="text-gray-500 text-sm">
                  {dashboardData.sales.bySegment.find(s => s.type === 'VITRINA')?.count || 0} ventas
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <Cookie className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Cake Bar */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                  <p className="text-gray-600 font-medium">Cake Bar</p>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {formatCurrency(dashboardData.sales.bySegment.find(s => s.type === 'CAKE_BAR')?.total || 0)}
                </p>
                <p className="text-gray-500 text-sm">
                  {dashboardData.sales.bySegment.find(s => s.type === 'CAKE_BAR')?.count || 0} órdenes
                </p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <Cake className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Pedidos Personalizados */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                  <p className="text-gray-600 font-medium">Pedidos Custom</p>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {formatCurrency(dashboardData.sales.customOrders.total)}
                </p>
                <p className="text-gray-500 text-sm">
                  {dashboardData.sales.customOrders.count} pagos
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <ShoppingCart className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Métricas operacionales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Promedio por transacción */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <Calculator className="w-5 h-5 mr-2 text-blue-500" />
                  <p className="text-gray-600 font-medium">Ticket Promedio</p>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {formatCurrency(dashboardData.sales.average)}
                </p>
                <p className="text-gray-500 text-sm">Por transacción</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Empleados activos */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <Users className="w-5 h-5 mr-2 text-indigo-500" />
                  <p className="text-gray-600 font-medium">Personal Activo</p>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {dashboardData.operations.activeEmployees.length}
                </p>
                <p className="text-gray-500 text-sm">Trabajando ahora</p>
              </div>
              <div className="bg-indigo-100 rounded-full p-3">
                <Clock className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Alertas del sistema */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <Bell className="w-5 h-5 mr-2 text-red-500" />
                  <p className="text-gray-600 font-medium">Alertas Sistema</p>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {dashboardData.operations.systemAlerts}
                </p>
                <p className="text-gray-500 text-sm">Pendientes</p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Análisis detallado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Métodos de pago */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <div className="bg-blue-100 rounded-lg p-2 mr-3">
                <PieChart className="w-5 h-5 text-blue-600" />
              </div>
              Métodos de Pago
            </h3>
            <div className="space-y-4">
              {dashboardData.sales.byPayment.map((payment) => (
                <div key={payment.method} className="flex items-center justify-between">
                  <div className="flex items-center">
                    {payment.method === 'CASH' && <Banknote className="w-5 h-5 mr-2 text-green-500" />}
                    {payment.method === 'CARD' && <CreditCard className="w-5 h-5 mr-2 text-blue-500" />}
                    {payment.method === 'TRANSFER' && <Smartphone className="w-5 h-5 mr-2 text-purple-500" />}
                    <span className="font-medium">
                      {payment.method === 'CASH' ? 'Efectivo' : 
                       payment.method === 'CARD' ? 'Tarjeta' : 'Transferencia'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(payment.total)}</p>
                    <p className="text-sm text-gray-500">{payment.count} ventas</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Productos más vendidos */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <div className="bg-green-100 rounded-lg p-2 mr-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              Top Productos
            </h3>
            <div className="space-y-3">
              {dashboardData.products.topSelling
                .filter(item => item && item.product && item.product.name) // Filtrar items válidos
                .slice(0, 5)
                .map((item, index) => (
                <div key={item.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="bg-blue-500 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{item.product.name}</p>
                      <p className="text-sm text-gray-500">{item.product.category || 'Sin categoría'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{item.quantity} unidades</p>
                    <p className="text-sm text-gray-500">{formatCurrency(item.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tendencia de ventas */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <div className="bg-purple-100 rounded-lg p-2 mr-3">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            Tendencia de Ventas (Últimos 14 días)
          </h3>
          <div className="overflow-x-auto">
            <div className="flex space-x-2 pb-4">
              {dashboardData.trends.dailySales.slice(-14).map((day) => (
                <div key={day.date} className="flex-shrink-0 text-center">
                  <div className="w-12 bg-gray-100 rounded-lg p-2 mb-2">
                    <div 
                      className="bg-blue-500 rounded"
                      style={{ 
                        height: Math.max(4, (day.total / Math.max(...dashboardData.trends.dailySales.map(d => d.total))) * 40) + 'px'
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(day.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-xs font-medium">{formatCurrency(day.total)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Estado operacional */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Estado de caja */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <div className="bg-green-100 rounded-lg p-2 mr-3">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              Control de Caja
            </h3>
            {dashboardData.cash.currentRegister ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className="font-medium text-green-600">Abierta</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Efectivo inicial:</span>
                  <span className="font-medium">{formatCurrency(dashboardData.cash.currentRegister.openingCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ventas del día:</span>
                  <span className="font-medium">{formatCurrency(dashboardData.cash.currentRegister.totalSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gastos:</span>
                  <span className="font-medium">{formatCurrency(dashboardData.cash.expenses.total)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold">
                  <span>Efectivo esperado:</span>
                  <span>{formatCurrency(
                    dashboardData.cash.currentRegister.openingCash + 
                    (dashboardData.sales.byPayment.find(p => p.method === 'CASH')?.total || 0) - 
                    dashboardData.cash.expenses.total
                  )}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Caja cerrada</p>
            )}
          </div>

          {/* Órdenes de Cake Bar activas */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <div className="bg-orange-100 rounded-lg p-2 mr-3">
                <Cake className="w-5 h-5 text-orange-600" />
              </div>
              Órdenes Cake Bar
            </h3>
            <div className="text-center">
              <div className="bg-orange-50 rounded-lg p-6">
                <p className="text-4xl font-bold text-orange-600 mb-2">
                  {dashboardData.operations.activeCakeBarOrders}
                </p>
                <p className="text-gray-600 font-medium">En proceso</p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de gestión rápida */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <div className="bg-blue-100 rounded-lg p-2 mr-3">
              <Timer className="w-5 h-5 text-blue-600" />
            </div>
            Acciones Rápidas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Link 
              href="/admin/work-sessions"
              className="bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-center transition-colors"
            >
              <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="font-medium text-blue-900 dark:text-blue-300">Jornadas Laborales</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Check-in/out empleados</p>
            </Link>
            
            <Link 
              href="/admin/cash-closure"
              className="bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-700 rounded-lg p-4 text-center transition-colors"
            >
              <Calculator className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="font-medium text-green-900 dark:text-green-300">Cierre de Caja</p>
              <p className="text-xs text-green-600 dark:text-green-400">Arqueo y balance</p>
            </Link>
            
            <Link 
              href="/admin/sales-history"
              className="bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-700 rounded-lg p-4 text-center transition-colors"
            >
              <BarChart3 className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="font-medium text-purple-900 dark:text-purple-300">Historial Ventas</p>
              <p className="text-xs text-purple-600 dark:text-purple-400">Reportes y filtros</p>
            </Link>
            
            <Link 
              href="/admin/employees"
              className="bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 border border-orange-200 dark:border-orange-700 rounded-lg p-4 text-center transition-colors"
            >
              <Users className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="font-medium text-orange-900 dark:text-orange-300">Empleados</p>
              <p className="text-xs text-orange-600 dark:text-orange-400">Gestión y horarios</p>
            </Link>
            
            <Link 
              href="/admin/system-config"
              className="bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 text-center transition-colors"
            >
              <Settings className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="font-medium text-gray-900 dark:text-gray-300">Configuración</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Sistema y preferencias</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}