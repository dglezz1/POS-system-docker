import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const today = searchParams.get('today')
    
    let whereClause = {}
    
    if (today === 'true') {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date()
      endOfDay.setHours(23, 59, 59, 999)
      
      whereClause = {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    }

    const orders = await prisma.cakeBarOrder.findMany({
      where: whereClause,
      include: {
        product: true,
        customizations: {
          include: {
            option: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calcular timeRemaining para cada orden
    const ordersWithTimer = orders.map(order => {
      let timeRemaining = null
      
      // Solo calcular timeRemaining para órdenes en progreso
      if (order.status === 'in_progress') {
        const now = new Date()
        const createdAt = new Date(order.createdAt)
        const elapsedTime = now.getTime() - createdAt.getTime()
        const thirtyMinutes = 30 * 60 * 1000 // 30 minutos en milisegundos
        
        timeRemaining = Math.max(0, thirtyMinutes - elapsedTime)
      }
      
      return {
        ...order,
        timeRemaining
      }
    })

    return NextResponse.json(ordersWithTimer)
  } catch (error) {
    console.error('Error fetching cake bar orders:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      productId, 
      size, 
      customizations, 
      customerName, 
      customerPhone,
      notes,
      createdBy 
    } = body

    // Validaciones básicas
    if (!productId || !size) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: productId y size' },
        { status: 400 }
      )
    }

    // Obtener el producto
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Calcular precio base según el tamaño
    let basePrice = product.price
    
    // Ajustar precio según tamaño (ejemplo: 10 = base, 20 = x1.5, 30 = x2)
    switch (size) {
      case '20':
        basePrice *= 1.5
        break
      case '30':
        basePrice *= 2
        break
      default:
        // '10' usa precio base
        break
    }

    let totalPrice = basePrice

    // Calcular precio de opciones seleccionadas
    let customizationData = []
    if (customizations && customizations.length > 0) {
      const optionIds = customizations.map((c: any) => c.optionId)
      const options = await prisma.cakeBarOption.findMany({
        where: {
          id: { in: optionIds }
        }
      })

      for (const customization of customizations) {
        const option = options.find(o => o.id === customization.optionId)
        if (option) {
          totalPrice += option.priceAdd
          customizationData.push({
            optionId: option.id,
            optionType: option.optionType,
            optionName: option.name,
            quantity: customization.quantity || 1,
            unitPrice: option.priceAdd,
            totalPrice: option.priceAdd * (customization.quantity || 1)
          })
        }
      }
    }

    // Generar número de orden único
    const orderCount = await prisma.cakeBarOrder.count()
    const orderNumber = `CB${String(orderCount + 1).padStart(4, '0')}`

    // Crear la orden
    const order = await prisma.cakeBarOrder.create({
      data: {
        orderNumber,
        productId,
        size,
        customerName,
        customerPhone,
        basePrice,
        totalPrice,
        remainingAmount: totalPrice,
        status: 'pending',
        notes,
        createdBy: createdBy || 'system', // Aquí deberías usar el ID del usuario autenticado
        customizations: {
          create: customizationData
        }
      },
      include: {
        product: true,
        customizations: {
          include: {
            option: true
          }
        }
      }
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating cake bar order:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}