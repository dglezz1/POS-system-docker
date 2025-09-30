'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Save, 
  Globe, 
  DollarSign, 
  Clock, 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Settings,
  Store,
  Receipt,
  CreditCard,
  Database,
  Wifi,
  Monitor,
  Printer
} from 'lucide-react'
import { PermissionGuard } from '@/hooks/usePermissions'
import ProtectedRoute from '@/components/ProtectedRoute'

interface SystemSettings {
  // Configuración general
  companyName: string
  companyAddress: string
  companyPhone: string
  companyEmail: string
  taxId: string
  
  // Configuración regional
  timezone: string
  currency: string
  language: string
  dateFormat: string
  
  // Configuración POS
  receiptFooter: string
  autoOpenCashDrawer: boolean
  requireEmployeeLogin: boolean
  defaultTaxRate: number
  
  // Configuración de impresión
  printerName: string
  receiptWidth: number
  printLogo: boolean
  
  // Configuración de notificaciones
  lowStockAlert: number
  emailNotifications: boolean
  pushNotifications: boolean
  
  // Configuración de apariencia
  theme: string
  primaryColor: string
  logoUrl: string
}

const timezones = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
  { value: 'America/Cancun', label: 'Cancún (GMT-5)' },
  { value: 'America/Tijuana', label: 'Tijuana (GMT-8)' },
  { value: 'America/Chihuahua', label: 'Chihuahua (GMT-7)' },
  { value: 'America/New_York', label: 'Nueva York (GMT-5)' },
  { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' }
]

const currencies = [
  { value: 'MXN', label: 'Peso Mexicano (MXN)', symbol: '$' },
  { value: 'USD', label: 'Dólar Estadounidense (USD)', symbol: '$' },
  { value: 'EUR', label: 'Euro (EUR)', symbol: '€' }
]

const languages = [
  { value: 'es-MX', label: 'Español (México)' },
  { value: 'es-ES', label: 'Español (España)' },
  { value: 'en-US', label: 'English (US)' }
]

const themes = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'auto', label: 'Automático' }
]

export default function AdminSettings() {
  return (
    <ProtectedRoute>
      <PermissionGuard permission="canAccessAdmin">
        <AdminSettingsContent />
      </PermissionGuard>
    </ProtectedRoute>
  )
}

function AdminSettingsContent() {
  const [settings, setSettings] = useState<SystemSettings>({
    // Valores por defecto
    companyName: 'Panadería & Pastelería',
    companyAddress: 'Ciudad de México, México',
    companyPhone: '+52 55 1234 5678',
    companyEmail: 'info@panaderia.com',
    taxId: 'RFC123456789',
    
    timezone: 'America/Mexico_City',
    currency: 'MXN',
    language: 'es-MX',
    dateFormat: 'DD/MM/YYYY',
    
    receiptFooter: '¡Gracias por su compra!',
    autoOpenCashDrawer: true,
    requireEmployeeLogin: true,
    defaultTaxRate: 16,
    
    printerName: 'Impresora Principal',
    receiptWidth: 58,
    printLogo: true,
    
    lowStockAlert: 10,
    emailNotifications: true,
    pushNotifications: true,
    
    theme: 'light',
    primaryColor: '#3B82F6',
    logoUrl: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error guardando configuración:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
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
                className="flex items-center px-4 py-2 text-gray-600 hover:text-white hover:bg-blue-600 rounded-lg mr-6 transition-all duration-200 border border-gray-300 hover:border-blue-600"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver al Panel Admin
              </Link>
              <div className="flex items-center">
                <div className="bg-blue-500 p-2 rounded-lg mr-3">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Configuración del Sistema
                  </h1>
                  <p className="text-xs text-gray-500">
                    Personaliza el comportamiento y apariencia del sistema
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                saved 
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg transform scale-105'
                  : loading 
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
              }`}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Guardando...' : saved ? 'Guardado ✓' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Información de la Empresa */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <div className="bg-blue-100 rounded-lg p-2 mr-3">
                <Building className="w-5 h-5 text-blue-600" />
              </div>
              Información de la Empresa
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <textarea
                  value={settings.companyAddress}
                  onChange={(e) => handleChange('companyAddress', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={settings.companyPhone}
                  onChange={(e) => handleChange('companyPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={settings.companyEmail}
                  onChange={(e) => handleChange('companyEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RFC / ID Fiscal
                </label>
                <input
                  type="text"
                  value={settings.taxId}
                  onChange={(e) => handleChange('taxId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Configuración Regional */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <div className="bg-green-100 rounded-lg p-2 mr-3">
                <Globe className="w-5 h-5 text-green-600" />
              </div>
              Configuración Regional
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zona Horaria
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {timezones.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moneda
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {currencies.map(curr => (
                    <option key={curr.value} value={curr.value}>{curr.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Idioma
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {languages.map(lang => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Formato de Fecha
                </label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => handleChange('dateFormat', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tasa de Impuesto (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={settings.defaultTaxRate}
                  onChange={(e) => handleChange('defaultTaxRate', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Configuración POS */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <div className="bg-purple-100 rounded-lg p-2 mr-3">
                <Store className="w-5 h-5 text-purple-600" />
              </div>
              Punto de Venta (POS)
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pie de Ticket
                </label>
                <textarea
                  value={settings.receiptFooter}
                  onChange={(e) => handleChange('receiptFooter', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.autoOpenCashDrawer}
                    onChange={(e) => handleChange('autoOpenCashDrawer', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Abrir cajón automáticamente</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.requireEmployeeLogin}
                    onChange={(e) => handleChange('requireEmployeeLogin', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Requerir login de empleado</span>
                </label>
              </div>
            </div>
          </div>

          {/* Configuración de Impresión */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <div className="bg-orange-100 rounded-lg p-2 mr-3">
                <Printer className="w-5 h-5 text-orange-600" />
              </div>
              Configuración de Impresión
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Impresora
                </label>
                <input
                  type="text"
                  value={settings.printerName}
                  onChange={(e) => handleChange('printerName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ancho de Ticket (mm)
                </label>
                <select
                  value={settings.receiptWidth}
                  onChange={(e) => handleChange('receiptWidth', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={58}>58mm</option>
                  <option value={80}>80mm</option>
                </select>
              </div>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.printLogo}
                  onChange={(e) => handleChange('printLogo', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Imprimir logo en tickets</span>
              </label>
            </div>
          </div>

          {/* Configuración de Notificaciones */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <div className="bg-red-100 rounded-lg p-2 mr-3">
                <Bell className="w-5 h-5 text-red-600" />
              </div>
              Notificaciones
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alerta de Stock Bajo (unidades)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.lowStockAlert}
                  onChange={(e) => handleChange('lowStockAlert', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Notificaciones por email</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={(e) => handleChange('pushNotifications', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Notificaciones push</span>
                </label>
              </div>
            </div>
          </div>

          {/* Configuración de Apariencia */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <div className="bg-pink-100 rounded-lg p-2 mr-3">
                <Palette className="w-5 h-5 text-pink-600" />
              </div>
              Apariencia
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tema
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) => handleChange('theme', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {themes.map(theme => (
                    <option key={theme.value} value={theme.value}>{theme.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color Principal
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL del Logo
                </label>
                <input
                  type="url"
                  value={settings.logoUrl}
                  onChange={(e) => handleChange('logoUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
        </div>
        
        {/* Vista previa de configuración */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <div className="bg-indigo-100 rounded-lg p-2 mr-3">
              <Monitor className="w-5 h-5 text-indigo-600" />
            </div>
            Vista Previa de Configuración
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Información de Empresa</h4>
              <div className="text-sm space-y-1 text-gray-600">
                <p><strong>Nombre:</strong> {settings.companyName}</p>
                <p><strong>Teléfono:</strong> {settings.companyPhone}</p>
                <p><strong>Email:</strong> {settings.companyEmail}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Regional</h4>
              <div className="text-sm space-y-1 text-gray-600">
                <p><strong>Zona:</strong> {timezones.find(t => t.value === settings.timezone)?.label}</p>
                <p><strong>Moneda:</strong> {currencies.find(c => c.value === settings.currency)?.label}</p>
                <p><strong>Impuesto:</strong> {settings.defaultTaxRate}%</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">POS</h4>
              <div className="text-sm space-y-1 text-gray-600">
                <p><strong>Pie de ticket:</strong> {settings.receiptFooter}</p>
                <p><strong>Cajón automático:</strong> {settings.autoOpenCashDrawer ? 'Sí' : 'No'}</p>
                <p><strong>Login empleado:</strong> {settings.requireEmployeeLogin ? 'Requerido' : 'Opcional'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}