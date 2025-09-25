'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions, PermissionGuard } from '@/hooks/usePermissions';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Edit2,
  Save,
  X,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Package,
  DollarSign,
  QrCode,
  Eye,
  EyeOff,
  Lock,
  Coffee
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string;
  type: string;
  barcode: string | null;
  isActive: boolean;
  isService: boolean;
  minStock: number;
  specialPrice: number | null;
  hasPromotion: boolean;
  promotionDiscount: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface EditingProduct extends Product {
  isEditing?: boolean;
  hasChanges?: boolean;
}

const userRole = 'ADMIN'; // Temporal - esto vendría del contexto de autenticación

export default function ProductsPage() {
  return (
    <ProtectedRoute>
      <PermissionGuard 
        permission="canViewInventory"
        fallback={
          <div className="min-h-screen bg-gray-50">
            <div className="p-8 max-w-7xl mx-auto">
              <div className="text-center py-12">
                <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Restringido</h3>
                <p className="text-gray-600">No tienes permisos para acceder a la gestión de productos.</p>
                <Link 
                  href="/" 
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al inicio
                </Link>
              </div>
            </div>
          </div>
        }
      >
        <ProductsPageContent />
      </PermissionGuard>
    </ProtectedRoute>
  )
}

function ProductsPageContent() {
  const { user } = useAuth();
  const permissions = usePermissions();
  const [products, setProducts] = useState<EditingProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories')
      ]);

      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();

      setProducts(productsData.map((p: Product) => ({ ...p, isEditing: false, hasChanges: false })));
      setCategories(categoriesData.map((c: any) => c.name));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode?.includes(searchTerm);
    
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    const matchesType = !typeFilter || product.type === typeFilter;
    const matchesService = !serviceFilter || 
                          (serviceFilter === 'products' && !product.isService) ||
                          (serviceFilter === 'services' && product.isService);
    const matchesActive = activeFilter === 'all' || 
                         (activeFilter === 'active' && product.isActive) ||
                         (activeFilter === 'inactive' && !product.isActive);
    const matchesStock = stockFilter === 'all' ||
                        (stockFilter === 'low' && product.stock <= product.minStock && !product.isService) ||
                        (stockFilter === 'normal' && (product.stock > product.minStock || product.isService));

    return matchesSearch && matchesCategory && matchesType && matchesService && matchesActive && matchesStock;
  });

  const startEditing = (productId: number) => {
    if (!permissions.canEditProducts) {
      alert('No tienes permisos para editar productos');
      return;
    }
    
    setProducts(products.map(p => 
      p.id === productId 
        ? { ...p, isEditing: true }
        : { ...p, isEditing: false }
    ));
  };

  const cancelEditing = (productId: number) => {
    setProducts(products.map(p => 
      p.id === productId 
        ? { ...p, isEditing: false, hasChanges: false }
        : p
    ));
  };

  const updateProductField = (productId: number, field: keyof Product, value: any) => {
    setProducts(products.map(p => 
      p.id === productId 
        ? { ...p, [field]: value, hasChanges: true }
        : p
    ));
  };

  const saveProduct = async (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

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
      });

      if (response.ok) {
        setProducts(products.map(p => 
          p.id === productId 
            ? { ...p, isEditing: false, hasChanges: false }
            : p
        ));
        
        // Aquí se dispararía la actualización en tiempo real al POS
        // broadcastProductUpdate(product);
      } else {
        alert('Error al guardar el producto');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error al guardar el producto');
    }
  };

  const toggleProductStatus = async (productId: number) => {
    if (!permissions.canEditProducts) {
      alert('No tienes permisos para cambiar el estado de productos');
      return;
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) return;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          isActive: !product.isActive,
        }),
      });

      if (response.ok) {
        setProducts(products.map(p => 
          p.id === productId 
            ? { ...p, isActive: !p.isActive }
            : p
        ));
      }
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
  };

  const deleteProduct = async (productId: number) => {
    if (!permissions.canDeleteProducts) {
      alert('No tienes permisos para eliminar productos');
      return;
    }
    
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId));
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const generateBarcode = (productId: number) => {
    const newBarcode = '789' + Math.random().toString().substr(2, 10);
    updateProductField(productId, 'barcode', newBarcode);
  };

  const addToCakeBar = async (productId: number) => {
    try {
      const response = await fetch('/api/products/add-to-cakebar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      if (response.ok) {
        alert('Producto añadido al menú Cake Bar exitosamente');
        loadData(); // Recargar para ver cambios
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      alert('Error al añadir producto al Cake Bar');
    }
  };

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
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link href="/inventory" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
            <p className="text-gray-600">Administra todos los productos de vitrina y cake bar</p>
          </div>
        </div>
        <PermissionGuard permission="canCreateProducts">
          <Link
            href="/inventory/products/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Link>
        </PermissionGuard>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las categorías</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los tipos</option>
            <option value="VITRINA">Vitrina</option>
            <option value="CAKE_BAR">Cake Bar</option>
            <option value="SERVICE">Servicios</option>
          </select>

          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Productos y Servicios</option>
            <option value="products">Solo Productos</option>
            <option value="services">Solo Servicios</option>
          </select>

          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todo el stock</option>
            <option value="low">Stock bajo</option>
            <option value="normal">Stock normal</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
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
                  Tipo
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
                  userRole={userRole}
                  onStartEditing={startEditing}
                  onCancelEditing={cancelEditing}
                  onUpdateField={updateProductField}
                  onSave={saveProduct}
                  onToggleStatus={toggleProductStatus}
                  onDelete={deleteProduct}
                  onGenerateBarcode={generateBarcode}
                  onAddToCakeBar={addToCakeBar}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
          <p className="text-gray-600">Intenta ajustar los filtros o crear un nuevo producto.</p>
        </div>
      )}
    </div>
  );
}

// Componente separado para cada fila de producto
function ProductRow({ 
  product, 
  categories, 
  userRole, 
  onStartEditing, 
  onCancelEditing, 
  onUpdateField, 
  onSave, 
  onToggleStatus, 
  onDelete,
  onGenerateBarcode,
  onAddToCakeBar 
}: {
  product: any;
  categories: string[];
  userRole: string;
  onStartEditing: (id: number) => void;
  onCancelEditing: (id: number) => void;
  onUpdateField: (id: number, field: keyof Product, value: any) => void;
  onSave: (id: number) => void;
  onToggleStatus: (id: number) => void;
  onDelete: (id: number) => void;
  onGenerateBarcode: (id: number) => void;
  onAddToCakeBar: (id: number) => void;
}) {
  const permissions = usePermissions();
  const isLowStock = !product.isService && product.stock <= product.minStock;
  const canEdit = permissions.canEditProducts;

  return (
    <tr className={`hover:bg-gray-50 ${!product.isActive ? 'bg-gray-50 opacity-75' : ''}`}>
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
                                  </div>
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
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
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
        {product.isEditing && canEdit ? (
          <select
            value={product.type}
            onChange={(e) => onUpdateField(product.id, 'type', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="VITRINA">Vitrina</option>
            <option value="CAKE_BAR">Cake Bar</option>
            <option value="SERVICE">Servicio</option>
          </select>
        ) : (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            product.type === 'VITRINA' 
              ? 'bg-blue-100 text-blue-800' 
              : product.type === 'CAKE_BAR'
              ? 'bg-purple-100 text-purple-800'
              : product.type === 'SERVICE'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {product.type === 'VITRINA' ? 'Vitrina' : 
             product.type === 'CAKE_BAR' ? 'Cake Bar' : 
             product.type === 'SERVICE' ? 'Servicio' :
             product.type}
          </span>
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
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              {canEdit && product.type !== 'cake_bar' && (
                <button
                  onClick={() => onAddToCakeBar(product.id)}
                  className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                  title="Añadir al menú Cake Bar"
                >
                  <Coffee className="w-4 h-4" />
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => onDelete(product.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}