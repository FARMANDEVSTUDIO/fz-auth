'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'warm' | 'light';

const THEMES: Theme[] = ['dark', 'warm', 'light'];

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
  cycle: () => void;
}>({ theme: 'dark', setTheme: () => {}, cycle: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

function applyTheme(t: Theme) {
  document.documentElement.classList.remove('dark', 'warm', 'light');
  if (t !== 'dark') document.documentElement.classList.add(t);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('fz-theme') as Theme | null;
    if (saved && THEMES.includes(saved)) {
      setThemeState(saved);
      applyTheme(saved);
    }
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('fz-theme', t);
    applyTheme(t);
  };

  const cycle = () => {
    const idx = THEMES.indexOf(theme);
    setTheme(THEMES[(idx + 1) % THEMES.length]);
  };

  // Always render the provider — swapping a Fragment for the Provider after
  // mount remounts the entire app (state loss, animation restarts, flicker).
  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycle }}>
      {children}
    </ThemeContext.Provider>
  );
}
