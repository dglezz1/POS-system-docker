const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseSaleItems() {
  console.log('🔍 Diagnosticando datos huérfanos en SaleItems...\n');

  try {
    // Obtener todos los SaleItems
    const allSaleItems = await prisma.saleItem.findMany({
      include: {
        product: true,
        sale: true
      }
    });

    console.log(`📊 Total de SaleItems: ${allSaleItems.length}`);

    // Identificar SaleItems sin producto
    const orphanedSaleItems = allSaleItems.filter(item => !item.product);
    
    if (orphanedSaleItems.length > 0) {
      console.log(`❌ SaleItems huérfanos encontrados: ${orphanedSaleItems.length}`);
      console.log('\nDetalles de SaleItems huérfanos:');
      
      orphanedSaleItems.forEach(item => {
        console.log(`- SaleItem ID: ${item.id}, ProductID: ${item.productId}, Sale: ${item.sale?.saleNumber || 'N/A'}`);
      });

      console.log('\n🛠️  Para corregir, puedes ejecutar:');
      console.log('1. Eliminar SaleItems huérfanos');
      console.log('2. O asignarlos a un producto genérico');
      
    } else {
      console.log('✅ No se encontraron SaleItems huérfanos');
    }

    // Verificar productos más vendidos para debug
    console.log('\n📈 Analizando productos más vendidos...');
    const productSales = {};
    
    allSaleItems.forEach(item => {
      if (item.product && item.product.name) {
        const key = item.product.name;
        if (!productSales[key]) {
          productSales[key] = {
            product: {
              id: item.product.id,
              name: item.product.name,
              category: item.product.category
            },
            quantity: 0,
            revenue: 0
          };
        }
        productSales[key].quantity += item.quantity;
        productSales[key].revenue += item.subtotal;
      } else {
        console.log(`⚠️  SaleItem ${item.id} tiene producto inválido:`, item.product);
      }
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    console.log('\nTop 5 productos más vendidos:');
    topProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.product.name} - ${product.quantity} unidades - $${product.revenue.toFixed(2)}`);
    });

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseSaleItems();