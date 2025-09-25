import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Función para verificar el token y obtener usuario
async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    return user;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buscar empleados con breaks de comida activos que excedan el tiempo
    const activeBreaks = await (prisma as any).breakSession.findMany({
      where: {
        breakType: 'meal',
        endTime: null,
        workSession: {
          dayDate: today
        }
      },
      include: {
        workSession: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    const alerts = [];

    for (const breakSession of activeBreaks) {
      const mealDuration = (now.getTime() - new Date(breakSession.startTime).getTime()) / (1000 * 60);
      
      if (mealDuration > 60) {
        alerts.push({
          id: breakSession.id,
          type: 'meal_overtime',
          severity: 'warning',
          employee: breakSession.workSession.user,
          message: `${breakSession.workSession.user.name} ha excedido su tiempo de comida por ${Math.round(mealDuration - 60)} minutos`,
          startTime: breakSession.startTime,
          duration: Math.round(mealDuration),
          overtime: Math.round(mealDuration - 60),
          workSessionId: breakSession.workSessionId
        });
      }
    }

    // Buscar empleados que llegaron tarde hoy
    const lateSessions = await (prisma as any).workSession.findMany({
      where: {
        dayDate: today,
        isOnTime: false,
        sessionNumber: 1 // Solo la primera sesión del día
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
    });

    for (const session of lateSessions) {
      if (session.minutesLate > 15) { // Alertar si llega más de 15 minutos tarde
        alerts.push({
          id: `late_${session.id}`,
          type: 'late_arrival',
          severity: session.minutesLate > 30 ? 'error' : 'warning',
          employee: session.user,
          message: `${session.user.name} llegó ${session.minutesLate} minutos tarde`,
          startTime: session.startTime,
          minutesLate: session.minutesLate,
          workSessionId: session.id
        });
      }
    }

    // Buscar empleados que no han hecho check-in hoy
    const expectedEmployees = await prisma.user.findMany({
      where: {
        role: 'EMPLOYEE',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    const employeesCheckedIn = await (prisma as any).workSession.findMany({
      where: {
        dayDate: today,
        sessionNumber: 1
      },
      select: {
        userId: true
      }
    });

    const checkedInIds = employeesCheckedIn.map((s: any) => s.userId);
    const currentHour = now.getHours();

    // Solo alertar después de las 9 AM sobre empleados que no han llegado
    if (currentHour >= 9) {
      for (const employee of expectedEmployees) {
        if (!checkedInIds.includes(employee.id)) {
          alerts.push({
            id: `no_checkin_${employee.id}`,
            type: 'no_checkin',
            severity: currentHour >= 10 ? 'error' : 'warning',
            employee,
            message: `${employee.name} no ha hecho check-in hoy`,
            expectedTime: '08:00 AM'
          });
        }
      }
    }

    // Ordenar alertas por severidad (error, warning, info)
    alerts.sort((a, b) => {
      const severityOrder: { [key: string]: number } = { error: 3, warning: 2, info: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    return NextResponse.json({
      alerts,
      summary: {
        total: alerts.length,
        errors: alerts.filter(a => a.severity === 'error').length,
        warnings: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length
      }
    });

  } catch (error) {
    console.error('Error en alertas admin:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}