'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  ToggleLeft, 
  ToggleRight,
  QrCode,
  ShoppingCart,
  Eye,
  EyeOff,
  Check,
  Minus,
  Cake
} from 'lucide-react'
import { usePermissions, PermissionGuard } from '@/hooks/usePermissions'

interface Product {
  id: number
  name: string
  description: string | null
  price: number
  stock: number
  category: string
  type: string
  barcode: string | null
  isActive: boolean
  isService: boolean
  minStock: number
  specialPrice: number | null
  hasPromotion: boolean
  promotionDiscount: number | null
  isEditing?: boolean
  hasChanges?: boolean
  isSelected?: boolean
}

export default function CakeBarInventoryPage() {
  return (
    <PermissionGuard permission="canViewInventory">
      <CakeBarInventoryContent />
    </PermissionGuard>
  )
}

function CakeBarInventoryContent() {
  const permissions = usePermissions()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  
  // Multi-selection
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const userRole = 'admin' // This would come from auth context

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/products?type=CAKE_BAR'),
        fetch('/api/categories')
      ])

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData.map((p: Product) => ({ ...p, isSelected: false })))
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        const cakeBarCategories = categoriesData
          .filter((cat: any) => cat.includes('CAKE_BAR') || cat.includes('DECORATIONS') || cat.includes('SERVICIOS'))
          .map((cat: any) => cat)
        setCategories(cakeBarCategories)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode?.includes(searchTerm)
    
    const matchesCategory = !categoryFilter || product.category === categoryFilter
    const matchesService = !serviceFilter || 
                          (serviceFilter === 'products' && !product.isService) ||
                          (serviceFilter === 'services' && product.isService)
    const matchesActive = activeFilter === 'all' || 
                         (activeFilter === 'active' && product.isActive) ||
                         (activeFilter === 'inactive' && !product.isActive)
    const matchesStock = stockFilter === 'all' ||
                        (stockFilter === 'low' && product.stock <= product.minStock && !product.isService) ||
                        (stockFilter === 'normal' && (product.stock > product.minStock || product.isService))

    return matchesSearch && matchesCategory && matchesService && matchesActive && matchesStock
  })

  // Multi-selection functions
  const toggleSelectAll = () => {
    const allSelected = filteredProducts.every(p => selectedProducts.has(p.id))
    if (allSelected) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)))
    }
  }

  const toggleSelectProduct = (productId: number) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
  }

  const deleteSelectedProducts = async () => {
    if (!permissions.canDeleteProducts) {
      alert('No tienes permisos para eliminar productos')
      return
    }

    try {
      await Promise.all(
        Array.from(selectedProducts).map(id => 
          fetch(`/api/products/${id}`, { method: 'DELETE' })
        )
      )
      
      setProducts(products.filter(p => !selectedProducts.has(p.id)))
      setSelectedProducts(new Set())
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Error deleting products:', error)
    }
  }

  // Product management functions
  const startEditing = (productId: number) => {
    if (!permissions.canEditProducts) {
      alert('No tienes permisos para editar productos')
      return
    }
    
    setProducts(products.map(p => 
      p.id === productId 
        ? { ...p, isEditing: true }
        : { ...p, isEditing: false }
    ))
  }

  const cancelEditing = (productId: number) => {
    setProducts(products.map(p => 
      p.id === productId 
        ? { ...p, isEditing: false, hasChanges: false }
        : p
    ))
  }

  const updateProductField = (productId: number, field: keyof Product, value: any) => {
    setProducts(products.map(p => 
      p.id === productId 
        ? { ...p, [field]: value, hasChanges: true }
        : p
    ))
  }

  const saveProduct = async (productId: number) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          category: product.category,
          type: product.type,
          barcode: product.barcode,
          isActive: product.isActive,
          minStock: product.minStock,
          specialPrice: product.specialPrice,
          hasPromotion: product.hasPromotion,
          promotionDiscount: product.promotionDiscount,
          isService: product.isService,
        }),
      })

      if (response.ok) {
        setProducts(products.map(p => 
          p.id === productId 
            ? { ...p, isEditing: false, hasChanges: false }
            : p
        ))
      } else {
        alert('Error al guardar el producto')
      }
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Error al guardar el producto')
    }
  }

  const toggleProductStatus = async (productId: number) => {
    if (!permissions.canEditProducts) {
      alert('No tienes permisos para cambiar el estado de productos')
      return
    }
    
    const product = products.find(p => p.id === productId)
    if (!product) return

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          isActive: !product.isActive,
        }),
      })

      if (response.ok) {
        setProducts(products.map(p => 
          p.id === productId 
            ? { ...p, isActive: !p.isActive }
            : p
        ))
      }
    } catch (error) {
      console.error('Error toggling product status:', error)
    }
  }

  const deleteProduct = async (productId: number) => {
    if (!permissions.canDeleteProducts) {
      alert('No tienes permisos para eliminar productos')
      return
    }
    
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId))
      }
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const generateBarcode = (productId: number) => {
    const newBarcode = '789' + Math.random().toString().substr(2, 10)
    updateProductField(productId, 'barcode', newBarcode)
  }

  const moveToVitrina = async (productId: number) => {
    if (!permissions.canEditProducts) {
      alert('No tienes permisos para mover productos')
      return
    }

    if (!confirm('¿Mover este producto al inventario de Vitrina?')) return

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'VITRINA'
        }),
      })

      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId))
        alert('Producto movido al inventario de Vitrina exitosamente')
      }
    } catch (error) {
      console.error('Error moving product:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/inventory"
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al Inventario
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventario Cake Bar</h1>
            <p className="text-gray-600">Gestión de productos, decoraciones y servicios para tortas</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {selectedProducts.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedProducts.size} seleccionados
              </span>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-secondary text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar Seleccionados
              </button>
            </div>
          )}
          
          <Link
            href="/inventory/cake-bar/new"
            className="btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Producto
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Cake className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Productos</p>
              <p className="text-2xl font-semibold text-gray-900">{products.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Productos Activos</p>
              <p className="text-2xl font-semibold text-gray-900">
                {products.filter(p => p.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
              <p className="text-2xl font-semibold text-gray-900">
                {products.filter(p => !p.isService && p.stock <= p.minStock).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Servicios</p>
              <p className="text-2xl font-semibold text-gray-900">
                {products.filter(p => p.isService).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Todas las categorías</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Productos y Servicios</option>
            <option value="products">Solo Productos</option>
            <option value="services">Solo Servicios</option>
          </select>

          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">Todo el stock</option>
            <option value="low">Stock bajo</option>
            <option value="normal">Stock normal</option>
          </select>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleSelectAll}
              className={`flex items-center px-3 py-2 rounded-lg border ${
                selectedProducts.size > 0 
                  ? 'bg-purple-50 border-purple-300 text-purple-700'
                  : 'bg-gray-50 border-gray-300 text-gray-700'
              }`}
            >
              {filteredProducts.length > 0 && selectedProducts.size === filteredProducts.length ? (
                <Check className="w-4 h-4 mr-1" />
              ) : (
                <Minus className="w-4 h-4 mr-1" />
              )}
              Seleccionar Todo
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={filteredProducts.length > 0 && selectedProducts.size === filteredProducts.length}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  categories={categories}
                  isSelected={selectedProducts.has(product.id)}
                  onToggleSelect={toggleSelectProduct}
                  onStartEditing={startEditing}
                  onCancelEditing={cancelEditing}
                  onUpdateField={updateProductField}
                  onSave={saveProduct}
                  onToggleStatus={toggleProductStatus}
                  onDelete={deleteProduct}
                  onGenerateBarcode={generateBarcode}
                  onMoveToVitrina={moveToVitrina}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Cake className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
          <p className="text-gray-600">Intenta ajustar los filtros o crear un nuevo producto.</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirmar Eliminación</h2>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar {selectedProducts.size} producto(s)? 
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={deleteSelectedProducts}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente ProductRow para Cake Bar
function ProductRow({ 
  product, 
  categories, 
  isSelected,
  onToggleSelect,
  onStartEditing, 
  onCancelEditing, 
  onUpdateField, 
  onSave, 
  onToggleStatus, 
  onDelete,
  onGenerateBarcode,
  onMoveToVitrina
}: {
  product: Product;
  categories: string[];
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onStartEditing: (id: number) => void;
  onCancelEditing: (id: number) => void;
  onUpdateField: (id: number, field: keyof Product, value: any) => void;
  onSave: (id: number) => void;
  onToggleStatus: (id: number) => void;
  onDelete: (id: number) => void;
  onGenerateBarcode: (id: number) => void;
  onMoveToVitrina: (id: number) => void;
}) {
  const permissions = usePermissions();
  const isLowStock = !product.isService && product.stock <= product.minStock;
  const canEdit = permissions.canEditProducts;

  return (
    <tr className={`hover:bg-gray-50 ${!product.isActive ? 'bg-gray-50 opacity-75' : ''} ${isSelected ? 'bg-purple-50' : ''}`}>
      <td className="px-4 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(product.id)}
          className="rounded"
        />
      </td>
      
      <td className="px-4 py-4">
        <div className="flex items-center">
          <div className="flex-1">
            {product.isEditing && canEdit ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={product.name}
                  onChange={(e) => onUpdateField(product.id, 'name', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <textarea
                  value={product.description || ''}
                  onChange={(e) => onUpdateField(product.id, 'description', e.target.value)}
                  placeholder="Descripción..."
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  rows={2}
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={product.barcode || ''}
                    onChange={(e) => onUpdateField(product.id, 'barcode', e.target.value)}
                    placeholder="Código de barras"
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <button
                    onClick={() => onGenerateBarcode(product.id)}
                    disabled={!canEdit}
                    className={`px-2 py-1 rounded text-xs ${
                      canEdit 
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer' 
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id={`isService-${product.id}`}
                    checked={product.isService || false}
                    onChange={(e) => onUpdateField(product.id, 'isService', e.target.checked)}
                    className="mr-2 rounded"
                  />
                  <label htmlFor={`isService-${product.id}`} className="text-sm text-gray-700">
                    Marcar como servicio
                  </label>
                </div>
              </div>
            ) : (
              <div>
                <div className="font-medium text-gray-900">{product.name}</div>
                {product.description && (
                  <div className="text-sm text-gray-600">{product.description}</div>
                )}
                {product.barcode && (
                  <div className="text-xs text-gray-500 font-mono">{product.barcode}</div>
                )}
                {isLowStock && (
                  <div className="flex items-center text-red-600 text-xs mt-1">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Stock bajo
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        {product.isEditing && canEdit ? (
          <div className="space-y-2">
            <input
              type="number"
              step="0.01"
              value={isNaN(product.price) ? '' : product.price}
              onChange={(e) => {
                const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                onUpdateField(product.id, 'price', isNaN(value) ? 0 : value);
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <input
              type="number"
              step="0.01"
              value={product.specialPrice && !isNaN(product.specialPrice) ? product.specialPrice : ''}
              onChange={(e) => {
                const value = e.target.value === '' ? null : parseFloat(e.target.value);
                onUpdateField(product.id, 'specialPrice', value && !isNaN(value) ? value : null);
              }}
              placeholder="Precio especial"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        ) : (
          <div>
            <div className="font-medium">${product.price.toFixed(2)}</div>
            {product.specialPrice && (
              <div className="text-sm text-green-600">${product.specialPrice.toFixed(2)}</div>
            )}
            {product.hasPromotion && (
              <div className="text-xs text-orange-600">
                -{product.promotionDiscount}% descuento
              </div>
            )}
          </div>
        )}
      </td>

      <td className="px-4 py-4">
        {product.isService ? (
          <div className="flex items-center">
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
              Servicio
            </span>
          </div>
        ) : product.isEditing && canEdit ? (
          <div className="space-y-2">
            <input
              type="number"
              value={isNaN(product.stock) ? '' : product.stock}
              onChange={(e) => {
                const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                onUpdateField(product.id, 'stock', isNaN(value) ? 0 : value);
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <input
              type="number"
              value={isNaN(product.minStock) ? '' : product.minStock}
              onChange={(e) => {
                const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                onUpdateField(product.id, 'minStock', isNaN(value) ? 0 : value);
              }}
              placeholder="Stock mínimo"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        ) : (
          <div>
            <div className={`font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
              {product.stock}
            </div>
            <div className="text-xs text-gray-500">Min: {product.minStock}</div>
          </div>
        )}
      </td>

      <td className="px-4 py-4">
        {product.isEditing && canEdit ? (
          <select
            value={product.category}
            onChange={(e) => onUpdateField(product.id, 'category', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        ) : (
          <span className="text-sm text-gray-900">{product.category}</span>
        )}
      </td>

      <td className="px-4 py-4">
        <button
          onClick={() => onToggleStatus(product.id)}
          disabled={!canEdit}
          className={`inline-flex items-center ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
        >
          {product.isActive ? (
            <div className="flex items-center text-green-600">
              <ToggleRight className="w-5 h-5 mr-1" />
              <span className="text-sm">Activo</span>
            </div>
          ) : (
            <div className="flex items-center text-gray-400">
              <ToggleLeft className="w-5 h-5 mr-1" />
              <span className="text-sm">Inactivo</span>
            </div>
          )}
        </button>
      </td>

      <td className="px-4 py-4">
        <div className="flex items-center space-x-2">
          {product.isEditing ? (
            <>
              <button
                onClick={() => onSave(product.id)}
                disabled={!product.hasChanges}
                className={`p-1 rounded ${
                  product.hasChanges 
                    ? 'text-green-600 hover:bg-green-50' 
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={() => onCancelEditing(product.id)}
                className="p-1 text-gray-600 hover:bg-gray-50 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              {canEdit && (
                <button
                  onClick={() => onStartEditing(product.id)}
                  className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                  title="Editar producto"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => onMoveToVitrina(product.id)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  title="Mover a Vitrina"
                >
                  <ShoppingCart className="w-4 h-4" />
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => onDelete(product.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Eliminar producto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  )
}