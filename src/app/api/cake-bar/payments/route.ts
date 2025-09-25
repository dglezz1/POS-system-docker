import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

// Función para verificar el token y obtener usuario
async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    return user
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, amount, paymentType, description } = body

    if (!orderId || !amount || !paymentType) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: orderId, amount, paymentType' },
        { status: 400 }
      )
    }

    // Verificar que la orden existe
    const order = await prisma.cakeBarOrder.findUnique({
      where: { id: orderId },
      include: { payments: true }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    // Calcular total pagado hasta ahora
    const totalPaid = order.payments.reduce((sum, payment) => sum + payment.amount, 0)
    const newTotalPaid = totalPaid + amount

    if (newTotalPaid > order.totalPrice) {
      return NextResponse.json(
        { error: 'El monto excede el total de la orden' },
        { status: 400 }
      )
    }

    // Crear el pago
    const payment = await prisma.cakeBarPayment.create({
      data: {
        orderId,
        amount,
        paymentType,
        description: description || `Pago ${paymentType}`,
        paidBy: user.id
      }
    })

    // Actualizar la orden con el nuevo monto pagado y restante
    const updatedOrder = await prisma.cakeBarOrder.update({
      where: { id: orderId },
      data: {
        amountPaid: newTotalPaid,
        remainingAmount: order.totalPrice - newTotalPaid
      },
      include: {
        product: true,
        customizations: true,
        payments: true
      }
    })

    return NextResponse.json({
      payment,
      order: updatedOrder
    })

  } catch (error) {
    console.error('Error in cake bar payments:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}