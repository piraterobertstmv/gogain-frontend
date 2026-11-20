import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  // VITE_API_URL comes from .env.[mode] files or the build environment
  // (e.g. the CI secret). Don't override it with `define`: that bypassed
  // .env.development and pointed local dev at the production backend.
})
