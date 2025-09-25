'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  DollarSign, 
  Calculator, 
  Lock, 
  Unlock, 
  TrendingUp, 
  TrendingDown,
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react'
import { PermissionGuard } from '@/hooks/usePermissions'
import ProtectedRoute from '@/components/ProtectedRoute'

interface CashRegisterData {
  hasOpenRegister: boolean
  register?: any
  summary?: {
    openingCash: number
    totalSales: number
    cashSales: number
    cardSales: number
    transferSales: number
    totalExpenses: number
    expectedCash: number
    actualCash: number | null
    difference: number | null
    status: string
  }
  salesByPayment?: Record<string, { total: number; count: number }>
  recentSales?: any[]
  expenses?: any[]
}

export default function CashClosurePage() {
  return (
    <ProtectedRoute>
      <PermissionGuard permission="canAccessAdmin">
        <CashClosureContent />
      </PermissionGuard>
    </ProtectedRoute>
  )
}

function CashClosureContent() {
  const [data, setData] = useState<CashRegisterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [openingCash, setOpeningCash] = useState('')
  const [actualCash, setActualCash] = useState('')
  const [notes, setNotes] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [cleaningData, setCleaningData] = useState(false)

  useEffect(() => {
    loadCashRegisterData()
  }, [])

  const loadCashRegisterData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/cash-closure')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error loading cash register data:', error)
    } finally {
      setLoading(false)
    }
  }

  const cleanPaymentTypes = async () => {
    if (!confirm('¿Estás seguro de que quieres limpiar los tipos de pago? Esto corregirá datos corruptos.')) {
      return
    }

    try {
      setCleaningData(true)
      const response = await fetch('/api/admin/clean-payment-types', {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`Limpieza completada: ${result.salesCleaned} ventas corregidas, ${result.cakeBarPaymentsCleaned} pagos de cake bar corregidos`)
        await loadCashRegisterData()
      } else {
        alert('Error en la limpieza')
      }
    } catch (error) {
      console.error('Error cleaning payment types:', error)
      alert('Error en la limpieza')
    } finally {
      setCleaningData(false)
    }
  }

  const handleOpenRegister = async () => {
    if (!openingCash || parseFloat(openingCash) < 0) {
      alert('Ingresa un monto válido para el efectivo inicial')
      return
    }

    try {
      const response = await fetch('/api/admin/cash-closure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'open',
          openingCash: parseFloat(openingCash),
          notes
        })
      })

      if (response.ok) {
        setOpeningCash('')
        setNotes('')
        await loadCashRegisterData()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al abrir caja')
      }
    } catch (error) {
      console.error('Error opening register:', error)
    }
  }

  const handleCloseRegister = async () => {
    if (!actualCash || parseFloat(actualCash) < 0) {
      alert('Ingresa el monto de efectivo contado')
      return
    }

    try {
      const response = await fetch('/api/admin/cash-closure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'close',
          actualCash: parseFloat(actualCash),
          notes
        })
      })

      if (response.ok) {
        setActualCash('')
        setNotes('')
        await loadCashRegisterData()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al cerrar caja')
      }
    } catch (error) {
      console.error('Error closing register:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Calculator className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Cargando sistema de cierre de caja...</p>
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
                <div className="bg-green-500 p-2 rounded-lg mr-3">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Sistema de Cierre de Caja
                  </h1>
                  <p className="text-xs text-gray-500">
                    Control de efectivo y arqueo diario
                  </p>
                </div>
              </div>
            </div>

            {/* Estado de caja */}
            <div className="flex items-center space-x-2">
              {data?.hasOpenRegister ? (
                <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  <Unlock className="w-4 h-4 mr-1" />
                  Caja Abierta
                </div>
              ) : (
                <div className="flex items-center bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                  <Lock className="w-4 h-4 mr-1" />
                  Caja Cerrada
                </div>
              )}
              
              {/* Botón temporal para limpiar datos */}
              <button
                onClick={cleanPaymentTypes}
                disabled={cleaningData}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
              >
                {cleaningData ? 'Limpiando...' : 'Corregir Datos'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {!data?.hasOpenRegister ? (
          /* Abrir Caja */
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center mb-6">
                <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto mb-4">
                  <Unlock className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Abrir Caja</h2>
                <p className="text-gray-600">Inicia un nuevo día de operaciones</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Efectivo inicial
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={openingCash}
                      onChange={(e) => setOpeningCash(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observaciones del día..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleOpenRegister}
                  disabled={!openingCash}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Abrir Caja
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Caja Abierta - Dashboard */
          <div className="space-y-8">
            {/* Resumen principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Efectivo inicial</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(data.summary?.openingCash || 0)}
                    </p>
                  </div>
                  <Banknote className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Ventas totales</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(data.summary?.totalSales || 0)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm font-medium">Efectivo esperado</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(data.summary?.expectedCash || 0)}
                    </p>
                  </div>
                  <Calculator className="w-8 h-8 text-orange-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">Gastos</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(data.summary?.totalExpenses || 0)}
                    </p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Ventas por método de pago */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Receipt className="w-5 h-5 mr-2 text-blue-500" />
                  Ventas por método de pago
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <Banknote className="w-5 h-5 mr-2 text-green-500" />
                      <span className="font-medium">Efectivo</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(data.summary?.cashSales || 0)}</p>
                      <p className="text-sm text-gray-500">
                        {data.salesByPayment?.CASH?.count || 0} transacciones
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <CreditCard className="w-5 h-5 mr-2 text-blue-500" />
                      <span className="font-medium">Tarjeta</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(data.summary?.cardSales || 0)}</p>
                      <p className="text-sm text-gray-500">
                        {data.salesByPayment?.CARD?.count || 0} transacciones
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center">
                      <Smartphone className="w-5 h-5 mr-2 text-purple-500" />
                      <span className="font-medium">Transferencia</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(data.summary?.transferSales || 0)}</p>
                      <p className="text-sm text-gray-500">
                        {data.salesByPayment?.TRANSFER?.count || 0} transacciones
                      </p>
                    </div>
                  </div>

                  {/* Resumen total */}
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                      <span className="font-bold text-gray-900">Total Ventas</span>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(data.summary?.totalSales || 0)}</p>
                        <p className="text-sm text-gray-500">
                          {Object.values(data.salesByPayment || {}).reduce((sum, method) => sum + method.count, 0)} transacciones
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cierre de caja */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Lock className="w-5 h-5 mr-2 text-red-500" />
                  Cerrar Caja
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Efectivo contado *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={actualCash}
                        onChange={(e) => setActualCash(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {actualCash && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span>Diferencia:</span>
                        <span className={`font-bold ${
                          (parseFloat(actualCash) - (data.summary?.expectedCash || 0)) === 0
                            ? 'text-green-600'
                            : (parseFloat(actualCash) - (data.summary?.expectedCash || 0)) > 0
                            ? 'text-blue-600'
                            : 'text-red-600'
                        }`}>
                          {formatCurrency(parseFloat(actualCash) - (data.summary?.expectedCash || 0))}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas de cierre (opcional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Observaciones del cierre..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={handleCloseRegister}
                    disabled={!actualCash}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cerrar Caja
                  </button>
                </div>
              </div>
            </div>

            {/* Detalles expandibles */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-gray-500" />
                  Detalles del día
                </h3>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center text-gray-600 hover:text-gray-800"
                >
                  {showDetails ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-1" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-1" />
                      Ver detalles
                    </>
                  )}
                </button>
              </div>

              {showDetails && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Ventas recientes */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Últimas 10 transacciones</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {data.recentSales && data.recentSales.length > 0 ? (
                        data.recentSales.map((sale: any) => (
                          <div key={sale.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div>
                              <div className="flex items-center">
                                <span className="text-sm font-medium">
                                  {sale.type === 'CAKE_BAR' ? 'Cake Bar' : sale.saleType}
                                </span>
                                {sale.orderNumber && (
                                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded ml-2">
                                    #{sale.orderNumber}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(sale.createdAt).toLocaleTimeString('es-MX')}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold">{formatCurrency(sale.total)}</span>
                              <div className="flex items-center justify-end">
                                <span className="text-xs text-gray-500">{sale.paymentType}</span>
                                {sale.paymentType === 'CASH' && <Banknote className="w-3 h-3 ml-1 text-green-500" />}
                                {sale.paymentType === 'CARD' && <CreditCard className="w-3 h-3 ml-1 text-blue-500" />}
                                {sale.paymentType === 'TRANSFER' && <Smartphone className="w-3 h-3 ml-1 text-purple-500" />}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No hay ventas registradas</p>
                      )}
                    </div>
                  </div>

                  {/* Gastos */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Gastos del día</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {data.expenses && data.expenses.length > 0 ? (
                        data.expenses.map((expense: any) => (
                          <div key={expense.id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                            <div>
                              <span className="text-sm font-medium">{expense.description}</span>
                              <span className="text-xs text-red-500 block">{expense.category}</span>
                            </div>
                            <span className="font-bold text-red-600">
                              -{formatCurrency(expense.amount)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No hay gastos registrados</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}