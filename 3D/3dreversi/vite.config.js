export default {
  base: './',
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (normalized.includes('/node_modules/')) return 'vendor';
          if (normalized.includes('/js/shared/')) return 'shared';
          if (normalized.includes('/3D/3dreversi/js/robot/')) return 'robot';
          return undefined;
        }
      }
    }
  },
  server: {
    host: '0.0.0.0'
  }
};
