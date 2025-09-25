'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SystemConfig {
  systemName: string;
  logo: string;
  primaryColor: string;
  theme: string;
  currency: string;
  [key: string]: any;
}

interface SystemConfigContextType {
  config: SystemConfig;
  isLoading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
}

const defaultConfig: SystemConfig = {
  systemName: 'Sistema de Panadería',
  logo: '',
  primaryColor: '#3B82F6',
  theme: 'light',
  currency: 'COP',
};

const SystemConfigContext = createContext<SystemConfigContextType | undefined>(undefined);

export function SystemConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/system-config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        setError(null);
      } else {
        // Si hay error 401/403, usar configuración por defecto
        if (response.status === 401 || response.status === 403) {
          setConfig(defaultConfig);
          setError(null);
        } else {
          setError('Error al cargar configuración');
        }
      }
    } catch (err) {
      console.warn('Error al cargar configuración, usando valores por defecto:', err);
      setConfig(defaultConfig);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshConfig = async () => {
    setIsLoading(true);
    await loadConfig();
  };

  useEffect(() => {
    loadConfig();
  }, []);

  return (
    <SystemConfigContext.Provider value={{ config, isLoading, error, refreshConfig }}>
      {children}
    </SystemConfigContext.Provider>
  );
}

export function useSystemConfig() {
  const context = useContext(SystemConfigContext);
  if (context === undefined) {
    throw new Error('useSystemConfig must be used within a SystemConfigProvider');
  }
  return context;
}