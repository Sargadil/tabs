import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/js/script.js',
      name: 'Tabs',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        if (format === 'es') return 'tabs.mjs';
        if (format === 'cjs') return 'tabs.cjs';
        return `tabs.${format}.js`;
      },
    },
    outDir: 'dist/js',
    emptyOutDir: true,
  },
});
