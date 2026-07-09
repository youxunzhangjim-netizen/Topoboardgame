import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (normalized.includes('/node_modules/')) return 'vendor';
          if (normalized.includes('/js/shared/')) return 'shared';
          if (normalized.includes('/3D/3dgo/js/robot/')) return 'robot';
          if (normalized.includes('/3D/3dgo/js/geometry/') || normalized.includes('/js/geometry/')) return 'geometry';
          return undefined;
        }
      }
    }
  }
});
