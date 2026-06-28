import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import path from "path";

export default defineConfig({
  plugins: [
    vue(),
  ],

  resolve: {
    alias: {
      "tailwind-config": path.resolve(__dirname, "./tailwind.config.js"),
      "@": path.resolve(__dirname, "./src"),
      "@core": path.resolve(__dirname, "./src/core"),
    },
  },
  build: {
    target: 'esnext',
    cssCodeSplit: true,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/vue')) return 'vue';

          if (id.includes('vue-router') || id.includes('pinia')) {
            return 'vue-vendor';
          }

          if (id.includes('echarts')) return 'echarts';
          if (id.includes('vue-echarts')) return 'vue-echarts';
          if (id.includes('@vueuse')) return 'vueuse';
          if (id.includes('@tabler/icons-vue')) return 'icons';

          if (
              id.includes('daisyui') ||
              id.includes('tailwind') ||
              id.includes('@headlessui')
          ) {
            return 'ui';
          }

          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },

  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia'],
    exclude: ['echarts'],
  },
});