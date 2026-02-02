import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const getSystemTheme = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
};

const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'system', // 'light', 'dark', 'system'
      resolvedTheme: 'dark', // actual theme being applied

      setTheme: (theme) => {
        const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
        set({ theme, resolvedTheme });

        // Apply theme to document
        applyTheme(resolvedTheme);
      },

      initTheme: () => {
        const { theme } = get();
        const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
        set({ resolvedTheme });
        applyTheme(resolvedTheme);

        // Listen for system theme changes
        if (typeof window !== 'undefined' && window.matchMedia) {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          mediaQuery.addEventListener('change', (e) => {
            const currentTheme = get().theme;
            if (currentTheme === 'system') {
              const newResolvedTheme = e.matches ? 'dark' : 'light';
              set({ resolvedTheme: newResolvedTheme });
              applyTheme(newResolvedTheme);
            }
          });
        }
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
);

const applyTheme = (theme) => {
  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
};

export default useThemeStore;
