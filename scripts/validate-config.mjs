import { readFileSync } from 'node:fs'
import { parse } from 'yaml'

const raw = readFileSync(new URL('../config.yaml', import.meta.url), 'utf8')
const data = parse(raw)

if (!data?.site?.title) {
  throw new Error('site.title is required')
}

if (!Array.isArray(data.links)) {
  throw new Error('links must be a list')
}

for (const [index, link] of data.links.entries()) {
  if (!link?.title || !link?.url) {
    throw new Error(`links[${index}] needs title and url`)
  }
}

console.log(`config.yaml ok — ${data.links.length} link(s)`)
