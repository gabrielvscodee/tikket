'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  isLoading: boolean;
  refetch: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  // Only fetch tenant if user has a token (is authenticated)
  const hasToken = typeof window !== 'undefined' && !!getToken();
  
  const { data: tenant, isLoading, refetch } = useQuery({
    queryKey: ['tenant'],
    queryFn: api.getTenant,
    retry: 1,
    enabled: hasToken, // Only fetch if authenticated
  });

  return (
    <TenantContext.Provider value={{ tenant: tenant || null, isLoading: hasToken ? isLoading : false, refetch }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}



