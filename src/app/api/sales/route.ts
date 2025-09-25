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
    // Verificar autenticación
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      items, 
      paymentMethod, 
      discount = 0, 
      amountReceived = 0,
      saleType = 'VITRINA'
    } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Items de venta son requeridos' },
        { status: 400 }
      )
    }

    // Extraer el tipo de pago correctamente
    let paymentType: string
    if (typeof paymentMethod === 'string') {
      paymentType = paymentMethod
    } else if (paymentMethod && typeof paymentMethod === 'object') {
      paymentType = paymentMethod.type || 'CASH'
    } else {
      paymentType = 'CASH'
    }

    // Validar que el tipo de pago sea válido
    if (!['CASH', 'CARD', 'TRANSFER', 'MIXED'].includes(paymentType)) {
      paymentType = 'CASH'
    }

    console.log('Sale API - Payment processing:', {
      received: paymentMethod,
      extracted: paymentType,
      saleType
    })

    // Calcular total antes del descuento
    let subtotal = 0
    for (const item of items) {
      subtotal += item.unitPrice * item.quantity
    }

    const discountAmount = (subtotal * discount) / 100
    const total = subtotal - discountAmount

    // Generar número de venta único
    const saleCount = await prisma.sale.count()
    const saleNumber = `${saleType}-${new Date().getFullYear()}-${String(saleCount + 1).padStart(6, '0')}`

    // Verificar stock disponible
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })
      
      if (!product) {
        return NextResponse.json(
          { error: `Producto no encontrado: ${item.productId}` },
          { status: 400 }
        )
      }

      // Solo verificar stock para productos que NO son servicios
      if (!product.isService && product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}` },
          { status: 400 }
        )
      }
    }

    // Crear la venta en una transacción
    const sale = await prisma.$transaction(async (tx) => {
      // Crear la venta
      const newSale = await tx.sale.create({
        data: {
          saleNumber,
          total,
          paymentType: paymentType, // Usar el tipo extraído
          saleType,
          userId: user.id, // Usuario autenticado
          status: 'COMPLETED',
          saleItems: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.unitPrice * item.quantity
            }))
          }
        },
        include: {
          saleItems: {
            include: {
              product: { select: { name: true } }
            }
          }
        }
      })

      // Actualizar stock de productos (solo para productos que NO son servicios)
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        })
        
        if (product && !product.isService) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          })
        }
      }

      return newSale
    })

    // Calcular cambio si es efectivo
    let change = 0
    if (paymentType === 'CASH') {
      change = Math.max(0, amountReceived - total)
    }

    const response = {
      sale,
      subtotal,
      discountAmount,
      total,
      change,
      amountReceived: paymentType === 'CASH' ? amountReceived : total,
      paymentDetails: paymentMethod
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating sale:', error)
    return NextResponse.json(
      { error: 'Error al procesar la venta' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      where: {
        status: 'COMPLETED'
      },
      include: {
        saleItems: {
          include: {
            product: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Últimas 50 ventas
    })

    return NextResponse.json(sales)
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { error: 'Error al obtener ventas' },
      { status: 500 }
    )
  }
}