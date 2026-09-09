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
| `description` | Short line under the title |
| `icon` | Card icon — see [Icons](#icons). Omit for a monogram of the title |
| `group` | Section heading. New group names create new sections |
| `tags` | Small pills under the description |
| `example` | `true` shows an **example** badge so placeholders are obvious |

### Icons

`icon` accepts three kinds of value:

- **Built-in line icon** (bundled, no network): `activity`, `bar-chart`, `book-open`, `box`, `calendar`, `camera`, `cloud`, `code`, `cpu`, `database`, `download`, `file-text`, `film`, `folder`, `gamepad`, `git-branch`, `globe`, `hard-drive`, `headphones`, `heart`, `home`, `image`, `key`, `layout-dashboard`, `link`, `lock`, `mail`, `message-circle`, `music`, `newspaper`, `play`, `rss`, `search`, `server`, `settings`, `shield`, `terminal`, `tv`, `users`, `wifi`, `wrench`, `zap`. Friendly aliases work too (`books`, `photos`, `notes`, `git`, `status`, `dashboard`, `movies`, `streaming`, `storage`, `chat`, …); see `src/icons.ts`.
- **Service logo**: `brand:<slug>` loads the matching SVG from the community [dashboard-icons](https://github.com/homarr-labs/dashboard-icons) set via jsDelivr, e.g. `brand:jellyfin`, `brand:nextcloud`, `brand:immich`, `brand:sonarr`. The slug is the file name in that repo. This is the one thing on the page that makes an external request; skip it if you want the site fully self-contained.
- **Your own image**: a URL or a path such as `/icons/mine.svg` (drop the file in `public/icons/`). Bare filenames ending in `.svg`/`.png`/`.webp`/`.jpg` work as well.

Anything else that is one or two characters long (a letter, a symbol) is shown literally.

Optional `groups` at the top of the file sets section order. Groups that are not listed still appear after the named ones.

Then rebuild (`npm run build`, or restart the container if the file is mounted).

The checked-in links are **examples** on `*.example.com`. Replace the URLs and drop `example: true` when a service is real.

## Site copy

The `site` block in `config.yaml` sets the page title, hero copy, and footer. No other file needs editing for day-to-day branding.

| Field | Purpose |
| --- | --- |
| `title` | Browser tab title (required) |
| `eyebrow` | Small label above the heading. Defaults to `Welcome to`; set to `""` to hide |
| `heading` | Large hero heading. Falls back to `title` |
| `tagline` | One-liner under the heading |
| `description` | Longer sentence under the tagline; also the meta description |
| `name` | Shown on the right side of the footer |
| `footer` | Text on the left side of the footer |

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

## Look

The page is a dark landing page rendered over a full-screen photo with glass cards. To change the picture, replace `public/background.jpg` with your own image (landscape, ~1600px wide is plenty; it is served as-is). Colours live as CSS variables at the top of `src/style.css` if you want to re-tint the accents to match a new image.

## Layout

- Links are grouped by `group` and rendered as cards; each card shows the link's hostname so you don't have to remember subdomains
- Absolute `http://` and `https://` URLs open in a new tab
- Relative URLs stay in the same tab
- Keyboard focus styles are visible, and every animation is disabled under `prefers-reduced-motion`

## Project layout

```
config.yaml                 ← edit this to add a link
src/                        Render + validation code and the stylesheet
src/icons.ts                Built-in line icons (Lucide paths) and aliases
public/background.jpg       Hero/background image (swap to change the look)
vite.config.ts              Reads YAML at build time and injects HTML
dist/                       Generated static site (after build)
Dockerfile                  Multi-stage: Vite build, nginx + rebuild-on-start
docker-compose.yml          Pulls ghcr.io/rafiistcool/tillhome
Caddyfile.example
deploy/nginx.conf.example
.github/workflows/          ci.yml (check + docker build); release.yml (GHCR on v* tags)
```
