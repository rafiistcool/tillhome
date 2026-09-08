# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY index.html tsconfig.json vite.config.ts ./
COPY public ./public
COPY scripts ./scripts
COPY src ./src
COPY config.yaml ./config.yaml
RUN npm run check && npm run build

# Runtime keeps Node so a bind-mounted config.yaml can be compiled on start
# (same YAML → Vite → static HTML path as a local `npm run build`). Without
# a mount the baked dist/ is served immediately.
FROM node:22-alpine
LABEL org.opencontainers.image.source="https://github.com/rafiistcool/tillhome" \
      org.opencontainers.image.title="tillhome" \
      org.opencontainers.image.description="YAML-driven static personal/ops link hub"

RUN apk add --no-cache nginx \
    && mkdir -p /usr/share/nginx/html /config

WORKDIR /app
COPY package.json package-lock.json tsconfig.json vite.config.ts index.html ./
COPY --from=deps /app/node_modules ./node_modules
COPY public ./public
COPY scripts ./scripts
COPY src ./src
COPY config.yaml ./config.yaml
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx.container.conf /etc/nginx/nginx.conf
COPY deploy/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod 755 /docker-entrypoint.sh

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
