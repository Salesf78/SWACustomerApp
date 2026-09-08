import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
       // 1. Catch /data-api requests coming from your React code on port 5173
      '/data-api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        // 2. Strip out "/data-api" so port 5000 gets exactly what it wants
        // rewrite: (path) => path.replace(/^\/data-api/, '') 
      }
    }
  }
})
