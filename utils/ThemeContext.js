import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { dark, light } from '../constants/colors';

const Ctx = createContext(null);

export function ThemeProvider({ children }) {
  const system = useColorScheme();          // 'dark' | 'light' | null
  const [override, setOverride] = useState(null);  // null = follow system

  const scheme = override ?? (system ?? 'light');
  const colors = scheme === 'dark' ? dark : light;

  return (
    <Ctx.Provider value={{ colors, scheme, setScheme: setOverride }}>
      {children}
    </Ctx.Provider>
  );
}

export function useColors() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useColors must be used within ThemeProvider');
  return ctx.colors;
}

export function useTheme() {
  return useContext(Ctx);
}
