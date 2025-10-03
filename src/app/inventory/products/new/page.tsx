'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PermissionGuard } from '@/hooks/usePermissions';
import { 
  ArrowLeft, 
  Save, 
  X, 
  QrCode, 
  Package, 
  DollarSign, 
  Tag,
  AlertTriangle,
  Settings,
  Lock
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color: string;
  type: 'VITRINA' | 'CAKE_BAR';
}

const userRole = 'ADMIN'; // Temporal - esto vendría del contexto de autenticación

export default function NewProductPage() {
  return (
    <ProtectedRoute>
      <PermissionGuard 
        permission="canCreateProducts"
        fallback={
          <div className="min-h-screen bg-gray-50">
            <div className="p-8 max-w-7xl mx-auto">
              <div className="text-center py-12">
                <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Restringido</h3>
                <p className="text-gray-600">No tienes permisos para crear productos.</p>
                <Link 
                  href="/inventory/products" 
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver a productos
                </Link>
              </div>
            </div>
          </div>
        }
      >
        <NewProductContent />
      </PermissionGuard>
    </ProtectedRoute>
  )
}

function NewProductContent() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '0',
    categoryId: '',
    type: 'VITRINA',
    barcode: '',
    isService: false,
    minStock: '5',
    specialPrice: '',
    hasPromotion: false,
    promotionDiscount: '',
    promotionStartDate: '',
    promotionEndDate: '',
  });

  useEffect(() => {
    if (userRole !== 'ADMIN') {
      router.push('/inventory');
      return;
    }
    loadCategories();
  }, [router]);

  // Recargar categorías cuando cambia el tipo de producto
  useEffect(() => {
    loadCategories();
  }, [formData.type]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        credentials: 'include'
      });
      const data = await response.json();
      // Filtrar categorías según el tipo de producto
      const filteredCategories = data.filter((cat: Category) => cat.type === formData.type);
      setCategories(filteredCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const generateBarcode = () => {
    const newBarcode = '789' + Math.random().toString().substr(2, 10);
    setFormData(prev => ({ ...prev, barcode: newBarcode }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'El precio debe ser mayor a 0';
    }

    // La categoría ya no es obligatoria - se usará "Sin Categoría" por defecto

    // Solo validar stock si no es un servicio
    if (!formData.isService) {
      if (parseInt(formData.stock) < 0) {
        newErrors.stock = 'El stock no puede ser negativo';
      }

      if (parseInt(formData.minStock) < 0) {
        newErrors.minStock = 'El stock mínimo no puede ser negativo';
      }
    }

    if (formData.specialPrice && parseFloat(formData.specialPrice) <= 0) {
      newErrors.specialPrice = 'El precio especial debe ser mayor a 0';
    }

    if (formData.hasPromotion) {
      if (!formData.promotionDiscount || parseFloat(formData.promotionDiscount) <= 0 || parseFloat(formData.promotionDiscount) > 100) {
        newErrors.promotionDiscount = 'El descuento debe estar entre 1 y 100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Si no se selecciona categoría, usar la categoría por defecto
      const categoryId = formData.categoryId || 
        (formData.type === 'CAKE_BAR' ? 'default-category-cakebar' : 'default-category-vitrina');

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          categoryId: categoryId,
          price: parseFloat(formData.price),
          stock: formData.isService ? 0 : parseInt(formData.stock),
          minStock: formData.isService ? 0 : parseInt(formData.minStock),
          specialPrice: formData.specialPrice ? parseFloat(formData.specialPrice) : null,
          promotionDiscount: formData.promotionDiscount ? parseFloat(formData.promotionDiscount) : null,
          promotionStartDate: formData.promotionStartDate || null,
          promotionEndDate: formData.promotionEndDate || null,
          createdBy: 'admin' // En producción esto vendría del usuario autenticado
        }),
      });

      if (response.ok) {
        router.push('/inventory/products');
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || 'Error al crear el producto' });
      }
    } catch (error) {
      console.error('Error creating product:', error);
      setErrors({ submit: 'Error al crear el producto' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Si se activa el modo servicio, resetear campos de stock
    if (field === 'isService' && value === true) {
      setFormData(prev => ({ 
        ...prev, 
        [field]: value,
        stock: '0',
        minStock: '0'
      }));
    }
  };

  if (userRole !== 'ADMIN') {
    return null;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link href="/inventory/products" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nuevo Producto</h1>
            <p className="text-gray-600">Crear un nuevo producto o servicio para la pastelería</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información Básica */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Información Básica
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Producto/Servicio *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Pan Francés o Decoración de Pastel"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="VITRINA">Vitrina</option>
                <option value="CAKE_BAR">Cake Bar</option>
                <option value="SERVICE">Servicio</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descripción detallada del producto o servicio..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.categoryId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Sin Categoría (por defecto)</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <p className="text-gray-500 text-sm mt-1">Si no seleccionas una categoría, se asignará automáticamente a "Sin Categoría"</p>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de Barras
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  disabled={formData.isService}
                  className={`flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formData.isService ? 'bg-gray-100 text-gray-500' : ''
                  }`}
                  placeholder={formData.isService ? "Los servicios no usan código de barras" : "Código de barras opcional"}
                />
                <button
                  type="button"
                  onClick={generateBarcode}
                  disabled={formData.isService}
                  className={`px-4 py-2 border border-l-0 border-gray-300 rounded-r-lg transition-colors ${
                    formData.isService 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isService"
                  checked={formData.isService}
                  onChange={(e) => handleInputChange('isService', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isService" className="ml-2 text-sm font-medium text-gray-700 flex items-center">
                  <Settings className="w-4 h-4 mr-1" />
                  Este es un servicio (no maneja inventario físico)
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Los servicios como decoración de pasteles, cursos, consultoría, etc. no requieren control de stock
              </p>
            </div>
          </div>
        </div>

        {/* Precios y Stock */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Precios {!formData.isService && 'y Stock'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Regular * ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>

            {!formData.isService && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => handleInputChange('stock', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.stock ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0"
                  />
                  {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => handleInputChange('minStock', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.minStock ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="5"
                  />
                  {errors.minStock && <p className="text-red-500 text-sm mt-1">{errors.minStock}</p>}
                </div>
              </>
            )}

            {formData.isService && (
              <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center text-blue-700">
                  <Settings className="w-5 h-5 mr-2" />
                  <span className="font-medium">Modo Servicio Activado</span>
                </div>
                <p className="text-blue-600 text-sm mt-1">
                  Este elemento no maneja inventario físico. Solo se registra el precio del servicio.
                </p>
              </div>
            )}

            <div className={formData.isService ? 'md:col-span-3' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Especial ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.specialPrice}
                onChange={(e) => handleInputChange('specialPrice', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.specialPrice ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Precio especial opcional"
              />
              {errors.specialPrice && <p className="text-red-500 text-sm mt-1">{errors.specialPrice}</p>}
            </div>
          </div>
        </div>

        {/* Promociones */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Tag className="w-5 h-5 mr-2" />
            Promociones
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasPromotion"
                checked={formData.hasPromotion}
                onChange={(e) => handleInputChange('hasPromotion', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="hasPromotion" className="ml-2 text-sm font-medium text-gray-700">
                Este {formData.isService ? 'servicio' : 'producto'} tiene promoción
              </label>
            </div>

            {formData.hasPromotion && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6 border-l-2 border-blue-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descuento (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.promotionDiscount}
                    onChange={(e) => handleInputChange('promotionDiscount', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.promotionDiscount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="20"
                  />
                  {errors.promotionDiscount && <p className="text-red-500 text-sm mt-1">{errors.promotionDiscount}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={formData.promotionStartDate}
                    onChange={(e) => handleInputChange('promotionStartDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Fin
                  </label>
                  <input
                    type="date"
                    value={formData.promotionEndDate}
                    onChange={(e) => handleInputChange('promotionEndDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Errores de submit */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{errors.submit}</span>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4">
          <Link
            href="/inventory/products"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Crear {formData.isService ? 'Servicio' : 'Producto'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}