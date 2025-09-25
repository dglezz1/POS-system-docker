import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

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
    const userId = decoded.userId

    const body = await request.json()
    const {
      customOrderId,
      amount,
      paymentMethod,
      paymentType, // 'ANTICIPO' o 'LIQUIDACION'
      description
    } = body

    // Validaciones
    if (!customOrderId || !amount || !paymentMethod || !paymentType) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el pedido existe
    const order = await prisma.customOrder.findUnique({
      where: { id: customOrderId },
      include: { payments: true }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    const newAmount = parseFloat(amount)
    const newTotal = order.totalPaid + newAmount

    // Validar que no se exceda el precio estimado
    if (newTotal > order.estimatedPrice) {
      return NextResponse.json(
        { error: 'El total de pagos no puede exceder el precio estimado' },
        { status: 400 }
      )
    }

    // Crear el pago y actualizar el total
    const payment = await prisma.customOrderPayment.create({
      data: {
        customOrderId,
        amount: newAmount,
        paymentMethod,
        paymentType,
        description,
        userId
      },
      include: {
        user: { select: { name: true } }
      }
    })

    // Actualizar el total pagado en el pedido
    await prisma.customOrder.update({
      where: { id: customOrderId },
      data: { totalPaid: newTotal }
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Error al registrar el pago' },
      { status: 500 }
    )
  }
}