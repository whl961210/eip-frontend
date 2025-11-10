import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue(),
      vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    // Server configuration for development
    server: {
      port: 5173,
      proxy: {
        // Proxy API requests to backend during development
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    // Build optimization
    build: {
      // Output directory
      outDir: 'dist',
      // Generate sourcemaps for production debugging
      sourcemap: mode === 'development',
      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
          }
        }
      }
    }
  }
})
