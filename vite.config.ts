import { readFileSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import { parse } from 'yaml'
import { escapeAttr } from './src/escape.ts'
import { BRAND_ICON_BASE, brandSlug, renderHead, renderPortal, siteLang } from './src/render.ts'
import type { SiteConfig } from './src/types.ts'
import { validateConfig } from './src/validate.ts'

const root = path.dirname(fileURLToPath(import.meta.url))
// TILLHOME_CONFIG points the build at another file, e.g. a local copy of
// the deployed config: `TILLHOME_CONFIG=config.local.yaml npm run dev`.
const configPath = path.resolve(root, process.env.TILLHOME_CONFIG ?? 'config.yaml')

// Downloaded `brand:` logos live here between runs; delete it to refetch.
const brandCacheDir = path.resolve(root, 'node_modules/.cache/tillhome-brand')
const BRAND_PATH = '/brand/'

// Served from our own origin, so refuse anything that could run when the
// file is opened directly.
const UNSAFE_SVG = /<script|<foreignObject|\bon[a-z]+\s*=|javascript:/i

function loadConfig() {
  const raw = readFileSync(configPath, 'utf8')
  return validateConfig(parse(raw))
}

/**
 * Downloads every `brand:` logo the config uses, once, and keeps the SVG
 * source in memory so the page can serve it itself. A logo that cannot be
 * fetched (offline build, unknown slug) stays on the CDN URL.
 */
async function fetchBrandIcons(config: SiteConfig, icons: Map<string, string>) {
  const slugs = new Set(config.links.map((link) => link.icon && brandSlug(link.icon.trim())))
  await Promise.all(
    [...slugs].map(async (slug) => {
      if (!slug || icons.has(slug)) return
      const file = path.join(brandCacheDir, `${slug}.svg`)
      let svg = await readFile(file, 'utf8').catch(() => undefined)
      if (svg === undefined) {
        try {
          const res = await fetch(`${BRAND_ICON_BASE}${slug}.svg`, { signal: AbortSignal.timeout(10_000) })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          svg = await res.text()
          await mkdir(brandCacheDir, { recursive: true })
          await writeFile(file, svg)
        } catch (err) {
          console.warn(`[yaml-portal] brand:${slug} not downloaded (${(err as Error).message}); using the CDN`)
          return
        }
      }
      if (UNSAFE_SVG.test(svg)) {
        console.warn(`[yaml-portal] brand:${slug} contains scripting; using the CDN`)
        return
      }
      icons.set(slug, svg)
    }),
  )
}

function yamlPortal(): Plugin {
  const brandIcons = new Map<string, string>()
  const brandSrc = (slug: string) =>
    brandIcons.has(slug) ? `${BRAND_PATH}${slug}.svg` : `${BRAND_ICON_BASE}${slug}.svg`

  return {
    name: 'yaml-portal',
    async buildStart() {
      await fetchBrandIcons(loadConfig(), brandIcons)
    },
    configureServer(server) {
      server.watcher.add(configPath)
      server.middlewares.use(BRAND_PATH, (req, res, next) => {
        const slug = req.url?.match(/^\/([a-z0-9][a-z0-9-]*)\.svg$/)?.[1]
        const svg = slug && brandIcons.get(slug)
        if (!svg) return next()
        res.setHeader('Content-Type', 'image/svg+xml')
        res.end(svg)
      })
    },
    async handleHotUpdate({ file, server }) {
      if (path.resolve(file) !== configPath) return
      await fetchBrandIcons(loadConfig(), brandIcons)
      server.ws.send({ type: 'full-reload' })
      return []
    },
    transformIndexHtml(html) {
      const config = loadConfig()
      const head = renderHead(config)
      return {
        html: html
          .replace('<html lang="en">', `<html lang="${escapeAttr(siteLang(config))}">`)
          .replace('<!--portal-->', renderPortal(config, { brandSrc })),
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
    generateBundle() {
      for (const [slug, svg] of brandIcons) {
        this.emitFile({ type: 'asset', fileName: `brand/${slug}.svg`, source: svg })
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
