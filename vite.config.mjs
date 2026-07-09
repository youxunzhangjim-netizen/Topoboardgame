import { defineConfig, loadEnv } from 'vite';

function editionBase(mode, env) {
  const edition = env.VITE_TBG_EDITION || mode || 'web-lite';
  return edition === 'web-lite' ? '/Topoboardgame/' : './';
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: editionBase(mode, env),
    server: {
      host: '0.0.0.0',
      port: 5172
    },
    preview: {
      host: '0.0.0.0',
      port: 4173
    },
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalized = id.replace(/\\/g, '/');
            if (normalized.includes('/node_modules/')) return 'vendor';
            if (normalized.includes('/js/labs/') || normalized.includes('/src/labs/')) return 'labs';
            if (normalized.includes('/life/')) return 'life';
            if (normalized.includes('/js/hex/') || normalized.includes('/2D/hex/') || normalized.includes('/3D/hex/') || normalized.includes('/4D/hex/')) return 'hex';
            if (normalized.includes('/js/shared/')) return 'shared';
            return undefined;
          }
        }
      }
    }
  };
});
