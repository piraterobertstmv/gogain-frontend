import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Explicitly define API URL for production 
    'import.meta.env.VITE_API_URL': JSON.stringify('https://gogain-backend.onrender.com/')
  },
})
