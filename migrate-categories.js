const { PrismaClient } = require('@prisma/client')

async function migrateCategories() {
  const prisma = new PrismaClient()

  try {
    console.log('🔄 Iniciando migración de categorías...')

    // 1. Obtener todas las categorías únicas existentes en productos
    const existingCategories = await prisma.$queryRaw`
      SELECT DISTINCT category, type 
      FROM Product 
      WHERE category IS NOT NULL AND category != ''
      ORDER BY category, type
    `

    console.log('📊 Categorías encontradas:', existingCategories.length)

    // 2. Crear categorías "Sin Categoría" por defecto
    const defaultCategories = [
      { name: 'Sin Categoría', type: 'VITRINA', color: '#6B7280' },
      { name: 'Sin Categoría', type: 'CAKE_BAR', color: '#6B7280' }
    ]

    for (const defaultCat of defaultCategories) {
      await prisma.category.upsert({
        where: {
          name_type: {
            name: defaultCat.name,
            type: defaultCat.type
          }
        },
        update: {},
        create: {
          name: defaultCat.name,
          type: defaultCat.type,
          color: defaultCat.color,
          sortOrder: 0,
          createdBy: 'migration',
        }
      })
      console.log(`✅ Categoría por defecto creada: ${defaultCat.name} (${defaultCat.type})`)
    }

    // 3. Crear categorías basadas en los datos existentes
    const categoryColors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
      '#8B5CF6', '#06B6D4', '#F97316', '#84CC16',
      '#6366F1', '#EC4899', '#14B8A6', '#F43F5E'
    ]

    for (let i = 0; i < existingCategories.length; i++) {
      const { category, type } = existingCategories[i]
      
      if (category && category.trim() !== '') {
        const color = categoryColors[i % categoryColors.length]
        
        try {
          await prisma.category.upsert({
            where: {
              name_type: {
                name: category.trim(),
                type: type || 'VITRINA'
              }
            },
            update: {},
            create: {
              name: category.trim(),
              type: type || 'VITRINA',
              color: color,
              sortOrder: i + 1,
              createdBy: 'migration',
            }
          })
          console.log(`✅ Categoría migrada: ${category} (${type || 'VITRINA'})`)
        } catch (error) {
          console.error(`❌ Error al crear categoría ${category}:`, error.message)
        }
      }
    }

    // 4. Actualizar productos para usar categoryId
    console.log('🔄 Actualizando productos con nuevas categorías...')
    
    const products = await prisma.product.findMany({
      where: {
        categoryId: null
      }
    })

    let updatedCount = 0
    for (const product of products) {
      try {
        // Buscar la categoría correspondiente
        let categoryName = product.category?.trim() || 'Sin Categoría'
        let productType = product.type || 'VITRINA'

        const matchingCategory = await prisma.category.findFirst({
          where: {
            name: categoryName,
            type: productType,
            isActive: true
          }
        })

        if (matchingCategory) {
          await prisma.product.update({
            where: { id: product.id },
            data: { categoryId: matchingCategory.id }
          })
          updatedCount++
        } else {
          // Asignar a "Sin Categoría"
          const defaultCategory = await prisma.category.findFirst({
            where: {
              name: 'Sin Categoría',
              type: productType,
              isActive: true
            }
          })
          
          if (defaultCategory) {
            await prisma.product.update({
              where: { id: product.id },
              data: { categoryId: defaultCategory.id }
            })
            updatedCount++
          }
        }
      } catch (error) {
        console.error(`❌ Error al actualizar producto ${product.id}:`, error.message)
      }
    }

    console.log(`✅ ${updatedCount} productos actualizados con nuevas categorías`)

    // 5. Mostrar resumen
    const totalCategories = await prisma.category.count({ where: { isActive: true } })
    const vitrinaCategories = await prisma.category.count({ 
      where: { type: 'VITRINA', isActive: true } 
    })
    const cakeBarCategories = await prisma.category.count({ 
      where: { type: 'CAKE_BAR', isActive: true } 
    })

    console.log('\n📊 Resumen de migración:')
    console.log(`- Total de categorías: ${totalCategories}`)
    console.log(`- Categorías Vitrina: ${vitrinaCategories}`)
    console.log(`- Categorías Cake Bar: ${cakeBarCategories}`)
    console.log(`- Productos actualizados: ${updatedCount}`)
    console.log('\n🎉 ¡Migración completada exitosamente!')

  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  migrateCategories()
}

module.exports = { migrateCategories }