import { groupLinks, hostnameOf, isAbsoluteHttpUrl } from './config.ts'
import { escapeAttr, escapeHtml } from './escape.ts'
import type { SiteConfig, SiteLink } from './types.ts'

function iconMarkup(icon: string | undefined, title: string): string {
  const label = title.slice(0, 1).toUpperCase()
  const inner = icon?.trim() ? escapeHtml(icon.trim()) : escapeHtml(label)
  return `<span class="card-icon" aria-hidden="true">${inner}</span>`
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
  return `<div class="card-pills">${pills.join('')}</div>`
}

function cardMarkup(link: SiteLink): string {
  const external = isAbsoluteHttpUrl(link.url)
  const target = external ? ' target="_blank" rel="noopener noreferrer"' : ''
  const hint = external ? ' <span class="sr-only">(opens in a new tab)</span>' : ''
  const desc = link.description
    ? `<p class="card-desc">${escapeHtml(link.description)}</p>`
    : ''

  return `
    <a class="card" href="${escapeAttr(link.url)}"${target} data-search="${escapeAttr(
      [link.title, link.description ?? '', link.url, ...(link.tags ?? [])].join(' ').toLowerCase(),
    )}">
      ${iconMarkup(link.icon, link.title)}
      <span class="card-body">
        <span class="card-title">${escapeHtml(link.title)}${hint}</span>
        ${desc}
        <span class="card-host">${escapeHtml(hostnameOf(link.url))}</span>
        ${tagsMarkup(link)}
      </span>
    </a>`
}

function themeToggle(): string {
  return `
    <button type="button" class="theme-toggle" data-theme-toggle aria-label="Switch to dark theme">
      <svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/>
        <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
      <svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15.4 3.6A8.4 8.4 0 1 0 20.4 14 6.6 6.6 0 0 1 15.4 3.6Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
      </svg>
    </button>`
}

export function renderPortal(config: SiteConfig): string {
  const { site } = config
  const groups = groupLinks(config)
  const heading = site.heading || site.title
  const sections = groups
    .map((group) => {
      const cards = group.links.map(cardMarkup).join('')
      return `
        <section class="section" aria-labelledby="group-${slug(group.name)}">
          <h2 class="section-title" id="group-${slug(group.name)}">${escapeHtml(group.name)}</h2>
          <div class="grid">${cards}</div>
        </section>`
    })
    .join('')

  const empty =
    config.links.length === 0
      ? `<p class="empty">No links yet. Add entries under <code>links</code> in <code>config.yaml</code>.</p>`
      : `<p class="empty empty-filter" hidden>No services match that filter.</p>`

  return `
    <a class="skip-link" href="#directory">Skip to directory</a>
    <header class="top">
      <div class="brand">
        <p class="eyebrow">${escapeHtml(site.name || site.title)}</p>
        <h1>${escapeHtml(heading)}</h1>
        ${site.tagline ? `<p class="tagline">${escapeHtml(site.tagline)}</p>` : ''}
      </div>
      ${themeToggle()}
    </header>
    <main id="directory">
      <label class="filter">
        <span class="sr-only">Filter services</span>
        <input type="search" name="q" placeholder="Filter services…" autocomplete="off" data-filter>
      </label>
      <div class="directory" data-directory>
        ${sections}
        ${empty}
      </div>
    </main>
    ${site.footer ? `<footer class="foot"><p>${escapeHtml(site.footer)}</p></footer>` : ''}`
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
