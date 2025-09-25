import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

// Función para verificar el token y obtener usuario
async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    return user
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { error: 'ID del producto es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el producto existe y no es ya de tipo cake_bar
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    if (product.type === 'cake_bar') {
      return NextResponse.json(
        { error: 'El producto ya está en el menú Cake Bar' },
        { status: 400 }
      )
    }

    // Crear una copia del producto para el Cake Bar
    const cakeBarProduct = await prisma.product.create({
      data: {
        name: `${product.name} (Cake Bar)`,
        description: product.description,
        price: product.price,
        cost: product.cost,
        stock: product.stock,
        category: product.category,
        type: 'cake_bar',
        barcode: null, // Nuevo código de barras se generará si es necesario
        isActive: true,
        isService: product.isService,
        hasStock: product.hasStock,
        minStock: product.minStock,
        specialPrice: product.specialPrice,
        hasPromotion: false, // Reset promotion for cake bar version
        promotionDiscount: null,
        promotionStartDate: null,
        promotionEndDate: null,
        createdBy: user.id
      }
    })

    // Opcional: crear opciones básicas para el producto del Cake Bar
    const basicOptions = [
      {
        productId: cakeBarProduct.id,
        optionType: 'SIZE',
        name: '10 personas',
        description: 'Tamaño estándar para 10 personas',
        priceAdd: 0,
        isDefault: true,
        displayOrder: 1
      },
      {
        productId: cakeBarProduct.id,
        optionType: 'SIZE', 
        name: '20 personas',
        description: 'Tamaño mediano para 20 personas',
        priceAdd: product.price * 0.5, // 50% más caro
        displayOrder: 2
      },
      {
        productId: cakeBarProduct.id,
        optionType: 'SIZE',
        name: '30 personas', 
        description: 'Tamaño grande para 30 personas',
        priceAdd: product.price * 1.0, // 100% más caro
        displayOrder: 3
      }
    ]

    await prisma.cakeBarOption.createMany({
      data: basicOptions
    })

    return NextResponse.json({
      message: 'Producto añadido al menú Cake Bar exitosamente',
      cakeBarProduct
    })

  } catch (error) {
    console.error('Error adding product to Cake Bar:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}