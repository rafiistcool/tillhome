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
    icon: book-open
    group: Reading
    tags: [books]
```

Required fields are `title` and `url`. Everything else is optional:

| Field | Purpose |
| --- | --- |
| `description` | What the service is for, in plain words. Shown under the title |
| `app` | The software behind it (`Jellyfin`, `Nextcloud`, …). Shown in small caps next to the hostname |
| `icon` | Entry icon — see [Icons](#icons). Omit for a monogram of the title |
| `group` | Section heading. New group names create new sections |
| `tags` | Not shown on the page; free-form labels for your own bookkeeping |
| `example` | `true` adds an **example** mark so placeholders are obvious |

### Icons

`icon` accepts three kinds of value:

- **Built-in line icon** (bundled, no network): `activity`, `bar-chart`, `book-open`, `box`, `calendar`, `camera`, `cloud`, `code`, `cpu`, `database`, `download`, `file-text`, `film`, `folder`, `gamepad`, `git-branch`, `globe`, `hard-drive`, `headphones`, `heart`, `hexagon`, `home`, `image`, `key`, `layout-dashboard`, `link`, `lock`, `mail`, `message-circle`, `music`, `newspaper`, `play`, `rss`, `search`, `server`, `settings`, `shield`, `terminal`, `tv`, `users`, `wifi`, `wrench`, `zap`. Friendly aliases work too (`books`, `photos`, `notes`, `git`, `status`, `dashboard`, `movies`, `streaming`, `storage`, `chat`, …); see `src/icons.ts`.
- **Service logo**: `brand:<slug>` uses the matching SVG from the community [dashboard-icons](https://github.com/homarr-labs/dashboard-icons) set, e.g. `brand:jellyfin`, `brand:nextcloud`, `brand:immich`, `brand:sonarr`. The slug is the file name in that repo. Logos are shown in sepia to match the page and in their own colours on hover. The build downloads each logo once from jsDelivr and serves it from `/brand/<slug>.svg`, so visitors' browsers never contact the CDN. Downloads are cached in `node_modules/.cache/tillhome-brand/` (delete it to refetch). If a logo cannot be downloaded (offline build, unknown slug) the build logs a warning and that entry points at the CDN instead.
- **Your own image**: a URL or a path such as `/icons/mine.svg` (drop the file in `public/icons/`). Bare filenames ending in `.svg`/`.png`/`.webp`/`.jpg` work as well. Same sepia treatment.

Anything else that is one or two characters long (a letter, a symbol) is shown literally.

Image `src` values that contain quotes, parentheses, backslashes, semicolons, or whitespace are rejected and the entry shows a monogram instead.

Optional `groups` at the top of the file sets section order. Groups that are not listed still appear after the named ones.

Then rebuild (`npm run build`, or restart the container if the file is mounted).

The checked-in links are **examples** on `*.example.com`. Replace the URLs and drop `example: true` when a service is real.

## Site copy

The `site` block in `config.yaml` sets the page title, hero copy, and footer. No other file needs editing for day-to-day branding.

| Field | Purpose |
| --- | --- |
| `title` | Browser tab title (required) |
| `lang` | Page language (`en` default, `de`). Also switches the built-in labels such as "three links" / "drei Dienste" |
| `eyebrow` | Small italic label at the top right of the page, e.g. `Directory`. Omit to hide |
| `heading` | Large title, also repeated in small caps at the top left. Falls back to `title` |
| `tagline` | Italic line under the title |
| `description` | Meta description for search engines; not shown on the page |
| `name` | Italic line under the footer text |
| `footer` | Small-caps line at the bottom of the page |

## Develop

```bash
npm ci
npm run dev
```

The app listens on [http://127.0.0.1:47211](http://127.0.0.1:47211). Saving `config.yaml` reloads the page.

To preview a different file (for example a copy of the config your server mounts), point `TILLHOME_CONFIG` at it: `TILLHOME_CONFIG=config.local.yaml npm run dev`. `config.local.yaml` is git-ignored.

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

## Look

The page is a plain sand-coloured sheet with a bronze double frame and a diamond on each corner, set like a printed directory: a running head at the top, a centred title with a fleuron, and one section per group with a ruled heading. Rust is the only accent and marks the entry under the pointer. All colours are tokens at the top of `src/style.css`.

Logos sit in sepia so they read as part of the page and show their own colours on hover. Built-in glyphs are Lucide strokes in the ink colour.

Type is **EB Garamond Variable** (roman and italic), self-hosted from [`@fontsource-variable/eb-garamond`](https://fontsource.org/fonts/eb-garamond) and bundled into `dist/assets/` at build time. There is no Google Fonts (or other) runtime request for type.

## Layout

- Links are grouped by `group` and rendered as directory entries: title, what it is for, then app and hostname
- Entries flow into two columns on wide screens; `auto-fill` keeps a short group at the same column width as a full one
- Absolute `http://` and `https://` URLs open in a new tab
- Relative URLs stay in the same tab
- Keyboard focus styles are visible, and every animation is disabled under `prefers-reduced-motion`

## Project layout

```
config.yaml                 ← edit this to add a link
src/                        Render + validation code and the stylesheet
src/icons.ts                Built-in line icons (Lucide paths) and aliases
vite.config.ts              Reads YAML at build time and injects HTML
dist/                       Generated static site (after build)
Dockerfile                  Multi-stage: Vite build, nginx + rebuild-on-start
docker-compose.yml          Pulls ghcr.io/rafiistcool/tillhome
Caddyfile.example
deploy/nginx.conf.example
.github/workflows/          ci.yml (check + docker build); release.yml (GHCR on v* tags)
```
