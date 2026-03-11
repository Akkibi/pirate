import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [mkcert(), vue()],
  optimizeDeps: {
    exclude: ['three'],
  },
  ssr: {
    noExternal: ['three'],
  },
  server: {
    host: true,
  },
});
