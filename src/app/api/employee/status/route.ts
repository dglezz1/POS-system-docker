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
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buscar sesión activa
    const activeSession = await (prisma as any).workSession.findFirst({
      where: {
        userId: user.id,
        endTime: null
      },
      include: {
        breakSessions: {
          where: {
            endTime: null
          }
        }
      }
    });

    // Buscar la última sesión del día si no hay activa
    const todaySession = await (prisma as any).workSession.findFirst({
      where: {
        userId: user.id,
        dayDate: today
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        breakSessions: true
      }
    });

    // Determinar estado actual
    let status = 'not_checked_in';
    let currentSession = null;
    let activeBreak = null;
    let mealTakenToday = false;

    if (activeSession) {
      currentSession = activeSession;
      
      // Verificar si está en break activo
      const activeMealBreak = activeSession.breakSessions.find((b: any) => 
        b.breakType === 'meal' && !b.endTime
      );
      
      if (activeMealBreak) {
        status = 'on_meal_break';
        activeBreak = activeMealBreak;
      } else {
        status = 'working';
      }
    } else if (todaySession && todaySession.exitType === 'temporary') {
      status = 'temporary_exit';
      currentSession = todaySession;
    } else if (todaySession && todaySession.exitType === 'final') {
      status = 'finished';
      currentSession = todaySession;
    }

    // Verificar si ya tomó comida hoy
    if (todaySession) {
      mealTakenToday = todaySession.breakSessions.some((b: any) => b.breakType === 'meal');
    }

    // Calcular horas trabajadas hoy
    const todaySessions = await (prisma as any).workSession.findMany({
      where: {
        userId: user.id,
        dayDate: today
      },
      include: {
        breakSessions: true
      }
    });

    let totalHoursToday = 0;
    let totalNetHoursToday = 0;

    for (const session of todaySessions) {
      if (session.hoursWorked) {
        totalHoursToday += session.hoursWorked;
      }
      if (session.netHoursWorked) {
        totalNetHoursToday += session.netHoursWorked;
      }
    }

    // Calcular horas de la semana
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekSessions = await (prisma as any).workSession.findMany({
      where: {
        userId: user.id,
        dayDate: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      }
    });

    let totalHoursWeek = 0;
    let totalNetHoursWeek = 0;

    for (const session of weekSessions) {
      if (session.hoursWorked) {
        totalHoursWeek += session.hoursWorked;
      }
      if (session.netHoursWorked) {
        totalNetHoursWeek += session.netHoursWorked;
      }
    }

    // Verificar alertas de tiempo excedido
    const alerts = [];
    if (activeBreak && activeBreak.breakType === 'meal') {
      const now = new Date();
      const mealDuration = (now.getTime() - new Date(activeBreak.startTime).getTime()) / (1000 * 60);
      
      if (mealDuration > 60) {
        alerts.push({
          type: 'meal_overtime',
          message: `Has excedido tu tiempo de comida por ${Math.round(mealDuration - 60)} minutos`,
          severity: 'warning'
        });
      } else if (mealDuration > 50) {
        alerts.push({
          type: 'meal_warning',
          message: `Te quedan ${Math.round(60 - mealDuration)} minutos de comida`,
          severity: 'info'
        });
      }
    }

    return NextResponse.json({
      status,
      currentSession,
      activeBreak,
      mealTakenToday,
      hoursToday: {
        total: Math.round(totalHoursToday * 100) / 100,
        net: Math.round(totalNetHoursToday * 100) / 100
      },
      hoursWeek: {
        total: Math.round(totalHoursWeek * 100) / 100,
        net: Math.round(totalNetHoursWeek * 100) / 100
      },
      alerts
    });

  } catch (error) {
    console.error('Error en status:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}