'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Lock, Mail, AlertCircle, ChefHat } from 'lucide-react';

interface PublicSystemConfig {
  systemName: string;
  logo: string;
  primaryColor: string;
  theme: string;
  language: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [systemConfig, setSystemConfig] = useState<PublicSystemConfig>({
    systemName: 'Sistema de Panadería',
    logo: '',
    primaryColor: '#3B82F6',
    theme: 'light',
    language: 'es'
  });
  const { login } = useAuth();
  const router = useRouter();

  // Cargar configuración pública del sistema
  useEffect(() => {
    const loadSystemConfig = async () => {
      try {
        const response = await fetch('/api/public/system-config');
        if (response.ok) {
          const config = await response.json();
          setSystemConfig(config);
        }
      } catch (error) {
        console.warn('Error al cargar configuración del sistema:', error);
        // Mantener valores por defecto
      }
    };

    loadSystemConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const success = await login(email, password);
    
    if (success) {
      router.push('/');
    } else {
      setError('Credenciales inválidas. Verifique su email y contraseña.');
    }
    
    setIsLoading(false);
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {systemConfig.logo ? (
              <img 
                src={systemConfig.logo} 
                alt="Logo" 
                className="h-16 w-16 object-contain rounded-lg bg-white dark:bg-gray-800 p-2 shadow-lg"
                onError={(e) => {
                  // Fallback al ícono por defecto si la imagen falla
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className={`p-3 rounded-full ${systemConfig.logo ? 'hidden' : 'flex'}`}
              style={{ backgroundColor: systemConfig.primaryColor }}
            >
              <ChefHat className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {systemConfig.systemName}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Pastelería & Repostería
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 mr-2" />
                <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                  style={{
                    '--tw-ring-color': systemConfig.primaryColor,
                    focusRingColor: systemConfig.primaryColor
                  } as any}
                  onFocus={(e) => e.target.style.borderColor = systemConfig.primaryColor}
                  onBlur={(e) => e.target.style.borderColor = ''}
                  placeholder="correo@empresa.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                  style={{
                    '--tw-ring-color': systemConfig.primaryColor,
                    focusRingColor: systemConfig.primaryColor
                  } as any}
                  onFocus={(e) => e.target.style.borderColor = systemConfig.primaryColor}
                  onBlur={(e) => e.target.style.borderColor = ''}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white py-3 px-4 rounded-lg font-medium focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{
                backgroundColor: systemConfig.primaryColor,
                '--tw-ring-color': systemConfig.primaryColor
              } as any}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  // Crear una versión más oscura del color para hover
                  const color = systemConfig.primaryColor;
                  const rgb = parseInt(color.slice(1), 16);
                  const r = Math.max(0, (rgb >> 16) - 30);
                  const g = Math.max(0, ((rgb >> 8) & 0x00FF) - 30);
                  const b = Math.max(0, (rgb & 0x0000FF) - 30);
                  (e.target as HTMLButtonElement).style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  (e.target as HTMLButtonElement).style.backgroundColor = systemConfig.primaryColor;
                }
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}