import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    // Leer archivo Excel
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer)
    
    // Obtener la primera hoja
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Convertir a JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet)
    
    if (jsonData.length === 0) {
      return NextResponse.json(
        { error: 'El archivo Excel está vacío' },
        { status: 400 }
      )
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[]
    }

    // Procesar cada fila
    for (let i = 0; i < jsonData.length; i++) {
      const row: any = jsonData[i]
      
      try {
        // Validar campos obligatorios
        if (!row['Nombre']) {
          results.errors.push(`Fila ${i + 2}: Nombre es obligatorio`)
          continue
        }
        
        if (typeof row['Precio'] !== 'number' || row['Precio'] < 0) {
          results.errors.push(`Fila ${i + 2}: Precio debe ser un número mayor o igual a 0`)
          continue
        }

        if (typeof row['Stock'] !== 'number' || row['Stock'] < 0) {
          results.errors.push(`Fila ${i + 2}: Stock debe ser un número mayor o igual a 0`)
          continue
        }

        // Validar tipo
        const validTypes = ['VITRINA', 'CAKE_BAR']
        if (!validTypes.includes(row['Tipo'])) {
          results.errors.push(`Fila ${i + 2}: Tipo debe ser VITRINA o CAKE_BAR`)
          continue
        }

        // Preparar datos del producto
        const productData = {
          name: row['Nombre'],
          description: row['Descripción'] || null,
          price: typeof row['Precio'] === 'number' ? row['Precio'] : parseFloat(row['Precio']),
          stock: typeof row['Stock'] === 'number' ? row['Stock'] : parseInt(row['Stock']),
          minStock: row['Stock Mínimo'] ? (typeof row['Stock Mínimo'] === 'number' ? row['Stock Mínimo'] : parseInt(row['Stock Mínimo'])) : 0,
          category: row['Categoría'] || 'Sin categoría',
          type: row['Tipo'],
          barcode: row['Código de Barras'] || null,
          isService: row['Es Servicio'] === 'SÍ',
          isActive: row['Activo'] !== 'NO', // Default true si no es NO
          specialPrice: row['Precio Especial'] ? parseFloat(row['Precio Especial']) : null,
          hasPromotion: row['Tiene Promoción'] === 'SÍ',
          promotionDiscount: row['Descuento Promoción'] ? parseFloat(row['Descuento Promoción']) : null,
          createdBy: 'import',
          updatedAt: new Date()
        }

        // Si hay ID, intentar actualizar; si no, crear nuevo
        if (row['ID'] && typeof row['ID'] === 'number') {
          const existingProduct = await prisma.product.findUnique({
            where: { id: row['ID'] }
          })

          if (existingProduct) {
            // Actualizar producto existente
            await prisma.product.update({
              where: { id: row['ID'] },
              data: productData
            })
            results.updated++
          } else {
            // ID no existe, crear nuevo producto sin especificar ID
            await prisma.product.create({
              data: productData
            })
            results.created++
          }
        } else {
          // No hay ID, crear nuevo producto
          await prisma.product.create({
            data: productData
          })
          results.created++
        }

      } catch (error: any) {
        results.errors.push(`Fila ${i + 2}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Importación completada. Creados: ${results.created}, Actualizados: ${results.updated}, Errores: ${results.errors.length}`,
      results
    })

  } catch (error) {
    console.error('Error importing inventory:', error)
    return NextResponse.json(
      { error: 'Error al importar inventario' },
      { status: 500 }
    )
  }
}

// Endpoint para generar plantilla de Excel
export async function GET() {
  try {
    // Datos de ejemplo para la plantilla
    const templateData = [
      {
        'ID': '', // Dejar vacío para nuevos productos, llenar para actualizar
        'Nombre': 'Croissant de Jamón',
        'Descripción': 'Croissant relleno de jamón y queso',
        'Precio': 3500,
        'Stock': 10,
        'Stock Mínimo': 5,
        'Categoría': 'Panadería',
        'Tipo': 'VITRINA',
        'Código de Barras': '1234567890',
        'Es Servicio': 'NO',
        'Activo': 'SÍ',
        'Precio Especial': '',
        'Tiene Promoción': 'NO',
        'Descuento Promoción': 0
      },
      {
        'ID': '',
        'Nombre': 'Decoración Fondant',
        'Descripción': 'Servicio de decoración con fondant',
        'Precio': 15000,
        'Stock': 0,
        'Stock Mínimo': 0,
        'Categoría': 'Servicios',
        'Tipo': 'CAKE_BAR',
        'Código de Barras': '',
        'Es Servicio': 'SÍ',
        'Activo': 'SÍ',
        'Precio Especial': '',
        'Tiene Promoción': 'SÍ',
        'Descuento Promoción': 10
      }
    ]

    // Crear libro de Excel
    const workbook = XLSX.utils.book_new()
    
    // Crear hoja de plantilla
    const worksheet = XLSX.utils.json_to_sheet(templateData)
    
    // Agregar comentarios en la primera fila
    const comments = {
      A1: 'Dejar vacío para crear nuevo producto, completar con ID existente para actualizar',
      B1: 'Nombre del producto (OBLIGATORIO)',
      C1: 'Descripción opcional del producto',
      D1: 'Precio del producto (OBLIGATORIO, número mayor a 0)',
      E1: 'Cantidad en stock (OBLIGATORIO, número mayor o igual a 0)',
      F1: 'Stock mínimo para alertas (opcional, default: 0)',
      G1: 'Categoría del producto (opcional)',
      H1: 'Tipo: VITRINA o CAKE_BAR (OBLIGATORIO)',
      I1: 'Código de barras (opcional)',
      J1: 'Es servicio: SÍ o NO',
      K1: 'Producto activo: SÍ o NO',
      L1: 'Precio especial (opcional)',
      M1: 'Tiene promoción: SÍ o NO',
      N1: 'Descuento de promoción en porcentaje (0-100)'
    }

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
      { wch: 18 }   // Descuento Promoción
    ]
    worksheet['!cols'] = columnWidths

    // Agregar hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla_Inventario')

    // Convertir a buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx' 
    })

    // Configurar headers para descarga
    const headers = new Headers()
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    headers.set('Content-Disposition', 'attachment; filename="Plantilla_Inventario.xlsx"')
    headers.set('Content-Length', excelBuffer.length.toString())

    return new NextResponse(excelBuffer, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Error generating template:', error)
    return NextResponse.json(
      { error: 'Error al generar plantilla' },
      { status: 500 }
    )
  }
}