import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');

    const whereClause: any = {};
    
    if (active !== null && active !== undefined) {
      whereClause.isActive = active === 'true';
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ],
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      sortOrder = 0,
      createdBy = 'system' // En producción esto vendría del usuario autenticado
    } = body;

    // Validaciones
    if (!name) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el nombre sea único
    const existingCategory = await prisma.category.findUnique({
      where: { name }
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Ya existe una categoría con ese nombre' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        sortOrder: parseInt(sortOrder),
        createdBy,
        isActive: true,
      },
    });

    // Registrar el cambio para auditoría
    await prisma.categoryChange.create({
      data: {
        categoryId: category.id,
        field: 'created',
        oldValue: null,
        newValue: JSON.stringify(category),
        userId: createdBy,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Error al crear categoría' },
      { status: 500 }
    );
  }
}