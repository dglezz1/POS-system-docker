'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Clock, 
  Play, 
  Pause, 
  Square, 
  Coffee, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Users,
  Timer,
  LogIn,
  LogOut,
  MoreVertical
} from 'lucide-react'
import { PermissionGuard } from '@/hooks/usePermissions'
import ProtectedRoute from '@/components/ProtectedRoute'

interface WorkSession {
  id: number
  userId: number
  startTime: string
  endTime: string | null
  hoursWorked: number | null
  isOnTime: boolean
  user: {
    id: number
    name: string
    email: string
  }
  breakSessions: Array<{
    id: number
    startTime: string
    endTime: string | null
    breakType: string
  }>
}

interface Employee {
  id: number
  name: string
  email: string
}

export default function WorkSessionsPage() {
  return (
    <ProtectedRoute>
      <PermissionGuard permission="canAccessAdmin">
        <WorkSessionsContent />
      </PermissionGuard>
    </ProtectedRoute>
  )
}

function WorkSessionsContent() {
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([])
  const [activeEmployees, setActiveEmployees] = useState<WorkSession[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
    loadWorkSessions()
    loadEmployees()
  }, [selectedDate])

  const loadWorkSessions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/work-sessions?date=${selectedDate}`)
      if (response.ok) {
        const data = await response.json()
        setWorkSessions(Array.isArray(data.workSessions) ? data.workSessions : [])
        setActiveEmployees(Array.isArray(data.activeEmployees) ? data.activeEmployees : [])
      }
    } catch (error) {
      console.error('Error loading work sessions:', error)
      setWorkSessions([])
      setActiveEmployees([])
    } finally {
      setLoading(false)
    }
  }

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/users?role=EMPLOYEE')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.users || [])
      }
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  const handleCheckIn = async (employeeId?: number) => {
    try {
      const response = await fetch('/api/admin/work-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'checkin',
          employeeId
        })
      })

      if (response.ok) {
        await loadWorkSessions()
      } else {
        const data = await response.json()
        alert(data.error || 'Error en check-in')
      }
    } catch (error) {
      console.error('Error in check-in:', error)
    }
  }

  const handleCheckOut = async (employeeId?: number) => {
    try {
      const response = await fetch('/api/admin/work-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'checkout',
          employeeId
        })
      })

      if (response.ok) {
        await loadWorkSessions()
      } else {
        const data = await response.json()
        alert(data.error || 'Error en check-out')
      }
    } catch (error) {
      console.error('Error in check-out:', error)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}h ${m}m`
  }

  const getCurrentSessionDuration = (startTime: string) => {
    const start = new Date(startTime)
    const now = new Date()
    const hours = (now.getTime() - start.getTime()) / (1000 * 60 * 60)
    return formatDuration(hours)
  }

  const isEmployeeActive = (employeeId: number) => {
    return (activeEmployees || []).some(session => session.userId === employeeId)
  }

  const getActiveSession = (employeeId: number) => {
    return (activeEmployees || []).find(session => session.userId === employeeId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Cargando jornadas laborales...</p>
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
                <div className="bg-blue-500 p-2 rounded-lg mr-3">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Control de Jornadas Laborales
                  </h1>
                  <p className="text-xs text-gray-500">
                    Check-in/out y control de tiempo
                  </p>
                </div>
              </div>
            </div>

            {/* Selector de fecha */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Empleados activos */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-green-500" />
            Empleados Activos ({(activeEmployees || []).length})
          </h2>
          
          {(activeEmployees || []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(activeEmployees || []).map((session) => (
                <div key={session.id} className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{session.user.name}</h3>
                      <p className="text-sm text-gray-500">{session.user.email}</p>
                    </div>
                    <div className="flex items-center text-green-600">
                      <Play className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">Activo</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Entrada:</span>
                      <span className="font-medium">{formatTime(session.startTime)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tiempo trabajado:</span>
                      <span className="font-medium text-blue-600">
                        {getCurrentSessionDuration(session.startTime)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Puntualidad:</span>
                      <span className={`font-medium ${session.isOnTime ? 'text-green-600' : 'text-red-600'}`}>
                        {session.isOnTime ? 'A tiempo' : 'Tardanza'}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleCheckOut(session.userId)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Check-out
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <Timer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay empleados trabajando actualmente</p>
            </div>
          )}
        </div>

        {/* Panel de control rápido */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <LogIn className="w-5 h-5 mr-2 text-blue-500" />
            Control Rápido
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((employee) => {
              const isActive = isEmployeeActive(employee.id)
              const activeSession = getActiveSession(employee.id)
              
              return (
                <div key={employee.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{employee.name}</h4>
                      <p className="text-sm text-gray-500">{employee.email}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </div>
                  
                  {isActive && activeSession ? (
                    <div className="space-y-2 mb-3">
                      <div className="text-xs text-gray-600">
                        Desde: {formatTime(activeSession.startTime)}
                      </div>
                      <div className="text-xs text-blue-600 font-medium">
                        {getCurrentSessionDuration(activeSession.startTime)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 mb-3">
                      Sin jornada activa
                    </div>
                  )}
                  
                  <button
                    onClick={() => isActive ? handleCheckOut(employee.id) : handleCheckIn(employee.id)}
                    disabled={loading}
                    className={`w-full font-medium py-2 px-3 rounded-lg text-sm flex items-center justify-center ${
                      isActive 
                        ? 'bg-red-100 hover:bg-red-200 text-red-700' 
                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                    } disabled:opacity-50`}
                  >
                    {isActive ? (
                      <>
                        <LogOut className="w-4 h-4 mr-1" />
                        Check-out
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-1" />
                        Check-in
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Historial del día */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-purple-500" />
            Historial del {new Date(selectedDate).toLocaleDateString('es-MX', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          
          {workSessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Empleado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Entrada</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Salida</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Horas</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Puntualidad</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {workSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{session.user.name}</p>
                          <p className="text-sm text-gray-500">{session.user.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {formatTime(session.startTime)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {session.endTime ? formatTime(session.endTime) : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {session.hoursWorked ? formatDuration(session.hoursWorked) : 
                         session.endTime ? '-' : getCurrentSessionDuration(session.startTime)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          session.isOnTime 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {session.isOnTime ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              A tiempo
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Tardanza
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          session.endTime 
                            ? 'bg-gray-100 text-gray-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {session.endTime ? (
                            <>
                              <Square className="w-3 h-3 mr-1" />
                              Completada
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 mr-1" />
                              Activa
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay registros para esta fecha</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}