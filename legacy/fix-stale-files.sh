#!/usr/bin/env bash
# Fixes: src/components/providers.tsx: Module '@/hooks/use-cms' has no exported member 'CmsProvider'
#
# Cause: the old src/hooks/use-cms.ts is still in your project from the first zip. The new code lives in
# src/hooks/use-cms.tsx, but TypeScript resolves "@/hooks/use-cms" to the .ts file first, so it never sees CmsProvider.
#
# Run from the project root:   bash fix-stale-files.sh
# Set SKIP_BUILD=1 to only clean up without running the build.
set -euo pipefail

if ! grep -q '"name": "lozia-storefront"' package.json 2>/dev/null; then
  echo "Run this from the project root (the folder that contains package.json for lozia-storefront)." >&2
  exit 1
fi

if ! grep -q "export function CmsProvider" src/hooks/use-cms.tsx 2>/dev/null; then
  echo "src/hooks/use-cms.tsx is missing or is the old version. Copy the latest lozia-next.zip contents over the project first." >&2
  exit 1
fi

# Files that existed in the first zip and were removed or replaced in the second one.
stale=(
  "src/hooks/use-cms.ts"      # replaced by use-cms.tsx (server-fed context)
  "src/config/contact.ts"     # contact details now come from the admin settings
)

for file in "${stale[@]}"; do
  if [[ -e "$file" ]]; then
    rm -v "$file"
  fi
done
rmdir src/config 2>/dev/null || true

# Clear build output so type checking does not read anything left over from the failed build.
rm -rf .next tsconfig.tsbuildinfo

echo "Cleanup done."

if [[ "${SKIP_BUILD:-0}" != "1" ]]; then
  pnpm install
  pnpm build
fi
