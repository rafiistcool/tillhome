#!/bin/sh
set -eu

# Serve the image's baked dist/ unless a config file is mounted. YAML is
# compiled to static HTML at start (same Vite path as `npm run build`);
# the browser never sees the YAML.
CONFIG_FILE="${CONFIG_FILE:-/config/config.yaml}"
HASH_FILE=/tmp/tillhome-config.sha256
APP_DIR=/app
HTML_DIR=/usr/share/nginx/html

if [ -d "$CONFIG_FILE" ]; then
  echo "error: $CONFIG_FILE is a directory. Mount a file, e.g. ./config.yaml:$CONFIG_FILE:ro" >&2
  exit 1
fi

if [ -f "$CONFIG_FILE" ]; then
  hash=$(sha256sum "$CONFIG_FILE" | awk '{print $1}')
  if [ ! -f "$HASH_FILE" ] || [ "$(cat "$HASH_FILE")" != "$hash" ]; then
    echo "Building portal from $CONFIG_FILE"
    cp "$CONFIG_FILE" "$APP_DIR/config.yaml"
    (cd "$APP_DIR" && npm run build)
    rm -rf "${HTML_DIR:?}/"*
    cp -a "$APP_DIR/dist/." "$HTML_DIR/"
    echo "$hash" > "$HASH_FILE"
  else
    echo "Mounted config unchanged; using existing build"
  fi
else
  echo "No mounted config at $CONFIG_FILE; serving image default"
fi

exec nginx -c /etc/nginx/nginx.conf -g 'daemon off;'
