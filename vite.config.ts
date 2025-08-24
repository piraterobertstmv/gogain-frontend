import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Explicitly define API URL for development
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:3001/')
  },
})
