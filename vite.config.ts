import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Explicitly define API URL for production 
      'import.meta.env.VITE_API_URL': JSON.stringify(
        mode === 'production' 
          ? 'https://gogain-backend.onrender.com/' 
          : env.VITE_API_URL || 'http://localhost:3001/'
      ),
    },
  }
})
