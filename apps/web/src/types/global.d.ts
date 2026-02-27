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
