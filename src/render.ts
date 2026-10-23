import { groupLinks, hostnameOf, isAbsoluteHttpUrl } from './config.ts'
import { escapeAttr, escapeHtml } from './escape.ts'
import { builtinIcon } from './icons.ts'
import type { SiteConfig, SiteLink } from './types.ts'

/** Brand logos: `icon: brand:jellyfin` → homarr-labs/dashboard-icons SVG. */
export const BRAND_ICON_BASE = 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/'
const IMAGE_EXT = /\.(svg|png|webp|jpe?g|gif|avif)(\?.*)?$/i

export interface RenderOptions {
  /**
   * Where the page loads a `brand:<slug>` logo from. The Vite plugin points
   * this at the copies it downloaded at build time; the default is the CDN.
   */
  brandSrc?: (slug: string) => string
}

const cdnBrandSrc = (slug: string) => `${BRAND_ICON_BASE}${slug}.svg`

/** The slug of a `brand:<slug>` icon value, or undefined if it is not one. */
export function brandSlug(icon: string): string | undefined {
  if (!icon.startsWith('brand:')) return undefined
  const slug = icon.slice('brand:'.length).trim().toLowerCase()
  return /^[a-z0-9][a-z0-9-]*$/.test(slug) ? slug : undefined
}

/**
 * Characters we refuse in an icon image src. The logo is an <img> now, so
 * attribute escaping alone would be enough, but a src with quotes, parens,
 * backslashes, semicolons, or whitespace is almost certainly a typo; the
 * entry falls back to a monogram instead.
 */
const UNSAFE_ICON_SRC = /["'()\\;\s]/

export function isStyleSafeIconSrc(src: string): boolean {
  return src.length > 0 && !UNSAFE_ICON_SRC.test(src)
}

/** UI strings for the languages `site.lang` understands; anything else is English. */
interface Copy {
  skip: string
  newTab: string
  example: string
  empty: string
  count: (n: number) => string
}

const EN_NUMBERS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']
const DE_NUMBERS = ['keine', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf']

const COPY: Record<'en' | 'de', Copy> = {
  en: {
    skip: 'Skip to links',
    newTab: ' (opens in a new tab)',
    example: 'example',
    empty: 'No links yet. Add entries under <code>links</code> in <code>config.yaml</code>.',
    count: (n) => `${EN_NUMBERS[n] ?? n} ${n === 1 ? 'link' : 'links'}`,
  },
  de: {
    skip: 'Zu den Links',
    newTab: ' (öffnet in neuem Tab)',
    example: 'Beispiel',
    empty: 'Noch keine Links. Einträge unter <code>links</code> in <code>config.yaml</code> anlegen.',
    count: (n) => `${DE_NUMBERS[n] ?? n} ${n === 1 ? 'Dienst' : 'Dienste'}`,
  },
}

export function siteLang(config: SiteConfig): string {
  return config.site.lang?.trim() || 'en'
}

function copyFor(config: SiteConfig): Copy {
  return siteLang(config).toLowerCase().startsWith('de') ? COPY.de : COPY.en
}

/**
 * If `icon` refers to an image, return its src. Accepts `brand:<slug>`,
 * absolute http(s) URLs, root-/dot-relative paths, and bare filenames
 * with an image extension.
 */
function iconImageSrc(icon: string, brandSrc: (slug: string) => string): string | undefined {
  if (icon.startsWith('brand:')) {
    const slug = brandSlug(icon)
    return slug ? brandSrc(slug) : undefined
  }
  if (/^https?:\/\//i.test(icon) || icon.startsWith('/') || icon.startsWith('./')) return icon
  if (IMAGE_EXT.test(icon)) return icon
  return undefined
}

function monogramMarkup(title: string): string {
  const monogram = [...title.trim()][0]?.toUpperCase() ?? '·'
  return `<span class="entry-icon" aria-hidden="true"><span class="entry-icon-glyph">${escapeHtml(monogram)}</span></span>`
}

/**
 * Entry icon, in order of preference:
 *  1. image (`brand:` slug, URL, or path), sepia at rest, full colour on hover
 *  2. built-in line icon by name (see src/icons.ts)
 *  3. short literal text (e.g. a letter), otherwise
 *  4. monogram from the first letter of the title
 */
function iconMarkup(icon: string | undefined, title: string, brandSrc: (slug: string) => string): string {
  const value = icon?.trim()
  if (value) {
    const src = iconImageSrc(value, brandSrc)
    if (src) {
      if (!isStyleSafeIconSrc(src)) return monogramMarkup(title)
      return `<span class="entry-icon" aria-hidden="true"><img class="entry-icon-img" src="${escapeAttr(src)}" alt="" width="34" height="34" loading="lazy" decoding="async"></span>`
    }
    const svg = builtinIcon(value)
    if (svg) return `<span class="entry-icon" aria-hidden="true">${svg}</span>`
    if ([...value].length <= 2) {
      return `<span class="entry-icon" aria-hidden="true"><span class="entry-icon-glyph">${escapeHtml(value)}</span></span>`
    }
  }
  return monogramMarkup(title)
}

function metaMarkup(link: SiteLink, copy: Copy): string {
  const parts: string[] = []
  if (link.app) parts.push(`<span class="entry-app">${escapeHtml(link.app)}</span>`)
  parts.push(`<span class="entry-host">${escapeHtml(hostnameOf(link.url))}</span>`)
  const example = link.example ? ` <span class="entry-example">${escapeHtml(copy.example)}</span>` : ''
  return `<span class="entry-meta">${parts.join(' · ')}${example}</span>`
}

function arrowMarkup(): string {
  return `<svg class="entry-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>`
}

function entryMarkup(link: SiteLink, copy: Copy, brandSrc: (slug: string) => string): string {
  const external = isAbsoluteHttpUrl(link.url)
  const target = external ? ' target="_blank" rel="noopener noreferrer"' : ''
  const hint = external ? `<span class="sr-only">${escapeHtml(copy.newTab)}</span>` : ''
  const desc = link.description
    ? `<span class="entry-desc">${escapeHtml(link.description)}</span>`
    : ''

  return `
        <li class="entry-item">
          <a class="entry" href="${escapeAttr(link.url)}"${target}>
            ${iconMarkup(link.icon, link.title, brandSrc)}
            <span class="entry-body">
              <span class="entry-title">${escapeHtml(link.title)}${hint}</span>
              ${desc}
              ${metaMarkup(link, copy)}
            </span>
            ${arrowMarkup()}
          </a>
        </li>`
}

export function renderPortal(config: SiteConfig, options: RenderOptions = {}): string {
  const { site } = config
  const copy = copyFor(config)
  const brandSrc = options.brandSrc ?? cdnBrandSrc
  const groups = groupLinks(config)
  const heading = site.heading || site.title

  const sections = groups
    .map((group) => {
      const id = `group-${slug(group.name)}`
      const entries = group.links.map((link) => entryMarkup(link, copy, brandSrc)).join('')
      return `
      <section class="section" aria-labelledby="${id}">
        <div class="section-head">
          <h2 class="section-title" id="${id}">${escapeHtml(group.name)}</h2>
          <span class="section-count">${escapeHtml(copy.count(group.links.length))}</span>
        </div>
        <ul class="entries">${entries}
        </ul>
      </section>`
    })
    .join('')

  const empty = config.links.length === 0 ? `<p class="empty">${copy.empty}</p>` : ''

  const footer = `
      <footer class="foot">
        <span class="fleuron" aria-hidden="true">❦</span>
        ${site.footer ? `<p class="foot-text">${escapeHtml(site.footer)}</p>` : ''}
        ${site.name ? `<p class="foot-name">${escapeHtml(site.name)}</p>` : ''}
      </footer>`

  return `
    <a class="skip-link" href="#directory">${escapeHtml(copy.skip)}</a>
    <div class="frame">
      <div class="frame-inner">
        <span class="corner corner-tl" aria-hidden="true"></span>
        <span class="corner corner-tr" aria-hidden="true"></span>
        <span class="corner corner-bl" aria-hidden="true"></span>
        <span class="corner corner-br" aria-hidden="true"></span>

        <div class="runhead">
          <span class="runhead-site">${escapeHtml(heading)}</span>
          ${site.eyebrow ? `<span class="runhead-label">${escapeHtml(site.eyebrow)}</span>` : ''}
        </div>

        <header class="hero">
          <p class="fleuron" aria-hidden="true">❦</p>
          <h1 class="hero-title">${escapeHtml(heading)}</h1>
          ${site.tagline ? `<p class="tagline">${escapeHtml(site.tagline)}</p>` : ''}
          <div class="hero-rule" aria-hidden="true"><span></span><span class="diamond"></span><span></span></div>
        </header>

        <main id="directory" class="directory">
          ${sections}
          ${empty}
        </main>
        ${footer}
      </div>
    </div>`
}

export function renderHead(config: SiteConfig): { title: string; description: string } {
  return {
    title: config.site.title,
    description: config.site.description || config.site.tagline || config.site.title,
  }
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'group'
}
