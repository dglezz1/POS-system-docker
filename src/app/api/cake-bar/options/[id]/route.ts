import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updatedOption = await prisma.cakeBarOption.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        priceAdd: body.priceAdd,
        cost: body.cost,
        stock: body.stock,
        minStock: body.minStock,
        hasStock: body.hasStock,
        isActive: body.isActive,
        isDefault: body.isDefault,
        allowMultiple: body.allowMultiple,
        displayOrder: body.displayOrder
      }
    })

    return NextResponse.json(updatedOption)
  } catch (error) {
    console.error('Error updating cake bar option:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la opción' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.cakeBarOption.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cake bar option:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la opción' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const option = await prisma.cakeBarOption.findUnique({
      where: { id }
    })

    if (!option) {
      return NextResponse.json(
        { error: 'Opción no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(option)
  } catch (error) {
    console.error('Error fetching cake bar option:', error)
    return NextResponse.json(
      { error: 'Error al obtener la opción' },
      { status: 500 }
    )
  }
}