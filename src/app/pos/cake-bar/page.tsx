'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, PermissionGuard } from '@/hooks/usePermissions'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Clock, 
  Timer,
  DollarSign,
  CreditCard,
  Banknote,
  Smartphone,
  Palette,
  Cake,
  ChefHat,
  Users,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  Eye,
  Edit3,
  X,
  Phone,
  Mail,
  Calendar
} from 'lucide-react'

interface Product {
  id: number
  name: string
  description: string | null
  price: number
  type: string
  isActive: boolean
  isService: boolean
}

interface CakeBarOption {
  id: string
  optionType: string
  category?: string
  name: string
  description: string | null
  priceAdd: number
  isActive: boolean
  isDefault: boolean
  allowMultiple: boolean
}

interface CakeBarOrder {
  id: number
  orderNumber: string
  product: Product
  size: string
  basePrice: number
  totalPrice: number
  amountPaid: number
  remainingAmount: number
  status: string
  customerName: string | null
  customerPhone: string | null
  notes: string | null
  startTime: string | null
  estimatedReady: string | null
  completedTime: string | null
  assignedWorker: string | null
  completedBy: string | null
  customizations: Array<{
    id: number
    optionType: string
    optionName: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  payments: Array<{
    id: number
    amount: number
    paymentType: string
    description: string | null
    createdAt: string
  }>
  timeRemaining?: number | null
}

interface ToppingSelection {
  [optionId: string]: number // optionId -> quantity
}

interface CustomizationSelection {
  [optionType: string]: string | ToppingSelection
}

interface PaymentModalData {
  amount: number
  paymentType: 'CASH' | 'CARD' | 'TRANSFER'
  description: string
}

export default function CakeBarPOS() {
  return (
    <ProtectedRoute>
      <PermissionGuard permission="canUsePOS">
        <CakeBarPOSContent />
      </PermissionGuard>
    </ProtectedRoute>
  )
}

function CakeBarPOSContent() {
  const { user } = useAuth()
  const permissions = usePermissions()
  
  // Estados principales
  const [products, setProducts] = useState<Product[]>([])
  const [options, setOptions] = useState<Record<string, CakeBarOption[] | Record<string, CakeBarOption[]>>>({})
  const [orders, setOrders] = useState<CakeBarOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(Date.now()) // Para actualizar el timer en tiempo real
  
  // Estado del formulario de nueva orden
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState<string>('10')
  const [customizations, setCustomizations] = useState<CustomizationSelection>({})
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  
  // Estados de modales
  const [showNewOrderModal, setShowNewOrderModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<CakeBarOrder | null>(null)
  const [isEditingOrder, setIsEditingOrder] = useState(false)
  const [paymentData, setPaymentData] = useState<PaymentModalData>({
    amount: 0,
    paymentType: 'CASH',
    description: ''
  })

  useEffect(() => {
    loadData()
    // Actualizar órdenes cada 30 segundos para sincronizar con el servidor
    const ordersInterval = setInterval(loadOrders, 30000)
    return () => clearInterval(ordersInterval)
  }, [])

  // Actualizar el tiempo cada segundo para el cronómetro en tiempo real
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(timeInterval)
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadProducts(),
        loadOptions(),
        loadOrders()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products?type=CAKE_BAR')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.filter((p: Product) => p.isActive))
      }
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const loadOptions = async () => {
    try {
      const response = await fetch('/api/cake-bar/options')
      if (response.ok) {
        const data = await response.json()
        setOptions(data)
      }
    } catch (error) {
      console.error('Error loading options:', error)
    }
  }

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/cake-bar/orders?today=true')
      if (response.ok) {
        const data = await response.json()
        setOrders(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      setOrders([])
    }
  }

  const calculateTotalPrice = () => {
    if (!selectedProduct) return 0

    const sizeMultiplier = selectedSize === '10' ? 1 : selectedSize === '20' ? 1.8 : 2.5
    const basePrice = selectedProduct.price * sizeMultiplier

    const customizationPrice = Object.entries(customizations).reduce((total, [optionType, selection]) => {
      if (optionType === 'TOPPING' && typeof selection === 'object') {
        // Para toppings, calcular según cantidad por cada topping seleccionado
        const toppingSelection = selection as ToppingSelection
        return total + Object.entries(toppingSelection).reduce((toppingTotal, [optionId, quantity]) => {
          // Buscar la opción en todas las categorías de toppings
          const toppings = options.TOPPING as Record<string, CakeBarOption[]>
          let option: CakeBarOption | undefined
          
          if (toppings) {
            for (const categoryOptions of Object.values(toppings)) {
              option = categoryOptions.find(o => o.id === optionId)
              if (option) break
            }
          }
          
          return toppingTotal + (option?.priceAdd || 0) * quantity
        }, 0)
      } else if (typeof selection === 'string') {
        // Para opciones simples (sabor, color, relleno)
        const optionsList = options[optionType] as CakeBarOption[]
        if (Array.isArray(optionsList)) {
          const option = optionsList.find(o => o.id === selection)
          return total + (option?.priceAdd || 0)
        }
      }
      return total
    }, 0)

    return basePrice + customizationPrice
  }

  const createOrder = async () => {
    if (!selectedProduct || !user) return

    try {
      const customizationsList: Array<{optionId: string, quantity?: number}> = []
      
      Object.entries(customizations).forEach(([optionType, selection]) => {
        if (optionType === 'TOPPING' && typeof selection === 'object') {
          // Para toppings múltiples
          const toppingSelection = selection as ToppingSelection
          Object.entries(toppingSelection).forEach(([optionId, quantity]) => {
            if (quantity > 0) {
              customizationsList.push({ optionId, quantity })
            }
          })
        } else if (typeof selection === 'string') {
          // Para opciones simples
          customizationsList.push({ optionId: selection })
        }
      })

      const response = await fetch('/api/cake-bar/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          size: selectedSize,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          notes: notes || null,
          customizations: customizationsList,
          createdBy: user.id
        })
      })

      if (response.ok) {
        const newOrder = await response.json()
        setOrders([newOrder, ...orders])
        resetForm()
        setShowNewOrderModal(false)
      } else {
        console.error('Error creating order')
      }
    } catch (error) {
      console.error('Error creating order:', error)
    }
  }

  const resetForm = () => {
    setSelectedProduct(null)
    setSelectedSize('10')
    setCustomizations({})
    setCustomerName('')
    setCustomerPhone('')
    setNotes('')
  }

  const startOrder = async (orderId: number) => {
    if (!user) return

    try {
      const response = await fetch(`/api/cake-bar/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'in_progress',
          assignedWorker: user.id
        })
      })

      if (response.ok) {
        loadOrders()
      }
    } catch (error) {
      console.error('Error starting order:', error)
    }
  }

  const completeOrder = async (orderId: number) => {
    if (!user) return

    try {
      const response = await fetch(`/api/cake-bar/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ready',
          completedBy: user.id
        })
      })

      if (response.ok) {
        loadOrders()
      }
    } catch (error) {
      console.error('Error completing order:', error)
    }
  }

  const processPayment = async () => {
    if (!selectedOrder || !user) return

    try {
      const response = await fetch('/api/cake-bar/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          amount: paymentData.amount,
          paymentType: paymentData.paymentType,
          description: paymentData.description || null,
          paidBy: user.id
        })
      })

      if (response.ok) {
        setShowPaymentModal(false)
        setSelectedOrder(null)
        setPaymentData({ amount: 0, paymentType: 'CASH', description: '' })
        loadOrders()
      }
    } catch (error) {
      console.error('Error processing payment:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'ready': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'in_progress': return <Timer className="w-4 h-4" />
      case 'ready': return <CheckCircle className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const openOrderDetailModal = (order: CakeBarOrder) => {
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

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Calcular tiempo restante en tiempo real
  const getRealTimeRemaining = (order: CakeBarOrder) => {
    if (order.status !== 'in_progress' || !order.startTime) return null
    
    const startTime = new Date(order.startTime).getTime()
    const thirtyMinutes = 30 * 60 * 1000 // 30 minutos en milisegundos
    const elapsedTime = currentTime - startTime
    
    return Math.max(0, thirtyMinutes - elapsedTime)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Cargando Cake Bar...</p>
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
                href="/" 
                className="flex items-center text-gray-600 hover:text-gray-800 mr-6"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver
              </Link>
              <div className="flex items-center">
                <div className="bg-orange-500 p-2 rounded-lg mr-3">
                  <Cake className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Cake Bar POS
                  </h1>
                  <p className="text-xs text-gray-500">
                    Pasteles personalizados
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowNewOrderModal(true)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Orden
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Órdenes del día */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Órdenes Pendientes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 flex items-center">
                <Clock className="w-5 h-5 text-yellow-500 mr-2" />
                Pendientes ({(orders || []).filter(o => o.status === 'pending').length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {(orders || []).filter(o => o.status === 'pending').map(order => (
                <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => openOrderDetailModal(order)}
                    >
                      <p className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                        #{order.orderNumber}
                      </p>
                      <p className="text-sm text-gray-600">{order.product.name}</p>
                      <p className="text-xs text-gray-500">{order.size} personas</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      Pendiente
                    </span>
                  </div>
                  
                  {order.customerName && (
                    <p className="text-sm text-gray-600 mb-2">{order.customerName}</p>
                  )}
                  
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold text-gray-900">
                      ${order.totalPrice.toFixed(2)}
                    </span>
                    {order.remainingAmount > 0 && (
                      <span className="text-sm text-red-600">
                        Pendiente: ${order.remainingAmount.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => startOrder(order.id)}
                      className="flex-1 bg-blue-500 text-white text-sm px-3 py-2 rounded hover:bg-blue-600 flex items-center justify-center"
                    >
                      <PlayCircle className="w-4 h-4 mr-1" />
                      Iniciar
                    </button>
                    {order.remainingAmount > 0 && (
                      <button
                        onClick={() => {
                          setSelectedOrder(order)
                          setPaymentData({
                            amount: order.remainingAmount,
                            paymentType: 'CASH',
                            description: 'Pago inicial'
                          })
                          setShowPaymentModal(true)
                        }}
                        className="bg-green-500 text-white text-sm px-3 py-2 rounded hover:bg-green-600"
                      >
                        <DollarSign className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Órdenes en Progreso */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 flex items-center">
                <Timer className="w-5 h-5 text-blue-500 mr-2" />
                En Progreso ({(orders || []).filter(o => o.status === 'in_progress').length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {(orders || []).filter(o => o.status === 'in_progress').map(order => (
                <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => openOrderDetailModal(order)}
                    >
                      <p className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                        #{order.orderNumber}
                      </p>
                      <p className="text-sm text-gray-600">{order.product.name}</p>
                      <p className="text-xs text-gray-500">{order.size} personas</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      En Progreso
                    </span>
                  </div>
                  
                  {order.assignedWorker && (
                    <p className="text-sm text-gray-600 mb-2">
                      Preparando: {order.assignedWorker}
                    </p>
                  )}
                  
                  {(() => {
                    const timeRemaining = getRealTimeRemaining(order)
                    return timeRemaining !== null && (
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">Tiempo restante:</span>
                          <span className={`text-sm font-medium ${
                            timeRemaining < 5 * 60 * 1000 ? 'text-red-600' : 'text-blue-600'
                          }`}>
                            {formatTime(timeRemaining)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              timeRemaining < 5 * 60 * 1000 ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                            style={{ 
                              width: `${Math.max(0, Math.min(100, (timeRemaining / (30 * 60 * 1000)) * 100))}%` 
                            }}
                          />
                        </div>
                      </div>
                    )
                  })()}

                  <div className="flex space-x-2">
                    <button
                      onClick={() => completeOrder(order.id)}
                      className="flex-1 bg-green-500 text-white text-sm px-3 py-2 rounded hover:bg-green-600 flex items-center justify-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Listo
                    </button>
                    {order.remainingAmount > 0 && (
                      <button
                        onClick={() => {
                          setSelectedOrder(order)
                          setPaymentData({
                            amount: order.remainingAmount,
                            paymentType: 'CASH',
                            description: 'Pago adicional'
                          })
                          setShowPaymentModal(true)
                        }}
                        className="bg-orange-500 text-white text-sm px-3 py-2 rounded hover:bg-orange-600"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Órdenes Listas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Listas ({(orders || []).filter(o => o.status === 'ready').length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {(orders || []).filter(o => o.status === 'ready').map(order => (
                <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => openOrderDetailModal(order)}
                    >
                      <p className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                        #{order.orderNumber}
                      </p>
                      <p className="text-sm text-gray-600">{order.product.name}</p>
                      <p className="text-xs text-gray-500">{order.size} personas</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      Listo
                    </span>
                  </div>
                  
                  {order.customerName && (
                    <p className="text-sm text-gray-600 mb-2">{order.customerName}</p>
                  )}
                  
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold text-gray-900">
                      ${order.totalPrice.toFixed(2)}
                    </span>
                    {order.remainingAmount > 0 && (
                      <span className="text-sm text-red-600">
                        Pendiente: ${order.remainingAmount.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {order.remainingAmount > 0 ? (
                    <button
                      onClick={() => {
                        setSelectedOrder(order)
                        setPaymentData({
                          amount: order.remainingAmount,
                          paymentType: 'CASH',
                          description: 'Pago final'
                        })
                        setShowPaymentModal(true)
                      }}
                      className="w-full bg-green-500 text-white text-sm px-3 py-2 rounded hover:bg-green-600 flex items-center justify-center"
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      Cobrar
                    </button>
                  ) : (
                    <div className="w-full bg-green-100 text-green-800 text-sm px-3 py-2 rounded text-center">
                      Pagado completamente
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Detalles de Orden */}
      {showOrderDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Pedido #{selectedOrder.orderNumber}
                </h2>
                <p className="text-sm text-gray-500">
                  Detalles del pedido
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
              {/* Estado y Progreso */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    {getStatusIcon(selectedOrder.status)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status === 'pending' && 'Pendiente'}
                      {selectedOrder.status === 'in_progress' && 'En Progreso'}
                      {selectedOrder.status === 'ready' && 'Listo'}
                      {selectedOrder.status === 'completed' && 'Completado'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Estado del pedido</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">
                    ${selectedOrder.totalPrice.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">Precio total</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">
                    ${selectedOrder.remainingAmount.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">Monto pendiente</p>
                </div>
              </div>

              {/* Información del Cliente */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Información del Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    {isEditingOrder ? (
                      <input
                        type="text"
                        defaultValue={selectedOrder.customerName || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 flex items-center">
                        <Users className="w-4 h-4 mr-2 text-gray-400" />
                        {selectedOrder.customerName || 'No especificado'}
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
                </div>
              </div>

              {/* Detalles del Producto */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Detalles del Producto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Producto</p>
                    <p className="text-gray-900 flex items-center mt-1">
                      <Cake className="w-4 h-4 mr-2 text-gray-400" />
                      {selectedOrder.product.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Tamaño</p>
                    <p className="text-gray-900 mt-1">{selectedOrder.size} personas</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Precio Base</p>
                    <p className="text-gray-900 mt-1">${selectedOrder.basePrice.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Personalizaciones */}
              {selectedOrder.customizations && selectedOrder.customizations.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Personalizaciones</h3>
                  <div className="space-y-2">
                    {selectedOrder.customizations.map((customization, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                        <div>
                          <p className="font-medium text-gray-900">{customization.optionName}</p>
                          <p className="text-sm text-gray-600">
                            {customization.optionType} - Cantidad: {customization.quantity}
                          </p>
                        </div>
                        <p className="font-medium text-gray-900">
                          ${customization.totalPrice.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pagos */}
              {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Historial de Pagos</h3>
                  <div className="space-y-2">
                    {selectedOrder.payments.map((payment, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                        <div>
                          <p className="font-medium text-gray-900">${payment.amount.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">
                            {payment.paymentType} - {new Date(payment.createdAt).toLocaleString()}
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
                <h3 className="font-semibold text-gray-900 mb-3">Notas</h3>
                {isEditingOrder ? (
                  <textarea
                    defaultValue={selectedOrder.notes || ''}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Agregar notas sobre el pedido..."
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {selectedOrder.notes || 'Sin notas especiales'}
                  </p>
                )}
              </div>

              {/* Tiempos */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Tiempos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {selectedOrder.startTime && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Inicio</p>
                      <p className="text-gray-900 flex items-center mt-1">
                        <PlayCircle className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(selectedOrder.startTime).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedOrder.estimatedReady && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Estimado Listo</p>
                      <p className="text-gray-900 flex items-center mt-1">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(selectedOrder.estimatedReady).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedOrder.completedTime && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Completado</p>
                      <p className="text-gray-900 flex items-center mt-1">
                        <CheckCircle className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(selectedOrder.completedTime).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedOrder.assignedWorker && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Asignado a</p>
                      <p className="text-gray-900 flex items-center mt-1">
                        <ChefHat className="w-4 h-4 mr-2 text-gray-400" />
                        {selectedOrder.assignedWorker}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Orden */}
      {showNewOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Nueva Orden - Cake Bar</h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Selección de Producto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Producto Base
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {products.map(product => (
                    <button
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className={`p-4 border rounded-lg text-left hover:border-orange-500 ${
                        selectedProduct?.id === product.id 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      {product.description && (
                        <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                      )}
                      <p className="text-lg font-bold text-orange-600 mt-2">
                        ${product.price.toFixed(2)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {selectedProduct && (
                <>
                  {/* Selección de Tamaño */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tamaño (Número de Personas)
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['10', '20', '30'].map(size => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`p-3 border rounded-lg text-center hover:border-orange-500 ${
                            selectedSize === size 
                              ? 'border-orange-500 bg-orange-50' 
                              : 'border-gray-200'
                          }`}
                        >
                          <Users className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                          <span className="font-medium">{size} personas</span>
                          <div className="text-sm text-gray-600 mt-1">
                            ${(selectedProduct.price * 
                              (size === '10' ? 1 : size === '20' ? 1.8 : 2.5)
                            ).toFixed(2)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Personalizaciones */}
                  {Object.entries(options).map(([optionType, optionData]) => {
                    if (optionType === 'TOPPING') {
                      // Manejar toppings con categorías
                      const toppingCategories = (optionData && typeof optionData === 'object' && !Array.isArray(optionData)) 
                        ? optionData as Record<string, CakeBarOption[]> 
                        : {}
                      
                      // Si optionData es un array, agruparlo por categoría
                      if (Array.isArray(optionData)) {
                        const grouped: Record<string, CakeBarOption[]> = {}
                        optionData.forEach(option => {
                          const category = option.category || 'OTROS'
                          if (!grouped[category]) {
                            grouped[category] = []
                          }
                          grouped[category].push(option)
                        })
                        Object.assign(toppingCategories, grouped)
                      }
                      
                      return (
                        <div key={optionType} className="space-y-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Decoraciones y Toppings
                          </label>
                          {Object.entries(toppingCategories).map(([category, categoryOptions]) => (
                            <div key={category} className="border rounded-lg p-4">
                              <h4 className="font-medium text-gray-800 mb-3">
                                {category === 'CHOCOLATES' ? 'Chocolates' :
                                 category === 'FLORES' ? 'Flores Comestibles' :
                                 category === 'PERLAS_CONFITES' ? 'Perlas y Confites' :
                                 category === 'FIGURAS' ? 'Figuras Decorativas' :
                                 category === 'ESPECIALES' ? 'Opciones Especiales' :
                                 category}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {(Array.isArray(categoryOptions) ? categoryOptions : []).map(option => {
                                  const currentToppings = customizations.TOPPING as ToppingSelection || {}
                                  const quantity = currentToppings[option.id] || 0
                                  
                                  return (
                                    <div
                                      key={option.id}
                                      className="border rounded-lg p-3 hover:border-orange-300"
                                    >
                                      <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                          <div className="font-medium text-gray-900">{option.name}</div>
                                          {option.description && (
                                            <div className="text-xs text-gray-600">{option.description}</div>
                                          )}
                                          {option.priceAdd > 0 && (
                                            <div className="text-sm text-orange-600">
                                              +${option.priceAdd.toFixed(2)} c/u
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {option.allowMultiple ? (
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm text-gray-600">Cantidad:</span>
                                          <div className="flex items-center space-x-2">
                                            <button
                                              onClick={() => {
                                                const newToppings = { ...currentToppings }
                                                if (quantity > 0) {
                                                  newToppings[option.id] = quantity - 1
                                                  if (newToppings[option.id] === 0) {
                                                    delete newToppings[option.id]
                                                  }
                                                }
                                                setCustomizations({
                                                  ...customizations,
                                                  TOPPING: newToppings
                                                })
                                              }}
                                              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                                            >
                                              -
                                            </button>
                                            <span className="w-8 text-center font-medium">{quantity}</span>
                                            <button
                                              onClick={() => {
                                                const newToppings = { ...currentToppings }
                                                newToppings[option.id] = quantity + 1
                                                setCustomizations({
                                                  ...customizations,
                                                  TOPPING: newToppings
                                                })
                                              }}
                                              className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center hover:bg-orange-300"
                                            >
                                              +
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            const newToppings = { ...currentToppings }
                                            if (quantity > 0) {
                                              delete newToppings[option.id]
                                            } else {
                                              newToppings[option.id] = 1
                                            }
                                            setCustomizations({
                                              ...customizations,
                                              TOPPING: newToppings
                                            })
                                          }}
                                          className={`w-full py-2 rounded text-sm font-medium ${
                                            quantity > 0
                                              ? 'bg-orange-500 text-white'
                                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                          }`}
                                        >
                                          {quantity > 0 ? 'Seleccionado' : 'Seleccionar'}
                                        </button>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    } else {
                      // Manejar opciones simples (sabor, color, relleno)
                      const optionsList = optionData as CakeBarOption[]
                      return (
                        <div key={optionType}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {optionType === 'BREAD_FLAVOR' ? 'Sabor del Pan' :
                             optionType === 'COLOR' ? 'Color' :
                             optionType === 'FILLING' ? 'Relleno' :
                             optionType}
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {optionsList.map(option => (
                              <button
                                key={option.id}
                                onClick={() => setCustomizations({
                                  ...customizations,
                                  [optionType]: option.id
                                })}
                                className={`p-3 border rounded-lg text-left hover:border-orange-500 ${
                                  customizations[optionType] === option.id 
                                    ? 'border-orange-500 bg-orange-50' 
                                    : 'border-gray-200'
                                }`}
                              >
                                <div className="font-medium text-gray-900">{option.name}</div>
                                {option.priceAdd > 0 && (
                                  <div className="text-sm text-orange-600">
                                    +${option.priceAdd.toFixed(2)}
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    }
                  })}

                  {/* Información del Cliente */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Cliente (Opcional)
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Nombre"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono (Opcional)
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Teléfono"
                      />
                    </div>
                  </div>

                  {/* Notas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas Especiales (Opcional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Instrucciones especiales, alergias, etc."
                    />
                  </div>

                  {/* Total */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-orange-600">
                        ${calculateTotalPrice().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowNewOrderModal(false)
                  resetForm()
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={createOrder}
                disabled={!selectedProduct}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Crear Orden
              </button>
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
                  max={selectedOrder.remainingAmount}
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    amount: parseFloat(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Saldo pendiente: ${selectedOrder.remainingAmount.toFixed(2)}
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
                      className={`p-3 border rounded-lg text-center hover:border-orange-500 ${
                        paymentData.paymentType === type 
                          ? 'border-orange-500 bg-orange-50' 
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
                  Descripción (Opcional)
                </label>
                <input
                  type="text"
                  value={paymentData.description}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    description: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ej: Pago inicial, Decoración extra"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setSelectedOrder(null)
                  setPaymentData({ amount: 0, paymentType: 'CASH', description: '' })
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={processPayment}
                disabled={paymentData.amount <= 0 || paymentData.amount > selectedOrder.remainingAmount}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Procesar Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}