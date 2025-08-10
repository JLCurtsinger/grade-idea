#!/usr/bin/env bash
set -euo pipefail
for U in \
  "https://www.gradeidea.cc/healthz" \
  "https://www.gradeidea.cc/sitemap.xml" \
  "https://gradeidea.cc/healthz" \
  "https://gradeidea.cc/sitemap.xml"
do
  echo "==> $U"
  curl -sS -o /dev/null -w "%{http_code} %{url_effective}\n" "$U" || true
done
