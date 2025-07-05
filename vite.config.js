import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
 
export default defineConfig({
  base: '/mussasalon/',
  plugins: [
    react(),
    tailwindcss(),   // ★ first-party integration for Tailwind v4+
  ],
})
