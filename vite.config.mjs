import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/js/script.js',
      name: 'Tabs',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        if (format === 'es') return 'tabs-a11y.mjs';
        if (format === 'cjs') return 'tabs-a11y.cjs';
        return `tabs-a11y.${format}.js`;
      },
    },
    outDir: 'dist/js',
    emptyOutDir: true,
  },
});
