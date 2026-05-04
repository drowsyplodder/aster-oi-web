import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// На GitHub Pages сайт живёт по пути /aster-oi-web/, поэтому базовый префикс
// нужен такой же. Если кто-то форкнет в репо с другим именем — переопределить
// через VITE_BASE_PATH (например, "/" для прод-домена в корне).
const basePath = process.env.VITE_BASE_PATH ?? '/aster-oi-web/'

// https://vite.dev/config/
export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss()],
})
