import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export type ThemeMode = 'light' | 'dark';
export type DaisyTheme = 'light' | 'dark';

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>('light');
  const daisyTheme = ref<DaisyTheme>('light');

  const STORAGE_KEY = 'core-theme-preference';

  function init() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { mode: m, daisyTheme: d } = JSON.parse(stored);
        if (m) {
          mode.value = m;
          setMode(m);
        }
        if (d) {
          daisyTheme.value = d;
          setDaisyTheme(d);
        }
      } catch {
        //
      }
    }
  }

  function setMode(m: ThemeMode) {
    mode.value = m;
    document.documentElement.classList.toggle('dark', m === 'dark');
  }

  function setDaisyTheme(theme: DaisyTheme) {
    daisyTheme.value = theme;
    document.documentElement.setAttribute('data-theme', theme);
  }

  function toggle() {
    const next = mode.value === 'light' ? 'dark' : 'light';
    setMode(next);
    setDaisyTheme(next === 'dark' ? 'dark' : 'light');
  }

  watch([mode, daisyTheme], ([m, d]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: m, daisyTheme: d }));
  }, { deep: true });

  return { mode, daisyTheme, init, setMode, setDaisyTheme, toggle };
});
