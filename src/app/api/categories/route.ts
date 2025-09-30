import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'VITRINA' | 'CAKE_BAR' | null
    const active = searchParams.get('active')

    const whereClause: any = {
      isActive: active === 'false' ? false : true,
    }
    
    if (type && ['VITRINA', 'CAKE_BAR'].includes(type)) {
      whereClause.type = type
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      include: {
        _count: true
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ],
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!requireAdmin(user)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { name, color, type } = await request.json()

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Nombre y tipo son requeridos' },
        { status: 400 }
      )
    }

    if (!['VITRINA', 'CAKE_BAR'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo debe ser VITRINA o CAKE_BAR' },
        { status: 400 }
      )
    }

    // Verificar que no existe una categoría con el mismo nombre y tipo
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: name.trim(),
        type,
        isActive: true,
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Ya existe una categoría con ese nombre para este tipo' },
        { status: 409 }
      )
    }

    // Obtener el siguiente sortOrder
    const lastCategory = await prisma.category.findFirst({
      where: { type, isActive: true },
      orderBy: { sortOrder: 'desc' }
    })
    const nextSortOrder = (lastCategory?.sortOrder || 0) + 1

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        color: color || '#3B82F6',
        type,
        sortOrder: nextSortOrder,
        isActive: true,
      },
      include: {
        _count: {
          select: { products: true }
        }
      }
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