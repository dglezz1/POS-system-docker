'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Calculator, DollarSign, Clock, CheckCircle, AlertCircle, Eye, Edit3, X, Phone, Mail, Calendar, Users, Banknote, CreditCard, Smartphone } from 'lucide-react'
import { usePermissions, PermissionGuard } from '@/hooks/usePermissions'

interface Ingredient {
  id: string
  name: string
  unit: string
  costPerUnit: number
}

interface CustomOrderPayment {
  amount: number
  paymentMethod: string
  paymentType: string
  description?: string
}

interface CustomOrder {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string | null
  customerEmail: string | null
  description: string
  estimatedPrice: number
  totalPaid: number
  status: string
  deliveryDate: string
  notes: string | null
  createdAt: string
  payments: {
    id: string
    amount: number
    paymentMethod: string
    paymentType: string
    description: string | null
    createdAt: string
    user: { name: string }
  }[]
}

export default function CustomOrdersPage() {
  return (
    <PermissionGuard permission="canCreateCustomOrders">
      <CustomOrdersContent />
    </PermissionGuard>
  )
}

function CustomOrdersContent() {
  const [orders, setOrders] = useState<CustomOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<CustomOrder[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [showNewOrderForm, setShowNewOrderForm] = useState(false)
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<CustomOrder | null>(null)
  const [isEditingOrder, setIsEditingOrder] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentType: 'CASH' as 'CASH' | 'CARD' | 'TRANSFER',
    paymentCategory: 'ANTICIPO' as 'ANTICIPO' | 'LIQUIDACION',
    description: ''
  })
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate, setFilterDate] = useState('')

  // Form state
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [description, setDescription] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [deliveryTime, setDeliveryTime] = useState('')
  const [estimatedPrice, setEstimatedPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [advanceAmount, setAdvanceAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    let filtered = [...orders]

    // Filtro por estado
    if (filterStatus) {
      filtered = filtered.filter(order => order.status === filterStatus)
    }

    // Filtro por fecha
    if (filterDate) {
      const filterDateTime = new Date(filterDate)
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.deliveryDate)
        return orderDate.toDateString() === filterDateTime.toDateString()
      })
    }

    setFilteredOrders(filtered)
  }, [orders, filterStatus, filterDate])

  // Función para detectar pedidos próximos a entrega
  const getUpcomingOrders = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return orders.filter(order => {
      const deliveryDate = new Date(order.deliveryDate)
      return deliveryDate.toDateString() === tomorrow.toDateString() && 
             order.status !== 'ENTREGADO'
    })
  }

  const fetchData = async () => {
    try {
      const [ordersRes, ingredientsRes] = await Promise.all([
        fetch('/api/custom-orders'),
        fetch('/api/ingredients')
      ])

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        setOrders(ordersData)
        setFilteredOrders(ordersData)
      }

      if (ingredientsRes.ok) {
        const ingredientsData = await ingredientsRes.json()
        setIngredients(ingredientsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateMinAdvance = () => {
    const price = parseFloat(estimatedPrice) || 0
    return price * 0.5
  }

  const validateAdvance = () => {
    const price = parseFloat(estimatedPrice) || 0
    const advance = parseFloat(advanceAmount) || 0
    return advance >= price * 0.5
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateAdvance()) {
      alert('El anticipo debe ser mínimo el 50% del precio estimado')
      return
    }
    
    try {
      const deliveryDateTime = new Date(`${deliveryDate}T${deliveryTime}`)
      
      const response = await fetch('/api/custom-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          description,
          deliveryDate: deliveryDateTime.toISOString(),
          notes,
          estimatedPrice: parseFloat(estimatedPrice),
          advanceAmount: parseFloat(advanceAmount),
          paymentMethod
        })
      })

      if (response.ok) {
        setShowNewOrderForm(false)
        resetForm()
        fetchData()
      } else {
        console.error('Error creating order')
      }
    } catch (error) {
      console.error('Error creating order:', error)
    }
  }

  const resetForm = () => {
    setCustomerName('')
    setCustomerPhone('')
    setCustomerEmail('')
    setDescription('')
    setDeliveryDate('')
    setDeliveryTime('')
    setEstimatedPrice('')
    setAdvanceAmount('')
    setNotes('')
    setPaymentMethod('CASH')
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!confirm(`¿Cambiar estado a ${getStatusText(newStatus)}?`)) return

    try {
      const response = await fetch(`/api/custom-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchData()
      } else {
        alert('Error al actualizar el estado')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error al actualizar el estado')
    }
  }

  const registerPayment = (orderId: string) => {
    const order = orders.find(o => o.id === orderId)
    if (!order) return

    setSelectedOrder(order)
    setPaymentData({
      amount: 0,
      paymentType: 'CASH',
      paymentCategory: 'ANTICIPO',
      description: ''
    })
    setShowPaymentModal(true)
  }

  const processPayment = async () => {
    if (!selectedOrder || paymentData.amount <= 0) return

    try {
      const response = await fetch('/api/custom-orders/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customOrderId: selectedOrder.id,
          amount: paymentData.amount,
          paymentMethod: paymentData.paymentType,
          paymentType: paymentData.paymentCategory,
          description: paymentData.description || `Pago ${paymentData.paymentCategory.toLowerCase()} registrado`
        })
      })

      if (response.ok) {
        fetchData()
        setShowPaymentModal(false)
        setSelectedOrder(null)
        setPaymentData({ amount: 0, paymentType: 'CASH', paymentCategory: 'ANTICIPO', description: '' })
        alert('Pago registrado exitosamente')
      } else {
        alert('Error al registrar el pago')
      }
    } catch (error) {
      console.error('Error registering payment:', error)
      alert('Error al registrar el pago')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800'
      case 'HORNEADO': return 'bg-orange-100 text-orange-800'
      case 'LISTO': return 'bg-green-100 text-green-800'
      case 'ENTREGADO': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDIENTE': return 'Pendiente'
      case 'HORNEADO': return 'Horneado'
      case 'LISTO': return 'Listo'
      case 'ENTREGADO': return 'Entregado'
      default: return status
    }
  }

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'PENDIENTE': return 'HORNEADO'
      case 'HORNEADO': return 'LISTO'
      case 'LISTO': return 'ENTREGADO'
      default: return null
    }
  }

  const openOrderDetailModal = (order: CustomOrder) => {
    setSelectedOrder(order)
    setShowOrderDetailModal(true)
    setIsEditingOrder(false)
  }

  const closeOrderDetailModal = () => {
    setShowOrderDetailModal(false)
    setSelectedOrder(null)
    setIsEditingOrder(false)
  }

  const toggleEditMode = () => {
    setIsEditingOrder(!isEditingOrder)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Cargando pedidos personalizados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver al inicio
              </Link>
            </div>
            <button
              onClick={() => setShowNewOrderForm(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Pedido Personalizado
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">
            Pedidos Personalizados
          </h1>
          <p className="text-gray-600 mt-2">
            Gestión de pedidos personalizados con anticipos y control de pagos
          </p>
        </div>

        {/* Información del Sistema */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-800 mb-1">
                Sistema de Pedidos Personalizados
              </h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• <strong>Anticipo obligatorio:</strong> Mínimo 50% del precio estimado</p>
                <p>• <strong>Estados:</strong> Pendiente → Horneado → Listo → Entregado</p>
                <p>• <strong>Pagos múltiples:</strong> Anticipo + Liquidación final</p>
                <p>• <strong>Control de caja:</strong> Los pagos afectan la caja del día recibido</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">Todos los estados</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="HORNEADO">Horneado</option>
                  <option value="LISTO">Listo</option>
                  <option value="ENTREGADO">Entregado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Entrega
                </label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilterStatus('')
                    setFilterDate('')
                  }}
                  className="btn-secondary w-full"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notificación de Pedidos Próximos */}
        {getUpcomingOrders().length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-orange-600 mr-2 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-orange-800 mb-1">
                  ⚠️ Pedidos para entregar mañana ({getUpcomingOrders().length})
                </h3>
                <div className="text-sm text-orange-700">
                  {getUpcomingOrders().map(order => (
                    <div key={order.id} className="flex justify-between items-center py-1">
                      <span>{order.customerName} - {order.orderNumber}</span>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Pedidos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Pedidos Activos ({filteredOrders.length} de {orders.length})
              </h2>
              <div className="text-sm text-gray-500">
                {filterStatus && `Estado: ${getStatusText(filterStatus)}`}
                {filterDate && ` • Fecha: ${new Date(filterDate).toLocaleDateString()}`}
              </div>
            </div>
          </div>

          <div className="p-6">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {orders.length === 0 ? 'No hay pedidos personalizados' : 'No hay pedidos que coincidan con los filtros'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {orders.length === 0 
                    ? 'Comienza creando tu primer pedido personalizado'
                    : 'Prueba cambiando los filtros o crea un nuevo pedido'
                  }
                </p>
                <button
                  onClick={() => setShowNewOrderForm(true)}
                  className="btn-primary"
                >
                  Crear Pedido
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => openOrderDetailModal(order)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                          {order.orderNumber}
                        </h3>
                        <p className="text-sm text-gray-600">{order.customerName}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                      {order.description}
                    </p>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Precio Estimado:</span>
                        <span className="font-medium">${order.estimatedPrice.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Pagado:</span>
                        <span className="font-medium text-green-600">${order.totalPaid.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600">Pendiente:</span>
                        <span className={`font-medium ${order.totalPaid >= order.estimatedPrice ? 'text-green-600' : 'text-orange-600'}`}>
                          ${(order.estimatedPrice - order.totalPaid).toFixed(2)}
                        </span>
                      </div>

                      {order.deliveryDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Entrega:</span>
                          <span className="flex items-center text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(order.deliveryDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {order.payments.length} pago(s) • {new Date(order.deliveryDate).toLocaleDateString()}
                        </span>
                        <div className="flex space-x-2">
                          {getNextStatus(order.status) && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                updateOrderStatus(order.id, getNextStatus(order.status)!)
                              }}
                              className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                            >
                              → {getStatusText(getNextStatus(order.status)!)}
                            </button>
                          )}
                          {order.totalPaid < order.estimatedPrice && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                registerPayment(order.id)
                              }}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                            >
                              + Pago
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal/Form para Nuevo Pedido */}
        {showNewOrderForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Nuevo Pedido Personalizado
                  </h2>
                  <button
                    onClick={() => setShowNewOrderForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Información del Cliente */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Cliente *
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="input-field w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="input-field w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="input-field w-full"
                      />
                    </div>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción del Pedido *
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="input-field w-full"
                      required
                    />
                  </div>

                  {/* Detalles del Pedido */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Entrega *
                      </label>
                      <input
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className="input-field w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hora de Entrega *
                      </label>
                      <input
                        type="time"
                        value={deliveryTime}
                        onChange={(e) => setDeliveryTime(e.target.value)}
                        className="input-field w-full"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio Total Estimado *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        value={estimatedPrice}
                        onChange={(e) => setEstimatedPrice(e.target.value)}
                        className="input-field w-full pl-10"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  {/* Anticipo */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-blue-900 mb-3">
                      Anticipo (Mínimo 50%)
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Monto del Anticipo *
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="number"
                            step="0.01"
                            value={advanceAmount}
                            onChange={(e) => setAdvanceAmount(e.target.value)}
                            className="input-field w-full pl-10"
                            placeholder="0.00"
                            min={calculateMinAdvance()}
                            required
                          />
                        </div>
                        {estimatedPrice && (
                          <p className="text-sm text-gray-600 mt-1">
                            Mínimo requerido: ${calculateMinAdvance().toFixed(2)}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Método de Pago *
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="input-field w-full"
                          required
                        >
                          <option value="CASH">Efectivo</option>
                          <option value="CARD">Tarjeta</option>
                          <option value="TRANSFER">Transferencia</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas Especiales
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="input-field w-full"
                      placeholder="Instrucciones especiales, detalles adicionales, decoraciones, etc..."
                    />
                  </div>

                  {/* Botones */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowNewOrderForm(false)}
                      className="btn-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      Crear Pedido
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Detalles de Pedido Personalizado */}
        {showOrderDetailModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Pedido Personalizado #{selectedOrder.orderNumber}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedOrder.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {!isEditingOrder && (
                    <button
                      onClick={toggleEditMode}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Editar
                    </button>
                  )}
                  {isEditingOrder && (
                    <>
                      <button
                        onClick={toggleEditMode}
                        className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        Guardar
                      </button>
                    </>
                  )}
                  <button
                    onClick={closeOrderDetailModal}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Estado y Resumen */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusText(selectedOrder.status)}
                    </span>
                    <p className="text-sm text-gray-600 mt-2">Estado del pedido</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">
                      ${selectedOrder.estimatedPrice.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">Precio estimado</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-lg font-bold text-green-600">
                      ${selectedOrder.totalPaid.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">Total pagado</p>
                  </div>
                </div>

                {/* Información del Cliente */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Información del Cliente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre
                      </label>
                      {isEditingOrder ? (
                        <input
                          type="text"
                          defaultValue={selectedOrder.customerName}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 flex items-center">
                          <Users className="w-4 h-4 mr-2 text-gray-400" />
                          {selectedOrder.customerName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      {isEditingOrder ? (
                        <input
                          type="tel"
                          defaultValue={selectedOrder.customerPhone || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {selectedOrder.customerPhone || 'No especificado'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      {isEditingOrder ? (
                        <input
                          type="email"
                          defaultValue={selectedOrder.customerEmail || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {selectedOrder.customerEmail || 'No especificado'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Descripción del Pedido */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Descripción del Pedido</h3>
                  {isEditingOrder ? (
                    <textarea
                      defaultValue={selectedOrder.description}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {selectedOrder.description}
                    </p>
                  )}
                </div>

                {/* Fechas */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Fechas Importantes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Fecha de Entrega</p>
                      {isEditingOrder ? (
                        <input
                          type="datetime-local"
                          defaultValue={new Date(selectedOrder.deliveryDate).toISOString().slice(0, 16)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mt-1"
                        />
                      ) : (
                        <p className="text-gray-900 flex items-center mt-1">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {new Date(selectedOrder.deliveryDate).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Fecha de Creación</p>
                      <p className="text-gray-900 flex items-center mt-1">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Historial de Pagos */}
                {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Historial de Pagos</h3>
                    <div className="space-y-2">
                      {selectedOrder.payments.map((payment, index) => (
                        <div key={payment.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                          <div>
                            <p className="font-medium text-gray-900">${payment.amount.toFixed(2)}</p>
                            <p className="text-sm text-gray-600">
                              {payment.paymentMethod} - {payment.paymentType}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(payment.createdAt).toLocaleString()} por {payment.user.name}
                            </p>
                            {payment.description && (
                              <p className="text-xs text-gray-500">{payment.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notas */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Notas Adicionales</h3>
                  {isEditingOrder ? (
                    <textarea
                      defaultValue={selectedOrder.notes || ''}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Agregar notas adicionales sobre el pedido..."
                    />
                  ) : (
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {selectedOrder.notes || 'Sin notas adicionales'}
                    </p>
                  )}
                </div>

                {/* Saldo Pendiente */}
                {selectedOrder.totalPaid < selectedOrder.estimatedPrice && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                      <div className="flex-1">
                        <h4 className="font-medium text-yellow-800">Saldo Pendiente</h4>
                        <p className="text-yellow-700">
                          Resta por pagar: ${(selectedOrder.estimatedPrice - selectedOrder.totalPaid).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          registerPayment(selectedOrder.id)
                        }}
                        className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                      >
                        Registrar Pago
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Pago */}
        {showPaymentModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Procesar Pago - #{selectedOrder.orderNumber}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Cliente: {selectedOrder.customerName}
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto a Pagar
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedOrder.estimatedPrice - selectedOrder.totalPaid}
                    value={paymentData.amount === 0 ? '' : paymentData.amount}
                    onChange={(e) => setPaymentData({
                      ...paymentData,
                      amount: parseFloat(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Saldo pendiente: ${(selectedOrder.estimatedPrice - selectedOrder.totalPaid).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Total del pedido: ${selectedOrder.estimatedPrice.toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de Pago
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: 'CASH', label: 'Efectivo', icon: Banknote },
                      { type: 'CARD', label: 'Tarjeta', icon: CreditCard },
                      { type: 'TRANSFER', label: 'Transferencia', icon: Smartphone }
                    ].map(({ type, label, icon: Icon }) => (
                      <button
                        key={type}
                        onClick={() => setPaymentData({
                          ...paymentData,
                          paymentType: type as 'CASH' | 'CARD' | 'TRANSFER'
                        })}
                        className={`p-3 border rounded-lg text-center hover:border-blue-500 transition-colors ${
                          paymentData.paymentType === type 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200'
                        }`}
                      >
                        <Icon className="w-5 h-5 mx-auto mb-1" />
                        <div className="text-sm font-medium">{label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Pago
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { type: 'ANTICIPO', label: 'Anticipo' },
                      { type: 'LIQUIDACION', label: 'Liquidación' }
                    ].map(({ type, label }) => (
                      <button
                        key={type}
                        onClick={() => setPaymentData({
                          ...paymentData,
                          paymentCategory: type as 'ANTICIPO' | 'LIQUIDACION'
                        })}
                        className={`p-3 border rounded-lg text-center hover:border-blue-500 transition-colors ${
                          paymentData.paymentCategory === type 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="text-sm font-medium">{label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción (Opcional)
                  </label>
                  <input
                    type="text"
                    value={paymentData.description}
                    onChange={(e) => setPaymentData({
                      ...paymentData,
                      description: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Pago inicial, Material adicional"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setSelectedOrder(null)
                    setPaymentData({ amount: 0, paymentType: 'CASH', paymentCategory: 'ANTICIPO', description: '' })
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={processPayment}
                  disabled={paymentData.amount <= 0 || paymentData.amount > (selectedOrder.estimatedPrice - selectedOrder.totalPaid)}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Procesar Pago
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}