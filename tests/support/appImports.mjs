// Lets a Node test import the app's Pinia stores: '@/x' resolves to src/x, and a
// path without an extension to its .ts file or folder index.ts, as Vite does.
// A test registers it before importing any store:
//   register('../support/appImports.mjs', import.meta.url)
import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SRC = fileURLToPath(new URL('../../src/', import.meta.url))

function withTs(file) {
  if (existsSync(file) && statSync(file).isFile()) return file
  for (const candidate of [`${file}.ts`, path.join(file, 'index.ts')]) if (existsSync(candidate)) return candidate
  return null
}

export async function resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) {
    const file = withTs(path.join(SRC, specifier.slice(2)))
    if (file) return { url: pathToFileURL(file).href, shortCircuit: true }
  }
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
    const file = withTs(path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier))
    if (file) return { url: pathToFileURL(file).href, shortCircuit: true }
  }
  return next(specifier, context)
}
