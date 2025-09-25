import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Obtener productos
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        stock: true,
        minStock: true,
        isActive: true,
      },
    });

    // Obtener categorías
    const categories = await prisma.category.findMany({
      where: { isActive: true },
    });

    // Obtener cambios recientes (últimas 24 horas)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentChanges = await prisma.productChange.count({
      where: {
        createdAt: {
          gte: yesterday,
        },
      },
    });

    // Calcular estadísticas
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.isActive).length;
    const lowStockProducts = products.filter(p => p.stock <= p.minStock).length;
    const totalCategories = categories.length;

    const stats = {
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalCategories,
      recentChanges,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas del dashboard' },
      { status: 500 }
    );
  }
}