import { groupLinks, hostnameOf, isAbsoluteHttpUrl } from './config.ts'
import { escapeAttr, escapeHtml } from './escape.ts'
import { builtinIcon } from './icons.ts'
import type { SiteConfig, SiteLink } from './types.ts'

const DEFAULT_EYEBROW = 'Welcome to'
const MAX_STAGGER = 12

/** Brand logos: `icon: brand:jellyfin` → homarr-labs/dashboard-icons SVG. */
const BRAND_ICON_BASE = 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/'
const IMAGE_EXT = /\.(svg|png|webp|jpe?g|gif|avif)(\?.*)?$/i

/**
 * Characters that can break out of `style="--icon-src:url(...)"`.
 * Quotes, parens, backslashes, semicolons, and whitespace are refused;
 * the card falls back to a monogram instead of painting a mask.
 */
const UNSAFE_ICON_SRC = /["'()\\;\s]/

export function isStyleSafeIconSrc(src: string): boolean {
  return src.length > 0 && !UNSAFE_ICON_SRC.test(src)
}

/**
 * If `icon` refers to an image, return its src. Accepts `brand:<slug>`,
 * absolute http(s) URLs, root-/dot-relative paths, and bare filenames
 * with an image extension.
 */
function iconImageSrc(icon: string): string | undefined {
  if (icon.startsWith('brand:')) {
    const slug = icon.slice('brand:'.length).trim().toLowerCase()
    return /^[a-z0-9][a-z0-9-]*$/.test(slug) ? `${BRAND_ICON_BASE}${slug}.svg` : undefined
  }
  if (/^https?:\/\//i.test(icon) || icon.startsWith('/') || icon.startsWith('./')) return icon
  if (IMAGE_EXT.test(icon)) return icon
  return undefined
}

function monogramMarkup(title: string): string {
  const monogram = [...title.trim()][0]?.toUpperCase() ?? '·'
  return `<span class="card-icon" aria-hidden="true"><span class="card-icon-glyph card-icon-monogram">${escapeHtml(monogram)}</span></span>`
}

/**
 * Card icon, in order of preference:
 *  1. image (`brand:` slug, URL, or path) as a CSS mask (monochrome)
 *  2. built-in line icon by name (see src/icons.ts)
 *  3. short literal text (e.g. a letter), otherwise
 *  4. monogram from the first letter of the title
 */
function iconMarkup(icon: string | undefined, title: string): string {
  const value = icon?.trim()
  if (value) {
    const src = iconImageSrc(value)
    if (src) {
      if (!isStyleSafeIconSrc(src)) return monogramMarkup(title)
      return `<span class="card-icon" aria-hidden="true"><span class="card-icon-mask" style="--icon-src:url(${escapeAttr(src)})"></span></span>`
    }
    const svg = builtinIcon(value)
    if (svg) return `<span class="card-icon" aria-hidden="true">${svg}</span>`
    if ([...value].length <= 2) {
      return `<span class="card-icon" aria-hidden="true"><span class="card-icon-glyph">${escapeHtml(value)}</span></span>`
    }
  }
  return monogramMarkup(title)
}

function tagsMarkup(link: SiteLink): string {
  const pills: string[] = []
  if (link.example) {
    pills.push('<span class="pill pill-example">example</span>')
  }
  for (const tag of link.tags ?? []) {
    pills.push(`<span class="pill">${escapeHtml(tag)}</span>`)
  }
  if (!pills.length) return ''
  return `<span class="card-pills">${pills.join('')}</span>`
}

function arrowMarkup(): string {
  return `
      <span class="card-arrow" aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 10h11M11 5.5 15.5 10 11 14.5"/>
        </svg>
      </span>`
}

function groupGlyph(): string {
  return `
      <span class="section-glyph" aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 2.5v3.2M10 14.3v3.2M2.5 10h3.2M14.3 10h3.2"/>
          <path d="M10 6.2 13.8 10 10 13.8 6.2 10Z"/>
        </svg>
      </span>`
}

function cardMarkup(link: SiteLink, index: number): string {
  const external = isAbsoluteHttpUrl(link.url)
  const target = external ? ' target="_blank" rel="noopener noreferrer"' : ''
  const hint = external ? '<span class="sr-only"> (opens in a new tab)</span>' : ''
  const desc = link.description
    ? `<span class="card-desc">${escapeHtml(link.description)}</span>`
    : ''
  const classes = link.example ? 'card card-example' : 'card'
  const stagger = Math.min(index, MAX_STAGGER)

  return `
    <li class="grid-item">
      <a class="${classes}" href="${escapeAttr(link.url)}"${target} style="--i:${stagger}">
        ${iconMarkup(link.icon, link.title)}
        <span class="card-body">
          <span class="card-title">${escapeHtml(link.title)}${hint}</span>
          ${desc}
          <span class="card-host">${escapeHtml(hostnameOf(link.url))}</span>
          ${tagsMarkup(link)}
        </span>
        ${arrowMarkup()}
      </a>
    </li>`
}

export function renderPortal(config: SiteConfig): string {
  const { site } = config
  const groups = groupLinks(config)
  const heading = site.heading || site.title
  const eyebrow = site.eyebrow ?? DEFAULT_EYEBROW

  let cardIndex = 0
  const sections = groups
    .map((group) => {
      const id = `group-${slug(group.name)}`
      const cards = group.links.map((link) => cardMarkup(link, cardIndex++)).join('')
      const count = group.links.length
      return `
        <section class="section" aria-labelledby="${id}">
          <div class="section-head">
            ${groupGlyph()}
            <h2 class="section-title" id="${id}">${escapeHtml(group.name)}</h2>
            <span class="section-rule" aria-hidden="true"></span>
            <span class="section-count">${count} ${count === 1 ? 'link' : 'links'}</span>
          </div>
          <ul class="grid">${cards}</ul>
        </section>`
    })
    .join('')

  const empty =
    config.links.length === 0
      ? `<p class="empty">No links yet. Add entries under <code>links</code> in <code>config.yaml</code>.</p>`
      : ''

  const footer =
    site.footer || site.name
      ? `
    <footer class="foot">
      ${site.footer ? `<p class="foot-text">${escapeHtml(site.footer)}</p>` : ''}
      ${site.name ? `<p class="foot-name">${escapeHtml(site.name)}</p>` : ''}
    </footer>`
      : ''

  return `
    <a class="skip-link" href="#directory">Skip to links</a>
    <header class="hero">
      ${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ''}
      <h1 class="hero-title">${escapeHtml(heading)}</h1>
      ${site.tagline ? `<p class="tagline">${escapeHtml(site.tagline)}</p>` : ''}
      ${site.description ? `<p class="lede">${escapeHtml(site.description)}</p>` : ''}
    </header>
    <main id="directory" class="directory">
      ${sections}
      ${empty}
    </main>
    ${footer}`
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
