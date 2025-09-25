import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // VITRINA, CAKE_BAR, or ALL
    
    // Construir filtros según el tipo solicitado
    const whereClause: any = {}
    if (type && type !== 'ALL') {
      whereClause.type = type
    }

    // Obtener productos
    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    })

    // Preparar datos para Excel
    const excelData = products.map(product => ({
      'ID': product.id,
      'Nombre': product.name,
      'Descripción': product.description || '',
      'Precio': product.price,
      'Stock': product.stock,
      'Stock Mínimo': product.minStock || 0,
      'Categoría': product.category || '',
      'Tipo': product.type,
      'Código de Barras': product.barcode || '',
      'Es Servicio': product.isService ? 'SÍ' : 'NO',
      'Activo': product.isActive ? 'SÍ' : 'NO',
      'Precio Especial': product.specialPrice || '',
      'Tiene Promoción': product.hasPromotion ? 'SÍ' : 'NO',
      'Descuento Promoción': product.promotionDiscount || 0,
      'Fecha Creación': product.createdAt.toISOString().split('T')[0],
      'Fecha Actualización': product.updatedAt.toISOString().split('T')[0]
    }))

    // Crear libro de Excel
    const workbook = XLSX.utils.book_new()
    
    // Crear hoja de productos
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    
    // Ajustar anchos de columna
    const columnWidths = [
      { wch: 8 },   // ID
      { wch: 25 },  // Nombre
      { wch: 30 },  // Descripción
      { wch: 12 },  // Precio
      { wch: 10 },  // Stock
      { wch: 15 },  // Stock Mínimo
      { wch: 20 },  // Categoría
      { wch: 12 },  // Tipo
      { wch: 15 },  // Código de Barras
      { wch: 12 },  // Es Servicio
      { wch: 10 },  // Activo
      { wch: 15 },  // Precio Especial
      { wch: 15 },  // Tiene Promoción
      { wch: 18 },  // Descuento Promoción
      { wch: 15 },  // Fecha Creación
      { wch: 18 }   // Fecha Actualización
    ]
    worksheet['!cols'] = columnWidths

    // Agregar hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario')

    // Convertir a buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx' 
    })

    // Generar nombre de archivo con fecha
    const currentDate = new Date().toISOString().split('T')[0]
    const typeLabel = type === 'ALL' ? 'Completo' : type || 'Completo'
    const filename = `Inventario_${typeLabel}_${currentDate}.xlsx`

    // Configurar headers para descarga
    const headers = new Headers()
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    headers.set('Content-Length', excelBuffer.length.toString())

    return new NextResponse(excelBuffer, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Error exporting inventory:', error)
    return NextResponse.json(
      { error: 'Error al exportar inventario' },
      { status: 500 }
    )
  }
}