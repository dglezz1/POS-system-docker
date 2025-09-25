'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  Eye,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Banknote,
  Smartphone,
  BarChart3,
  PieChart,
  Users,
  ShoppingCart,
  Clock,
  CheckCircle,
  X,
  Loader2
} from 'lucide-react'
import { PermissionGuard } from '@/hooks/usePermissions'
import ProtectedRoute from '@/components/ProtectedRoute'

interface Sale {
  id: string
  saleNumber: string
  total: number
  paymentType: string
  status: string
  saleType: string
  createdAt: string
  user: {
    name: string
    email: string
  }
  saleItems: Array<{
    id: string
    quantity: number
    unitPrice: number
    subtotal: number
    product: {
      name: string
      category: string
    }
  }>
  cashRegister?: {
    id: number
    date: string
  }
  customOrderInfo?: {
    customerName: string
    description: string
    paymentType: string
    orderStatus: string
    totalOrderValue: number
  }
}

interface SalesData {
  sales: Sale[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  stats: {
    total: number
    count: number
  }
  breakdown: {
    byPayment: Array<{
      paymentType: string
      _sum: { total: number }
      _count: number
    }>
    byType: Array<{
      saleType: string
      _sum: { total: number }
      _count: number
    }>
    byEmployee: Array<{
      userId: string
      employeeName: string
      _sum: { total: number }
      _count: number
    }>
  }
  dailySales: Array<{
    date: string
    count: number
    total: number
  }>
}

export default function SalesHistoryPage() {
  return (
    <ProtectedRoute>
      <PermissionGuard permission="canAccessAdmin">
        <SalesHistoryContent />
      </PermissionGuard>
    </ProtectedRoute>
  )
}

function SalesHistoryContent() {
  const [data, setData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([])
  
  // Filtros
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentType: 'ALL',
    employeeId: 'ALL',
    saleType: 'ALL',
    page: 1,
    limit: 50
  })

  const [showFilters, setShowFilters] = useState(false)
  const [expandedSale, setExpandedSale] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadEmployees()
    loadSalesData()
  }, [])

  useEffect(() => {
    loadSalesData()
  }, [filters])

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const result = await response.json()
        setEmployees(result.users || [])
      }
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  const loadSalesData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'ALL') {
          params.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/admin/sales-history?${params}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error loading sales data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key !== 'page' && { page: 1 }) // Reset page when changing other filters
    }))
  }

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      paymentType: 'ALL',
      employeeId: 'ALL',
      saleType: 'ALL',
      page: 1,
      limit: 50
    })
  }

  const exportToCSV = async () => {
    try {
      setExporting(true)
      const response = await fetch('/api/admin/sales-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters,
          format: 'csv'
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ventas_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting data:', error)
    } finally {
      setExporting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'CASH': return <Banknote className="w-4 h-4" />
      case 'CARD': return <CreditCard className="w-4 h-4" />
      case 'TRANSFER': return <Smartphone className="w-4 h-4" />
      default: return <DollarSign className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100'
      case 'PENDING': return 'text-yellow-600 bg-yellow-100'
      case 'CANCELLED': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSaleTypeColor = (saleType: string) => {
    switch (saleType) {
      case 'VITRINA': return 'bg-blue-100 text-blue-800'
      case 'CAKE_BAR': return 'bg-purple-100 text-purple-800'
      case 'CUSTOM_ORDER': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSaleTypeLabel = (saleType: string) => {
    switch (saleType) {
      case 'VITRINA': return 'Vitrina'
      case 'CAKE_BAR': return 'Cake Bar'
      case 'CUSTOM_ORDER': return 'Pedido Personalizado'
      default: return saleType
    }
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Cargando historial de ventas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link 
                href="/admin" 
                className="flex items-center text-gray-600 hover:text-gray-800 mr-6"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Panel Admin
              </Link>
              <div className="flex items-center">
                <div className="bg-purple-500 p-2 rounded-lg mr-3">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Historial de Ventas
                  </h1>
                  <p className="text-xs text-gray-500">
                    Reportes y análisis de ventas
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
                {showFilters ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
              </button>
              <button
                onClick={exportToCSV}
                disabled={exporting || !data?.sales.length}
                className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Exportar CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha inicio
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha fin
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método de pago
                </label>
                <select
                  value={filters.paymentType}
                  onChange={(e) => handleFilterChange('paymentType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ALL">Todos</option>
                  <option value="CASH">Efectivo</option>
                  <option value="CARD">Tarjeta</option>
                  <option value="TRANSFER">Transferencia</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empleado
                </label>
                <select
                  value={filters.employeeId}
                  onChange={(e) => handleFilterChange('employeeId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ALL">Todos</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de venta
                </label>
                <select
                  value={filters.saleType}
                  onChange={(e) => handleFilterChange('saleType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ALL">Todos</option>
                  <option value="VITRINA">Vitrina</option>
                  <option value="CAKE_BAR">Cake Bar</option>
                  <option value="CUSTOM_ORDER">Pedidos Personalizados</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={resetFilters}
                className="flex items-center text-gray-600 hover:text-gray-800 px-3 py-1 rounded"
              >
                <X className="w-4 h-4 mr-1" />
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Estadísticas principales */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total ventas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(data.stats.total)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Número de ventas</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.count}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Ticket promedio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(data.stats.count > 0 ? data.stats.total / data.stats.count : 0)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Empleados activos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.breakdown.byEmployee.length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* Lista de ventas */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Ventas recientes
              </h3>
              {data && (
                <p className="text-sm text-gray-500">
                  {data.pagination.total} ventas encontradas
                </p>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Cargando ventas...</p>
              </div>
            ) : data?.sales.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No se encontraron ventas con los filtros aplicados</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Venta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pago
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.sales.map((sale) => (
                    <React.Fragment key={sale.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {sale.saleNumber}
                            </div>
                            <div className="text-xs text-gray-500">
                              {sale.id.slice(0, 8)}...
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">
                              {formatDate(sale.createdAt)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatTime(sale.createdAt)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSaleTypeColor(sale.saleType)}`}>
                            {getSaleTypeLabel(sale.saleType)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getPaymentIcon(sale.paymentType)}
                            <span className="ml-2 text-sm text-gray-900">
                              {sale.paymentType}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(sale.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                            {sale.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                      
                      {/* Detalles expandidos */}
                      {expandedSale === sale.id && (
                        <tr>
                          <td colSpan={8} className="px-6 py-4 bg-gray-50">
                            <div className="space-y-3">
                              {sale.saleType === 'CUSTOM_ORDER' && sale.customOrderInfo ? (
                                <div>
                                  <h4 className="font-medium text-gray-900">Detalles del Pedido Personalizado:</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                    <div className="bg-white p-3 rounded border">
                                      <p className="text-sm text-gray-600">Cliente</p>
                                      <p className="font-medium text-gray-900">{sale.customOrderInfo.customerName}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded border">
                                      <p className="text-sm text-gray-600">Estado del Pedido</p>
                                      <p className="font-medium text-gray-900">{sale.customOrderInfo.orderStatus}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded border">
                                      <p className="text-sm text-gray-600">Tipo de Pago</p>
                                      <p className="font-medium text-gray-900">{sale.customOrderInfo.paymentType}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded border">
                                      <p className="text-sm text-gray-600">Valor Total del Pedido</p>
                                      <p className="font-medium text-gray-900">{formatCurrency(sale.customOrderInfo.totalOrderValue)}</p>
                                    </div>
                                  </div>
                                  <div className="bg-white p-3 rounded border mt-3">
                                    <p className="text-sm text-gray-600">Descripción</p>
                                    <p className="font-medium text-gray-900">{sale.customOrderInfo.description}</p>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <h4 className="font-medium text-gray-900">Productos vendidos:</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {sale.saleItems
                                      .filter(item => item && item.product && item.product.name) // Filtrar items válidos
                                      .map((item) => (
                                      <div key={item.id} className="bg-white p-3 rounded border">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <p className="font-medium text-gray-900">{item.product.name}</p>
                                            <p className="text-sm text-gray-500">{item.product.category || 'Sin categoría'}</p>
                                            <p className="text-sm text-gray-600">
                                              Cantidad: {item.quantity} × {formatCurrency(item.unitPrice)}
                                            </p>
                                          </div>
                                          <p className="font-medium text-gray-900">
                                            {formatCurrency(item.subtotal)}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Paginación */}
          {data && data.pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{((data.pagination.page - 1) * data.pagination.limit) + 1}</span> a{' '}
                    <span className="font-medium">
                      {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)}
                    </span> de{' '}
                    <span className="font-medium">{data.pagination.total}</span> resultados
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                    disabled={filters.page <= 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded">
                    {filters.page} / {data.pagination.pages}
                  </span>
                  <button
                    onClick={() => handleFilterChange('page', Math.min(data.pagination.pages, filters.page + 1))}
                    disabled={filters.page >= data.pagination.pages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}