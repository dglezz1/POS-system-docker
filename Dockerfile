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
COPY --from=builder --chown=nextjs:nodejs /app/setup-system-config.js ./
COPY --from=builder --chown=nextjs:nodejs /app/setup-default-credentials.js ./

# Crear directorio para uploads con permisos
RUN mkdir -p ./public/uploads && chown -R nextjs:nodejs ./public/uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Crear script de inicio
COPY --chown=nextjs:nodejs <<EOF /app/start.sh
#!/bin/sh
echo "🚀 Iniciando Sistema de Gestión de Panadería..."
echo "📊 Configurando base de datos..."

# Ejecutar migraciones de Prisma
npx prisma migrate deploy

# Configurar credenciales por defecto
echo "🔐 Configurando credenciales por defecto..."
node setup-default-credentials.js

# Configurar sistema inicial
echo "⚙️ Configurando sistema inicial..."
node setup-system-config.js

echo "✅ Iniciando servidor..."
node server.js
EOF

RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]