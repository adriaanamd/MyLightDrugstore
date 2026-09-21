import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tanstackStart(), tailwindcss(), react()],
  resolve: { alias: { '@': `${process.cwd()}/src` } },
  server: { host: '0.0.0.0', port: Number(process.env.PORT ?? 8443), strictPort: true },
})
