'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Palette,
  Tag,
  Search,
  Filter
} from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { PermissionGuard } from '@/hooks/usePermissions'

interface Category {
  id: string
  name: string
  color: string
  type: 'VITRINA' | 'CAKE_BAR'
  _count: {
    products: number
  }
}

interface CategoryFormData {
  name: string
  color: string
  type: 'VITRINA' | 'CAKE_BAR'
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<'ALL' | 'VITRINA' | 'CAKE_BAR'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    color: '#3B82F6',
    type: 'VITRINA'
  })

  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6366F1'
  ]

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/categories', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingCategory 
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories'
      
      const method = editingCategory ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await loadCategories()
        closeModal()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al guardar categoría')
      }
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Error al guardar categoría')
    }
  }

  const handleDelete = async (category: Category) => {
    if (category.name === 'Sin Categoría') {
      alert('No se puede eliminar la categoría "Sin Categoría"')
      return
    }

    if (!confirm(`¿Estás seguro de eliminar "${category.name}"? Los productos se moverán a "Sin Categoría".`)) {
      return
    }

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        await loadCategories()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al eliminar categoría')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Error al eliminar categoría')
    }
  }

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        color: category.color,
        type: category.type
      })
    } else {
      setEditingCategory(null)
      setFormData({
        name: '',
        color: '#3B82F6',
        type: 'VITRINA'
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCategory(null)
    setFormData({
      name: '',
      color: '#3B82F6',
      type: 'VITRINA'
    })
  }

  const filteredCategories = categories.filter(category => {
    const matchesType = selectedType === 'ALL' || category.type === selectedType
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch
  })

  return (
    <ProtectedRoute>
      <PermissionGuard permission="canViewInventory">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link 
                  href="/inventory" 
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Tag className="h-6 w-6 mr-2 text-blue-600" />
                    Gestión de Categorías
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Administra las categorías para productos de vitrina y cake bar
                  </p>
                </div>
              </div>

              <PermissionGuard permission="canManageCategories">
                <button
                  onClick={() => openModal()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nueva Categoría</span>
                </button>
              </PermissionGuard>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar categorías..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Type Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as typeof selectedType)}
                    className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none"
                  >
                    <option value="ALL">Todos los tipos</option>
                    <option value="VITRINA">Vitrina</option>
                    <option value="CAKE_BAR">Cake Bar</option>
                  </select>
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>Total: {filteredCategories.length}</span>
                  <span>Vitrina: {filteredCategories.filter(c => c.type === 'VITRINA').length}</span>
                  <span>Cake Bar: {filteredCategories.filter(c => c.type === 'CAKE_BAR').length}</span>
                </div>
              </div>
            </div>

            {/* Categories Grid */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Color Header */}
                    <div 
                      className="h-3"
                      style={{ backgroundColor: category.color }}
                    />
                    
                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {category.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {category.type === 'VITRINA' ? 'Vitrina' : 'Cake Bar'}
                          </p>
                        </div>
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: category.color }}
                        />
                      </div>

                      {/* Stats */}
                      <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
                        <Package className="h-4 w-4 mr-1" />
                        <span className="text-sm">
                          {category._count.products} producto{category._count.products !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Actions */}
                      <PermissionGuard permission="canManageCategories">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openModal(category)}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg flex items-center justify-center space-x-1 transition-colors text-sm"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Editar</span>
                          </button>
                          {category.name !== 'Sin Categoría' && (
                            <button
                              onClick={() => handleDelete(category)}
                              className="bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg flex items-center justify-center transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </PermissionGuard>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredCategories.length === 0 && !loading && (
              <div className="text-center py-12">
                <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No hay categorías
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm || selectedType !== 'ALL' 
                    ? 'No se encontraron categorías con los filtros aplicados'
                    : 'Crea tu primera categoría para organizar tus productos'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </h2>

                <form onSubmit={handleSubmit}>
                  {/* Nombre */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre de la categoría
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                      disabled={editingCategory?.name === 'Sin Categoría'}
                    />
                  </div>

                  {/* Tipo */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'VITRINA' | 'CAKE_BAR' })}
                      className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      disabled={!!editingCategory}
                    >
                      <option value="VITRINA">Vitrina</option>
                      <option value="CAKE_BAR">Cake Bar</option>
                    </select>
                  </div>

                  {/* Color */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Color
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, color })}
                          className={`w-10 h-10 rounded-lg border-2 transition-transform hover:scale-110 ${
                            formData.color === color 
                              ? 'border-gray-400 scale-110' 
                              : 'border-gray-200 dark:border-gray-600'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="mt-2 flex items-center space-x-2">
                      <Palette className="h-4 w-4 text-gray-400" />
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-8 h-8 border dark:border-gray-600 rounded cursor-pointer"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formData.color}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {editingCategory ? 'Actualizar' : 'Crear'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </PermissionGuard>
    </ProtectedRoute>
  )
}