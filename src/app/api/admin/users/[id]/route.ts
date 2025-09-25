import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const { id } = params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sales: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Obtener estadísticas del usuario
    const salesStats = await prisma.sale.aggregate({
      where: {
        userId: id
      },
      _sum: {
        total: true
      },
      _count: true
    })

    // Obtener ventas recientes del usuario
    const recentSales = await prisma.sale.findMany({
      where: {
        userId: id
      },
      select: {
        id: true,
        saleNumber: true,
        total: true,
        paymentType: true,
        saleType: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    // Obtener sesiones de trabajo del usuario (últimas 10)
    // const workSessions = await prisma.workSession.findMany({
    //   where: {
    //     userId: id
    //   },
    //   select: {
    //     id: true,
    //     startTime: true,
    //     endTime: true,
    //     sessionType: true,
    //     exitType: true,
    //     totalMinutes: true,
    //     status: true,
    //     createdAt: true
    //   },
    //   orderBy: {
    //     createdAt: 'desc'
    //   },
    //   take: 10
    // })

    return NextResponse.json({
      user: {
        ...user,
        stats: {
          totalSales: salesStats._sum.total || 0,
          salesCount: salesStats._count,
          recentSales,
          workSessions: [] // Placeholder until WorkSession model is available
        }
      }
    })

  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const { id } = params
    const body = await request.json()
    const { name, email, role, isActive, password } = body

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el email ya está en uso por otro usuario
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'El email ya está en uso' },
          { status: 400 }
        )
      }
    }

    // Preparar datos para actualizar
    const updateData: any = {}

    if (name) updateData.name = name
    if (email) updateData.email = email
    if (role) updateData.role = role
    if (typeof isActive === 'boolean') updateData.isActive = isActive

    // Actualizar contraseña si se proporciona
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'La contraseña debe tener al menos 6 caracteres' },
          { status: 400 }
        )
      }
      updateData.password = await bcrypt.hash(password, 12)
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      message: 'Usuario actualizado exitosamente',
      user: updatedUser
    })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const { id } = params

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // En lugar de eliminar físicamente, desactivar el usuario
    // Esto preserva la integridad referencial con ventas y otras entidades
    await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        email: `deleted_${Date.now()}_${existingUser.email}` // Evitar conflictos de email único
      }
    })

    return NextResponse.json({
      message: 'Usuario desactivado exitosamente'
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}