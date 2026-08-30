#!/usr/bin/env sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

echo "== Backend: clean verify =="
cd "$ROOT/campusshare-backend"
mvn -B --no-transfer-progress clean verify

echo "== Frontend: clean install, lint, build =="
cd "$ROOT/campusshare-frontend"
npm ci
npm run lint
npm run build

echo "== Verification completed successfully =="
