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

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { action, breakType = 'meal' } = await request.json();
    const now = new Date();

    if (action === 'start') {
      // Verificar si hay una sesión activa
      const activeSession = await (prisma as any).workSession.findFirst({
        where: {
          userId: user.id,
          endTime: null
        }
      });

      if (!activeSession) {
        return NextResponse.json(
          { error: 'Debes estar trabajando para tomar un descanso' },
          { status: 400 }
        );
      }

      // Verificar si ya está en break
      const activeBreak = await (prisma as any).breakSession.findFirst({
        where: {
          workSessionId: activeSession.id,
          endTime: null
        }
      });

      if (activeBreak) {
        return NextResponse.json(
          { error: 'Ya tienes un descanso activo' },
          { status: 400 }
        );
      }

      // Definir tiempo máximo según tipo de break
      const maxAllowed = breakType === 'meal' ? 60 : 15; // 60 min para comida, 15 min para break

      // Crear nuevo break
      const breakSession = await (prisma as any).breakSession.create({
        data: {
          workSessionId: activeSession.id,
          breakType,
          startTime: now,
          maxAllowed,
          isPaid: breakType === 'break' // Los breaks cortos se pagan, la comida no
        }
      });

      return NextResponse.json({
        message: `${breakType === 'meal' ? 'Tiempo de comida' : 'Descanso'} iniciado`,
        breakSession
      });

    } else if (action === 'end') {
      // Buscar break activo del usuario
      const activeSession = await (prisma as any).workSession.findFirst({
        where: {
          userId: user.id,
          endTime: null
        }
      });

      if (!activeSession) {
        return NextResponse.json(
          { error: 'No hay sesión activa' },
          { status: 400 }
        );
      }

      const activeBreak = await (prisma as any).breakSession.findFirst({
        where: {
          workSessionId: activeSession.id,
          endTime: null
        }
      });

      if (!activeBreak) {
        return NextResponse.json(
          { error: 'No hay descanso activo para terminar' },
          { status: 400 }
        );
      }

      // Calcular duración en minutos
      const startTime = new Date(activeBreak.startTime);
      const duration = (now.getTime() - startTime.getTime()) / (1000 * 60);
      
      // Determinar si es overtime
      const isOvertime = duration > activeBreak.maxAllowed;
      const overtimeMinutes = isOvertime ? Math.round(duration - activeBreak.maxAllowed) : 0;

      // Actualizar break
      const updatedBreak = await (prisma as any).breakSession.update({
        where: { id: activeBreak.id },
        data: {
          endTime: now,
          duration: Math.round(duration),
          isOvertime,
          overtimeMinutes
        }
      });

      return NextResponse.json({
        message: `${activeBreak.breakType === 'meal' ? 'Tiempo de comida' : 'Descanso'} terminado`,
        breakSession: updatedBreak,
        overtime: isOvertime ? `Te excediste ${overtimeMinutes} minutos` : null
      });

    } else {
      return NextResponse.json(
        { error: 'Acción no válida' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error en break:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}