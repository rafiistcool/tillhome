# tillhome.de

Canonical repo: [github.com/rafiistcool/tillhome](https://github.com/rafiistcool/tillhome).

Static homepage portal for [tillhome.de](https://tillhome.de). One YAML file lists every subdomain and service; a small Vite build turns that file into plain HTML, CSS, and JS.

Production does not parse YAML. Edit the config, build, serve `dist/`.

## Add a link

Open `config.yaml` and append a block under `links`:

```yaml
  - title: Book Club
    url: https://bookclub.tillhome.de
    description: Club picks and reading notes.
    icon: "📚"
    group: Reading
    tags: [books]
```

Required fields are `title` and `url`. Everything else is optional:

| Field | Purpose |
| --- | --- |
| `description` | Short line under the title |
| `icon` | Emoji or short mark shown on the card |
| `group` | Section heading. New group names create new sections |
| `tags` | Small pills; also matched by the filter box |
| `example` | `true` shows an **example** badge so placeholders are obvious |

Optional `groups` at the top of the file sets section order. Groups that are not listed still appear after the named ones.

Then rebuild:

```bash
npm install
npm run build
```

Serve the `dist/` folder on tillhome.de.

The checked-in links (Book Club, Notes, Photos, Glean, Git, Status) are **examples**. Replace the URLs and drop `example: true` when a service is real.

## Site copy

The `site` block in `config.yaml` sets the page title, heading, name, tagline, meta description, and footer. No other file needs editing for day-to-day changes.

## Develop

```bash
npm install
npm run dev
```

The app listens on [http://127.0.0.1:47211](http://127.0.0.1:47211). Saving `config.yaml` reloads the page.

```bash
npm run check    # typecheck + validate YAML
npm run build    # emit dist/
npm run preview  # serve the built site on port 47211
```

## Deploy on tillhome.de

1. Edit `config.yaml`.
2. Run `npm run build`.
3. Publish the contents of `dist/` as the document root for `tillhome.de`.

### Caddy

See `Caddyfile.example`:

```caddy
tillhome.de {
	root * /var/www/tillhome
	encode gzip
	file_server
}
```

Copy `dist/` into `/var/www/tillhome` (or whatever `root` you choose).

### nginx

See `deploy/nginx.conf.example`. Point `root` at the same `dist/` files.

### GitHub Pages or any static host

Upload `dist/`, or run `npm run build` in CI and publish that folder. This is a single-page static site: no backend, no environment variables, no YAML parser at runtime.

## Theme

The page follows `prefers-color-scheme`. The header toggle stores an explicit light or dark choice in `localStorage` (`tillhome-theme`). Clear that key to follow the system again.

## Layout

- Links are grouped by `group` and rendered as cards
- Absolute `http://` and `https://` URLs open in a new tab
- Relative URLs stay in the same tab
- The filter box searches title, description, host, and tags
- Keyboard focus styles and `prefers-reduced-motion` are respected

## Project layout

```
config.yaml             ← edit this to add a subdomain
src/                    Vite app (theme toggle + filter)
vite.config.ts          Reads YAML at build time and injects HTML
dist/                   Generated static site (after build)
Caddyfile.example
deploy/nginx.conf.example
```
