import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: true
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getAuthenticatedUser()
    
    if (!requireAdmin(user)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { name, color } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    // Verificar que la categoría existe
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    })

    if (!existingCategory) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    // Verificar que no hay otra categoría con el mismo nombre y tipo
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        name: name.trim(),
        // type: existingCategory.type,
        isActive: true,
        id: { not: id }
      }
    })

    if (duplicateCategory) {
      return NextResponse.json(
        { error: 'Ya existe otra categoría con ese nombre' },
        { status: 409 }
      )
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        // color: color || existingCategory.color,
      },
      include: {
        _count: true
      }
    })

    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getAuthenticatedUser()
    
    if (!requireAdmin(user)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Verificar que la categoría existe
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: true
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    // No permitir eliminar la categoría "Sin Categoría" si existe
    if (category.name === 'Sin Categoría') {
      return NextResponse.json(
        { error: 'No se puede eliminar la categoría por defecto' },
        { status: 400 }
      )
    }

    // Si tiene productos asignados, moverlos a "Sin Categoría"
    if (category._count.products > 0) {
      // Buscar o crear categoría "Sin Categoría" para el mismo tipo
      let defaultCategory = await prisma.category.findFirst({
        where: {
          name: 'Sin Categoría',
          // type: category.type,
          isActive: true,
        }
      })

      if (!defaultCategory) {
        defaultCategory = await prisma.category.create({
          data: {
            name: 'Sin Categoría',
            // color: '#6B7280',
            // type: category.type,
            sortOrder: 0,
            // createdBy: auth.user.id,
          }
        })
      }

      // Mover productos a "Sin Categoría"
      await prisma.product.updateMany({
        where: { categoryId: id },
        data: { categoryId: defaultCategory.id }
      })
    }

    // Marcar categoría como inactiva (soft delete)
    await prisma.category.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Categoría eliminada exitosamente' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}