'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Users,
  UserCheck,
  UserX,
  Crown,
  Shield,
  User,
  Mail,
  Calendar,
  TrendingUp,
  Award,
  Clock,
  DollarSign,
  MoreVertical,
  X,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RotateCcw,
  CalendarClock,
  Save
} from 'lucide-react'
import { PermissionGuard } from '@/hooks/usePermissions'
import ProtectedRoute from '@/components/ProtectedRoute'

interface Employee {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: {
    sales: number
  }
}

interface Alert {
  id: string
  type: string
  severity: string
  employee: {
    id: string
    name: string
    email: string
  }
  message: string
  startTime?: string
  duration?: number
  overtime?: number
  minutesLate?: number
  workSessionId?: number
  expectedTime?: string
}

interface AlertsData {
  alerts: Alert[]
  summary: {
    total: number
    errors: number
    warnings: number
    info: number
  }
}

interface EmployeesData {
  users: Employee[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  stats: {
    total: number
    active: number
    byRole: Array<{
      role: string
      _count: number
    }>
  }
  topSellers: Array<{
    id: string
    name: string
    role: string
    _count: {
      sales: number
    }
  }>
}

export default function EmployeesPage() {
  return (
    <ProtectedRoute>
      <PermissionGuard permission="canAccessAdmin">
        <EmployeesContent />
      </PermissionGuard>
    </ProtectedRoute>
  )
}

function EmployeesContent() {
  const [data, setData] = useState<EmployeesData | null>(null)
  const [alertsData, setAlertsData] = useState<AlertsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [alertsLoading, setAlertsLoading] = useState(true)
  
  // Estados para filtros y búsqueda
  const [filters, setFilters] = useState({
    search: '',
    role: 'ALL',
    isActive: '',
    page: 1,
    limit: 20
  })

  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  // Estados para formularios
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    isActive: true
  })
  const [submitting, setSubmitting] = useState(false)

  // Estados para modal de horarios
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleEmployee, setScheduleEmployee] = useState<Employee | null>(null)
  const [schedules, setSchedules] = useState<any[]>([])
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [savingSchedule, setSavingSchedule] = useState(false)

  useEffect(() => {
    loadEmployeesData()
    loadAlertsData()
    
    // Recargar alertas cada 30 segundos
    const alertsInterval = setInterval(loadAlertsData, 30000)
    
    return () => clearInterval(alertsInterval)
  }, [filters])

  const loadAlertsData = async () => {
    try {
      setAlertsLoading(true)
      const response = await fetch('/api/admin/alerts')
      if (response.ok) {
        const result = await response.json()
        setAlertsData(result)
      }
    } catch (error) {
      console.error('Error loading alerts data:', error)
    } finally {
      setAlertsLoading(false)
    }
  }

  const loadEmployeesData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'ALL') {
          params.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error loading employees data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key !== 'page' && { page: 1 })
    }))
  }

  const resetFilters = () => {
    setFilters({
      search: '',
      role: 'ALL',
      isActive: '',
      page: 1,
      limit: 20
    })
  }

  const openCreateModal = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'EMPLOYEE',
      isActive: true
    })
    setShowCreateModal(true)
  }

  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee)
    setFormData({
      name: employee.name,
      email: employee.email,
      password: '',
      role: employee.role,
      isActive: employee.isActive
    })
    setShowEditModal(true)
  }

  const closeModals = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setSelectedEmployee(null)
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'EMPLOYEE',
      isActive: true
    })
  }

  // Funciones para gestión de horarios
  const openScheduleModal = async (employee: Employee) => {
    setScheduleEmployee(employee)
    setShowScheduleModal(true)
    await loadEmployeeSchedule(employee.id)
  }

  const closeScheduleModal = () => {
    setShowScheduleModal(false)
    setScheduleEmployee(null)
    setSchedules([])
  }

  const loadEmployeeSchedule = async (userId: string) => {
    try {
      setLoadingSchedule(true)
      const response = await fetch(`/api/employees/schedule?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setSchedules(data)
      } else {
        console.error('Error al cargar horarios')
      }
    } catch (error) {
      console.error('Error al cargar horarios:', error)
    } finally {
      setLoadingSchedule(false)
    }
  }

  const handleScheduleChange = (dayOfWeek: number, field: string, value: any) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.dayOfWeek === dayOfWeek 
        ? { ...schedule, [field]: value }
        : schedule
    ))
  }

  const saveSchedule = async () => {
    if (!scheduleEmployee) return

    try {
      setSavingSchedule(true)
      const response = await fetch('/api/employees/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: scheduleEmployee.id,
          schedules: schedules
        })
      })

      if (response.ok) {
        alert('Horario actualizado correctamente')
        closeScheduleModal()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al guardar horario')
      }
    } catch (error) {
      console.error('Error al guardar horario:', error)
      alert('Error al guardar horario')
    } finally {
      setSavingSchedule(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email) {
      alert('Nombre y email son requeridos')
      return
    }

    if (showCreateModal && !formData.password) {
      alert('La contraseña es requerida para nuevos empleados')
      return
    }

    try {
      setSubmitting(true)
      
      const url = showCreateModal 
        ? '/api/admin/users'
        : `/api/admin/users/${selectedEmployee?.id}`
      
      const method = showCreateModal ? 'POST' : 'PUT'
      const body: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive
      }

      if (formData.password) {
        body.password = formData.password
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        closeModals()
        await loadEmployeesData()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al procesar la solicitud')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Error interno del servidor')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (employee: Employee) => {
    if (!confirm(`¿Estás seguro de que quieres desactivar a ${employee.name}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${employee.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadEmployeesData()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al eliminar empleado')
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      alert('Error interno del servidor')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Crown className="w-4 h-4 text-yellow-500" />
      case 'MANAGER': return <Shield className="w-4 h-4 text-blue-500" />
      case 'EMPLOYEE': return <User className="w-4 h-4 text-gray-500" />
      default: return <User className="w-4 h-4 text-gray-500" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-yellow-100 text-yellow-800'
      case 'MANAGER': return 'bg-blue-100 text-blue-800'
      case 'EMPLOYEE': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Cargando empleados...</p>
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
                href="/admin" 
                className="flex items-center text-gray-600 hover:text-gray-800 mr-6"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Panel Admin
              </Link>
              <div className="flex items-center">
                <div className="bg-orange-500 p-2 rounded-lg mr-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Gestión de Empleados
                  </h1>
                  <p className="text-xs text-gray-500">
                    Control y administración del personal
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={openCreateModal}
              className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Empleado
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Alertas */}
        {alertsData && alertsData.alerts.length > 0 && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-lg border-l-4 border-red-500">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Alertas de Empleados
                    </h3>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    {alertsData.summary.errors > 0 && (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        {alertsData.summary.errors} críticas
                      </span>
                    )}
                    {alertsData.summary.warnings > 0 && (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        {alertsData.summary.warnings} advertencias
                      </span>
                    )}
                    <button
                      onClick={loadAlertsData}
                      className="text-gray-500 hover:text-gray-700"
                      disabled={alertsLoading}
                    >
                      {alertsLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 max-h-60 overflow-y-auto">
                <div className="space-y-3">
                  {alertsData.alerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`p-3 rounded-lg border-l-4 ${
                        alert.severity === 'error' 
                          ? 'bg-red-50 border-red-400' 
                          : alert.severity === 'warning'
                          ? 'bg-yellow-50 border-yellow-400'
                          : 'bg-blue-50 border-blue-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {alert.severity === 'error' && (
                            <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                          )}
                          {alert.severity === 'warning' && (
                            <Clock className="w-4 h-4 text-yellow-500 mr-2" />
                          )}
                          {alert.severity === 'info' && (
                            <CheckCircle className="w-4 h-4 text-blue-500 mr-2" />
                          )}
                          <div>
                            <p className={`font-medium ${
                              alert.severity === 'error' 
                                ? 'text-red-800' 
                                : alert.severity === 'warning'
                                ? 'text-yellow-800'
                                : 'text-blue-800'
                            }`}>
                              {alert.message}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {alert.type === 'meal_overtime' && alert.startTime && (
                                `Inicio de comida: ${new Date(alert.startTime).toLocaleTimeString('es-MX')}`
                              )}
                              {alert.type === 'late_arrival' && alert.startTime && (
                                `Llegada: ${new Date(alert.startTime).toLocaleTimeString('es-MX')}`
                              )}
                              {alert.type === 'no_checkin' && alert.expectedTime && (
                                `Hora esperada: ${alert.expectedTime}`
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-xs">
                          {alert.type === 'meal_overtime' && (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                              +{alert.overtime}m extra
                            </span>
                          )}
                          {alert.type === 'late_arrival' && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              +{alert.minutesLate}m tarde
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded ${
                            alert.severity === 'error' 
                              ? 'bg-red-200 text-red-800' 
                              : alert.severity === 'warning'
                              ? 'bg-yellow-200 text-yellow-800'
                              : 'bg-blue-200 text-blue-800'
                          }`}>
                            {alert.type === 'meal_overtime' && 'Comida excedida'}
                            {alert.type === 'late_arrival' && 'Llegada tarde'}
                            {alert.type === 'no_checkin' && 'Sin check-in'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Estadísticas principales */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total empleados</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.active}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">Inactivos</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.total - data.stats.active}</p>
                </div>
                <UserX className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Top seller</p>
                  <p className="text-lg font-bold text-gray-900">
                    {data.topSellers[0]?.name || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {data.topSellers[0]?._count.sales || 0} ventas
                  </p>
                </div>
                <Award className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Nombre o email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Todos</option>
                <option value="ADMIN">Administrador</option>
                <option value="MANAGER">Gerente</option>
                <option value="EMPLOYEE">Empleado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filters.isActive}
                onChange={(e) => handleFilterChange('isActive', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="flex items-center text-gray-600 hover:text-gray-800 px-3 py-2 rounded"
              >
                <X className="w-4 h-4 mr-1" />
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Lista de empleados */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Lista de empleados
              </h3>
              {data && (
                <p className="text-sm text-gray-500">
                  {data.pagination.total} empleados encontrados
                </p>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Cargando empleados...</p>
              </div>
            ) : data?.users.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No se encontraron empleados</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ventas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha registro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.users.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {employee.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(employee.role)}`}>
                          {getRoleIcon(employee.role)}
                          <span className="ml-1">{employee.role}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          employee.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Activo
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3 mr-1" />
                              Inactivo
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                          {employee._count.sales} ventas
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(employee.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(employee)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar empleado"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openScheduleModal(employee)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Editar horario"
                          >
                            <CalendarClock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(employee)}
                            className="text-red-600 hover:text-red-900"
                            disabled={!employee.isActive}
                            title="Eliminar empleado"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Paginación */}
          {data && data.pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{((data.pagination.page - 1) * data.pagination.limit) + 1}</span> a{' '}
                    <span className="font-medium">
                      {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)}
                    </span> de{' '}
                    <span className="font-medium">{data.pagination.total}</span> resultados
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                    disabled={filters.page <= 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded">
                    {filters.page} / {data.pagination.pages}
                  </span>
                  <button
                    onClick={() => handleFilterChange('page', Math.min(data.pagination.pages, filters.page + 1))}
                    disabled={filters.page >= data.pagination.pages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de crear/editar empleado */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {showCreateModal ? 'Nuevo Empleado' : 'Editar Empleado'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña {showCreateModal ? '*' : '(dejar vacío para no cambiar)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required={showCreateModal}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="EMPLOYEE">Empleado</option>
                  <option value="MANAGER">Gerente</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Empleado activo
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                      Guardando...
                    </>
                  ) : (
                    showCreateModal ? 'Crear' : 'Actualizar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Horarios */}
      {showScheduleModal && scheduleEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Horario de {scheduleEmployee.name}
                </h2>
                <p className="text-sm text-gray-500">
                  Configura el horario semanal del empleado
                </p>
              </div>
              <button
                onClick={closeScheduleModal}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {loadingSchedule ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-600">Cargando horarios...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Días de la semana */}
                  {schedules.map((schedule) => {
                    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
                    return (
                      <div key={schedule.dayOfWeek} className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                          {/* Día */}
                          <div className="font-medium text-gray-900">
                            {dayNames[schedule.dayOfWeek]}
                          </div>

                          {/* Día libre checkbox */}
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`dayoff-${schedule.dayOfWeek}`}
                              checked={schedule.isDayOff}
                              onChange={(e) => handleScheduleChange(schedule.dayOfWeek, 'isDayOff', e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor={`dayoff-${schedule.dayOfWeek}`} className="ml-2 text-sm text-gray-700">
                              Día libre
                            </label>
                          </div>

                          {/* Hora de inicio */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Hora inicio
                            </label>
                            <input
                              type="time"
                              value={schedule.startTime || ''}
                              onChange={(e) => handleScheduleChange(schedule.dayOfWeek, 'startTime', e.target.value)}
                              disabled={schedule.isDayOff}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                          </div>

                          {/* Hora de fin */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Hora fin
                            </label>
                            <input
                              type="time"
                              value={schedule.endTime || ''}
                              onChange={(e) => handleScheduleChange(schedule.dayOfWeek, 'endTime', e.target.value)}
                              disabled={schedule.isDayOff}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Información adicional */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Clock className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
                      <div>
                        <h4 className="font-medium text-blue-900">Información sobre horarios</h4>
                        <ul className="text-sm text-blue-700 mt-1 space-y-1">
                          <li>• Los horarios se usan para medir la puntualidad del empleado</li>
                          <li>• Las horas trabajadas se calculan desde el check-in hasta el check-out</li>
                          <li>• Los días libres no requieren check-in/check-out</li>
                          <li>• Los cambios se aplican a partir de la fecha actual</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={closeScheduleModal}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                Cancelar
              </button>
              <button
                onClick={saveSchedule}
                disabled={savingSchedule || loadingSchedule}
                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {savingSchedule ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Horario
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}