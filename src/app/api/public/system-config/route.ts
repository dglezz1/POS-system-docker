import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Endpoint público para obtener configuración básica del sistema (para login, etc.)
export async function GET(request: NextRequest) {
  try {
    // Obtener configuraciones públicas (sin requerir autenticación)
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: [
            'systemName',
            'logo', 
            'primaryColor',
            'theme',
            'language'
          ]
        }
      }
    });

    // Convertir a objeto con valores por defecto
    const configObject = {
      systemName: 'Sistema de Panadería',
      logo: '',
      primaryColor: '#3B82F6',
      theme: 'light',
      language: 'es'
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
    console.error('Error al obtener configuración pública:', error);
    
    // En caso de error, devolver configuración por defecto
    return NextResponse.json({
      systemName: 'Sistema de Panadería',
      logo: '',
      primaryColor: '#3B82F6',
      theme: 'light',
      language: 'es'
    });
  }
}