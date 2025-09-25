import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Obtener opciones de personalización disponibles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const optionType = searchParams.get('type');

    let whereClause: any = {
      isActive: true
    };

    if (productId) {
      whereClause.OR = [
        { productId: parseInt(productId) },
        { productId: null } // Opciones globales
      ];
    }

    if (optionType) {
      whereClause.optionType = optionType;
    }

    const options = await prisma.cakeBarOption.findMany({
      where: whereClause,
      include: {
        product: true
      },
      orderBy: [
        { optionType: 'asc' },
        { name: 'asc' }
      ]
    });

    // Agrupar por tipo de opción
    const groupedOptions = options.reduce((acc: any, option) => {
      if (!acc[option.optionType]) {
        acc[option.optionType] = [];
      }
      
      acc[option.optionType].push(option);
      
      return acc;
    }, {});

    // Para TOPPINGS, agrupar también por categoría
    if (groupedOptions.TOPPING) {
      const toppingsByCategory: any = {};
      groupedOptions.TOPPING.forEach((topping: any) => {
        const category = topping.category || 'OTROS';
        if (!toppingsByCategory[category]) {
          toppingsByCategory[category] = [];
        }
        toppingsByCategory[category].push(topping);
      });
      groupedOptions.TOPPING = toppingsByCategory;
    }

    // Si se especifica un tipo específico, devolver solo ese array
    if (optionType && groupedOptions[optionType]) {
      return NextResponse.json(groupedOptions[optionType]);
    }

    // Si no se especifica tipo o no existe, devolver todo agrupado
    return NextResponse.json(groupedOptions);
  } catch (error) {
    console.error('Error fetching cake bar options:', error);
    return NextResponse.json(
      { error: 'Error al obtener opciones de personalización' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva opción de personalización
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productId,
      optionType,
      name,
      description,
      priceAdd,
      isDefault,
      displayOrder
    } = body;

    const option = await prisma.cakeBarOption.create({
      data: {
        productId: productId || null,
        optionType,
        name,
        priceAdd: priceAdd || 0
      },
      include: {
        product: true
      }
    });

    return NextResponse.json(option, { status: 201 });
  } catch (error) {
    console.error('Error creating cake bar option:', error);
    return NextResponse.json(
      { error: 'Error al crear opción de personalización' },
      { status: 500 }
    );
  }
}