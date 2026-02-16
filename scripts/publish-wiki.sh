#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="${ROOT_DIR}/docs/wiki"
WIKI_REMOTE="${WIKI_REMOTE:-https://github.com/jjoonleo/price-record.wiki.git}"
WIKI_COMMIT_MESSAGE="${WIKI_COMMIT_MESSAGE:-Update project wiki documentation}"

if [[ ! -d "${SOURCE_DIR}" ]]; then
  echo "Wiki source directory not found: ${SOURCE_DIR}" >&2
  exit 1
fi

if ! compgen -G "${SOURCE_DIR}/*.md" > /dev/null; then
  echo "No markdown files found in ${SOURCE_DIR}" >&2
  exit 1
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

WIKI_CLONE_DIR="${TMP_DIR}/price-record.wiki"

echo "Cloning wiki repository: ${WIKI_REMOTE}"
git clone "${WIKI_REMOTE}" "${WIKI_CLONE_DIR}"

echo "Syncing markdown pages from ${SOURCE_DIR}"
find "${WIKI_CLONE_DIR}" -maxdepth 1 -type f -name "*.md" -delete
cp "${SOURCE_DIR}"/*.md "${WIKI_CLONE_DIR}/"

cd "${WIKI_CLONE_DIR}"
git add .

if git diff --cached --quiet; then
  echo "No wiki changes to publish."
  exit 0
fi

git commit -m "${WIKI_COMMIT_MESSAGE}"
git push origin HEAD

echo "Wiki publish complete."
