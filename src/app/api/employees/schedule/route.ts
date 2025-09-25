import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

// GET - Obtener horarios de un empleado
export async function GET(request: NextRequest) {
  try {
    // Obtener usuario autenticado
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido' },
        { status: 401 }
      )
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    const decoded = jwt.verify(token, JWT_SECRET) as any

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Si no se especifica userId, devolver horarios del usuario actual
    const targetUserId = userId || decoded.userId

    // Solo admin puede ver horarios de otros usuarios
    if (userId && decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para ver horarios de otros empleados' },
        { status: 403 }
      )
    }

    const schedules = await prisma.employeeSchedule.findMany({
      where: { userId: targetUserId },
      orderBy: { dayOfWeek: 'asc' },
      include: {
        updatedByUser: {
          select: { name: true, email: true }
        }
      }
    })

    // Si no hay horarios, crear horarios por defecto (8:00-17:00, lunes a viernes)
    if (schedules.length === 0) {
      const defaultSchedules = []
      for (let day = 0; day <= 6; day++) {
        const schedule = await prisma.employeeSchedule.create({
          data: {
            userId: targetUserId,
            dayOfWeek: day,
            startTime: day >= 1 && day <= 5 ? '08:00' : null, // Lunes a viernes
            endTime: day >= 1 && day <= 5 ? '17:00' : null,
            isDayOff: day === 0 || day === 6, // Sábado y domingo libres
            updatedBy: decoded.userId
          },
          include: {
            updatedByUser: {
              select: { name: true, email: true }
            }
          }
        })
        defaultSchedules.push(schedule)
      }
      return NextResponse.json(defaultSchedules)
    }

    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Error fetching employee schedules:', error)
    return NextResponse.json(
      { error: 'Error al obtener horarios del empleado' },
      { status: 500 }
    )
  }
}

// POST - Crear/actualizar horarios de un empleado
export async function POST(request: NextRequest) {
  try {
    // Obtener usuario autenticado
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido' },
        { status: 401 }
      )
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    const decoded = jwt.verify(token, JWT_SECRET) as any

    const body = await request.json()
    const { userId, schedules } = body

    // Verificar permisos
    const canEditSchedules = await checkScheduleEditPermissions(decoded, userId)
    if (!canEditSchedules) {
      return NextResponse.json(
        { error: 'No tienes permisos para editar horarios' },
        { status: 403 }
      )
    }

    // Validar datos
    if (!Array.isArray(schedules) || schedules.length !== 7) {
      return NextResponse.json(
        { error: 'Debe proporcionar horarios para los 7 días de la semana' },
        { status: 400 }
      )
    }

    // Validar formato de horarios
    for (const schedule of schedules) {
      if (schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6) {
        return NextResponse.json(
          { error: 'Día de la semana inválido' },
          { status: 400 }
        )
      }
      
      if (!schedule.isDayOff) {
        if (!schedule.startTime || !schedule.endTime) {
          return NextResponse.json(
            { error: 'Hora de inicio y fin son requeridas para días laborales' },
            { status: 400 }
          )
        }
        
        if (schedule.startTime >= schedule.endTime) {
          return NextResponse.json(
            { error: 'La hora de inicio debe ser anterior a la hora de fin' },
            { status: 400 }
          )
        }
      }
    }

    // Actualizar horarios
    const updatedSchedules = []
    for (const schedule of schedules) {
      const updatedSchedule = await prisma.employeeSchedule.upsert({
        where: {
          userId_dayOfWeek: {
            userId: userId,
            dayOfWeek: schedule.dayOfWeek
          }
        },
        create: {
          userId: userId,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.isDayOff ? null : schedule.startTime,
          endTime: schedule.isDayOff ? null : schedule.endTime,
          isDayOff: schedule.isDayOff,
          updatedBy: decoded.userId
        },
        update: {
          startTime: schedule.isDayOff ? null : schedule.startTime,
          endTime: schedule.isDayOff ? null : schedule.endTime,
          isDayOff: schedule.isDayOff,
          updatedBy: decoded.userId,
          updatedAt: new Date()
        },
        include: {
          updatedByUser: {
            select: { name: true, email: true }
          }
        }
      })
      updatedSchedules.push(updatedSchedule)
    }

    return NextResponse.json(updatedSchedules)
  } catch (error) {
    console.error('Error updating employee schedules:', error)
    return NextResponse.json(
      { error: 'Error al actualizar horarios del empleado' },
      { status: 500 }
    )
  }
}

// Función helper para verificar permisos de edición de horarios
async function checkScheduleEditPermissions(decoded: any, targetUserId: string) {
  // Admins siempre pueden editar
  if (decoded.role === 'ADMIN') {
    return true
  }

  // Verificar si el empleado puede editar su propio horario
  if (decoded.userId === targetUserId) {
    // Verificar configuración del sistema
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'employees_can_edit_schedule' }
    })
    
    if (config && config.value === 'true') {
      return true
    }
  }

  return false
}