import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const status = searchParams.get('status')

    // Convertir fecha a rango de día
    const selectedDate = new Date(date)
    selectedDate.setHours(0, 0, 0, 0)
    
    const nextDay = new Date(selectedDate)
    nextDay.setDate(selectedDate.getDate() + 1)

    let whereClause: any = {
      startTime: {
        gte: selectedDate,
        lt: nextDay
      }
    }

    if (employeeId) {
      whereClause.userId = employeeId
    }

    if (status === 'active') {
      whereClause.endTime = null
    }

    // Obtener sesiones de trabajo del día
    const workSessions = await prisma.workSession.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        breakSessions: true
      },
      orderBy: {
        startTime: 'desc'
      }
    })

    // Obtener empleados activos (sesiones sin endTime)
    const activeEmployees = await prisma.workSession.findMany({
      where: {
        endTime: null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        breakSessions: {
          where: {
            endTime: null
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    })

    // Calcular estadísticas
    const stats = {
      activeEmployees: activeEmployees.length,
      totalHoursToday: workSessions
        .filter(session => session.endTime)
        .reduce((total, session) => {
          const hours = (session.endTime!.getTime() - session.startTime.getTime()) / (1000 * 60 * 60)
          return total + hours
        }, 0),
      punctualityRate: workSessions.length > 0 
        ? (workSessions.filter(s => s.isOnTime).length / workSessions.length) * 100 
        : 100
    }

    return NextResponse.json({
      workSessions,
      activeEmployees,
      stats
    })

  } catch (error) {
    console.error('Error fetching work sessions:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, employeeId, notes } = body

    if (!employeeId) {
      return NextResponse.json(
        { error: 'ID de empleado requerido' },
        { status: 400 }
      )
    }

    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (action === 'check-in') {
      // Verificar si ya tiene una sesión activa
      const activeSession = await prisma.workSession.findFirst({
        where: {
          userId: employeeId,
          endTime: null
        }
      })

      if (activeSession) {
        return NextResponse.json(
          { error: 'El empleado ya tiene una sesión activa' },
          { status: 400 }
        )
      }

      // Contar sesiones del día para determinar el número de sesión
      const todaySessions = await prisma.workSession.count({
        where: {
          userId: employeeId,
          dayDate: today
        }
      })

      // Crear nueva sesión
      const session = await prisma.workSession.create({
        data: {
          userId: employeeId,
          startTime: now,
          dayDate: today,
          weekNumber: getWeekNumber(now),
          yearNumber: now.getFullYear(),
          sessionNumber: todaySessions + 1,
          notes
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      return NextResponse.json({
        message: 'Check-in registrado exitosamente',
        session
      })
    }

    if (action === 'check-out') {
      // Buscar sesión activa
      const activeSession = await prisma.workSession.findFirst({
        where: {
          userId: employeeId,
          endTime: null
        }
      })

      if (!activeSession) {
        return NextResponse.json(
          { error: 'No se encontró sesión activa para este empleado' },
          { status: 404 }
        )
      }

      // Terminar breaks activos
      await prisma.breakSession.updateMany({
        where: {
          workSessionId: activeSession.id,
          endTime: null
        },
        data: {
          endTime: now,
          duration: {
            // Calcular duración en minutos
          }
        }
      })

      // Calcular horas trabajadas
      const hoursWorked = (now.getTime() - activeSession.startTime.getTime()) / (1000 * 60 * 60)

      // Actualizar sesión
      const updatedSession = await prisma.workSession.update({
        where: { id: activeSession.id },
        data: {
          endTime: now,
          hoursWorked: hoursWorked,
          netHoursWorked: hoursWorked, // Se podría calcular descontando breaks
          notes: notes || activeSession.notes
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      return NextResponse.json({
        message: 'Check-out registrado exitosamente',
        session: updatedSession
      })
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error in work session operation:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Función auxiliar para calcular número de semana
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / (1000 * 60 * 60 * 24)
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}