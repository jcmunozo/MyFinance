import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// El build compila directo a ../public, que es la carpeta que server/index.js
// ya sirve como estáticos (express.static) — así el backend no se entera de
// que el frontend ahora es un proyecto Vue con build step.
export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: '../public',
    emptyOutDir: true,
  },
  server: {
    // `npm run dev` sirve en :5173 y reenvía /api al backend de Express en :3000,
    // para poder desarrollar sin reconstruir la imagen de Docker cada vez.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
