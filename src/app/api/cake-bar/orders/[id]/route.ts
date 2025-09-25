import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const order = await prisma.cakeBarOrder.findUnique({
      where: { id: parseInt(id) },
      include: {
        product: true,
        customizations: {
          include: {
            option: true
          }
        },
        payments: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching cake bar order:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, assignedWorker, completedBy, notes } = body

    const order = await prisma.cakeBarOrder.findUnique({
      where: { id: parseInt(id) }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    let updateData: any = {}

    if (status) {
      updateData.status = status
      
      if (status === 'in_progress') {
        updateData.startTime = new Date()
        updateData.assignedWorker = assignedWorker || 'system'
        
        // Calcular tiempo estimado (30 minutos después)
        const estimatedReady = new Date()
        estimatedReady.setMinutes(estimatedReady.getMinutes() + 30)
        updateData.estimatedReady = estimatedReady
      }
      
      if (status === 'ready' || status === 'completed') {
        updateData.completedTime = new Date()
        updateData.completedBy = completedBy || 'system'
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    const updatedOrder = await prisma.cakeBarOrder.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        product: true,
        customizations: {
          include: {
            option: true
          }
        },
        payments: true
      }
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating cake bar order:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}