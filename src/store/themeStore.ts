import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './authStore';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false,
      toggle: () => set((state) => {
        const isDark = !state.isDark;
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { isDark };
      }),
    }),
    {
      name: () => {
        const user = useAuthStore.getState().user;
        return `theme-storage-${user?.id || 'anonymous'}`;
      },
      onRehydrateStorage: (state) => {
        // Apply theme on page load
        if (state?.isDark) {
          document.documentElement.classList.add('dark');
        }
      },
      skipHydration: true, // This ensures we don't hydrate before we have the user
    }
  )
);

// Listen for auth state changes to update theme
useAuthStore.subscribe((state) => {
  const currentState = useThemeStore.getState();
  // Re-initialize the store with the new user's preferences
  useThemeStore.persist.rehydrate();
  // Apply the theme
  if (currentState.isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
});