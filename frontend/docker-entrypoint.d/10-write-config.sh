#!/bin/sh
set -eu

printf 'window.__APP_CONFIG__ = { VITE_API_BASE_URL: "%s" };\n' "$VITE_API_BASE_URL" > /usr/share/nginx/html/config.js
