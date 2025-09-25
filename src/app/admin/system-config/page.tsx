'use client'

import { useState, useEffect } from 'react'
import { Save, Building2, Palette, DollarSign, Settings, Users, Bell, Shield, BarChart3 } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Header from '@/components/Header'
import { useSystemConfig } from '@/contexts/SystemConfigContext'

export default function SystemConfigPage() {
  const { refreshConfig } = useSystemConfig();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('company');
  const [config, setConfig] = useState({
    // Información de la empresa
    systemName: 'Sistema de Panadería',
    currency: 'COP',
    taxRate: 0.0,
    timezone: 'America/Bogota',
    dateFormat: 'DD/MM/YYYY',
    
    // Apariencia
    theme: 'light',
    logo: '',
    primaryColor: '#3B82F6',
    language: 'es',
    
    // Notificaciones
    enableNotifications: true,
    emailNotifications: true,
    
    // Inventario
    lowStockThreshold: 10,
    
    // Funciones
    enableCakeBar: true,
    enableCustomOrders: true,
    maxCakeBarOptions: 50,
    
    // Ventas
    defaultPaymentMethod: 'EFECTIVO',
    allowPartialPayments: true,
    
    // Personal
    requireEmployeeClockIn: true,
    maxWorkHours: 8,
    breakDuration: 30,
    
    // Seguridad
    passwordMinLength: 6,
    sessionTimeout: 480,
    enableTwoFactor: false,
    
    // Sistema
    backupFrequency: 'daily',
    maintenanceMode: false
  });

  // Cargar configuración al montar el componente
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/admin/system-config');
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
        } else {
          console.error('Error al cargar configuración');
        }
      } catch (error) {
        console.error('Error al cargar configuración:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Función para guardar configuración
  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/system-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const updatedConfig = await response.json();
        setConfig(updatedConfig);
        await refreshConfig(); // Actualizar el contexto global
        alert('Configuración guardada exitosamente');
      } else {
        const error = await response.json();
        alert(`Error al guardar: ${error.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      alert('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Estado y función para subir logo
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        handleConfigChange('logo', data.url);
        alert('Logo subido exitosamente');
      } else {
        const error = await response.json();
        alert(`Error al subir logo: ${error.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error al subir logo:', error);
      alert('Error al subir logo');
    } finally {
      setUploadingLogo(false);
      // Limpiar el input
      event.target.value = '';
    }
  };

  const tabs = [
    { id: 'company', label: 'Empresa', icon: Building2 },
    { id: 'financial', label: 'Financiero', icon: DollarSign },
    { id: 'visual', label: 'Visual', icon: Palette },
    { id: 'sales', label: 'Ventas', icon: Settings },
    { id: 'inventory', label: 'Inventario', icon: BarChart3 },
    { id: 'staff', label: 'Personal', icon: Users },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'security', label: 'Seguridad', icon: Shield }
  ];

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Header />
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Configuración del Sistema
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Personaliza el comportamiento y apariencia del sistema
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            {/* Tabs Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        activeTab === tab.id
                          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Información de la Empresa */}
              {activeTab === 'company' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Información de la Empresa
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nombre del sistema
                      </label>
                      <input
                        type="text"
                        value={config.systemName}
                        onChange={(e) => handleConfigChange('systemName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Sistema de Panadería"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Idioma
                      </label>
                      <select
                        value={config.language}
                        onChange={(e) => handleConfigChange('language', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="es">Español</option>
                        <option value="en">Inglés</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Zona horaria
                      </label>
                      <select
                        value={config.timezone}
                        onChange={(e) => handleConfigChange('timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="America/Bogota">Bogotá (COL)</option>
                        <option value="America/Mexico_City">Ciudad de México</option>
                        <option value="America/New_York">Nueva York</option>
                        <option value="Europe/Madrid">Madrid</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Formato de fecha
                      </label>
                      <select
                        value={config.dateFormat}
                        onChange={(e) => handleConfigChange('dateFormat', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Configuración Financiera */}
              {activeTab === 'financial' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Configuración Financiera
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Moneda
                      </label>
                      <select
                        value={config.currency}
                        onChange={(e) => handleConfigChange('currency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="COP">Peso Colombiano (COP)</option>
                        <option value="MXN">Peso Mexicano (MXN)</option>
                        <option value="USD">Dólar Estadounidense (USD)</option>
                        <option value="EUR">Euro (EUR)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tasa de impuesto (0-1)
                      </label>
                      <input
                        type="number"
                        value={config.taxRate}
                        onChange={(e) => handleConfigChange('taxRate', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="0.19"
                        step="0.01"
                        min="0"
                        max="1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Configuración Visual */}
              {activeTab === 'visual' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Personalización Visual
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tema por defecto
                      </label>
                      <select
                        value={config.theme}
                        onChange={(e) => handleConfigChange('theme', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="light">Claro</option>
                        <option value="dark">Oscuro</option>
                        <option value="system">Sistema</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Color primario
                      </label>
                      <input
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                        className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Logo del sistema
                      </label>
                      
                      {/* Mostrar logo actual si existe */}
                      {config.logo && (
                        <div className="mb-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Logo actual:</p>
                          <img 
                            src={config.logo} 
                            alt="Logo actual" 
                            className="h-16 object-contain bg-white dark:bg-gray-800 p-2 rounded border"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiAxNkMyNC4yNjggMTYgMTggMjIuMjY4IDE4IDMwUzI0LjI2OCA0NCAzMiA0NFM0NiAzNy43MzIgNDYgMzBTMzkuNzMyIDE2IDMyIDE2Wk0zMiAyMkMyNi40ODcgMjIgMjIgMjYuNDg3IDIyIDMyUzI2LjQ4NyA0MiAzMiA0MlMzOCAzNy41MTMgMzggMzJTMzUuNTEzIDIyIDMyIDIyWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                            }}
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{config.logo}</p>
                        </div>
                      )}

                      {/* Input para subir archivo */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Subir nuevo logo
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            disabled={uploadingLogo}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          {uploadingLogo && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Formatos permitidos: JPG, PNG, GIF, SVG. Tamaño máximo: 5MB.
                        </p>
                      </div>

                      {/* Input para URL manual */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          O ingresa URL manual
                        </label>
                        <input
                          type="text"
                          value={config.logo}
                          onChange={(e) => handleConfigChange('logo', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="https://ejemplo.com/logo.png"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Configuración de Ventas */}
              {activeTab === 'sales' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Configuración de Ventas
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Método de pago por defecto
                      </label>
                      <select
                        value={config.defaultPaymentMethod}
                        onChange={(e) => handleConfigChange('defaultPaymentMethod', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="TARJETA">Tarjeta</option>
                        <option value="TRANSFERENCIA">Transferencia</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="allowPartialPayments"
                        checked={config.allowPartialPayments}
                        onChange={(e) => handleConfigChange('allowPartialPayments', e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="allowPartialPayments" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Permitir pagos parciales
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Configuración de Inventario */}
              {activeTab === 'inventory' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Configuración de Inventario
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Umbral de stock bajo
                      </label>
                      <input
                        type="number"
                        value={config.lowStockThreshold}
                        onChange={(e) => handleConfigChange('lowStockThreshold', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Máximo opciones Cake Bar
                      </label>
                      <input
                        type="number"
                        value={config.maxCakeBarOptions}
                        onChange={(e) => handleConfigChange('maxCakeBarOptions', parseInt(e.target.value) || 50)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        min="1"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableCakeBar"
                        checked={config.enableCakeBar}
                        onChange={(e) => handleConfigChange('enableCakeBar', e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="enableCakeBar" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Habilitar Cake Bar
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableCustomOrders"
                        checked={config.enableCustomOrders}
                        onChange={(e) => handleConfigChange('enableCustomOrders', e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="enableCustomOrders" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Habilitar pedidos personalizados
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Configuración de Personal */}
              {activeTab === 'staff' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Configuración de Personal
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Máximo horas de trabajo
                      </label>
                      <input
                        type="number"
                        value={config.maxWorkHours}
                        onChange={(e) => handleConfigChange('maxWorkHours', parseInt(e.target.value) || 8)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        min="1"
                        max="24"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Duración del descanso (minutos)
                      </label>
                      <input
                        type="number"
                        value={config.breakDuration}
                        onChange={(e) => handleConfigChange('breakDuration', parseInt(e.target.value) || 30)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        min="5"
                        max="120"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="requireEmployeeClockIn"
                        checked={config.requireEmployeeClockIn}
                        onChange={(e) => handleConfigChange('requireEmployeeClockIn', e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="requireEmployeeClockIn" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Requerir marcado de entrada/salida
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Configuración de Notificaciones */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Configuración de Notificaciones
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableNotifications"
                        checked={config.enableNotifications}
                        onChange={(e) => handleConfigChange('enableNotifications', e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="enableNotifications" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Habilitar notificaciones del sistema
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="emailNotifications"
                        checked={config.emailNotifications}
                        onChange={(e) => handleConfigChange('emailNotifications', e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Notificaciones por email
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Configuración de Seguridad */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Configuración de Seguridad
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Longitud mínima de contraseña
                      </label>
                      <input
                        type="number"
                        value={config.passwordMinLength}
                        onChange={(e) => handleConfigChange('passwordMinLength', parseInt(e.target.value) || 6)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        min="4"
                        max="20"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tiempo de sesión (minutos)
                      </label>
                      <input
                        type="number"
                        value={config.sessionTimeout}
                        onChange={(e) => handleConfigChange('sessionTimeout', parseInt(e.target.value) || 480)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        min="30"
                        max="1440"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableTwoFactor"
                        checked={config.enableTwoFactor}
                        onChange={(e) => handleConfigChange('enableTwoFactor', e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="enableTwoFactor" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Habilitar autenticación de dos factores
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Frecuencia de respaldo
                      </label>
                      <select
                        value={config.backupFrequency}
                        onChange={(e) => handleConfigChange('backupFrequency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="daily">Diario</option>
                        <option value="weekly">Semanal</option>
                        <option value="monthly">Mensual</option>
                        <option value="never">Nunca</option>
                      </select>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="maintenanceMode"
                        checked={config.maintenanceMode}
                        onChange={(e) => handleConfigChange('maintenanceMode', e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Modo mantenimiento
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}