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

// Función para calcular número de semana
function getWeekNumber(date: Date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { action, exitType } = await request.json();
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (action === 'checkin') {
      // Verificar si ya tiene una sesión activa
      const activeSession = await (prisma as any).workSession.findFirst({
        where: {
          userId: user.id,
          endTime: null
        }
      });

      if (activeSession) {
        return NextResponse.json(
          { error: 'Ya tienes una sesión activa' },
          { status: 400 }
        );
      }

      // Contar sesiones del día para determinar el número de sesión
      const todaySessionsCount = await (prisma as any).workSession.count({
        where: {
          userId: user.id,
          dayDate: today
        }
      });

      const sessionNumber = todaySessionsCount + 1;

      // Determinar si llegó tarde (asumiendo horario de 8:00 AM para primera sesión)
      let isOnTime = true;
      let minutesLate = 0;

      if (sessionNumber === 1) {
        const expectedStart = new Date(today);
        expectedStart.setHours(8, 0, 0, 0); // 8:00 AM

        if (now > expectedStart) {
          isOnTime = false;
          minutesLate = Math.round((now.getTime() - expectedStart.getTime()) / (1000 * 60));
        }
      }

      // Calcular número de semana y año
      const weekNumber = getWeekNumber(now);
      const yearNumber = now.getFullYear();

      // Crear nueva sesión
      const workSession = await (prisma as any).workSession.create({
        data: {
          userId: user.id,
          sessionType: 'work',
          startTime: now,
          dayDate: today,
          sessionNumber,
          isOnTime,
          minutesLate,
          weekNumber,
          yearNumber
        }
      });

      return NextResponse.json({
        message: 'Check-in exitoso',
        workSession
      });

    } else if (action === 'checkout') {
      // Buscar sesión activa
      const activeSession = await (prisma as any).workSession.findFirst({
        where: {
          userId: user.id,
          endTime: null
        }
      });

      if (!activeSession) {
        return NextResponse.json(
          { error: 'No hay sesión activa para cerrar' },
          { status: 400 }
        );
      }

      // Validar tipo de salida
      const validExitTypes = ['temporary', 'meal', 'final'];
      if (!exitType || !validExitTypes.includes(exitType)) {
        return NextResponse.json(
          { error: 'Tipo de salida no válido. Use: temporary, meal, final' },
          { status: 400 }
        );
      }

      // Validaciones específicas para hora de comida
      if (exitType === 'meal') {
        // Verificar si ya tomó comida hoy
        const mealBreakToday = await (prisma as any).breakSession.findFirst({
          where: {
            workSession: {
              userId: user.id,
              dayDate: today
            },
            breakType: 'meal'
          }
        });

        if (mealBreakToday) {
          return NextResponse.json(
            { error: 'Ya has tomado tu hora de comida hoy' },
            { status: 400 }
          );
        }

        // Crear sesión de break para comida
        await (prisma as any).breakSession.create({
          data: {
            workSessionId: activeSession.id,
            breakType: 'meal',
            startTime: now,
            maxAllowed: 60, // 1 hora máximo
            isPaid: false
          }
        });

        return NextResponse.json({
          message: 'Inicio de hora de comida registrado',
          breakType: 'meal',
          startTime: now
        });
      }

      // Para salida temporal
      if (exitType === 'temporary') {
        // Cerrar breaks activos primero
        await (prisma as any).breakSession.updateMany({
          where: {
            workSessionId: activeSession.id,
            endTime: null
          },
          data: {
            endTime: now
          }
        });

        // Actualizar sesión con salida temporal
        await (prisma as any).workSession.update({
          where: { id: activeSession.id },
          data: {
            exitType: 'temporary',
            endTime: now
          }
        });

        return NextResponse.json({
          message: 'Salida temporal registrada',
          exitType: 'temporary'
        });
      }

      // Para salida final del día
      if (exitType === 'final') {
        // Cerrar breaks activos
        const activeBreaks = await (prisma as any).breakSession.findMany({
          where: {
            workSessionId: activeSession.id,
            endTime: null
          }
        });

        for (const breakSession of activeBreaks) {
          const breakDuration = (now.getTime() - new Date(breakSession.startTime).getTime()) / (1000 * 60);
          await (prisma as any).breakSession.update({
            where: { id: breakSession.id },
            data: {
              endTime: now,
              duration: Math.round(breakDuration),
              isOvertime: breakDuration > breakSession.maxAllowed,
              overtimeMinutes: Math.max(0, Math.round(breakDuration - breakSession.maxAllowed))
            }
          });
        }

        // Calcular horas trabajadas
        const startTime = new Date(activeSession.startTime);
        const totalMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60);
        const hoursWorked = totalMinutes / 60;

        // Calcular tiempo de comida para descontar
        const mealBreaks = await (prisma as any).breakSession.findMany({
          where: {
            workSessionId: activeSession.id,
            breakType: 'meal'
          }
        });

        let totalMealTime = 0;
        for (const meal of mealBreaks) {
          if (meal.duration) {
            totalMealTime += meal.duration;
          }
        }

        const netHoursWorked = (totalMinutes - totalMealTime) / 60;

        // Actualizar sesión final
        const updatedSession = await (prisma as any).workSession.update({
          where: { id: activeSession.id },
          data: {
            exitType: 'final',
            endTime: now,
            hoursWorked: Math.round(hoursWorked * 100) / 100,
            netHoursWorked: Math.round(netHoursWorked * 100) / 100
          }
        });

        return NextResponse.json({
          message: 'Jornada laboral finalizada',
          workSession: updatedSession,
          hoursWorked: updatedSession.hoursWorked,
          netHoursWorked: updatedSession.netHoursWorked
        });
      }

    } else if (action === 'return_from_break') {
      // Manejar regreso de comida o salida temporal
      const activeSession = await (prisma as any).workSession.findFirst({
        where: {
          userId: user.id,
          dayDate: today
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!activeSession) {
        return NextResponse.json(
          { error: 'No hay sesión activa' },
          { status: 400 }
        );
      }

      // Buscar break activo de comida
      const activeMealBreak = await (prisma as any).breakSession.findFirst({
        where: {
          workSessionId: activeSession.id,
          breakType: 'meal',
          endTime: null
        }
      });

      if (activeMealBreak) {
        // Calcular duración de la comida
        const mealDuration = (now.getTime() - new Date(activeMealBreak.startTime).getTime()) / (1000 * 60);
        const isOvertime = mealDuration > 60; // Más de 1 hora
        const overtimeMinutes = Math.max(0, Math.round(mealDuration - 60));

        // Cerrar break de comida
        await (prisma as any).breakSession.update({
          where: { id: activeMealBreak.id },
          data: {
            endTime: now,
            duration: Math.round(mealDuration),
            isOvertime,
            overtimeMinutes
          }
        });

        return NextResponse.json({
          message: 'Regreso de comida registrado',
          mealDuration: Math.round(mealDuration),
          isOvertime,
          overtimeMinutes: isOvertime ? overtimeMinutes : 0
        });
      }

      // Si la sesión tiene salida temporal, crear nueva sesión
      if (activeSession.exitType === 'temporary') {
        const newSessionNumber = await (prisma as any).workSession.count({
          where: {
            userId: user.id,
            dayDate: today
          }
        }) + 1;

        const weekNumber = getWeekNumber(now);
        const yearNumber = now.getFullYear();

        const newSession = await (prisma as any).workSession.create({
          data: {
            userId: user.id,
            sessionType: 'work',
            startTime: now,
            dayDate: today,
            sessionNumber: newSessionNumber,
            isOnTime: true,
            minutesLate: 0,
            weekNumber,
            yearNumber
          }
        });

        return NextResponse.json({
          message: 'Regreso de salida temporal registrado',
          workSession: newSession
        });
      }

      return NextResponse.json(
        { error: 'No hay salida temporal o comida activa' },
        { status: 400 }
      );

    } else {
      return NextResponse.json(
        { error: 'Acción no válida' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error en clock:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}