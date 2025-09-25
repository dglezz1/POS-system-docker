import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

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

// Función para normalizar tipo de pago
function normalizePaymentType(paymentType: any): string {
  if (typeof paymentType === 'string') {
    if (['CASH', 'CARD', 'TRANSFER', 'MIXED'].includes(paymentType)) {
      return paymentType;
    }
    try {
      const parsed = JSON.parse(paymentType);
      if (parsed.type && ['CASH', 'CARD', 'TRANSFER', 'MIXED'].includes(parsed.type)) {
        return parsed.type;
      }
    } catch (e) {
      return 'CASH';
    }
  }
  
  if (typeof paymentType === 'object' && paymentType !== null) {
    if (paymentType.type && ['CASH', 'CARD', 'TRANSFER', 'MIXED'].includes(paymentType.type)) {
      return paymentType.type;
    }
  }
  
  return 'CASH';
}

// Función para calcular rango de fechas
function getDateRange(period: string) {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'today';
    const { startDate, endDate } = getDateRange(period);

    // Obtener todas las ventas del período
    const [allSalesData, allCakeBarData, allCustomOrderData] = await Promise.all([
      prisma.sale.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          saleItems: {
            include: {
              product: true
            }
          },
          user: true
        }
      }),
      prisma.cakeBarPayment.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          order: true
        }
      }),
      prisma.customOrderPayment.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          customOrder: true
        }
      })
    ]);

    // Procesar totales por método de pago
    const paymentTotals: Record<string, { total: number; count: number }> = {};

    // Procesar ventas regulares
    allSalesData.forEach((sale: any) => {
      const normalizedType = normalizePaymentType(sale.paymentType);
      if (!paymentTotals[normalizedType]) {
        paymentTotals[normalizedType] = { total: 0, count: 0 };
      }
      paymentTotals[normalizedType].total += sale.total;
      paymentTotals[normalizedType].count += 1;
    });

    // Procesar pagos de Cake Bar
    allCakeBarData.forEach((payment: any) => {
      const normalizedType = normalizePaymentType(payment.paymentType);
      if (!paymentTotals[normalizedType]) {
        paymentTotals[normalizedType] = { total: 0, count: 0 };
      }
      paymentTotals[normalizedType].total += payment.amount;
      paymentTotals[normalizedType].count += 1;
    });

    // Procesar pagos de pedidos personalizados
    allCustomOrderData.forEach((payment: any) => {
      const normalizedType = normalizePaymentType(payment.paymentMethod);
      if (!paymentTotals[normalizedType]) {
        paymentTotals[normalizedType] = { total: 0, count: 0 };
      }
      paymentTotals[normalizedType].total += payment.amount;
      paymentTotals[normalizedType].count += 1;
    });

    // Calcular totales generales
    const totalSalesAmount = allSalesData.reduce((sum: number, sale: any) => sum + sale.total, 0);
    const totalCakeBarAmount = allCakeBarData.reduce((sum: number, payment: any) => sum + payment.amount, 0);
    const totalCustomOrderAmount = allCustomOrderData.reduce((sum: number, payment: any) => sum + payment.amount, 0);
    const grandTotal = totalSalesAmount + totalCakeBarAmount + totalCustomOrderAmount;
    const totalTransactions = allSalesData.length + allCakeBarData.length + allCustomOrderData.length;

    // Obtener productos más vendidos
    const productSales: Record<string, { product: { id: number; name: string; category: string }; quantity: number; revenue: number }> = {};
    allSalesData.forEach((sale: any) => {
      sale.saleItems.forEach((item: any) => {
        // Validar que el producto exista
        if (!item.product || !item.product.name) {
          console.warn('SaleItem without valid product:', item);
          return;
        }
        
        const key = item.product.name;
        if (!productSales[key]) {
          productSales[key] = {
            product: {
              id: item.product.id,
              name: item.product.name,
              category: item.product.category || 'Sin categoría'
            },
            quantity: 0,
            revenue: 0
          };
        }
        productSales[key].quantity += item.quantity;
        productSales[key].revenue += item.subtotal;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Obtener datos de operaciones
    const [
      activeCakeBarOrders,
      activeEmployees,
      pendingCustomOrders,
      lowStockItems,
      totalProducts,
      totalIngredients,
      activeUsers
    ] = await Promise.all([
      prisma.cakeBarOrder.count({
        where: {
          status: { in: ['pending', 'in_progress'] }
        }
      }),
      prisma.user.findMany({
        where: {
          isActive: true,
          workSessions: {
            some: {
              endTime: null
            }
          }
        },
        select: {
          id: true,
          name: true,
          role: true
        }
      }),
      prisma.customOrder.count({
        where: {
          status: { in: ['PENDIENTE', 'EN_PROGRESO'] }
        }
      }),
      prisma.ingredient.count({
        where: {
          currentStock: {
            lte: prisma.ingredient.fields.minStock
          }
        }
      }),
      prisma.product.count(),
      prisma.ingredient.count(),
      prisma.user.count({
        where: {
          isActive: true
        }
      })
    ]);

    // Obtener tendencias diarias (últimos 7 días)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dailySales = await prisma.sale.aggregate({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate
          }
        },
        _sum: {
          total: true
        },
        _count: true
      });

      last7Days.push({
        date: date.toISOString().split('T')[0],
        total: dailySales._sum.total || 0,
        count: dailySales._count
      });
    }

    // Obtener información de caja actual
    const currentRegister = await prisma.cashRegister.findFirst({
      where: {
        status: 'open'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calcular efectivo esperado
    const cashPayments = paymentTotals['CASH']?.total || 0;
    const expectedCash = (currentRegister?.openingCash || 0) + cashPayments;

    return NextResponse.json({
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      sales: {
        total: grandTotal,
        count: totalTransactions,
        average: totalTransactions > 0 ? grandTotal / totalTransactions : 0,
        bySegment: [
          { type: "VITRINA", total: totalSalesAmount, count: allSalesData.length },
          { type: "CAKE_BAR", total: totalCakeBarAmount, count: allCakeBarData.length }
        ],
        byPayment: Object.entries(paymentTotals).map(([method, data]) => ({
          method,
          total: data.total,
          count: data.count
        })),
        customOrders: {
          total: totalCustomOrderAmount,
          count: allCustomOrderData.length
        }
      },
      products: {
        topSelling: topProducts
      },
      trends: {
        dailySales: last7Days
      },
      operations: {
        activeCakeBarOrders,
        activeEmployees,
        pendingCustomOrders,
        lowStockItems,
        systemAlerts: lowStockItems,
        unreadAlerts: []
      },
      cash: {
        currentRegister: currentRegister ? {
          totalSales: grandTotal,
          openedAt: currentRegister.createdAt.toISOString(),
          openedBy: currentRegister.openedBy || "Usuario",
          openingCash: currentRegister.openingCash
        } : null,
        expectedCash,
        registeredExpenses: 0,
        expenses: {
          total: 0,
          count: 0
        }
      },
      inventory: {
        totalProducts,
        totalIngredients,
        activeUsers
      },
      alerts: []
    });
  } catch (error) {
    console.error('Error en dashboard:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
