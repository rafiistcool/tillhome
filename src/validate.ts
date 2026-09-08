import type { SiteConfig, SiteLink } from './types.ts'

export function validateConfig(data: unknown): SiteConfig {
  if (!data || typeof data !== 'object') {
    throw new Error('config.yaml must be a mapping')
  }

  const raw = data as Record<string, unknown>
  const siteRaw = raw.site
  if (!siteRaw || typeof siteRaw !== 'object') {
    throw new Error('config.yaml needs a `site` block with at least `title`')
  }

  const site = siteRaw as Record<string, unknown>
  if (typeof site.title !== 'string' || !site.title.trim()) {
    throw new Error('site.title is required')
  }

  if (!Array.isArray(raw.links)) {
    throw new Error('config.yaml needs a `links` list')
  }

  const links: SiteLink[] = raw.links.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`links[${index}] must be a mapping`)
    }
    const link = item as Record<string, unknown>
    if (typeof link.title !== 'string' || !link.title.trim()) {
      throw new Error(`links[${index}].title is required`)
    }
    if (typeof link.url !== 'string' || !link.url.trim()) {
      throw new Error(`links[${index}].url is required`)
    }
    const tags = link.tags
    if (tags !== undefined && (!Array.isArray(tags) || tags.some((t) => typeof t !== 'string'))) {
      throw new Error(`links[${index}].tags must be a list of strings`)
    }
    return {
      title: link.title,
      url: link.url,
      description: optionalString(link.description),
      icon: optionalString(link.icon),
      group: optionalString(link.group),
      tags: tags as string[] | undefined,
      example: Boolean(link.example),
    }
  })

  const groups = raw.groups
  if (groups !== undefined && (!Array.isArray(groups) || groups.some((g) => typeof g !== 'string'))) {
    throw new Error('groups must be a list of strings')
  }

  return {
    site: {
      title: site.title,
      heading: optionalString(site.heading),
      name: optionalString(site.name),
      tagline: optionalString(site.tagline),
      description: optionalString(site.description),
      footer: optionalString(site.footer),
    },
    groups: groups as string[] | undefined,
    links,
  }
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}
