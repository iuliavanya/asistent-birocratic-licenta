import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Importă plugin-ul nou

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Adaugă-l aici
  ],
})