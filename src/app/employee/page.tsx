'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Clock, 
  Play, 
  Pause, 
  Square, 
  Coffee, 
  LogIn,
  LogOut,
  Timer,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  ArrowLeft,
  CalendarClock,
  Eye,
  X
} from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'

interface WorkSession {
  id: number
  sessionType: string
  startTime: string
  endTime: string | null
  hoursWorked: number | null
  isOnTime: boolean
  minutesLate: number
  sessionNumber: number
  dayDate: string
  breakSessions: Array<{
    id: number
    breakType: string
    startTime: string
    endTime: string | null
    duration: number | null
    isOvertime: boolean
    maxAllowed: number
  }>
}

interface EmployeeStatus {
  status: string // 'not_checked_in', 'working', 'on_meal_break', 'temporary_exit', 'finished'
  currentSession: WorkSession | null
  activeBreak: any | null
  mealTakenToday: boolean
  hoursToday: {
    total: number
    net: number
  }
  hoursWeek: {
    total: number
    net: number
  }
  alerts: Array<{
    type: string
    message: string
    severity: string
  }>
}

export default function EmployeePanelPage() {
  return (
    <ProtectedRoute>
      <EmployeePanelContent />
    </ProtectedRoute>
  )
}

function EmployeePanelContent() {
  const { user } = useAuth()
  const [status, setStatus] = useState<EmployeeStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [schedules, setSchedules] = useState<any[]>([])
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [loadingSchedule, setLoadingSchedule] = useState(false)

  useEffect(() => {
    loadEmployeeStatus()
    
    // Actualizar la hora cada segundo
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const loadEmployeeStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/employee/status')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Error loading employee status:', error)
    } finally {
      setLoading(false)
    }
  }

  // Funciones para gestión de horarios
  const loadEmployeeSchedule = async () => {
    try {
      setLoadingSchedule(true)
      const response = await fetch('/api/employees/schedule')
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

  const openScheduleModal = () => {
    setShowScheduleModal(true)
    loadEmployeeSchedule()
  }

  const closeScheduleModal = () => {
    setShowScheduleModal(false)
    setSchedules([])
  }

  const getTodaySchedule = () => {
    const today = new Date().getDay() // 0 = Domingo, 1 = Lunes, ...
    return schedules.find(s => s.dayOfWeek === today)
  }

  const handleCheckIn = async () => {
    try {
      const response = await fetch('/api/employee/clock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'checkin' })
      })

      if (response.ok) {
        await loadEmployeeStatus()
      } else {
        const data = await response.json()
        alert(data.error || 'Error en check-in')
      }
    } catch (error) {
      console.error('Error in check-in:', error)
    }
  }

  const handleCheckOut = async (exitType: string = 'final') => {
    try {
      const response = await fetch('/api/employee/clock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'checkout',
          exitType 
        })
      })

      if (response.ok) {
        await loadEmployeeStatus()
      } else {
        const data = await response.json()
        alert(data.error || 'Error en check-out')
      }
    } catch (error) {
      console.error('Error in check-out:', error)
    }
  }

  const handleReturnFromBreak = async () => {
    try {
      const response = await fetch('/api/employee/clock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'return_from_break' })
      })

      if (response.ok) {
        await loadEmployeeStatus()
      } else {
        const data = await response.json()
        alert(data.error || 'Error al regresar')
      }
    } catch (error) {
      console.error('Error returning from break:', error)
    }
  }


  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getCurrentSessionDuration = () => {
    if (!status?.currentSession) return '0h 0m'
    
    const start = new Date(status.currentSession.startTime)
    const now = new Date()
    const hours = (now.getTime() - start.getTime()) / (1000 * 60 * 60)
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}h ${m}m`
  }

  const getCurrentBreakDuration = () => {
    if (!status?.activeBreak) return '0m'
    
    const start = new Date(status.activeBreak.startTime)
    const now = new Date()
    const minutes = (now.getTime() - start.getTime()) / (1000 * 60)
    return `${Math.round(minutes)}m`
  }

  const getBreakTimeRemaining = () => {
    if (!status?.activeBreak) return 0
    
    const start = new Date(status.activeBreak.startTime)
    const now = new Date()
    const elapsed = (now.getTime() - start.getTime()) / (1000 * 60)
    const remaining = Math.max(0, (status.activeBreak.maxAllowed || 60) - elapsed)
    return Math.round(remaining)
  }

  const isBreakOvertime = () => {
    return getBreakTimeRemaining() === 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Cargando panel de empleado...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Debes estar logueado para acceder</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link 
                href="/" 
                className="flex items-center text-gray-600 hover:text-gray-800 mr-6"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="text-sm">Volver al Sistema</span>
              </Link>
              <div className="bg-blue-500 p-2 rounded-lg mr-3">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Panel de Empleado
                </h1>
                <p className="text-xs text-gray-500">
                  ¡Hola {user.name}! - {currentTime.toLocaleDateString('es-MX', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {/* Reloj en tiempo real y botón horarios */}
            <div className="text-right space-y-3">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {currentTime.toLocaleTimeString('es-MX', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                  })}
                </div>
                <div className="text-sm text-gray-500">
                  Hora actual
                </div>
              </div>
              
              <button
                onClick={openScheduleModal}
                className="inline-flex items-center px-3 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <CalendarClock className="w-4 h-4 mr-2" />
                Ver Mi Horario
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Estado actual */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Panel de control principal */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Timer className="w-5 h-5 mr-2 text-blue-500" />
              Control de Jornada
            </h3>

            {/* Mostrar alertas */}
            {status?.alerts && status.alerts.length > 0 && (
              <div className="mb-4">
                {status.alerts.map((alert, index) => (
                  <div key={index} className={`p-3 rounded-lg mb-2 ${
                    alert.severity === 'warning' 
                      ? 'bg-red-50 border border-red-200 text-red-800'
                      : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                  }`}>
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">{alert.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {status?.status === 'working' || status?.status === 'on_meal_break' ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-800 font-medium flex items-center">
                      <Play className="w-4 h-4 mr-1" />
                      {status.status === 'on_meal_break' ? 'En Comida' : 'Trabajando'}
                    </span>
                    <span className="text-green-600 text-sm">
                      Sesión #{status.currentSession?.sessionNumber || 1}
                    </span>
                  </div>
                  <div className="text-sm text-green-700">
                    Desde: {status.currentSession ? formatTime(status.currentSession.startTime) : '-'}
                  </div>
                  <div className="text-lg font-bold text-green-800 mt-2">
                    {getCurrentSessionDuration()}
                  </div>
                </div>

                {status.status === 'on_meal_break' && status.activeBreak ? (
                  <div className={`border rounded-lg p-4 ${
                    isBreakOvertime() 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-medium flex items-center ${
                        isBreakOvertime() ? 'text-red-800' : 'text-yellow-800'
                      }`}>
                        <Coffee className="w-4 h-4 mr-1" />
                        En Comida
                      </span>
                      {isBreakOvertime() && (
                        <span className="text-red-600 text-xs font-medium">
                          TIEMPO EXCEDIDO
                        </span>
                      )}
                    </div>
                    <div className={`text-sm ${
                      isBreakOvertime() ? 'text-red-700' : 'text-yellow-700'
                    }`}>
                      Duración: {getCurrentBreakDuration()}
                      {!isBreakOvertime() && (
                        <span className="ml-2">
                          (Quedan {getBreakTimeRemaining()}m)
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleReturnFromBreak}
                      className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Terminar Comida
                    </button>
                  </div>
                ) : status.status === 'working' && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleCheckOut('meal')}
                      disabled={status.mealTakenToday}
                      className="bg-orange-100 hover:bg-orange-200 text-orange-700 font-medium py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Coffee className="w-4 h-4 mr-2" />
                      {status.mealTakenToday ? 'Comida tomada' : 'Ir a Comida'}
                    </button>
                    <button
                      onClick={() => handleCheckOut('temporary')}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-3 px-4 rounded-lg flex items-center justify-center"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Salida Temporal
                    </button>
                  </div>
                )}

                <button
                  onClick={() => handleCheckOut('final')}
                  disabled={status.status === 'on_meal_break'}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Salida Final
                </button>
              </div>
            ) : status?.status === 'temporary_exit' ? (
              <div className="text-center">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
                  <Pause className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                  <p className="text-blue-800 font-medium mb-2">En Salida Temporal</p>
                  <p className="text-blue-600 text-sm mb-4">
                    Puedes regresar cuando estés listo
                  </p>
                </div>
                
                <button
                  onClick={handleReturnFromBreak}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Regresar al Trabajo
                </button>
              </div>
            ) : status?.status === 'finished' ? (
              <div className="text-center">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
                  <CheckCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-700 font-medium mb-2">Jornada Finalizada</p>
                  <p className="text-gray-600 text-sm mb-4">
                    Has completado tu jornada laboral de hoy
                  </p>
                </div>
                
                <button
                  onClick={handleCheckIn}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Nueva Sesión
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">
                    No has iniciado tu jornada hoy
                  </p>
                </div>
                
                <button
                  onClick={handleCheckIn}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Check-in
                </button>
              </div>
            )}
          </div>

          {/* Resumen del día */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-purple-500" />
              Resumen de Hoy
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-700 font-medium">Horas trabajadas hoy:</span>
                <span className="text-blue-900 font-bold">
                  {status?.hoursToday ? `${status.hoursToday.total.toFixed(1)}h` : '0h'}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-green-700 font-medium">Horas netas (sin comida):</span>
                <span className="text-green-900 font-bold">
                  {status?.hoursToday ? `${status.hoursToday.net.toFixed(1)}h` : '0h'}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-purple-700 font-medium">Horas esta semana:</span>
                <span className="text-purple-900 font-bold">
                  {status?.hoursWeek ? `${status.hoursWeek.net.toFixed(1)}h` : '0h'}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">Estado:</span>
                <span className={`font-bold ${
                  status?.status === 'working'
                    ? 'text-green-600'
                    : status?.status === 'on_meal_break'
                    ? 'text-yellow-600'
                    : status?.status === 'temporary_exit'
                    ? 'text-blue-600'
                    : status?.status === 'finished'
                    ? 'text-gray-600'
                    : 'text-gray-600'
                }`}>
                  {status?.status === 'working' && 'Trabajando'}
                  {status?.status === 'on_meal_break' && 'En Comida'}
                  {status?.status === 'temporary_exit' && 'Salida Temporal'}
                  {status?.status === 'finished' && 'Finalizado'}
                  {status?.status === 'not_checked_in' && 'Sin Check-in'}
                </span>
              </div>

              {/* Información del horario de hoy */}
              {(() => {
                const todaySchedule = getTodaySchedule()
                if (todaySchedule) {
                  return (
                    <div className="p-3 bg-indigo-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-indigo-700 font-medium flex items-center">
                          <CalendarClock className="w-4 h-4 mr-2" />
                          Horario de hoy
                        </span>
                      </div>
                      {todaySchedule.isDayOff ? (
                        <span className="text-indigo-900 font-bold">Día libre</span>
                      ) : (
                        <span className="text-indigo-900 font-bold">
                          {todaySchedule.startTime} - {todaySchedule.endTime}
                        </span>
                      )}
                    </div>
                  )
                }
                return null
              })()}

              {status?.currentSession?.isOnTime === false && (
                <div className="flex items-center p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                  <span className="text-red-700 text-sm">
                    Llegada con {status?.currentSession?.minutesLate || 0} min de retraso
                  </span>
                </div>
              )}

              {status?.mealTakenToday && (
                <div className="flex items-center p-3 bg-orange-50 rounded-lg">
                  <Coffee className="w-4 h-4 text-orange-500 mr-2" />
                  <span className="text-orange-700 text-sm">
                    Ya tomaste tu hora de comida hoy
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de visualización de horarios */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Mi Horario Semanal
                </h2>
                <p className="text-sm text-gray-500">
                  Consulta tu horario de trabajo asignado
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
                  <Clock className="w-8 h-8 animate-pulse text-blue-500" />
                  <span className="ml-2 text-gray-600">Cargando horarios...</span>
                </div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarClock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No tienes horarios asignados</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Contacta al administrador para configurar tu horario
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Horario semanal */}
                  {schedules.map((schedule) => {
                    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
                    const today = new Date().getDay()
                    const isToday = schedule.dayOfWeek === today
                    
                    return (
                      <div 
                        key={schedule.dayOfWeek} 
                        className={`p-4 rounded-lg border-2 ${
                          isToday 
                            ? 'border-blue-200 bg-blue-50' 
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className={`font-semibold ${isToday ? 'text-blue-900' : 'text-gray-900'}`}>
                              {dayNames[schedule.dayOfWeek]}
                              {isToday && (
                                <span className="ml-2 px-2 py-1 text-xs bg-blue-200 text-blue-800 rounded-full">
                                  Hoy
                                </span>
                              )}
                            </span>
                          </div>
                          
                          <div className={`text-sm ${isToday ? 'text-blue-800' : 'text-gray-700'}`}>
                            {schedule.isDayOff ? (
                              <span className="flex items-center">
                                <Eye className="w-4 h-4 mr-1" />
                                Día libre
                              </span>
                            ) : (
                              <span className="font-medium">
                                {schedule.startTime} - {schedule.endTime}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {isToday && !schedule.isDayOff && (
                          <div className="mt-2 text-xs text-blue-700">
                            <Clock className="w-3 h-3 inline mr-1" />
                            Tu horario para hoy
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Información adicional */}
                  <div className="mt-6 bg-gray-100 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Información importante
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Los horarios son de referencia para medir puntualidad</li>
                      <li>• Las horas trabajadas se cuentan desde check-in hasta check-out</li>
                      <li>• Puedes hacer check-in antes o después de tu horario asignado</li>
                      <li>• Si necesitas cambios en tu horario, contacta al administrador</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={closeScheduleModal}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}