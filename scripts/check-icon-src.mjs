/**
 * Guardrail for the CSS-mask style attribute.
 * Keep the regex identical to UNSAFE_ICON_SRC in src/render.ts.
 */
import { readFileSync } from 'node:fs'

const UNSAFE_ICON_SRC = /["'()\\;\s]/
const render = readFileSync(new URL('../src/render.ts', import.meta.url), 'utf8')
<if></if>