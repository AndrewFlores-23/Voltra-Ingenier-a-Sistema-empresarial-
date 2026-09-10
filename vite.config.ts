import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// El sitio se publica en https://andrewflores-23.github.io/<repo>/, así que en
// producción los assets necesitan ese prefijo. En desarrollo se sirve en la raíz.
const REPO = '/Voltra-Ingenier-a-Sistema-empresarial-/'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? REPO : '/',
  plugins: [react(), tailwindcss()],
  server: { port: 5180 },
  build: { chunkSizeWarningLimit: 1200 },
}))
