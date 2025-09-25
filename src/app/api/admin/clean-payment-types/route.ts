import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    console.log('Iniciando limpieza de tipos de pago...')

    // Función para normalizar tipo de pago
    function normalizePaymentType(paymentType: any): string {
      if (typeof paymentType === 'string') {
        // Si ya es string, verificar si es válido
        if (['CASH', 'CARD', 'TRANSFER', 'MIXED'].includes(paymentType)) {
          return paymentType
        }
        // Intentar parsear si es JSON string
        try {
          const parsed = JSON.parse(paymentType)
          if (parsed.type && ['CASH', 'CARD', 'TRANSFER', 'MIXED'].includes(parsed.type)) {
            return parsed.type
          }
        } catch (e) {
          // Si no se puede parsear, asumir efectivo
          return 'CASH'
        }
      }
      
      if (typeof paymentType === 'object' && paymentType !== null) {
        if (paymentType.type && ['CASH', 'CARD', 'TRANSFER', 'MIXED'].includes(paymentType.type)) {
          return paymentType.type
        }
      }
      
      // Fallback a efectivo
      return 'CASH'
    }

    // 1. Obtener todas las ventas con tipos de pago potencialmente corruptos
    const allSales = await prisma.sale.findMany({
      select: {
        id: true,
        paymentType: true
      }
    })

    let cleanedSales = 0
    for (const sale of allSales) {
      const originalType = sale.paymentType
      const normalizedType = normalizePaymentType(originalType)
      
      if (originalType !== normalizedType) {
        await prisma.sale.update({
          where: { id: sale.id },
          data: { paymentType: normalizedType }
        })
        cleanedSales++
        console.log(`Sale ${sale.id}: "${originalType}" -> "${normalizedType}"`)
      }
    }

    // 2. Verificar pagos de Cake Bar (normalmente están bien)
    const allCakeBarPayments = await prisma.cakeBarPayment.findMany({
      select: {
        id: true,
        paymentType: true
      }
    })

    let cleanedCakeBarPayments = 0
    for (const payment of allCakeBarPayments) {
      const originalType = payment.paymentType
      const normalizedType = normalizePaymentType(originalType)
      
      if (originalType !== normalizedType) {
        await prisma.cakeBarPayment.update({
          where: { id: payment.id },
          data: { paymentType: normalizedType }
        })
        cleanedCakeBarPayments++
        console.log(`CakeBar Payment ${payment.id}: "${originalType}" -> "${normalizedType}"`)
      }
    }

    return NextResponse.json({
      message: 'Limpieza completada',
      salesCleaned: cleanedSales,
      cakeBarPaymentsCleaned: cleanedCakeBarPayments,
      totalSales: allSales.length,
      totalCakeBarPayments: allCakeBarPayments.length
    })

  } catch (error) {
    console.error('Error en limpieza:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}