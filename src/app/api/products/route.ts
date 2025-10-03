import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Función para determinar el tipo de producto según la categoría
function determineProductType(category: string, explicitType?: string): string {
  // Si se especifica un tipo explícito, usarlo
  if (explicitType && ['VITRINA', 'CAKE_BAR'].includes(explicitType.toUpperCase())) {
    return explicitType.toUpperCase();
  }

  // Categorías específicas para Cake Bar
  const cakeBarCategories = [
    'CAKE_BAR_DECORATIONS',
    'DECORACIONES_TORTA',
    'TOPPINGS_CAKE_BAR',
    'CHOCOLATES_DECORACION',
    'FIGURAS_TORTA'
  ];

  // Categorías específicas para Vitrina
  const vitrinaCategories = [
    'VELAS_VITRINA',
    'PRODUCTOS_HORNEADOS',
    'BEBIDAS',
    'VITRINA_GENERAL',
    'OTROS_VITRINA'
  ];

  // Servicios se asignan según su nombre o categoría
  if (category.includes('SERVICIOS')) {
    // Servicios de panadería van a vitrina por defecto
    return 'VITRINA';
  }

  // Verificar categorías específicas
  if (cakeBarCategories.some(cat => category.includes(cat) || category.includes('CAKE_BAR'))) {
    return 'CAKE_BAR';
  }

  if (vitrinaCategories.some(cat => category.includes(cat) || category.includes('VITRINA'))) {
    return 'VITRINA';
  }

  // Por defecto, productos van a vitrina
  return 'VITRINA';
}

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const active = searchParams.get('active');
    const lowStock = searchParams.get('lowStock');

    const whereClause: any = {};

    if (type) {
      whereClause.type = type.toUpperCase();
    }

    if (category) {
      whereClause.category = category;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search } },
      ];
    }

    if (active !== null && active !== undefined) {
      whereClause.isActive = active === 'true';
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' }
      ],
    });

    // Filtrar por stock bajo si se solicita
    let filteredProducts = products;
    if (lowStock === 'true') {
      filteredProducts = products.filter(p => p.stock <= p.minStock);
    }

    return NextResponse.json(filteredProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    );
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

    const body = await request.json();
    const {
      name,
      description,
      price,
      stock,
      category,
      categoryId,
      type,
      barcode,
      isService = false,
      minStock = 5,
      specialPrice,
      hasPromotion = false,
      promotionDiscount,
      promotionStartDate,
      promotionEndDate
    } = body;

    // Validaciones
    if (!name || !price || stock === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Determinar categoryId si no se proporciona
    let finalCategoryId = categoryId;
    if (!finalCategoryId) {
      const productType = type || 'VITRINA';
      finalCategoryId = productType === 'CAKE_BAR' ? 'default-category-cakebar' : 'default-category-vitrina';
    }

    // Determinar el tipo automáticamente basado en la categoría
    const finalType = determineProductType(category, type);

    // Generar código de barras automático si no se proporciona y no es un servicio
    let finalBarcode = barcode;
    if (!finalBarcode && !isService) {
      finalBarcode = '789' + Math.random().toString().substr(2, 10);
    }

    // Verificar que el código de barras sea único
    if (finalBarcode) {
      const existingProduct = await prisma.product.findUnique({
        where: { barcode: finalBarcode }
      });
      
      if (existingProduct) {
        return NextResponse.json(
          { error: 'El código de barras ya existe' },
          { status: 400 }
        );
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: isService ? 0 : parseInt(stock),
        category: category || 'Sin Categoría', // Mantener por compatibilidad
        categoryId: finalCategoryId,
        type: finalType,
        barcode: finalBarcode,
        isService,
        minStock: isService ? 0 : parseInt(minStock),
        specialPrice: specialPrice ? parseFloat(specialPrice) : null,
        hasPromotion,
        promotionDiscount: promotionDiscount ? parseFloat(promotionDiscount) : null,
        promotionStartDate: promotionStartDate ? new Date(promotionStartDate) : null,
        promotionEndDate: promotionEndDate ? new Date(promotionEndDate) : null,
        createdBy: user.id,
        isActive: true,
      },
    });

    // Registrar el movimiento de stock inicial solo si no es un servicio
    if (!isService) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: 'adjustment',
          quantity: stock,
          previousStock: 0,
          newStock: stock,
          reason: 'Stock inicial',
          userId: user.id,
        },
      });
    }

    // Registrar el cambio para auditoría
    await prisma.productChange.create({
      data: {
        productId: product.id,
        field: 'created',
        oldValue: null,
        newValue: JSON.stringify(product),
        userId: user.id,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    );
  }
}