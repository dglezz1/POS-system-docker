# Dockerfile para Sistema de Gestión de Panadería - Producción
FROM node:18-alpine AS base

# Instalar dependencias solo cuando sea necesario
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl git
WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild solo cuando sea necesario
FROM base AS builder
RUN apk add --no-cache libc6-compat openssl git
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

# Copiar archivos de configuración primero
COPY package.json package-lock.json* ./
COPY tsconfig.json next.config.js ./
COPY tailwind.config.js postcss.config.js ./
COPY .eslintrc.production.json ./

# Copiar el resto de los archivos del proyecto
COPY prisma/ ./prisma/
COPY src/ ./src/
COPY public/ ./public/
COPY setup-system-config.js ./
COPY setup-default-credentials.js ./
COPY setup-railway-config.js ./

# Generar Prisma Client
RUN npx prisma generate

# Build de la aplicación
RUN npm run build:production

# Imagen de producción
FROM base AS runner
WORKDIR /app

# Instalar dependencias de runtime necesarias para Prisma
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos públicos
COPY --from=builder /app/public ./public

# Establecer permisos correctos para archivos pre-renderizados
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copiar automáticamente los archivos de producción aprovechando trace de Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar esquema de Prisma y configuración
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/setup-system-config.js ./
COPY --from=builder --chown=nextjs:nodejs /app/setup-default-credentials.js ./
COPY --from=builder --chown=nextjs:nodejs /app/setup-railway-config.js ./

# Crear directorio para uploads con permisos
RUN mkdir -p ./public/uploads && chown -R nextjs:nodejs ./public/uploads

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Crear script de inicio optimizado para base de datos nueva
COPY --chown=nextjs:nodejs <<'EOF' /app/start.sh
#!/bin/sh
set -e

echo "🚀 Iniciando Sistema de Gestión de Panadería..."
echo "📊 Configurando base de datos..."

# Verificar que DATABASE_URL esté configurada
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL no está configurada"
    exit 1
fi

echo "🔄 Generando Prisma Client..."
npx prisma generate

echo "🔄 Aplicando migraciones de base de datos..."
# En base de datos nueva, esto debería funcionar sin problemas
if ! npx prisma migrate deploy; then
    echo "❌ Error aplicando migraciones"
    echo "📋 Intentando diagnóstico..."
    npx prisma migrate status || true
    
    # Si hay migraciones pendientes en desarrollo, aplicarlas
    if [ "$ALLOW_DB_PUSH" = "true" ]; then
        echo "🔧 Usando db push como alternativa..."
        npx prisma db push --force-reset
    else
        exit 1
    fi
fi

echo "✅ Migraciones aplicadas correctamente"

# Detectar entorno y configurar apropiadamente
if [ ! -z "$RAILWAY_ENVIRONMENT" ] || [ ! -z "$RAILWAY_PROJECT_ID" ]; then
    echo "🚆 Entorno Railway detectado - Configurando para producción..."
    if ! node setup-railway-config.js; then
        echo "⚠️ Error en configuración Railway (continuando...)"
    fi
else
    echo "🔐 Configurando credenciales por defecto..."
    if ! node setup-default-credentials.js; then
        echo "⚠️ Error en credenciales por defecto (continuando...)"
    fi
fi

# Configurar sistema inicial
echo "⚙️ Configurando sistema inicial..."
if ! node setup-system-config.js; then
    echo "⚠️ Error en configuración del sistema (continuando...)"
fi

echo "✅ Iniciando servidor..."
exec node server.js
EOF

RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]