const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateProductsToVitrina() {
  try {
    console.log('Iniciando migración: Cambiar todos los productos a VITRINA...')
    
    // Obtener estadísticas antes de la migración
    const totalProducts = await prisma.product.count()
    const productsByType = await prisma.product.groupBy({
      by: ['type'],
      _count: true
    })
    
    console.log('\n=== ESTADO ACTUAL ===')
    console.log(`Total de productos: ${totalProducts}`)
    console.log('Distribución por tipo:')
    productsByType.forEach(group => {
      console.log(`  ${group.type}: ${group._count}`)
    })
    
    // Obtener productos que no son VITRINA
    const nonVitrinaProducts = await prisma.product.findMany({
      where: {
        NOT: {
          type: 'VITRINA'
        }
      },
      select: {
        id: true,
        name: true,
        type: true
      }
    })
    
    console.log(`\nProductos que serán actualizados: ${nonVitrinaProducts.length}`)
    
    if (nonVitrinaProducts.length === 0) {
      console.log('✅ Todos los productos ya son de tipo VITRINA')
      return
    }
    
    // Mostrar productos que serán cambiados
    console.log('\nProductos a actualizar:')
    nonVitrinaProducts.forEach(product => {
      console.log(`  - ID: ${product.id} | ${product.name} (${product.type} → VITRINA)`)
    })
    
    // Actualizar todos los productos a VITRINA
    const updateResult = await prisma.product.updateMany({
      where: {
        NOT: {
          type: 'VITRINA'
        }
      },
      data: {
        type: 'VITRINA',
        updatedAt: new Date()
      }
    })
    
    console.log(`\n✅ Actualización completada: ${updateResult.count} productos actualizados`)
    
    // Verificar estadísticas después de la migración
    const finalProductsByType = await prisma.product.groupBy({
      by: ['type'],
      _count: true
    })
    
    console.log('\n=== ESTADO FINAL ===')
    console.log('Distribución por tipo:')
    finalProductsByType.forEach(group => {
      console.log(`  ${group.type}: ${group._count}`)
    })
    
    console.log('\n🎉 Migración completada exitosamente')
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar la migración
updateProductsToVitrina()