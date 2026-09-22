#!/usr/bin/env bash
# Fixes a lozia-next project that got nested inside itself
# (i.e. you now have ./lozia-next/lozia-next/... instead of ./lozia-next/...).
#
# This happens if install-lozia-next.sh was run while already inside the
# extracted lozia-next folder — it then extracts a second lozia-next/ inside it.
#
# Run this from the PARENT directory of the outer lozia-next, e.g.:
#   your-folder/
#     lozia-next/          <- outer (run the script from here's parent)
#       lozia-next/        <- nested duplicate, this script removes it
#       ...
#
# Usage:  bash fix-nested-lozia.sh [path-to-outer-lozia-next]
# Defaults to ./lozia-next if no path is given.
set -euo pipefail

OUTER="${1:-lozia-next}"
NESTED="$OUTER/lozia-next"

if [[ ! -d "$OUTER" ]]; then
  echo "Error: '$OUTER' is not a directory. Pass the path to your outer lozia-next folder." >&2
  exit 1
fi
if [[ ! -d "$NESTED" ]]; then
  echo "No nested $NESTED found — nothing to fix. Your project already looks flat." >&2
  exit 0
fi
if [[ ! -f "$NESTED/package.json" ]] || ! grep -q '"name": "lozia-storefront"' "$NESTED/package.json"; then
  echo "Error: $NESTED doesn't look like the lozia-storefront project. Refusing to touch it." >&2
  exit 1
fi

echo "Found nested project at $NESTED"

# If you'd made edits in the OUTER copy (outside the nested folder) as well as the
# nested one, the nested copy wins on conflicts since it's the complete, real project;
# anything only in the outer copy (not overwritten) is kept.
echo "Moving contents of $NESTED up into $OUTER ..."
shopt -s dotglob
for item in "$NESTED"/*; do
  name="$(basename "$item")"
  target="$OUTER/$name"
  if [[ -e "$target" && "$target" != "$NESTED" ]]; then
    rm -rf "$target"
  fi
  mv "$item" "$OUTER/"
done
shopt -u dotglob

rmdir "$NESTED"

echo "Done. $OUTER now contains the project directly."
echo
echo "Next steps:"
echo "  cd $OUTER"
echo "  ls            # should show README.md, package.json, src/, supabase/, etc. directly"
