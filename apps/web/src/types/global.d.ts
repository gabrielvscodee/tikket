// Global type declarations to fix TypeScript errors
declare module 'next-themes' {
  export interface ThemeProviderProps {
    children?: React.ReactNode;
    attribute?: string;
    defaultTheme?: string;
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
    storageKey?: string;
    themes?: string[];
    forcedTheme?: string;
    enableColorScheme?: boolean;
    nonce?: string;
  }
  
  export function ThemeProvider(props: ThemeProviderProps): JSX.Element;
  export function useTheme(): {
    theme: string | undefined;
    setTheme: (theme: string) => void;
    themes: string[];
    systemTheme: string | undefined;
    resolvedTheme: string | undefined;
  };
}

declare module 'recharts' {
  import * as React from 'react';
  
  // Component exports - using any to avoid strict type checking issues
  export const BarChart: React.ComponentType<any>;
  export const Bar: React.ComponentType<any>;
  export const XAxis: React.ComponentType<any>;
  export const YAxis: React.ComponentType<any>;
  export const CartesianGrid: React.ComponentType<any>;
  export const PieChart: React.ComponentType<any>;
  export const Pie: React.ComponentType<any>;
  export const Cell: React.ComponentType<any>;
  export const Area: React.ComponentType<any>;
  export const AreaChart: React.ComponentType<any>;
  export const Legend: React.ComponentType<any>;
  export const ComposedChart: React.ComponentType<any>;
  export const LineChart: React.ComponentType<any>;
  export const Line: React.ComponentType<any>;
  export const Tooltip: React.ComponentType<any>;
  export const ResponsiveContainer: React.ComponentType<any>;
  
  // Type interfaces
  export interface TooltipProps<ValueType, NameType> {
    active?: boolean;
    payload?: Array<{
      name?: string;
      value?: ValueType;
      dataKey?: string;
      color?: string;
      payload?: Record<string, unknown>;
      fill?: string;
      [key: string]: unknown;
    }>;
    label?: string | number;
    labelFormatter?: (label: unknown, payload: unknown) => React.ReactNode;
    formatter?: (value: unknown, name: string, item: unknown, index: number, payload: Record<string, unknown>) => React.ReactNode;
  }
  
  export interface LegendProps {
    payload?: Array<{
      value?: string;
      type?: string;
      id?: string;
      dataKey?: string;
      payload?: {
        fill?: string;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    }>;
    verticalAlign?: 'top' | 'bottom';
  }
}
