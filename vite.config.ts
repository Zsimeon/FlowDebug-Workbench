import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        // Shortcut of `build.lib.entry`.
        entry: 'electron/main.ts',
      },
      // Optional: Input your preload scripts
      // preload: {
      //   input: 'electron/preload.ts',
      // },
      // Optional: Use Node.js API in the Renderer-process
      renderer: {},
    }),
  ],
  base: './', // Important for Electron relative paths
})