import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    vuetify({
      autoImport: true,
    }),
    // Serve the Retail Cloud POS APK from its out-of-git location during local dev
    {
      name: 'retail-pos-apk',
      configureServer(server) {
        server.middlewares.use('/retail-cloud-pos.apk', (_req, res) => {
          const apkPath = path.resolve(__dirname, 'Retail Cloud POS APK/app-release.apk')
          if (!fs.existsSync(apkPath)) {
            res.statusCode = 404
            res.end('APK not found')
            return
          }
          const stat = fs.statSync(apkPath)
          res.setHeader('Content-Type', 'application/vnd.android.package-archive')
          res.setHeader('Content-Disposition', 'attachment; filename="RetailCloudPOS.apk"')
          res.setHeader('Content-Length', stat.size)
          fs.createReadStream(apkPath).pipe(res)
        })
      },
    },
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@marobase/ui': fileURLToPath(new URL('./packages/marobase-ui/src/index.ts', import.meta.url)),
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/tokens" as *;\n`,
      },
    },
  },
})
