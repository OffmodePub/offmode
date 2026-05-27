import React, { createContext, useContext, useState } from 'react';
import { dark, light } from '../constants/colors';

const Ctx = createContext(null);

export function ThemeProvider({ children }) {
  // 기본은 항상 라이트. 시스템 다크모드와 무관하게 동작하며,
  // 사용자가 Settings에서 명시적으로 dark를 선택할 때만 override 적용.
  const [override, setOverride] = useState(null);

  const scheme = override ?? 'light';
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
