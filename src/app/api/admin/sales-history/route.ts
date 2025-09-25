import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const paymentType = searchParams.get('paymentType')
    const employeeId = searchParams.get('employeeId')
    const saleType = searchParams.get('saleType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Construir filtros de fecha
    const dateFilter: any = {}
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z')
      }
    } else if (startDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate)
      }
    } else if (endDate) {
      dateFilter.createdAt = {
        lte: new Date(endDate + 'T23:59:59.999Z')
      }
    }

    // Construir filtros para ventas tradicionales
    const vitrinaWhere: any = { ...dateFilter }
    if (paymentType && paymentType !== 'ALL') {
      vitrinaWhere.paymentType = paymentType
    }
    if (employeeId && employeeId !== 'ALL') {
      vitrinaWhere.userId = employeeId
    }
    if (saleType && saleType !== 'ALL') {
      vitrinaWhere.saleType = saleType
    }

    // Obtener ventas de vitrina
    const [vitrinaSales, vitrinaTotal] = await Promise.all([
      prisma.sale.findMany({
        where: vitrinaWhere,
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          saleItems: {
            include: {
              product: {
                select: {
                  name: true,
                  category: true
                }
              }
            }
          },
          cashRegister: {
            select: {
              id: true,
              date: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: 0, // Obtendremos todas y luego paginaremos
        take: limit * 10 // Aumentamos el límite para la combinación
      }),
      prisma.sale.count({ where: vitrinaWhere })
    ])

    // Obtener ventas de Cake Bar (pagos)
    const cakeBarPayments = await prisma.cakeBarPayment.findMany({
      where: dateFilter,
      include: {
        order: {
          include: {
            product: {
              select: {
                name: true,
                category: true
              }
            },
            customizations: {
              include: {
                option: {
                  select: {
                    name: true,
                    category: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Transformar ventas de Cake Bar al formato de ventas tradicionales
    const transformedCakeBarSales = cakeBarPayments.map((payment: any) => ({
      id: `cakebar-${payment.id}`,
      saleNumber: `CAKE-BAR-${payment.order.orderNumber || payment.order.id}`,
      total: payment.amount,
      paymentType: payment.paymentType,
      saleType: 'CAKE_BAR',
      status: 'COMPLETED',
      createdAt: payment.createdAt,
      user: {
        name: payment.paidBy || 'Sistema Cake Bar',
        email: 'cakebar@system.com'
      },
      saleItems: [
        // Producto base
        {
          id: `base-${payment.order.id}`,
          productId: payment.order.productId,
          quantity: 1,
          unitPrice: payment.order.basePrice,
          subtotal: payment.order.basePrice,
          product: payment.order.product || { name: 'Torta Base', category: 'CAKE_BAR' }
        },
        // Customizaciones como items
        ...payment.order.customizations.map((custom: any) => ({
          id: `custom-${custom.id}`,
          productId: custom.optionId,
          quantity: custom.quantity,
          unitPrice: custom.unitPrice,
          subtotal: custom.totalPrice,
          product: custom.option ? { 
            name: custom.option.name, 
            category: custom.option.category || 'Decoración' 
          } : { name: 'Personalización', category: 'Decoración' }
        }))
      ],
      cashRegister: null
    }))

    // Obtener pagos de pedidos personalizados
    const customOrderPayments = await prisma.customOrderPayment.findMany({
      where: dateFilter,
      include: {
        customOrder: {
          select: {
            orderNumber: true,
            customerName: true,
            description: true,
            estimatedPrice: true,
            status: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Transformar pagos de pedidos personalizados al formato de ventas tradicionales
    const transformedCustomOrderSales = customOrderPayments.map((payment: any) => ({
      id: `custom-${payment.id}`,
      saleNumber: `CUSTOM-${payment.customOrder.orderNumber}`,
      total: payment.amount,
      paymentType: payment.paymentMethod,
      saleType: 'CUSTOM_ORDER',
      status: 'COMPLETED',
      createdAt: payment.createdAt,
      user: {
        name: payment.user.name,
        email: payment.user.email
      },
      saleItems: [
        {
          id: `custom-item-${payment.id}`,
          productId: null,
          quantity: 1,
          unitPrice: payment.amount,
          subtotal: payment.amount,
          product: {
            name: `Pedido Personalizado - ${payment.customOrder.customerName}`,
            category: 'CUSTOM_ORDER'
          }
        }
      ],
      cashRegister: null,
      // Información adicional específica de pedidos personalizados
      customOrderInfo: {
        customerName: payment.customOrder.customerName,
        description: payment.customOrder.description,
        paymentType: payment.paymentType,
        orderStatus: payment.customOrder.status,
        totalOrderValue: payment.customOrder.estimatedPrice
      }
    }))

    // Combinar y ordenar todas las ventas
    const allSales = [...vitrinaSales, ...transformedCakeBarSales, ...transformedCustomOrderSales]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Aplicar paginación
    const startIndex = (page - 1) * limit
    const paginatedSales = allSales.slice(startIndex, startIndex + limit)
    const totalSales = vitrinaTotal + cakeBarPayments.length + customOrderPayments.length

    // Obtener estadísticas del período para vitrina
    const vitrinaStats = await prisma.sale.aggregate({
      where: vitrinaWhere,
      _sum: {
        total: true
      },
      _count: true
    })

    // Obtener estadísticas de Cake Bar
    const cakeBarStats = await prisma.cakeBarPayment.aggregate({
      where: dateFilter,
      _sum: {
        amount: true
      },
      _count: true
    })

    // Obtener estadísticas de pedidos personalizados
    const customOrderStats = await prisma.customOrderPayment.aggregate({
      where: dateFilter,
      _sum: {
        amount: true
      },
      _count: true
    })

    // Combinar estadísticas
    const combinedStats = {
      _sum: {
        total: (vitrinaStats._sum.total || 0) + (cakeBarStats._sum.amount || 0) + (customOrderStats._sum.amount || 0)
      },
      _count: vitrinaStats._count + cakeBarStats._count + customOrderStats._count
    }

    // Estadísticas por método de pago - Vitrina
    const vitrinaPaymentStats = await prisma.sale.groupBy({
      by: ['paymentType'],
      where: vitrinaWhere,
      _sum: {
        total: true
      },
      _count: true
    })

    // Estadísticas por método de pago - Cake Bar
    const cakeBarPaymentStats = await prisma.cakeBarPayment.groupBy({
      by: ['paymentType'],
      where: dateFilter,
      _sum: {
        amount: true
      },
      _count: true
    })

    // Estadísticas por método de pago - Pedidos Personalizados
    const customOrderPaymentStats = await prisma.customOrderPayment.groupBy({
      by: ['paymentMethod'],
      where: dateFilter,
      _sum: {
        amount: true
      },
      _count: true
    })

    // Combinar estadísticas de métodos de pago
    const paymentStatsMap = new Map()
    
    vitrinaPaymentStats.forEach(stat => {
      const key = stat.paymentType
      paymentStatsMap.set(key, {
        paymentType: key,
        _sum: { total: stat._sum.total || 0 },
        _count: stat._count
      })
    })

    cakeBarPaymentStats.forEach(stat => {
      const key = stat.paymentType
      const existing = paymentStatsMap.get(key)
      if (existing) {
        existing._sum.total += stat._sum.amount || 0
        existing._count += stat._count
      } else {
        paymentStatsMap.set(key, {
          paymentType: key,
          _sum: { total: stat._sum.amount || 0 },
          _count: stat._count
        })
      }
    })

    customOrderPaymentStats.forEach(stat => {
      const key = stat.paymentMethod // Nota: usa paymentMethod en lugar de paymentType
      const existing = paymentStatsMap.get(key)
      if (existing) {
        existing._sum.total += stat._sum.amount || 0
        existing._count += stat._count
      } else {
        paymentStatsMap.set(key, {
          paymentType: key,
          _sum: { total: stat._sum.amount || 0 },
          _count: stat._count
        })
      }
    })

    const paymentStats = Array.from(paymentStatsMap.values())

    // Estadísticas por tipo de venta
    const typeStats = [
      {
        saleType: 'VITRINA',
        _sum: { total: vitrinaStats._sum.total || 0 },
        _count: vitrinaStats._count
      },
      {
        saleType: 'CAKE_BAR', 
        _sum: { total: cakeBarStats._sum.amount || 0 },
        _count: cakeBarStats._count
      },
      {
        saleType: 'CUSTOM_ORDER',
        _sum: { total: customOrderStats._sum.amount || 0 },
        _count: customOrderStats._count
      }
    ]

    // Estadísticas por empleado (solo vitrina por ahora)
    const employeeStats = await prisma.sale.groupBy({
      by: ['userId'],
      where: vitrinaWhere,
      _sum: {
        total: true
      },
      _count: true
    })

    // Obtener nombres de empleados para las estadísticas
    const employees = await prisma.user.findMany({
      where: {
        id: {
          in: employeeStats.map(s => s.userId).filter(Boolean)
        }
      },
      select: {
        id: true,
        name: true
      }
    })

    const employeeStatsWithNames = employeeStats.map(stat => ({
      ...stat,
      employeeName: employees.find(e => e.id === stat.userId)?.name || 'Sistema'
    }))

    // Ventas por día (últimos 30 días)
    const dailySales = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count,
        SUM(total) as total
      FROM Sale 
      WHERE createdAt >= datetime('now', '-30 days')
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `

    return NextResponse.json({
      sales: paginatedSales,
      pagination: {
        page,
        limit,
        total: totalSales,
        pages: Math.ceil(totalSales / limit)
      },
      stats: {
        total: combinedStats._sum?.total || 0,
        count: combinedStats._count
      },
      breakdown: {
        byPayment: paymentStats,
        byType: typeStats,
        byEmployee: employeeStatsWithNames
      },
      dailySales
    })

  } catch (error) {
    console.error('Error fetching sales history:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Exportar ventas a CSV
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { filters, format = 'csv' } = body

    // Usar los mismos filtros que en GET
    const where: any = {}

    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate + 'T23:59:59.999Z')
      }
    }

    if (filters.paymentType && filters.paymentType !== 'ALL') {
      where.paymentType = filters.paymentType
    }

    if (filters.employeeId && filters.employeeId !== 'ALL') {
      where.userId = filters.employeeId
    }

    if (filters.saleType && filters.saleType !== 'ALL') {
      where.saleType = filters.saleType
    }

    // Obtener todas las ventas regulares
    const regularSales = await prisma.sale.findMany({
      where,
      include: {
        user: {
          select: {
            name: true
          }
        },
        saleItems: {
          include: {
            product: {
              select: {
                name: true,
                category: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Obtener ventas de Cake Bar
    const cakeBarWhere: any = {}
    if (filters.startDate && filters.endDate) {
      cakeBarWhere.createdAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate + 'T23:59:59.999Z')
      }
    }
    if (filters.paymentType && filters.paymentType !== 'ALL') {
      cakeBarWhere.paymentType = filters.paymentType
    }

    const cakeBarPayments = await prisma.cakeBarPayment.findMany({
      where: cakeBarWhere,
      include: {
        order: {
          select: {
            orderNumber: true,
            productId: true,
            product: {
              select: {
                name: true,
                category: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Obtener pagos de pedidos personalizados
    const customOrderWhere: any = {}
    if (filters.startDate && filters.endDate) {
      customOrderWhere.createdAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate + 'T23:59:59.999Z')
      }
    }
    if (filters.paymentType && filters.paymentType !== 'ALL') {
      customOrderWhere.paymentType = filters.paymentType
    }

    const customOrderPayments = await prisma.customOrderPayment.findMany({
      where: customOrderWhere,
      include: {
        customOrder: {
          select: {
            id: true,
            customerName: true,
            description: true,
            status: true,
            estimatedPrice: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Aplicar filtros específicos después de obtener los datos
    let allSales: any[] = []

    // Procesar ventas regulares
    if (!filters.saleType || filters.saleType === 'ALL' || filters.saleType === 'VITRINA') {
      allSales.push(...regularSales.map(sale => ({
        id: `sale_${sale.id}`,
        createdAt: sale.createdAt,
        saleNumber: sale.saleNumber,
        saleType: 'VITRINA',
        paymentType: sale.paymentType,
        total: sale.total,
        status: sale.status,
        user: sale.user,
        saleItems: sale.saleItems,
        source: 'regular'
      })))
    }

    // Procesar ventas de Cake Bar
    if (!filters.saleType || filters.saleType === 'ALL' || filters.saleType === 'CAKE_BAR') {
      allSales.push(...cakeBarPayments.map(payment => ({
        id: `cakebar_${payment.id}`,
        createdAt: payment.createdAt,
        saleNumber: `CB-${payment.order.orderNumber}`,
        saleType: 'CAKE_BAR',
        paymentType: payment.paymentType,
        total: payment.amount,
        status: 'COMPLETED',
        user: { name: 'Sistema Cake Bar' },
        saleItems: [{
          product: payment.order.product,
          quantity: 1
        }],
        source: 'cakeBar'
      })))
    }

    // Procesar pedidos personalizados
    if (!filters.saleType || filters.saleType === 'ALL' || filters.saleType === 'CUSTOM_ORDER') {
      allSales.push(...customOrderPayments.map(payment => ({
        id: `custom_${payment.id}`,
        createdAt: payment.createdAt,
        saleNumber: `CO-${payment.customOrder.id}`,
        saleType: 'CUSTOM_ORDER',
        paymentType: payment.paymentType,
        total: payment.amount,
        status: 'COMPLETED',
        user: { name: 'Sistema Pedidos' },
        customOrderInfo: payment.customOrder,
        source: 'customOrder'
      })))
    }

    // Ordenar todas las ventas por fecha
    allSales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    if (format === 'csv') {
      // Generar CSV
      const headers = [
        'Fecha',
        'Hora',
        'Numero Venta',
        'Tipo Venta',
        'Método Pago',
        'Empleado',
        'Total',
        'Estado',
        'Productos'
      ]

      const rows = allSales.map((sale: any) => {
        let productsText = ''
        
        if (sale.source === 'regular' && sale.saleItems) {
          productsText = sale.saleItems.map((item: any) => `${item.product.name} (${item.quantity})`).join('; ')
        } else if (sale.source === 'cakeBar' && sale.saleItems) {
          productsText = sale.saleItems.map((item: any) => `${item.product.name} (${item.quantity})`).join('; ')
        } else if (sale.source === 'customOrder' && sale.customOrderInfo) {
          productsText = sale.customOrderInfo.description
        }

        return [
          new Date(sale.createdAt).toLocaleDateString('es-MX'),
          new Date(sale.createdAt).toLocaleTimeString('es-MX'),
          sale.saleNumber,
          sale.saleType,
          sale.paymentType,
          sale.user?.name || 'Sistema',
          sale.total.toString(),
          sale.status,
          productsText
        ]
      })

      const csvContent = [headers, ...rows]
        .map((row: any[]) => row.map((field: any) => `"${field}"`).join(','))
        .join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="ventas_${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({ error: 'Formato no soportado' }, { status: 400 })

  } catch (error) {
    console.error('Error exporting sales:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}