import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import { parse } from 'yaml'
import { renderHead, renderPortal } from './src/render.ts'
import { validateConfig } from './src/validate.ts'

const root = path.dirname(fileURLToPath(import.meta.url))
const configPath = path.resolve(root, 'config.yaml')

function loadConfig() {
  const raw = readFileSync(configPath, 'utf8')
  return validateConfig(parse(raw))
}

function yamlPortal(): Plugin {
  return {
    name: 'yaml-portal',
    configureServer(server) {
      server.watcher.add(configPath)
    },
    handleHotUpdate({ file, server }) {
      if (path.resolve(file) !== configPath) return
      server.ws.send({ type: 'full-reload' })
      return []
    },
    transformIndexHtml(html) {
      const config = loadConfig()
      const head = renderHead(config)
      return {
        html: html.replace('<!--portal-->', renderPortal(config)),
        tags: [
          {
            tag: 'title',
            children: head.title,
            injectTo: 'head',
          },
          {
            tag: 'meta',
            attrs: { name: 'description', content: head.description },
            injectTo: 'head',
          },
        ],
      }
    },
  }
}

export default defineConfig({
  plugins: [yamlPortal()],
  server: {
    host: true,
    port: 47211,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 47211,
    strictPort: true,
  },
})
