'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SkinConfig, SkinName, getSkinConfig } from '@/lib/skins';

interface SkinContextType {
  skinName: SkinName;
  skinConfig: SkinConfig;
  darkMode: boolean;
  setSkin: (skin: SkinName) => void;
  setDarkMode: (darkMode: boolean) => void;
}

const SkinContext = createContext<SkinContextType | undefined>(undefined);

interface SkinProviderProps {
  children: ReactNode;
  initialSkin?: SkinName;
}

export function SkinProvider({ children, initialSkin = 'basic' }: SkinProviderProps) {
  const [skinName, setSkinState] = useState<SkinName>(initialSkin);
  const [darkMode, setDarkModeState] = useState(false);
  const skinConfig = getSkinConfig(skinName);

  // Load preferences on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSkin = localStorage.getItem('preferred-skin') as SkinName | null;
      const savedDarkMode = localStorage.getItem('dark-mode') === 'true';

      if (savedSkin) setSkinState(savedSkin);
      if (savedDarkMode !== null) setDarkModeState(savedDarkMode);
    }
  }, []);

  // Apply dark mode class to html element
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [darkMode]);

  const setSkin = (skin: SkinName) => {
    setSkinState(skin);
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-skin', skin);
    }
  };

  const setDarkMode = (mode: boolean) => {
    setDarkModeState(mode);
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('dark-mode', mode.toString());
    }
  };

  return (
    <SkinContext.Provider value={{ skinName, skinConfig, darkMode, setSkin, setDarkMode }}>
      {children}
    </SkinContext.Provider>
  );
}

export function useSkin() {
  const context = useContext(SkinContext);
  if (context === undefined) {
    throw new Error('useSkin must be used within a SkinProvider');
  }
  return context;
}
