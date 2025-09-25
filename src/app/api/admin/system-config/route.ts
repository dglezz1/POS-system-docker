import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Función helper para verificar autenticación
async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return { authenticated: false, user: null };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      authenticated: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      },
    };
  } catch (error) {
    return { authenticated: false, user: null };
  }
}

// Obtener configuración del sistema
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated || !auth.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (auth.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener todas las configuraciones
    const configs = await prisma.systemConfig.findMany();

    // Convertir a objeto con valores por defecto
    const configObject = {
      systemName: 'Sistema de Panadería',
      currency: 'COP',
      taxRate: 0.0,
      timezone: 'America/Bogota',
      dateFormat: 'DD/MM/YYYY',
      theme: 'light',
      logo: '',
      primaryColor: '#3B82F6',
      language: 'es',
      enableNotifications: true,
      emailNotifications: true,
      lowStockThreshold: 10,
      enableCakeBar: true,
      enableCustomOrders: true,
      maxCakeBarOptions: 50,
      defaultPaymentMethod: 'EFECTIVO',
      allowPartialPayments: true,
      requireEmployeeClockIn: true,
      maxWorkHours: 8,
      breakDuration: 30,
      passwordMinLength: 6,
      sessionTimeout: 480,
      enableTwoFactor: false,
      backupFrequency: 'daily',
      maintenanceMode: false
    };

    // Aplicar valores de la base de datos
    configs.forEach(config => {
      const value = config.dataType === 'boolean' 
        ? config.value === 'true'
        : config.dataType === 'number'
        ? parseFloat(config.value)
        : config.value;
      
      (configObject as any)[config.key] = value;
    });

    return NextResponse.json(configObject);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Actualizar configuración del sistema
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated || !auth.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (auth.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const data = await request.json();

    // Validar datos básicos
    if (!data.systemName || data.systemName.trim().length === 0) {
      return NextResponse.json(
        { error: 'El nombre del sistema es requerido' },
        { status: 400 }
      );
    }

    if (data.taxRate && (data.taxRate < 0 || data.taxRate > 1)) {
      return NextResponse.json(
        { error: 'La tasa de impuesto debe estar entre 0 y 1' },
        { status: 400 }
      );
    }

    if (data.lowStockThreshold && data.lowStockThreshold < 0) {
      return NextResponse.json(
        { error: 'El umbral de stock bajo debe ser positivo' },
        { status: 400 }
      );
    }

    // Definir configuraciones y sus tipos
    const configDefinitions = [
      { key: 'systemName', value: data.systemName, dataType: 'string', category: 'general', description: 'Nombre del sistema' },
      { key: 'currency', value: data.currency || 'COP', dataType: 'string', category: 'financial', description: 'Moneda del sistema' },
      { key: 'taxRate', value: String(data.taxRate || 0.0), dataType: 'number', category: 'financial', description: 'Tasa de impuesto' },
      { key: 'timezone', value: data.timezone || 'America/Bogota', dataType: 'string', category: 'general', description: 'Zona horaria' },
      { key: 'dateFormat', value: data.dateFormat || 'DD/MM/YYYY', dataType: 'string', category: 'general', description: 'Formato de fecha' },
      { key: 'theme', value: data.theme || 'light', dataType: 'string', category: 'appearance', description: 'Tema del sistema' },
      { key: 'logo', value: data.logo || '', dataType: 'string', category: 'appearance', description: 'Logo del sistema' },
      { key: 'primaryColor', value: data.primaryColor || '#3B82F6', dataType: 'string', category: 'appearance', description: 'Color primario' },
      { key: 'language', value: data.language || 'es', dataType: 'string', category: 'general', description: 'Idioma del sistema' },
      { key: 'enableNotifications', value: String(data.enableNotifications ?? true), dataType: 'boolean', category: 'notifications', description: 'Habilitar notificaciones' },
      { key: 'emailNotifications', value: String(data.emailNotifications ?? true), dataType: 'boolean', category: 'notifications', description: 'Notificaciones por email' },
      { key: 'lowStockThreshold', value: String(data.lowStockThreshold || 10), dataType: 'number', category: 'inventory', description: 'Umbral de stock bajo' },
      { key: 'enableCakeBar', value: String(data.enableCakeBar ?? true), dataType: 'boolean', category: 'features', description: 'Habilitar Cake Bar' },
      { key: 'enableCustomOrders', value: String(data.enableCustomOrders ?? true), dataType: 'boolean', category: 'features', description: 'Habilitar pedidos personalizados' },
      { key: 'maxCakeBarOptions', value: String(data.maxCakeBarOptions || 50), dataType: 'number', category: 'features', description: 'Máximo opciones Cake Bar' },
      { key: 'defaultPaymentMethod', value: data.defaultPaymentMethod || 'EFECTIVO', dataType: 'string', category: 'sales', description: 'Método de pago por defecto' },
      { key: 'allowPartialPayments', value: String(data.allowPartialPayments ?? true), dataType: 'boolean', category: 'sales', description: 'Permitir pagos parciales' },
      { key: 'requireEmployeeClockIn', value: String(data.requireEmployeeClockIn ?? true), dataType: 'boolean', category: 'staff', description: 'Requerir marcado de empleados' },
      { key: 'maxWorkHours', value: String(data.maxWorkHours || 8), dataType: 'number', category: 'staff', description: 'Máximo horas de trabajo' },
      { key: 'breakDuration', value: String(data.breakDuration || 30), dataType: 'number', category: 'staff', description: 'Duración del descanso (minutos)' },
      { key: 'passwordMinLength', value: String(data.passwordMinLength || 6), dataType: 'number', category: 'security', description: 'Longitud mínima de contraseña' },
      { key: 'sessionTimeout', value: String(data.sessionTimeout || 480), dataType: 'number', category: 'security', description: 'Tiempo de sesión (minutos)' },
      { key: 'enableTwoFactor', value: String(data.enableTwoFactor ?? false), dataType: 'boolean', category: 'security', description: 'Habilitar autenticación de dos factores' },
      { key: 'backupFrequency', value: data.backupFrequency || 'daily', dataType: 'string', category: 'system', description: 'Frecuencia de respaldo' },
      { key: 'maintenanceMode', value: String(data.maintenanceMode ?? false), dataType: 'boolean', category: 'system', description: 'Modo mantenimiento' }
    ];

    // Actualizar o crear cada configuración
    for (const config of configDefinitions) {
      await prisma.systemConfig.upsert({
        where: { key: config.key },
        update: {
          value: config.value,
          updatedBy: auth.user.id
        },
        create: {
          key: config.key,
          value: config.value,
          dataType: config.dataType,
          description: config.description,
          category: config.category,
          updatedBy: auth.user.id
        }
      });
    }

    // Obtener configuración actualizada
    const configs = await prisma.systemConfig.findMany();
    const configObject: any = {};
    
    configs.forEach(config => {
      const value = config.dataType === 'boolean' 
        ? config.value === 'true'
        : config.dataType === 'number'
        ? parseFloat(config.value)
        : config.value;
      
      configObject[config.key] = value;
    });

    return NextResponse.json(configObject);
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}