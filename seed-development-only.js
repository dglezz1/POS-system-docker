// Script para insertar datos de prueba
// Ejecutar: node seed.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de la base de datos...');

  // Hash de contraseñas
  const adminPassword = await bcrypt.hash('admin123', 12);
  const employeePassword = await bcrypt.hash('empleado123', 12);

  // Crear usuario administrador
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@pasteleria.com',
      name: 'Administrador',
      role: 'ADMIN',
      password: adminPassword,
      isActive: true,
    },
  });

  console.log('Usuario administrador creado:', adminUser.email);

  // Crear usuario empleado
  const employeeUser = await prisma.user.create({
    data: {
      email: 'empleado@pasteleria.com',
      name: 'Juan Pérez',
      role: 'EMPLOYEE',
      password: employeePassword,
      isActive: true,
    },
  });

  console.log('Usuario empleado creado:', employeeUser.email);

  // Crear categorías
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Panes',
        description: 'Panes tradicionales y artesanales',
        isActive: true,
        sortOrder: 1,
        createdBy: adminUser.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Pasteles',
        description: 'Pasteles y tortas para toda ocasión',
        isActive: true,
        sortOrder: 2,
        createdBy: adminUser.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Galletas',
        description: 'Galletas dulces y saladas',
        isActive: true,
        sortOrder: 3,
        createdBy: adminUser.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Bebidas',
        description: 'Bebidas calientes y frías',
        isActive: true,
        sortOrder: 4,
        createdBy: adminUser.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Servicios',
        description: 'Servicios especializados de la pastelería',
        isActive: true,
        sortOrder: 5,
        createdBy: adminUser.id,
      },
    }),
  ]);

  console.log('Categorías creadas:', categories.length);

  // Crear ingredientes
  const ingredients = await Promise.all([
    prisma.ingredient.create({
      data: {
        name: 'Harina de trigo',
        unit: 'kg',
        costPerUnit: 2.50,
        currentStock: 50.0,
        minStock: 10.0,
      },
    }),
    prisma.ingredient.create({
      data: {
        name: 'Azúcar',
        unit: 'kg',
        costPerUnit: 1.80,
        currentStock: 25.0,
        minStock: 5.0,
      },
    }),
    prisma.ingredient.create({
      data: {
        name: 'Huevos',
        unit: 'unidad',
        costPerUnit: 0.25,
        currentStock: 120.0,
        minStock: 24.0,
      },
    }),
    prisma.ingredient.create({
      data: {
        name: 'Mantequilla',
        unit: 'kg',
        costPerUnit: 8.00,
        currentStock: 15.0,
        minStock: 3.0,
      },
    }),
  ]);

  console.log('Ingredientes creados:', ingredients.length);

  // Generar código de barras automático
  function generateBarcode() {
    return '789' + Math.random().toString().substr(2, 10);
  }

  // Crear productos de vitrina
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Pan Francés',
        description: 'Pan tradicional francés recién horneado',
        price: 2.50,
        stock: 20,
        category: 'Panes',
        type: 'vitrina',
        barcode: generateBarcode(),
        isActive: true,
        minStock: 5,
        createdBy: adminUser.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Croissant',
        description: 'Croissant de mantequilla tradicional',
        price: 3.00,
        stock: 15,
        category: 'Panes',
        type: 'vitrina',
        barcode: generateBarcode(),
        isActive: true,
        minStock: 3,
        createdBy: adminUser.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Pastel de Chocolate',
        description: 'Delicioso pastel de chocolate con cobertura',
        price: 25.00,
        stock: 5,
        category: 'Pasteles',
        type: 'vitrina',
        barcode: generateBarcode(),
        isActive: true,
        minStock: 2,
        specialPrice: 20.00,
        hasPromotion: true,
        promotionDiscount: 20.0,
        createdBy: adminUser.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Galletas de Avena',
        description: 'Galletas caseras de avena con pasas',
        price: 1.50,
        stock: 30,
        category: 'Galletas',
        type: 'vitrina',
        barcode: generateBarcode(),
        isActive: true,
        minStock: 10,
        createdBy: adminUser.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Café Americano',
        description: 'Café americano recién preparado',
        price: 2.00,
        stock: 100,
        category: 'Bebidas',
        type: 'vitrina',
        barcode: generateBarcode(),
        isActive: true,
        minStock: 20,
        createdBy: adminUser.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Cheesecake',
        description: 'Cheesecake de fresa con base de galleta',
        price: 28.00,
        stock: 3,
        category: 'Pasteles',
        type: 'vitrina',
        barcode: generateBarcode(),
        isActive: true,
        minStock: 1,
        createdBy: adminUser.id,
      },
    }),
  ]);

  console.log('Productos creados:', products.length);

  // Crear algunos productos de cake bar
  const cakeBarProducts = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Pastel Base Vainilla',
        description: 'Base para pastel personalizado sabor vainilla',
        price: 15.00,
        stock: 10,
        category: 'Pasteles',
        type: 'cake_bar',
        isActive: true,
        minStock: 2,
        createdBy: adminUser.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Pastel Base Chocolate',
        description: 'Base para pastel personalizado sabor chocolate',
        price: 18.00,
        stock: 8,
        category: 'Pasteles',
        type: 'cake_bar',
        isActive: true,
        minStock: 2,
        createdBy: adminUser.id,
      },
    }),
  ]);

  console.log('Productos Cake Bar creados:', cakeBarProducts.length);

  // Crear opciones de personalización para Cake Bar
  const cakeBarOptions = await Promise.all([
    // Sabores de pan/bizcocho
    prisma.cakeBarOption.create({
      data: {
        optionType: 'BREAD_FLAVOR',
        name: 'Vainilla Clásica',
        description: 'Bizcocho tradicional de vainilla, suave y esponjoso',
        priceAdd: 0.00,
        isActive: true,
        isDefault: true,
        allowMultiple: false,
        displayOrder: 1,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'BREAD_FLAVOR',
        name: 'Chocolate Intenso',
        description: 'Bizcocho de chocolate con cacao premium',
        priceAdd: 2.00,
        isActive: true,
        isDefault: false,
        allowMultiple: false,
        displayOrder: 2,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'BREAD_FLAVOR',
        name: 'Red Velvet',
        description: 'Bizcocho rojo terciopelo con toque de cacao',
        priceAdd: 3.50,
        isActive: true,
        isDefault: false,
        allowMultiple: false,
        displayOrder: 3,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'BREAD_FLAVOR',
        name: 'Limón',
        description: 'Bizcocho cítrico con ralladura de limón natural',
        priceAdd: 2.50,
        isActive: true,
        isDefault: false,
        allowMultiple: false,
        displayOrder: 4,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'BREAD_FLAVOR',
        name: 'Zanahoria',
        description: 'Bizcocho de zanahoria con especias tradicionales',
        priceAdd: 3.00,
        isActive: true,
        isDefault: false,
        allowMultiple: false,
        displayOrder: 5,
      },
    }),

    // Rellenos
    prisma.cakeBarOption.create({
      data: {
        optionType: 'FILLING',
        name: 'Dulce de Leche',
        description: 'Cremoso dulce de leche artesanal',
        priceAdd: 2.50,
        isActive: true,
        isDefault: true,
        allowMultiple: false,
        displayOrder: 1,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'FILLING',
        name: 'Crema de Chocolate',
        description: 'Crema suave de chocolate belga',
        priceAdd: 3.00,
        isActive: true,
        isDefault: false,
        allowMultiple: false,
        displayOrder: 2,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'FILLING',
        name: 'Crema de Vainilla',
        description: 'Crema pastelera de vainilla natural',
        priceAdd: 2.00,
        isActive: true,
        isDefault: false,
        allowMultiple: false,
        displayOrder: 3,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'FILLING',
        name: 'Frutas Frescas',
        description: 'Relleno de frutas de temporada con crema',
        priceAdd: 4.00,
        isActive: true,
        isDefault: false,
        allowMultiple: false,
        displayOrder: 4,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'FILLING',
        name: 'Nutella',
        description: 'Relleno cremoso de avellanas y chocolate',
        priceAdd: 4.50,
        isActive: true,
        isDefault: false,
        allowMultiple: false,
        displayOrder: 5,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'FILLING',
        name: 'Mermelada de Fresa',
        description: 'Mermelada casera de fresas naturales',
        priceAdd: 2.50,
        isActive: true,
        isDefault: false,
        allowMultiple: false,
        displayOrder: 6,
      },
    }),

    // Colores/decoración
    prisma.cakeBarOption.create({
      data: {
        optionType: 'COLOR',
        name: 'Blanco Natural',
        description: 'Cobertura blanca clásica sin colorantes',
        priceAdd: 0.00,
        isActive: true,
        isDefault: true,
        allowMultiple: false,
        displayOrder: 1,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'COLOR',
        name: 'Rosa Pastel',
        description: 'Tono rosa suave y delicado',
        priceAdd: 1.50,
        isActive: true,
        isDefault: false,
        allowMultiple: false,
        displayOrder: 2,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'COLOR',
        name: 'Azul Cielo',
        description: 'Azul claro y brillante',
        priceAdd: 1.50,
        isActive: true,
        isDefault: false,
        allowMultiple: false,
        displayOrder: 3,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'COLOR',
        name: 'Chocolate',
        description: 'Cobertura de chocolate oscuro',
        priceAdd: 2.00,
        isActive: true,
        isDefault: false,
        allowMultiple: false,
        displayOrder: 4,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'COLOR',
        name: 'Multicolor',
        description: 'Diseño con múltiples colores vibrantes',
        priceAdd: 3.50,
        isActive: true,
        isDefault: false,
        allowMultiple: false,
        displayOrder: 5,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'COLOR',
        name: 'Dorado Elegante',
        description: 'Acabado dorado para ocasiones especiales',
        priceAdd: 5.00,
        isActive: true,
        isDefault: false,
        allowMultiple: false,
        displayOrder: 6,
      },
    }),

    // Toppings/decoraciones extras - Organizados por categorías
    
    // === CHOCOLATES ===
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'CHOCOLATES',
        name: 'Kisses de Hershey',
        description: 'Chocolates Kisses clásicos de Hershey',
        priceAdd: 1.50,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 1,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'CHOCOLATES',
        name: 'Mamut Mini',
        description: 'Mini chocolates Mamut',
        priceAdd: 2.00,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 2,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'CHOCOLATES',
        name: 'Ferrero Rocher',
        description: 'Chocolates Ferrero Rocher premium',
        priceAdd: 3.50,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 3,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'CHOCOLATES',
        name: 'Raffaello',
        description: 'Chocolates blancos Raffaello con coco',
        priceAdd: 3.50,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 4,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'CHOCOLATES',
        name: 'Carlos V',
        description: 'Chocolates Carlos V tradicionales',
        priceAdd: 2.50,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 5,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'CHOCOLATES',
        name: 'Kinder Bueno Mini',
        description: 'Mini chocolates Kinder Bueno',
        priceAdd: 2.75,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 6,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'CHOCOLATES',
        name: 'Kinder Bueno Normal',
        description: 'Chocolates Kinder Bueno tamaño normal',
        priceAdd: 3.00,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 7,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'CHOCOLATES',
        name: 'Huevo Kinder',
        description: 'Huevos Kinder con sorpresa',
        priceAdd: 4.00,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 8,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'CHOCOLATES',
        name: 'Crunch',
        description: 'Chocolates Crunch crujientes',
        priceAdd: 2.25,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 9,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'CHOCOLATES',
        name: 'Conejo Turín Mini',
        description: 'Mini conejos de chocolate Turín',
        priceAdd: 2.50,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 10,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'CHOCOLATES',
        name: 'Monedas de Chocolate',
        description: 'Monedas doradas de chocolate',
        priceAdd: 1.75,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 11,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'CHOCOLATES',
        name: 'Bombones Surtidos',
        description: 'Bombones de chocolate con rellenos variados',
        priceAdd: 3.25,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 12,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'CHOCOLATES',
        name: 'Mini Balones de Chocolate',
        description: 'Pequeños balones decorativos de chocolate',
        priceAdd: 2.00,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 13,
      },
    }),

    // === FLORES COMESTIBLES ===
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'FLORES',
        name: 'Flores Mini',
        description: 'Pequeñas flores comestibles decorativas',
        priceAdd: 2.50,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 1,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'FLORES',
        name: 'Flores Chicas',
        description: 'Flores comestibles tamaño chico',
        priceAdd: 3.50,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 2,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'FLORES',
        name: 'Flores Medianas',
        description: 'Flores comestibles tamaño mediano',
        priceAdd: 4.50,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 3,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'FLORES',
        name: 'Flores Grandes',
        description: 'Flores comestibles tamaño grande',
        priceAdd: 6.00,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 4,
      },
    }),

    // === PERLAS Y CONFITES ===
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'PERLAS_CONFITES',
        name: 'Perlas Blancas',
        description: 'Perlas comestibles blancas nacaradas',
        priceAdd: 1.50,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 1,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'PERLAS_CONFITES',
        name: 'Perlas Doradas',
        description: 'Perlas comestibles doradas elegantes',
        priceAdd: 2.00,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 2,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'PERLAS_CONFITES',
        name: 'Perlas Plateadas',
        description: 'Perlas comestibles plateadas brillantes',
        priceAdd: 2.00,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 3,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'PERLAS_CONFITES',
        name: 'Confites Multicolor',
        description: 'Confites pequeños de colores variados',
        priceAdd: 1.25,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 4,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'PERLAS_CONFITES',
        name: 'Sprinkles Arcoíris',
        description: 'Sprinkles largos de colores del arcoíris',
        priceAdd: 1.00,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 5,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'PERLAS_CONFITES',
        name: 'Chispas de Chocolate',
        description: 'Pequeñas chispas de chocolate para decorar',
        priceAdd: 1.25,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 6,
      },
    }),

    // === FIGURAS DECORATIVAS ===
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'FIGURAS',
        name: 'Figuras de Azúcar',
        description: 'Pequeñas figuras decorativas hechas de azúcar',
        priceAdd: 3.00,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 1,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'FIGURAS',
        name: 'Mariposas Comestibles',
        description: 'Delicadas mariposas comestibles de azúcar',
        priceAdd: 3.50,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 2,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'FIGURAS',
        name: 'Corazones de Chocolate',
        description: 'Pequeños corazones decorativos de chocolate',
        priceAdd: 2.50,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 3,
      },
    }),

    // === OPCIONES ESPECIALES ===
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'ESPECIALES',
        name: 'Sin Decoración Extra',
        description: 'Solo la cobertura base sin toppings adicionales',
        priceAdd: 0.00,
        isActive: true,
        isDefault: true,
        allowMultiple: false,
        displayOrder: 1,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'ESPECIALES',
        name: 'Escribir Mensaje',
        description: 'Mensaje personalizado escrito en el pastel',
        priceAdd: 2.50,
        isActive: true,
        isDefault: false,
        allowMultiple: false,
        displayOrder: 2,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'ESPECIALES',
        name: 'Frutas Frescas',
        description: 'Decoración con frutas frescas de temporada',
        priceAdd: 4.00,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 3,
      },
    }),
    prisma.cakeBarOption.create({
      data: {
        optionType: 'TOPPING',
        category: 'ESPECIALES',
        name: 'Velas Temáticas',
        description: 'Velas especiales según la ocasión',
        priceAdd: 3.00,
        isActive: true,
        isDefault: false,
        allowMultiple: true,
        displayOrder: 4,
      },
    }),
  ]);

  console.log('Opciones de Cake Bar creadas:', cakeBarOptions.length);

  // Crear servicios de ejemplo
  const services = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Decoración de Pastel Personalizada',
        description: 'Servicio de decoración personalizada para pasteles con diseños únicos',
        price: 25.00,
        stock: 0,
        category: 'Servicios',
        type: 'vitrina',
        isActive: true,
        isService: true,
        minStock: 0,
        createdBy: adminUser.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Curso de Repostería Básica',
        description: 'Clase grupal de repostería básica, duración 3 horas',
        price: 45.00,
        stock: 0,
        category: 'Servicios',
        type: 'vitrina',
        isActive: true,
        isService: true,
        minStock: 0,
        createdBy: adminUser.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Consultoría de Menú',
        description: 'Asesoría personalizada para desarrollar menú de repostería',
        price: 80.00,
        stock: 0,
        category: 'Servicios',
        type: 'vitrina',
        isActive: true,
        isService: true,
        minStock: 0,
        createdBy: adminUser.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Instalación y Armado en Evento',
        description: 'Servicio de instalación y armado de postres en eventos especiales',
        price: 60.00,
        stock: 0,
        category: 'Servicios',
        type: 'cake_bar',
        isActive: true,
        isService: true,
        minStock: 0,
        createdBy: adminUser.id,
      },
    }),
  ]);

  console.log('Servicios creados:', services.length);

  // Crear registro de caja inicial
  const cashRegister = await prisma.cashRegister.create({
    data: {
      openingCash: 100.00,
      totalSales: 0.00,
      totalExpenses: 0.00,
      status: 'open',
      openedBy: adminUser.id,
      notes: 'Caja inicial del sistema',
    },
  });

  console.log('Registro de caja creado:', cashRegister.id);

  console.log('✅ Seed completado exitosamente!');
  console.log('Datos creados:');
  console.log(`- 1 usuario administrador (${adminUser.email})`);
  console.log(`- ${categories.length} categorías`);
  console.log(`- ${ingredients.length} ingredientes`);
  console.log(`- ${products.length} productos de vitrina`);
  console.log(`- ${cakeBarProducts.length} productos de cake bar`);
  console.log(`- ${cakeBarOptions.length} opciones de personalización`);
  console.log(`- 1 registro de caja`);
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });