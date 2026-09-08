export interface SiteMeta {
  title: string
  heading?: string
  name?: string
  tagline?: string
  description?: string
  footer?: string
}

export interface SiteLink {
  title: string
  url: string
  description?: string
  icon?: string
  group?: string
  tags?: string[]
  example?: boolean
}

export interface SiteConfig {
  site: SiteMeta
  groups?: string[]
  links: SiteLink[]
}

export interface LinkGroup {
  name: string
  links: SiteLink[]
}
