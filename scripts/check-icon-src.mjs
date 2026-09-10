/**
 * Guardrail for the CSS-mask style attribute.
 * Keep the regex identical to UNSAFE_ICON_SRC in src/render.ts.
 */
import { readFileSync } from 'node:fs'

const UNSAFE_ICON_SRC = /["'()\\;\s]/
const render = readFileSync(new URL('../src/render.ts', import.meta.url), 'utf8')
if (!render.includes('const UNSAFE_ICON_SRC = /["\'()\\\\;\\s]/')) {
  console.error('UNSAFE_ICON_SRC in src/render.ts drifted from scripts/check-icon-src.mjs')
  process.exit(1)
}

function isStyleSafeIconSrc(src) {
  return src.length > 0 && !UNSAFE_ICON_SRC.test(src)
}

const cases = [
  ['https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/immich.svg', true],
  ['/icons/mine.svg', true],
  ['./logo.svg', true],
  ['https://example.com/a.svg?x=1&y=2', true],
  ['https://example.com/a.svg?x="foo"', false],
  ["https://example.com/a.svg?x='foo'", false],
  ['https://example.com/a.svg?x=(foo)', false],
  ['https://example.com/a.svg;color:red', false],
  ['https://example.com/a.svg foo', false],
  ['https://example.com/a.svg\\x', false],
  ['', false],
]

let failed = 0
for (const [src, expected] of cases) {
  const got = isStyleSafeIconSrc(src)
  if (got !== expected) {
    console.error(`isStyleSafeIconSrc(${JSON.stringify(src)}) => ${got}, expected ${expected}`)
    failed += 1
  }
}

if (failed) {
  process.exit(1)
}
