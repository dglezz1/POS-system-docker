/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para deployment en Docker
  output: 'standalone',
  
  // Configuración para archivos estáticos
  images: {
    unoptimized: true
  },
  
  // Configuración para mejor performance
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
}

module.exports = nextConfig