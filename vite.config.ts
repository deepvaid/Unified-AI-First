import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import { synthesize, synthesizeStream, TtsError } from './src/server/tts'
import { generateReply, GeminiError } from './src/server/gemini'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load ALL env (no prefix) for SERVER-side use only (dev middleware). The key
  // is never exposed to the client — it's not VITE_-prefixed and is read here in
  // Node, mirroring the Vercel serverless function (api/tts.ts).
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue({
        template: { transformAssetUrls },
      }),
      vuetify({
        autoImport: true,
      }),
      // Serve the static marketing landing page (public/main-landing/) at /main-landing
      {
        name: 'main-landing-rewrite',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const [path, query] = (req.url ?? '').split('?')
            if (path === '/main-landing') {
              // redirect so relative asset paths resolve under /main-landing/
              res.statusCode = 301
              res.setHeader('Location', '/main-landing/' + (query ? `?${query}` : ''))
              res.end()
              return
            }
            if (path === '/main-landing/') {
              req.url = '/main-landing/index.html' + (query ? `?${query}` : '')
            }
            next()
          })
        },
      },
      // Dev parity for the /api/tts serverless function (api/tts.ts) — realistic
      // cloud voice in `vite dev` too. Reads the key server-side (never bundled).
      {
        name: 'tts-api-dev',
        configureServer(server) {
          server.middlewares.use('/api/tts', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.end('Method Not Allowed')
              return
            }
            try {
              const chunks: Buffer[] = []
              for await (const c of req) chunks.push(c as Buffer)
              const { text, voice, model, stream } = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
              const opts = {
                apiKey: env.GEMINI_API_KEY || process.env.GEMINI_API_KEY,
                voice: voice ?? env.TTS_VOICE,
                model: model ?? env.TTS_MODEL,
              }
              if (stream) {
                let started = false
                try {
                  for await (const chunk of synthesizeStream(text ?? '', opts)) {
                    if (!started) {
                      started = true
                      res.statusCode = 200
                      res.setHeader('Content-Type', 'audio/l16; rate=24000')
                      res.setHeader('Cache-Control', 'no-store')
                    }
                    res.write(Buffer.from(chunk))
                  }
                } catch (err) {
                  if (!started) {
                    res.statusCode = err instanceof TtsError ? err.status : 500
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'tts failed' }))
                    return
                  }
                }
                res.end()
                return
              }
              const { audio, contentType } = await synthesize(text ?? '', opts)
              res.statusCode = 200
              res.setHeader('Content-Type', contentType)
              res.setHeader('Cache-Control', 'no-store')
              res.end(Buffer.from(audio))
            } catch (err) {
              res.statusCode = err instanceof TtsError ? err.status : 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'tts failed' }))
            }
          })
        },
      },
      // Dev parity for the /api/gemini serverless function (api/gemini.ts) — smart
      // Da Vinci answers in `vite dev` too. Reads the key server-side (never bundled).
      {
        name: 'gemini-api-dev',
        configureServer(server) {
          server.middlewares.use('/api/gemini', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.end('Method Not Allowed')
              return
            }
            try {
              const chunks: Buffer[] = []
              for await (const c of req) chunks.push(c as Buffer)
              const { text, history } = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
              const result = await generateReply(text ?? '', {
                apiKey: env.GEMINI_API_KEY || process.env.GEMINI_API_KEY,
                model: env.GEMINI_MODEL || process.env.GEMINI_MODEL,
                history,
              })
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.setHeader('Cache-Control', 'no-store')
              res.end(JSON.stringify(result))
            } catch (err) {
              res.statusCode = err instanceof GeminiError ? err.status : 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'gemini failed' }))
            }
          })
        },
      },
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
    // Honor the port assigned by dev tooling (e.g. Claude preview) via PORT env var
    server: process.env.PORT ? { port: Number(process.env.PORT), strictPort: true } : undefined,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/styles/tokens" as *;\n`,
        },
      },
    },
  }
})
