import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Función para normalizar tipo de pago
    function normalizePaymentType(paymentType: any): string {
      if (typeof paymentType === 'string') {
        return paymentType
      }
      if (typeof paymentType === 'object' && paymentType !== null) {
        // Si es un objeto, intentar extraer el tipo
        if (paymentType.type) {
          return paymentType.type
        }
        // Si el objeto completo fue guardado como string JSON
        try {
          const parsed = typeof paymentType === 'string' ? JSON.parse(paymentType) : paymentType
          if (parsed.type) {
            return parsed.type
          }
        } catch (e) {
          // Ignorar errores de parsing
        }
      }
      // Fallback a efectivo si no se puede determinar
      return 'CASH'
    }

    // Verificar si hay una caja abierta hoy
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    const currentRegister = await prisma.cashRegister.findFirst({
      where: {
        date: {
          gte: today
        },
        status: 'open'
      },
      include: {
        sales: {
          select: {
            id: true,
            total: true,
            paymentType: true,
            saleType: true,
            createdAt: true
          }
        },
        expenses: {
          select: {
            id: true,
            amount: true,
            category: true,
            description: true,
            createdAt: true
          }
        }
      }
    })

    if (!currentRegister) {
      return NextResponse.json({
        hasOpenRegister: false
      })
    }

    // Obtener ventas de Cake Bar del día actual
    const cakeBarPayments = await prisma.cakeBarPayment.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      select: {
        id: true,
        amount: true,
        paymentType: true,
        createdAt: true,
        order: {
          select: {
            orderNumber: true
          }
        }
      }
    })

    // Obtener pagos de pedidos personalizados del día actual
    const customOrderPayments = await prisma.customOrderPayment.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      select: {
        id: true,
        amount: true,
        paymentType: true,
        createdAt: true,
        customOrder: {
          select: {
            customerName: true
          }
        }
      }
    })

    // Normalizar y combinar ventas regulares, de cake bar y pedidos personalizados
    const normalizedSales = currentRegister.sales.map(sale => ({
      paymentType: normalizePaymentType(sale.paymentType),
      amount: sale.total,
      source: 'SALE'
    }))

    const normalizedCakeBarPayments = cakeBarPayments.map(payment => ({
      paymentType: normalizePaymentType(payment.paymentType),
      amount: payment.amount,
      source: 'CAKE_BAR'
    }))

    const normalizedCustomOrderPayments = customOrderPayments.map(payment => ({
      paymentType: normalizePaymentType(payment.paymentType),
      amount: payment.amount,
      source: 'CUSTOM_ORDER'
    }))

    const allPayments = [...normalizedSales, ...normalizedCakeBarPayments, ...normalizedCustomOrderPayments]

    console.log('Cash Closure API - Normalized payments:', allPayments)
    console.log('Cash Closure API - Raw sales data:', currentRegister.sales.map(s => ({ id: s.id, total: s.total, paymentType: s.paymentType, paymentTypeType: typeof s.paymentType })))
    console.log('Cash Closure API - Raw cake bar data:', cakeBarPayments.map(p => ({ id: p.id, amount: p.amount, paymentType: p.paymentType, paymentTypeType: typeof p.paymentType })))
    console.log('Cash Closure API - Raw custom order data:', customOrderPayments.map(p => ({ id: p.id, amount: p.amount, paymentType: p.paymentType, paymentTypeType: typeof p.paymentType })))

    // Calcular totales por método de pago combinando ambas fuentes
    const salesByPayment = allPayments.reduce((acc: Record<string, { total: number; count: number }>, payment) => {
      if (!acc[payment.paymentType]) {
        acc[payment.paymentType] = { total: 0, count: 0 }
      }
      acc[payment.paymentType].total += payment.amount
      acc[payment.paymentType].count++
      return acc
    }, {})

    // Calcular totales
    const totalSalesRegular = currentRegister.sales.reduce((sum, sale) => sum + sale.total, 0)
    const totalSalesCakeBar = cakeBarPayments.reduce((sum, payment) => sum + payment.amount, 0)
    const totalSalesCustomOrder = customOrderPayments.reduce((sum, payment) => sum + payment.amount, 0)
    const totalSalesAll = totalSalesRegular + totalSalesCakeBar + totalSalesCustomOrder

    const cashSales = salesByPayment.CASH?.total || 0
    const totalExpenses = currentRegister.expenses.reduce((sum: number, exp) => sum + exp.amount, 0)
    
    const expectedCash = currentRegister.openingCash + cashSales - totalExpenses

    // Combinar ventas recientes (regulares + cake bar + pedidos personalizados) para mostrar en detalles
    const recentSalesFormatted = [
      ...currentRegister.sales.map(sale => ({
        id: `sale_${sale.id}`,
        type: 'SALE',
        saleType: sale.saleType,
        total: sale.total,
        paymentType: sale.paymentType,
        createdAt: sale.createdAt
      })),
      ...cakeBarPayments.map(payment => ({
        id: `cakebar_${payment.id}`,
        type: 'CAKE_BAR',
        saleType: 'CAKE_BAR',
        total: payment.amount,
        paymentType: payment.paymentType,
        createdAt: payment.createdAt,
        orderNumber: payment.order.orderNumber
      })),
      ...customOrderPayments.map(payment => ({
        id: `custom_${payment.id}`,
        type: 'CUSTOM_ORDER',
        saleType: 'CUSTOM_ORDER',
        total: payment.amount,
        paymentType: payment.paymentType,
        createdAt: payment.createdAt,
        customerName: payment.customOrder.customerName
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)

    console.log('Cash Closure API - Totals calculated:', {
      regularSales: totalSalesRegular,
      cakeBarSales: totalSalesCakeBar,
      customOrderSales: totalSalesCustomOrder,
      totalSalesAll,
      cashSales,
      expectedCash,
      paymentBreakdown: salesByPayment
    })

    return NextResponse.json({
      hasOpenRegister: true,
      register: currentRegister,
      summary: {
        openingCash: currentRegister.openingCash,
        totalSales: totalSalesAll,
        cashSales: cashSales,
        cardSales: salesByPayment.CARD?.total || 0,
        transferSales: salesByPayment.TRANSFER?.total || 0,
        totalExpenses: totalExpenses,
        expectedCash: expectedCash,
        actualCash: currentRegister.closingCash,
        difference: currentRegister.closingCash ? (currentRegister.closingCash - expectedCash) : null,
        status: currentRegister.status
      },
      salesByPayment,
      recentSales: recentSalesFormatted,
      expenses: currentRegister.expenses.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    })

  } catch (error) {
    console.error('Error obteniendo estado de caja:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, openingCash, actualCash, notes } = body

    if (action === 'open') {
      // Verificar si ya hay una caja abierta hoy
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const existingRegister = await prisma.cashRegister.findFirst({
        where: {
          date: {
            gte: today
          },
          status: 'open'
        }
      })

      if (existingRegister) {
        return NextResponse.json(
          { error: 'Ya hay una caja abierta hoy' },
          { status: 400 }
        )
      }

      // Crear nueva caja
      const newRegister = await prisma.cashRegister.create({
        data: {
          date: new Date(),
          openingCash: openingCash,
          status: 'open',
          openedBy: 'admin', // TODO: Obtener del usuario autenticado
          notes: notes || null
        }
      })

      return NextResponse.json({
        message: 'Caja abierta exitosamente',
        register: newRegister
      })
    }

    if (action === 'close') {
      // Función para normalizar tipo de pago (reutilizada)
      function normalizePaymentType(paymentType: any): string {
        if (typeof paymentType === 'string') {
          return paymentType
        }
        if (typeof paymentType === 'object' && paymentType !== null) {
          if (paymentType.type) {
            return paymentType.type
          }
          try {
            const parsed = typeof paymentType === 'string' ? JSON.parse(paymentType) : paymentType
            if (parsed.type) {
              return parsed.type
            }
          } catch (e) {
            // Ignorar errores de parsing
          }
        }
        return 'CASH'
      }

      // Buscar caja abierta
      const openRegister = await prisma.cashRegister.findFirst({
        where: {
          status: 'open'
        },
        include: {
          sales: true,
          expenses: true
        }
      })

      if (!openRegister) {
        return NextResponse.json(
          { error: 'No hay caja abierta para cerrar' },
          { status: 400 }
        )
      }

      // Obtener ventas de Cake Bar del día actual
      const today = new Date(openRegister.date)
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)

      const cakeBarPayments = await prisma.cakeBarPayment.findMany({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      })

      // Obtener pagos de pedidos personalizados del día actual
      const customOrderPayments = await prisma.customOrderPayment.findMany({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      })

      // Calcular totales reales incluyendo cake bar y pedidos personalizados con normalización
      const totalSalesRegular = openRegister.sales.reduce((sum, sale) => sum + sale.total, 0)
      const totalSalesCakeBar = cakeBarPayments.reduce((sum, payment) => sum + payment.amount, 0)
      const totalSalesCustomOrder = customOrderPayments.reduce((sum, payment) => sum + payment.amount, 0)
      const totalSalesAll = totalSalesRegular + totalSalesCakeBar + totalSalesCustomOrder

      // Calcular efectivo en ventas (regulares + cake bar + pedidos personalizados) con normalización
      const cashSalesRegular = openRegister.sales
        .filter(sale => normalizePaymentType(sale.paymentType) === 'CASH')
        .reduce((sum, sale) => sum + sale.total, 0)
      
      const cashSalesCakeBar = cakeBarPayments
        .filter(payment => normalizePaymentType(payment.paymentType) === 'CASH')
        .reduce((sum, payment) => sum + payment.amount, 0)

      const cashSalesCustomOrder = customOrderPayments
        .filter(payment => normalizePaymentType(payment.paymentType) === 'CASH')
        .reduce((sum, payment) => sum + payment.amount, 0)
      
      const totalCashSales = cashSalesRegular + cashSalesCakeBar + cashSalesCustomOrder
      const totalExpenses = openRegister.expenses.reduce((sum, expense) => sum + expense.amount, 0)
      const expectedCash = openRegister.openingCash + totalCashSales - totalExpenses
      const difference = actualCash - expectedCash

      console.log('Cash Closure - Final calculation with normalization:', {
        openingCash: openRegister.openingCash,
        totalSalesRegular,
        totalSalesCakeBar,
        totalSalesCustomOrder,
        totalSalesAll,
        totalCashSales,
        totalExpenses,
        expectedCash,
        actualCash,
        difference
      })

      // Cerrar caja
      const closedRegister = await prisma.cashRegister.update({
        where: {
          id: openRegister.id
        },
        data: {
          status: 'closed',
          closingCash: actualCash,
          totalSales: totalSalesAll, // Actualizar con el total correcto
          totalExpenses: totalExpenses,
          closedBy: 'admin', // TODO: Obtener del usuario autenticado
          notes: notes || openRegister.notes
        }
      })

      return NextResponse.json({
        message: 'Caja cerrada exitosamente',
        register: closedRegister,
        summary: {
          totalSales: totalSalesAll,
          totalExpenses,
          expectedCash,
          actualCash,
          difference
        }
      })
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error en operación de caja:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}