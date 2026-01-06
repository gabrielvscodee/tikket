'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

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
  const { data: tenant, isLoading, refetch } = useQuery({
    queryKey: ['tenant'],
    queryFn: api.getTenant,
    retry: 1,
  });

  return (
    <TenantContext.Provider value={{ tenant: tenant || null, isLoading, refetch }}>
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

