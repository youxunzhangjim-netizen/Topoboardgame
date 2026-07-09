export default {
    base: './',
    build: {
        chunkSizeWarningLimit: 1300,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    const normalized = id.replace(/\\/g, '/');
                    if (normalized.includes('/node_modules/')) return 'vendor';
                    if (normalized.includes('/js/shared/')) return 'shared';
                    if (normalized.includes('/js/labs/') || normalized.includes('/src/labs/')) return 'labs';
                    if (normalized.includes('/algebraic/js/')) return 'algebraic';
                    return undefined;
                }
            }
        }
    }
};
