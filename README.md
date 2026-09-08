# tillhome

Canonical repo: [github.com/rafiistcool/tillhome](https://github.com/rafiistcool/tillhome).

A small static **link hub** for personal sites and home-lab services. One YAML file lists every link; a Vite build turns that file into plain HTML, CSS, and JS. Branding, copy, groups, and URLs all come from `config.yaml` — fork it, or pull the image and mount your own file.

Production does not parse YAML in the browser. Edit the config, build, serve `dist/`.

One live deploy of this project is [tillhome.de](https://tillhome.de).

## Self-host

Releases are published as a container image at `ghcr.io/rafiistcool/tillhome` (amd64 + arm64). No fork needed — grab the example compose file and a starting config:

```bash
mkdir portal && cd portal
curl -fsSLO https://raw.githubusercontent.com/rafiistcool/tillhome/main/docker-compose.yml
curl -fsSLO https://raw.githubusercontent.com/rafiistcool/tillhome/main/config.yaml
# edit site title, name, and links
docker compose up -d
```

Open `http://<host>:8080`. The container bind-mounts `./config.yaml` and rebuilds the static site on start (same YAML → Vite → HTML path as a local `npm run build`). After you edit the file, `docker compose restart`.

Update with `docker compose pull && docker compose up -d`. Pin a version if you prefer (`ghcr.io/rafiistcool/tillhome:0.1.0` or `:0.1`).

HTTPS is yours to provide: put any reverse proxy in front of `:8080`.

Building the image from source (contributors):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

`docker run` without a mounted config serves the baked example links.

## Add a link

Open `config.yaml` and append a block under `links`:

```yaml
  - title: Book Club
    url: https://books.example.com
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

Then rebuild (`npm run build`, or restart the container if the file is mounted).

The checked-in links are **examples** on `*.example.com`. Replace the URLs and drop `example: true` when a service is real.

## Site copy

The `site` block in `config.yaml` sets the page title, heading, name, tagline, meta description, and footer. No other file needs editing for day-to-day branding.

## Develop

```bash
npm ci
npm run dev
```

The app listens on [http://127.0.0.1:47211](http://127.0.0.1:47211). Saving `config.yaml` reloads the page.

```bash
npm run check    # typecheck + validate YAML
npm run build    # emit dist/
npm run preview  # serve the built site on port 47211
```

## Deploy `dist/` yourself

1. Edit `config.yaml`.
2. Run `npm run build`.
3. Publish the contents of `dist/` as the document root for your host.

### Caddy

See `Caddyfile.example`. Copy `dist/` into the `root` path you choose.

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
config.yaml                 ← edit this to add a link
src/                        Vite app (theme toggle + filter)
vite.config.ts              Reads YAML at build time and injects HTML
dist/                       Generated static site (after build)
Dockerfile                  Multi-stage: Vite build, nginx + rebuild-on-start
docker-compose.yml          Pulls ghcr.io/rafiistcool/tillhome
Caddyfile.example
deploy/nginx.conf.example
.github/workflows/          ci.yml (check + docker build); release.yml (GHCR on v* tags)
```
