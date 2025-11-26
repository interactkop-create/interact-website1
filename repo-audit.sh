#!/usr/bin/env bash
set -e

REPO="https://github.com/interactkop-create/interact-website.git"
WORKDIR="interact-website-audit"
echo "=== starting audit ==="

if [ -d "$WORKDIR" ]; then
  echo "Using existing folder $WORKDIR"
else
  echo "Cloning repo..."
  git clone "$REPO" "$WORKDIR"
fi
cd "$WORKDIR"

echo
echo "---- Git branches ----"
git fetch --all --prune
git branch -avv

echo
echo "---- Tree at repo root ----"
ls -la

echo
echo "---- Check main branch files ----"
git checkout main || true
echo "branch: $(git rev-parse --abbrev-ref HEAD)"
echo "listing root files..."
ls -la

echo
echo "---- Check admin folder (main) ----"
if [ -d "admin" ]; then
  echo "admin/ exists. files:"
  ls -la admin || true
else
  echo "admin/ MISSING"
fi

echo
echo "---- Check api branch files ----"
if git show-ref --verify --quiet refs/heads/api; then
  git checkout api
  echo "on branch: $(git rev-parse --abbrev-ref HEAD)"
  echo "api/ listing:"
  ls -la || true
  echo "api folder contents (if present):"
  if [ -d "api" ]; then ls -la api || true; else echo "no api/ folder found in repo root"; fi
else
  echo "No local branch named 'api'. See remote branches:"
  git branch -r | grep -E 'origin/(Data|api)' || true
fi

echo
echo "---- JSON validation (api/*.json and public/data/*.json) ----"
for f in $(git ls-files | grep -E '\.json$' || true); do
  echo "--- $f ---"
  if command -v jq >/dev/null 2>&1; then
    if jq empty "$f" 2>/dev/null; then
      echo "OK JSON"
    else
      echo "INVALID JSON (jq parse failed):"
      jq --color-output . "$f" 2>/dev/null || cat "$f"
    fi
  else
    echo "jq not installed; showing partial file content:"
    head -n 20 "$f"
  fi
done

echo
echo "---- Serverless API files check (/api/* functions) ----"
for fn in api/uploadImage.js api/updateSite.js; do
  if git ls-files | grep -q "^$fn$"; then
    echo "$fn FOUND"
    echo "-> first 60 lines:"
    sed -n '1,60p' "$fn" || true
  else
    echo "$fn MISSING"
  fi
done

echo
echo "---- Admin files check (main branch expected) ----"
for fn in admin/index.html admin/admin.js admin/auth.js admin/styles.css; do
  if git ls-files | grep -q "^$fn$"; then
    echo "$fn FOUND"
  else
    echo "$fn MISSING"
  fi
done

echo
echo "---- Search for key strings (uploadImage, updateSite, site.json) ----"
git grep -n "uploadImage" || true
git grep -n "updateSite" || true
git grep -n "site.json" || true

echo
echo "---- Done. Print last 10 commits across branches ----"
git log --all --decorate --oneline -n 20

echo "=== audit complete ==="
