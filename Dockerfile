FROM node:18-alpine AS base

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache libc6-compat openssl ca-certificates

FROM base AS deps
WORKDIR /app

# Copiar archivos de configuración
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instalar dependencias incluyendo devDependencies para Prisma
RUN npm ci

# Generar cliente Prisma en la etapa de deps
RUN npx prisma generate

FROM base AS builder
WORKDIR /app

# Copiar node_modules y cliente generado de la etapa anterior
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copiar archivos de configuración
COPY package.json package-lock.json* ./
COPY tsconfig.json next.config.js ./
COPY tailwind.config.js postcss.config.js ./

# Copiar código fuente
COPY src ./src
COPY public ./public
COPY setup-*.js ./

# Build de la aplicación
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar archivos públicos
COPY --from=builder /app/public ./public

# Crear directorio .next y establecer permisos
RUN mkdir .next && chown nextjs:nodejs .next

# Copiar build de Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# CRÍTICO: Copiar TODOS los archivos de Prisma correctamente
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copiar scripts de configuración
COPY --from=builder --chown=nextjs:nodejs /app/setup-system-config.js ./
COPY --from=builder --chown=nextjs:nodejs /app/setup-default-credentials.js ./
COPY --from=builder --chown=nextjs:nodejs /app/setup-railway-config.js ./

# Crear directorio de uploads
RUN mkdir -p ./public/uploads && chown -R nextjs:nodejs ./public/uploads

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Script de inicio optimizado que evita regenerar Prisma
COPY --chown=nextjs:nodejs <<'EOF' /app/start.sh
#!/bin/sh
set -e

echo "🚀 Iniciando Sistema de Gestión de Panadería..."

# Verificar que DATABASE_URL esté configurada
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL no está configurada"
    exit 1
fi

echo "📊 Configurando base de datos..."

# Verificar que el cliente de Prisma esté disponible
if [ ! -d "/app/node_modules/.prisma/client" ]; then
    echo "❌ ERROR: Cliente de Prisma no encontrado"
    exit 1
fi

echo "✅ Cliente de Prisma verificado"

# Aplicar schema usando db push para evitar problemas de migración
echo "🔄 Aplicando schema de base de datos..."
if ! npx prisma db push --skip-generate; then
    echo "❌ Error aplicando schema, intentando con force-reset..."
    if ! npx prisma db push --force-reset --skip-generate; then
        echo "❌ Error crítico aplicando schema"
        exit 1
    fi
fi

echo "✅ Schema aplicado correctamente"

# Detectar entorno Railway
if [ ! -z "$RAILWAY_ENVIRONMENT" ] || [ ! -z "$RAILWAY_PROJECT_ID" ]; then
    echo "🚆 Entorno Railway detectado"
    if ! node setup-railway-config.js; then
        echo "⚠️ Error en configuración Railway (continuando...)"
    fi
else
    echo "🔐 Configurando credenciales por defecto"
    if ! node setup-default-credentials.js; then
        echo "⚠️ Error en credenciales por defecto (continuando...)"
    fi
fi

# Configurar sistema
echo "⚙️ Configurando sistema inicial..."
if ! node setup-system-config.js; then
    echo "⚠️ Error en configuración del sistema (continuando...)"
fi

echo "✅ Iniciando servidor Next.js..."
exec node server.js
EOF

RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]