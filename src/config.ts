import type { LinkGroup, SiteConfig, SiteLink } from './types.ts'

const UNGROUPED = 'Other'

export function hostnameOf(url: string): string {
  try {
    return new URL(url, 'https://example.com').host
  } catch {
    return url
  }
}

export function isAbsoluteHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

export function groupLinks(config: SiteConfig): LinkGroup[] {
  const buckets = new Map<string, SiteLink[]>()

  for (const link of config.links) {
    const name = link.group?.trim() || UNGROUPED
    const list = buckets.get(name)
    if (list) list.push(link)
    else buckets.set(name, [link])
  }

  const ordered: LinkGroup[] = []
  const seen = new Set<string>()

  for (const name of config.groups ?? []) {
    const links = buckets.get(name)
    if (!links) continue
    ordered.push({ name, links })
    seen.add(name)
  }

  for (const [name, links] of buckets) {
    if (seen.has(name)) continue
    ordered.push({ name, links })
  }

  return ordered
}

export function searchBlob(link: SiteLink): string {
  return [link.title, link.description ?? '', link.url, ...(link.tags ?? [])]
    .join(' ')
    .toLowerCase()
}
