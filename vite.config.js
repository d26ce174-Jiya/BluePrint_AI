import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    // Raise the warning threshold slightly — our chunks are intentionally split
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        // Manual chunk splitting — keeps vendor libs out of the app bundle
        // so browsers can cache them independently across deployments
        manualChunks(id) {
          // React core — almost never changes, long-lived cache
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }
          // Router
          if (id.includes('node_modules/react-router') ||
              id.includes('node_modules/@remix-run')) {
            return 'vendor-router';
          }
          // Mermaid + transitive deps — dynamically imported, keep as async chunk.
          // Returning undefined lets Vite manage the chunk boundary itself.
          if (id.includes('node_modules/mermaid') ||
              id.includes('node_modules/@mermaid-js') ||
              id.includes('node_modules/dagre') ||
              id.includes('node_modules/d3') ||
              id.includes('node_modules/elk') ||
              id.includes('node_modules/khroma') ||
              id.includes('node_modules/cytoscape')) {
            return undefined;
          }
          // Everything else in node_modules → shared vendor chunk
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
      },
    },
  },

  // Pre-bundle key deps for faster dev server start
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});
