'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ScanLine,
  Percent,
  DollarSign,
  CreditCard,
  Banknote,
  Smartphone,
  Calculator,
  Printer,
  Zap,
  AlertTriangle,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { usePermissions, PermissionGuard } from '@/hooks/usePermissions'

interface Category {
  id: string
  name: string
  color: string
  type: 'VITRINA' | 'CAKE_BAR'
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  minStock: number
  barcode: string | null
  isService: boolean
  category: Category | null
  categoryId: string | null
}

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  stock: number
  minStock: number
  isService: boolean
}

interface PaymentMethod {
  type: 'CASH' | 'CARD' | 'TRANSFER' | 'MIXED'
  cash?: number
  card?: number
  transfer?: number
}

export default function VitrinaPOS() {
  return (
    <PermissionGuard permission="canUsePOS">
      <VitrinaPOSContent />
    </PermissionGuard>
  )
}

function VitrinaPOSContent() {
  const permissions = usePermissions();
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showTicket, setShowTicket] = useState(false)
  const [lastSale, setLastSale] = useState<any>(null)
  
  // Payment modal state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({ type: 'CASH' })
  const [discount, setDiscount] = useState(0)
  const [amountReceived, setAmountReceived] = useState(0)
  
  // Quick sale products
  const [quickSaleProducts, setQuickSaleProducts] = useState<Product[]>([])
  
  const barcodeInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchData()
    // Focus barcode input on mount
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    filterProducts()
  }, [searchTerm, selectedCategory])

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/products?type=VITRINA', { credentials: 'include' }),
        fetch('/api/categories?type=VITRINA', { credentials: 'include' })
      ])

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData)
        
        // Set quick sale products (most common items)
        const quickItems = productsData.filter((p: Product) => 
          p.name.toLowerCase().includes('galleta') || 
          p.name.toLowerCase().includes('pan') ||
          p.name.toLowerCase().includes('café')
        ).slice(0, 6)
        setQuickSaleProducts(quickItems)
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        // Filtrar solo categorías de VITRINA
        const vitrinaCategories = categoriesData.filter((cat: Category) => cat.type === 'VITRINA')
        setCategories(vitrinaCategories)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    // This will be handled by the display logic
  }

  const getFilteredProducts = () => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = !selectedCategory || product.category?.name === selectedCategory
      return matchesSearch && matchesCategory
    })
  }

  const getStockStatus = (stock: number, minStock: number, isService: boolean = false) => {
    if (isService) return { color: 'text-blue-600', bg: 'bg-blue-100', icon: CheckCircle, text: 'Servicio' }
    if (stock === 0) return { color: 'text-red-600', bg: 'bg-red-100', icon: AlertCircle, text: 'Agotado' }
    if (stock <= minStock) return { color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle, text: 'Crítico' }
    if (stock <= minStock * 2) return { color: 'text-orange-600', bg: 'bg-orange-100', icon: AlertTriangle, text: 'Bajo' }
    return { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle, text: 'OK' }
  }

  const addToCart = (product: Product, quantity: number = 1) => {
    const existingItem = cart.find(item => item.productId === product.id)
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ))
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
        stock: product.stock,
        minStock: product.minStock,
        isService: product.isService
      }])
    }
  }

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (!permissions.canApplyDiscounts && newQuantity < cart.find(item => item.productId === productId)?.quantity!) {
      alert('Solo administradores pueden reducir cantidades')
      return
    }

    if (newQuantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(cart.map(item => 
        item.productId === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ))
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId))
  }

  const clearCart = () => {
    setCart([])
  }

  const handleBarcodeScanner = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const product = products.find(p => p.barcode === barcodeInput)
      if (product) {
        addToCart(product)
        setBarcodeInput('')
      } else {
        alert('Producto no encontrado')
      }
    }
  }

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const discountAmount = (subtotal * discount) / 100
    const total = subtotal - discountAmount
    return { subtotal, discountAmount, total }
  }

  const handlePayment = async () => {
    const { total } = calculateTotals()
    
    if (paymentMethod.type === 'CASH' && amountReceived < total) {
      alert('El monto recibido es insuficiente')
      return
    }

    if (paymentMethod.type === 'MIXED') {
      const totalMixed = (paymentMethod.cash || 0) + (paymentMethod.card || 0) + (paymentMethod.transfer || 0)
      if (Math.abs(totalMixed - total) > 0.01) {
        alert('El total de los métodos de pago no coincide con el total de la venta')
        return
      }
    }

    try {
      const saleData = {
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price
        })),
        paymentMethod,
        discount,
        amountReceived: paymentMethod.type === 'CASH' ? amountReceived : total,
        saleType: 'VITRINA'
      }

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      })

      if (response.ok) {
        const result = await response.json()
        setLastSale(result)
        setShowPaymentModal(false)
        setShowTicket(true)
        clearCart()
        setDiscount(0)
        setAmountReceived(0)
        setPaymentMethod({ type: 'CASH' })
        
        // Refresh products to update stock
        fetchData()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al procesar la venta')
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      alert('Error al procesar el pago')
    }
  }

  const printTicket = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Cargando punto de venta...</p>
        </div>
      </div>
    )
  }

  const { subtotal, discountAmount, total } = calculateTotals()

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Products Section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Inicio
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">POS Vitrina</h1>
          </div>
                    {/* Role indicator */}
          <div className="flex items-center">
            <span className={`px-3 py-1 rounded text-sm ${
              permissions.isAdmin ? 'bg-green-100 text-green-800' : 
              permissions.isManager ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-600'
            }`}>
              {permissions.isAdmin ? 'Admin' : permissions.isManager ? 'Manager' : 'Empleado'}
            </span>
          </div>
        </div>

        {/* Search and Barcode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          <div className="relative">
            <ScanLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Escanear código de barras"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyPress={handleBarcodeScanner}
              className="input-field pl-10 w-full"
            />
          </div>
        </div>

        {/* Quick Sale */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center mb-3">
            <Zap className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="font-medium text-gray-900">Venta Rápida</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {quickSaleProducts.map((product) => {
              const stockStatus = getStockStatus(product.stock, product.minStock, product.isService)
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate">{product.name}</span>
                    <stockStatus.icon className={`h-3 w-3 ${stockStatus.color}`} />
                  </div>
                  <div className="text-xs text-gray-500">${product.price.toFixed(2)}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            <option value="">🏷️ Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {getFilteredProducts().map((product) => {
            const stockStatus = getStockStatus(product.stock, product.minStock, product.isService)
            return (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900 truncate flex-1 mr-2">
                    {product.name}
                  </h3>
                  <div className={`px-2 py-1 rounded-full text-xs ${stockStatus.bg} ${stockStatus.color}`}>
                    {product.stock}
                  </div>
                </div>
                
                {product.category && (
                  <div 
                    className="inline-block px-2 py-1 rounded-full text-xs font-medium text-white mb-2"
                    style={{ backgroundColor: product.category.color }}
                  >
                    {product.category.name}
                  </div>
                )}
                
                {product.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {product.description}
                  </p>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">
                    ${product.price.toFixed(2)}
                  </span>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0 && !product.isService}
                    className={`flex items-center px-3 py-1 rounded text-sm ${
                      product.stock === 0 && !product.isService
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-screen">
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Carrito</h2>
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-gray-600" />
              <span className="bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cart.length}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 min-h-0 cart-scroll">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Carrito vacío</p>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {cart.map((item) => {
                const stockStatus = getStockStatus(item.stock, item.minStock, item.isService)
                return (
                  <div key={item.productId} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900 flex-1 mr-2">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        ${item.price.toFixed(2)} c/u
                      </span>
                      <div className={`px-2 py-1 rounded text-xs ${stockStatus.bg} ${stockStatus.color}`}>
                        Stock: {item.stock}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                          className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                          className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="font-semibold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 p-6 flex-shrink-0 bg-white">
            {/* Discount */}
            {permissions.canApplyDiscounts && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Descuento (%)
                  </label>
                  <Percent className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                  className="input-field w-full"
                />
              </div>
            )}

            {/* Totals */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento ({discount}%):</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setShowPaymentModal(true)}
                className="btn-primary w-full flex items-center justify-center"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Procesar Pago
              </button>
              <button
                onClick={clearCart}
                className="btn-secondary w-full"
              >
                Limpiar Carrito
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Procesar Pago</h2>
            
            <div className="mb-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total a Pagar:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pago
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: 'CASH' as const, label: 'Efectivo', icon: Banknote },
                  { type: 'CARD' as const, label: 'Tarjeta', icon: CreditCard },
                  { type: 'TRANSFER' as const, label: 'Transferencia', icon: Smartphone },
                  { type: 'MIXED' as const, label: 'Mixto', icon: Calculator }
                ].map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => setPaymentMethod({ type })}
                    className={`p-3 border rounded-lg flex flex-col items-center ${
                      paymentMethod.type === type
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5 mb-1" />
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Amount Input */}
            {paymentMethod.type === 'CASH' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto Recibido
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                  className="input-field w-full"
                  placeholder="0.00"
                />
                {amountReceived >= total && (
                  <div className="mt-2 text-sm">
                    <span className="text-green-600 font-medium">
                      Cambio: ${(amountReceived - total).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Mixed Payment */}
            {paymentMethod.type === 'MIXED' && (
              <div className="mb-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Efectivo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentMethod.cash || 0}
                    onChange={(e) => setPaymentMethod({
                      ...paymentMethod,
                      cash: parseFloat(e.target.value) || 0
                    })}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tarjeta
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentMethod.card || 0}
                    onChange={(e) => setPaymentMethod({
                      ...paymentMethod,
                      card: parseFloat(e.target.value) || 0
                    })}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transferencia
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentMethod.transfer || 0}
                    onChange={(e) => setPaymentMethod({
                      ...paymentMethod,
                      transfer: parseFloat(e.target.value) || 0
                    })}
                    className="input-field w-full"
                  />
                </div>
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Total métodos:</span>
                    <span>
                      ${((paymentMethod.cash || 0) + (paymentMethod.card || 0) + (paymentMethod.transfer || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handlePayment}
                className="btn-primary"
              >
                Confirmar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      {showTicket && lastSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Venta Completada</h2>
              <div className="text-green-600 font-medium">
                {lastSale.sale.saleNumber}
              </div>
            </div>

            {/* Ticket Preview */}
            <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
              <div className="text-center mb-4">
                <h3 className="font-bold">PASTELERÍA</h3>
                <p className="text-sm text-gray-600">Ticket de Venta</p>
                <p className="text-xs text-gray-500">
                  {new Date(lastSale.sale.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="border-t border-gray-300 pt-2 mb-2">
                {lastSale.sale.saleItems.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm mb-1">
                    <div>
                      <div>{item.product.name}</div>
                      <div className="text-xs text-gray-500">
                        {item.quantity} x ${item.unitPrice.toFixed(2)}
                      </div>
                    </div>
                    <div>${item.subtotal.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-300 pt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${lastSale.subtotal.toFixed(2)}</span>
                </div>
                {lastSale.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento:</span>
                    <span>-${lastSale.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${lastSale.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Método:</span>
                  <span>{lastSale.paymentDetails.type}</span>
                </div>
                {lastSale.change > 0 && (
                  <div className="flex justify-between">
                    <span>Cambio:</span>
                    <span>${lastSale.change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowTicket(false)}
                className="btn-secondary"
              >
                Cerrar
              </button>
              <button
                onClick={printTicket}
                className="btn-primary flex items-center"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}