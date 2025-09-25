import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(ingredients)
  } catch (error) {
    console.error('Error fetching ingredients:', error)
    return NextResponse.json(
      { error: 'Error al obtener ingredientes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, unit, costPerUnit, currentStock, minStock } = body

    if (!name || !unit || costPerUnit === undefined) {
      return NextResponse.json(
        { error: 'Nombre, unidad y costo por unidad son requeridos' },
        { status: 400 }
      )
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        unit,
        costPerUnit: parseFloat(costPerUnit),
        currentStock: parseFloat(currentStock) || 0,
        minStock: parseFloat(minStock) || 0,
      },
    })

    return NextResponse.json(ingredient, { status: 201 })
  } catch (error) {
    console.error('Error creating ingredient:', error)
    return NextResponse.json(
      { error: 'Error al crear ingrediente' },
      { status: 500 }
    )
  }
}