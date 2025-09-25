'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Search, Edit2, Trash2, Save, X } from 'lucide-react'

interface CakeBarOption {
  id: string
  productId?: number
  optionType: string
  category?: string
  name: string
  description?: string
  priceAdd: number
  cost?: number
  stock?: number
  minStock?: number
  hasStock: boolean
  isActive: boolean
  isDefault: boolean
  allowMultiple: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export default function CakeBarToppingsPage() {
  const [toppings, setToppings] = useState<CakeBarOption[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newTopping, setNewTopping] = useState<Partial<CakeBarOption>>({
    optionType: 'TOPPING',
    category: 'CHOCOLATES',
    name: '',
    description: '',
    priceAdd: 0,
    cost: 0,
    stock: 0,
    minStock: 5,
    hasStock: true,
    isActive: true,
    isDefault: false,
    allowMultiple: true,
    displayOrder: 0
  })
  const [showNewForm, setShowNewForm] = useState(false)

  const categories = [
    { value: 'CHOCOLATES', label: 'Chocolates', icon: '🍫', color: 'bg-amber-100 text-amber-800' },
    { value: 'FLORES', label: 'Flores Comestibles', icon: '🌸', color: 'bg-pink-100 text-pink-800' },
    { value: 'PERLAS_CONFITES', label: 'Perlas y Confites', icon: '✨', color: 'bg-purple-100 text-purple-800' },
    { value: 'FIGURAS', label: 'Figuras Decorativas', icon: '🎭', color: 'bg-blue-100 text-blue-800' },
    { value: 'ESPECIALES', label: 'Opciones Especiales', icon: '⭐', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'FRUTAS', label: 'Frutas', icon: '🍓', color: 'bg-red-100 text-red-800' },
    { value: 'CREMAS', label: 'Cremas y Rellenos', icon: '🍰', color: 'bg-green-100 text-green-800' }
  ]

  useEffect(() => {
    loadToppings()
  }, [])

  const loadToppings = async () => {
    try {
      const response = await fetch('/api/cake-bar/options?type=TOPPING')
      if (response.ok) {
        const data = await response.json()
        
        // Manejar tanto la estructura nueva (objeto con categorías) como la antigua (array)
        if (Array.isArray(data)) {
          setToppings(data)
        } else if (data && typeof data === 'object') {
          // Si es un objeto con categorías, aplanar a un array
          const flatToppings: CakeBarOption[] = []
          Object.values(data).forEach((categoryToppings: any) => {
            if (Array.isArray(categoryToppings)) {
              flatToppings.push(...categoryToppings)
            }
          })
          setToppings(flatToppings)
        } else {
          console.error('La respuesta no tiene el formato esperado:', data)
          setToppings([])
        }
      } else {
        console.error('Error en la respuesta:', response.status)
        setToppings([])
      }
    } catch (error) {
      console.error('Error loading toppings:', error)
      setToppings([])
    } finally {
      setLoading(false)
    }
  }

  const createTopping = async () => {
    try {
      const response = await fetch('/api/cake-bar/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTopping)
      })

      if (response.ok) {
        const createdTopping = await response.json()
        // Agregar el nuevo topping al array existente
        setToppings(prevToppings => Array.isArray(prevToppings) ? [...prevToppings, createdTopping] : [createdTopping])
        setNewTopping({
          optionType: 'TOPPING',
          category: 'CHOCOLATES',
          name: '',
          description: '',
          priceAdd: 0,
          cost: 0,
          stock: 0,
          minStock: 5,
          hasStock: true,
          isActive: true,
          isDefault: false,
          allowMultiple: true,
          displayOrder: 0
        })
        setShowNewForm(false)
        alert('Topping creado exitosamente')
      } else {
        const error = await response.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      alert('Error al crear topping')
    }
  }

  const updateTopping = async (id: string, updates: Partial<CakeBarOption>) => {
    try {
      const response = await fetch(`/api/cake-bar/options/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const updatedTopping = await response.json()
        setToppings(prevToppings => 
          Array.isArray(prevToppings) 
            ? prevToppings.map(t => t.id === id ? updatedTopping : t)
            : [updatedTopping]
        )
        setEditingId(null)
      } else {
        alert('Error al actualizar topping')
      }
    } catch (error) {
      alert('Error al actualizar topping')
    }
  }

  const deleteTopping = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este topping?')) return

    try {
      const response = await fetch(`/api/cake-bar/options/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setToppings(prevToppings => 
          Array.isArray(prevToppings) 
            ? prevToppings.filter(t => t.id !== id)
            : []
        )
        alert('Topping eliminado exitosamente')
      } else {
        alert('Error al eliminar topping')
      }
    } catch (error) {
      alert('Error al eliminar topping')
    }
  }

  const filteredToppings = Array.isArray(toppings) ? toppings.filter(topping => {
    const matchesSearch = topping.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || topping.category === filterCategory
    return matchesSearch && matchesCategory
  }) : []

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando toppings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <Link
              href="/inventory"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Inventario
            </Link>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Toppings Cake Bar</h1>
              <p className="text-gray-600 mt-2">Gestiona toppings y decoraciones para el Cake Bar</p>
            </div>
            
            <button
              onClick={() => setShowNewForm(true)}
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Topping
            </button>
          </div>
        </div>

        {/* Formulario Nuevo Topping */}
        {showNewForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Nuevo Topping</h2>
              <button
                onClick={() => setShowNewForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={newTopping.name}
                  onChange={(e) => setNewTopping({...newTopping, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ej: Chocolate con leche"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  value={newTopping.category}
                  onChange={(e) => setNewTopping({...newTopping, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Adicional
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={!newTopping.priceAdd || isNaN(newTopping.priceAdd) ? '' : newTopping.priceAdd}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    setNewTopping({
                      ...newTopping, 
                      priceAdd: isNaN(value) ? 0 : value
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={newTopping.description}
                  onChange={(e) => setNewTopping({...newTopping, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={2}
                  placeholder="Descripción del topping..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowNewForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={createTopping}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Crear Topping
              </button>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar toppings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilterCategory('all')
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>

          {/* Filtros de Categoría Visual */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Filtro rápido por categoría
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterCategory('all')}
                className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterCategory === 'all' 
                    ? 'bg-orange-100 text-orange-800 border-2 border-orange-500' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🎯 Todas
              </button>
              {categories.map(category => (
                <button
                  key={category.value}
                  onClick={() => setFilterCategory(category.value)}
                  className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    filterCategory === category.value 
                      ? `${category.color} border-2 border-current` 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.icon} {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de Toppings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Toppings ({filteredToppings.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Topping
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
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
                {filteredToppings.map((topping) => (
                  <tr key={topping.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === topping.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={topping.name}
                            onChange={(e) => setToppings(prev => 
                              prev.map(t => t.id === topping.id ? {...t, name: e.target.value} : t)
                            )}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Nombre del topping"
                          />
                          <input
                            type="text"
                            value={topping.description || ''}
                            onChange={(e) => setToppings(prev => 
                              prev.map(t => t.id === topping.id ? {...t, description: e.target.value} : t)
                            )}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Descripción"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {topping.name}
                          </div>
                          {topping.description && (
                            <div className="text-sm text-gray-500">
                              {topping.description}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === topping.id ? (
                        <select
                          value={topping.category}
                          onChange={(e) => setToppings(prev => 
                            prev.map(t => t.id === topping.id ? {...t, category: e.target.value} : t)
                          )}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          {categories.map(category => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          categories.find(c => c.value === topping.category)?.color || 'bg-gray-100 text-gray-800'
                        }`}>
                          {categories.find(c => c.value === topping.category)?.icon || '📋'} {categories.find(c => c.value === topping.category)?.label || topping.category}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingId === topping.id ? (
                        <div className="space-y-2">
                          <input
                            type="number"
                            step="0.01"
                            value={!topping.priceAdd || isNaN(topping.priceAdd) ? '' : topping.priceAdd}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              setToppings(prev => 
                                prev.map(t => t.id === topping.id ? {
                                  ...t, 
                                  priceAdd: isNaN(value) ? 0 : value
                                } : t)
                              );
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Precio adicional"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={topping.cost || 0}
                            onChange={(e) => setToppings(prev => 
                              prev.map(t => t.id === topping.id ? {
                                ...t, 
                                cost: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                              } : t)
                            )}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Costo"
                          />
                        </div>
                      ) : (
                        <div>
                          +${topping.priceAdd.toFixed(2)}
                          {topping.cost && (
                            <div className="text-xs text-gray-500">
                              Costo: ${topping.cost.toFixed(2)}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === topping.id ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={topping.hasStock}
                              onChange={(e) => setToppings(prev => 
                                prev.map(t => t.id === topping.id ? {...t, hasStock: e.target.checked} : t)
                              )}
                              className="rounded"
                            />
                            <span className="text-xs text-gray-600">Control de stock</span>
                          </div>
                          {topping.hasStock && (
                            <>
                              <input
                                type="number"
                                value={topping.stock || 0}
                                onChange={(e) => setToppings(prev => 
                                  prev.map(t => t.id === topping.id ? {
                                    ...t, 
                                    stock: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                                  } : t)
                                )}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Stock actual"
                              />
                              <input
                                type="number"
                                value={topping.minStock || 0}
                                onChange={(e) => setToppings(prev => 
                                  prev.map(t => t.id === topping.id ? {
                                    ...t, 
                                    minStock: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                                  } : t)
                                )}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Stock mínimo"
                              />
                            </>
                          )}
                        </div>
                      ) : (
                        <div>
                          {topping.hasStock ? (
                            <span className={`text-sm font-medium ${
                              (topping.stock || 0) < (topping.minStock || 0) ? 'text-red-600' :
                              (topping.stock || 0) < (topping.minStock || 0) * 2 ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {topping.stock || 0}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">Sin control</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === topping.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={topping.isActive}
                            onChange={(e) => setToppings(prev => 
                              prev.map(t => t.id === topping.id ? {...t, isActive: e.target.checked} : t)
                            )}
                            className="rounded"
                          />
                          <span className="text-xs text-gray-600">Activo</span>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          topping.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {topping.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {editingId === topping.id ? (
                        <>
                          <button
                            onClick={async () => {
                              await updateTopping(topping.id, {
                                name: topping.name,
                                description: topping.description,
                                category: topping.category,
                                priceAdd: topping.priceAdd,
                                cost: topping.cost,
                                stock: topping.stock,
                                minStock: topping.minStock,
                                hasStock: topping.hasStock,
                                isActive: topping.isActive
                              })
                            }}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Save className="w-4 h-4 inline" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null)
                              loadToppings() // Recargar para deshacer cambios
                            }}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <X className="w-4 h-4 inline" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingId(topping.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit2 className="w-4 h-4 inline" />
                          </button>
                          
                          <button
                            onClick={() => deleteTopping(topping.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredToppings.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  No se encontraron toppings con los filtros aplicados
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}