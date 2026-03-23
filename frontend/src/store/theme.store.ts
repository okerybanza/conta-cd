import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeAppearance = 'modern' | 'classic';

interface ThemeState {
  appearance: ThemeAppearance;
  setAppearance: (appearance: ThemeAppearance) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      appearance: 'modern', // Par défaut : design moderne
      setAppearance: (appearance) => set({ appearance }),
    }),
    {
      name: 'conta-theme-storage',
    }
  )
);
