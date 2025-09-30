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
      orderBy: { date: 'asc' },
      include: {
        updater: {
          select: { name: true, email: true }
        }
      }
    })

    // Si no hay horarios, crear horarios por defecto para la próxima semana (8:00-17:00, lunes a viernes)
    if (schedules.length === 0) {
      const defaultSchedules = []
      const today = new Date()
      const nextWeekStart = new Date(today)
      nextWeekStart.setDate(today.getDate() + (7 - today.getDay())) // Próximo lunes
      
      for (let day = 0; day < 7; day++) {
        const scheduleDate = new Date(nextWeekStart)
        scheduleDate.setDate(nextWeekStart.getDate() + day)
        
        const isWeekend = day === 0 || day === 6 // Domingo o sábado
        
        const schedule = await prisma.employeeSchedule.create({
          data: {
            userId: targetUserId,
            date: scheduleDate,
            startTime: isWeekend ? '00:00' : '08:00',
            endTime: isWeekend ? '00:00' : '17:00',
            notes: isWeekend ? 'Día libre' : null,
            updatedBy: decoded.userId
          },
          include: {
            updater: {
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
    if (!Array.isArray(schedules) || schedules.length === 0) {
      return NextResponse.json(
        { error: 'Debe proporcionar al menos un horario' },
        { status: 400 }
      )
    }

    // Validar formato de horarios
    for (const schedule of schedules) {
      if (!schedule.date) {
        return NextResponse.json(
          { error: 'Fecha es requerida para cada horario' },
          { status: 400 }
        )
      }
      
      if (!schedule.startTime || !schedule.endTime) {
        return NextResponse.json(
          { error: 'Hora de inicio y fin son requeridas' },
          { status: 400 }
        )
      }
      
      if (schedule.startTime !== '00:00' && schedule.endTime !== '00:00' && schedule.startTime >= schedule.endTime) {
        return NextResponse.json(
          { error: 'La hora de inicio debe ser anterior a la hora de fin' },
          { status: 400 }
        )
      }
    }

    // Actualizar horarios
    const updatedSchedules = []
    for (const schedule of schedules) {
      const scheduleDate = new Date(schedule.date)
      
      const updatedSchedule = await prisma.employeeSchedule.upsert({
        where: {
          userId_date: {
            userId: userId,
            date: scheduleDate
          }
        },
        create: {
          userId: userId,
          date: scheduleDate,
          startTime: schedule.startTime || '00:00',
          endTime: schedule.endTime || '00:00',
          notes: schedule.notes,
          updatedBy: decoded.userId
        },
        update: {
          startTime: schedule.startTime || '00:00',
          endTime: schedule.endTime || '00:00',
          notes: schedule.notes,
          updatedBy: decoded.userId,
          updatedAt: new Date()
        },
        include: {
          updater: {
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