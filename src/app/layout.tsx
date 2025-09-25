import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { SystemConfigProvider } from '@/contexts/SystemConfigContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistema de Gestión de Pastelería',
  description: 'Sistema completo para la gestión de inventario, ventas y pedidos de pastelería',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <SystemConfigProvider>
              {children}
            </SystemConfigProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}