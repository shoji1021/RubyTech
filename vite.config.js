import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        nested1: resolve(__dirname, 'level1.html'),
        nested2: resolve(__dirname, 'level2.html'),
        nested3: resolve(__dirname, 'level3.html'),
        nested4: resolve(__dirname, 'level4.html'),
        nested5: resolve(__dirname, 'level5.html'),
        nested6: resolve(__dirname, 'level6.html'),
        nested7: resolve(__dirname, 'level7.html'),
        nested8: resolve(__dirname, 'level8.html'),
        nested9: resolve(__dirname, 'level9.html'),
        nested10: resolve(__dirname, 'level10.html'),
      },
    },
  },
})