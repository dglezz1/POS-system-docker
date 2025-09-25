import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Función para determinar el tipo de producto según la categoría
function determineProductType(category: string, explicitType?: string): string {
  // Si se especifica un tipo explícito, usarlo
  if (explicitType && ['VITRINA', 'CAKE_BAR'].includes(explicitType.toUpperCase())) {
    return explicitType.toUpperCase();
  }

  // Categorías específicas para Cake Bar
  const cakeBarCategories = [
    'CAKE_BAR_DECORATIONS',
    'DECORACIONES_TORTA',
    'TOPPINGS_CAKE_BAR',
    'CHOCOLATES_DECORACION',
    'FIGURAS_TORTA'
  ];

  // Categorías específicas para Vitrina
  const vitrinaCategories = [
    'VELAS_VITRINA',
    'PRODUCTOS_HORNEADOS',
    'BEBIDAS',
    'VITRINA_GENERAL',
    'OTROS_VITRINA'
  ];

  // Servicios se asignan según su nombre o categoría
  if (category.includes('SERVICIOS')) {
    // Servicios de panadería van a vitrina por defecto
    return 'VITRINA';
  }

  // Verificar categorías específicas
  if (cakeBarCategories.some(cat => category.includes(cat) || category.includes('CAKE_BAR'))) {
    return 'CAKE_BAR';
  }

  if (vitrinaCategories.some(cat => category.includes(cat) || category.includes('VITRINA'))) {
    return 'VITRINA';
  }

  // Por defecto, productos van a vitrina
  return 'VITRINA';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Error al obtener producto' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    const body = await request.json();
    const {
      name,
      description,
      price,
      stock,
      category,
      type,
      barcode,
      isActive,
      isService,
      minStock,
      specialPrice,
      hasPromotion,
      promotionDiscount,
      promotionStartDate,
      promotionEndDate,
      userId = 'system' // En producción esto vendría del usuario autenticado
    } = body;

    // Obtener producto actual para comparar cambios
    const currentProduct = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!currentProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Verificar código de barras único si cambió
    if (barcode && barcode !== currentProduct.barcode) {
      const existingProduct = await prisma.product.findUnique({
        where: { barcode }
      });
      
      if (existingProduct && existingProduct.id !== productId) {
        return NextResponse.json(
          { error: 'El código de barras ya existe' },
          { status: 400 }
        );
      }
    }

    // Determinar el tipo automáticamente basado en la categoría
    const finalType = determineProductType(category, type);

    // Actualizar producto
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: isService ? 0 : parseInt(stock),
        category,
        type: finalType,
        barcode,
        isActive,
        isService,
        minStock: isService ? 0 : parseInt(minStock),
        specialPrice: specialPrice ? parseFloat(specialPrice) : null,
        hasPromotion,
        promotionDiscount: promotionDiscount ? parseFloat(promotionDiscount) : null,
        promotionStartDate: promotionStartDate ? new Date(promotionStartDate) : null,
        promotionEndDate: promotionEndDate ? new Date(promotionEndDate) : null,
      },
    });

    // Registrar movimiento de stock si cambió
    if (currentProduct.stock !== parseInt(stock)) {
      const stockDifference = parseInt(stock) - currentProduct.stock;
      
      await prisma.stockMovement.create({
        data: {
          productId,
          type: 'adjustment',
          quantity: stockDifference,
          previousStock: currentProduct.stock,
          newStock: parseInt(stock),
          reason: 'Ajuste manual',
          userId,
        },
      });
    }

    // Registrar cambios para auditoría
    const changes = [];
    
    if (currentProduct.name !== name) {
      changes.push({ field: 'name', oldValue: currentProduct.name, newValue: name });
    }
    
    if (currentProduct.price !== parseFloat(price)) {
      changes.push({ field: 'price', oldValue: currentProduct.price.toString(), newValue: price.toString() });
    }
    
    if (currentProduct.stock !== parseInt(stock)) {
      changes.push({ field: 'stock', oldValue: currentProduct.stock.toString(), newValue: stock.toString() });
    }
    
    if (currentProduct.isActive !== isActive) {
      changes.push({ field: 'isActive', oldValue: currentProduct.isActive.toString(), newValue: isActive.toString() });
    }

    // Guardar todos los cambios
    for (const change of changes) {
      await prisma.productChange.create({
        data: {
          productId,
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          userId,
        },
      });
    }

    // Crear alerta si el stock está bajo
    if (parseInt(stock) <= parseInt(minStock) && currentProduct.stock > currentProduct.minStock) {
      await prisma.alert.create({
        data: {
          type: 'low_stock',
          title: 'Stock Bajo',
          message: `El producto "${name}" tiene stock bajo (${stock} unidades)`,
          severity: 'warning',
          productId,
          data: JSON.stringify({ stock: parseInt(stock), minStock: parseInt(minStock) }),
        },
      });
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Error al actualizar producto' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    // Verificar que el producto existe
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // En lugar de eliminar físicamente, desactivar el producto
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        isActive: false,
      },
    });

    // Registrar el cambio
    await prisma.productChange.create({
      data: {
        productId,
        field: 'deleted',
        oldValue: 'active',
        newValue: 'deleted',
        userId: 'system',
      },
    });

    return NextResponse.json({ message: 'Producto desactivado correctamente' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Error al eliminar producto' },
      { status: 500 }
    );
  }
}