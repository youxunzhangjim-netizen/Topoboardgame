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
    }
  };
});
