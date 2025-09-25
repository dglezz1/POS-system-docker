import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET() {
  try {
    const orders = await prisma.customOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        payments: {
          include: {
            user: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching custom orders:', error)
    return NextResponse.json(
      { error: 'Error al obtener pedidos personalizados' },
      { status: 500 }
    )
  }
}

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

    // Debug: verificar que el usuario existe
    console.log('Decoded token:', decoded)
    console.log('User ID from token:', userId)
    
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!userExists) {
      console.error('User not found in database:', userId)
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 401 }
      )
    }
    
    console.log('User found:', userExists.name)

    const body = await request.json()
    const {
      customerName,
      customerPhone,
      customerEmail,
      description,
      deliveryDate,
      notes,
      estimatedPrice,
      advanceAmount,
      paymentMethod
    } = body

    // Validaciones
    if (!customerName || !description || !deliveryDate || !estimatedPrice || !advanceAmount) {
      return NextResponse.json(
        { error: 'Todos los campos marcados son requeridos' },
        { status: 400 }
      )
    }

    const price = parseFloat(estimatedPrice)
    const advance = parseFloat(advanceAmount)
    
    if (advance < price * 0.5) {
      return NextResponse.json(
        { error: 'El anticipo debe ser mínimo el 50% del precio estimado' },
        { status: 400 }
      )
    }

    // Generar número de pedido único
    const orderCount = await prisma.customOrder.count()
    const orderNumber = `CUSTOM-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, '0')}`

    const order = await prisma.customOrder.create({
      data: {
        orderNumber,
        customerName,
        customerPhone,
        customerEmail,
        description,
        estimatedPrice: price,
        totalPaid: advance,
        deliveryDate: new Date(deliveryDate),
        notes,
        userId,
        payments: {
          create: {
            amount: advance,
            paymentMethod,
            paymentType: 'ANTICIPO',
            description: 'Anticipo inicial del pedido',
            userId
          }
        }
      },
      include: {
        payments: {
          include: {
            user: { select: { name: true } }
          }
        }
      }
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating custom order:', error)
    return NextResponse.json(
      { error: 'Error al crear pedido personalizado' },
      { status: 500 }
    )
  }
}