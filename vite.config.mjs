import { defineConfig, loadEnv } from 'vite';

function editionName(mode, env) {
  return env.VITE_TBG_EDITION || mode || 'web-lite';
}

function editionBase(mode, env) {
  return editionName(mode, env) === 'web-lite' ? '/Topoboardgame/' : './';
}

function editionOutDir(mode, env) {
  const edition = editionName(mode, env);
  if (edition === 'steam-stable') return 'dist-steam/app';
  if (edition === 'research-dev') return 'dist-research';
  return 'dist-web';
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const edition = editionName(mode, env);
  const isSteam = edition === 'steam-stable';
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
      outDir: editionOutDir(mode, env),
      sourcemap: isSteam,
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
