#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$(pwd)}"
cd "$ROOT"

backup() {
  local f="$1"
  [[ -f "$f" ]] || { echo "ERROR: Missing $f" >&2; exit 1; }
  [[ -f "$f.lozia-ui.bak" ]] || cp "$f" "$f.lozia-ui.bak"
}

HOME_PAGE='src/app/(store)/page.tsx'
FILTERS='src/components/shop/shop-filters.tsx'
SECTIONS='src/components/home/sections.tsx'
CONTACT='src/app/(store)/contact/page.tsx'
CARD='src/components/shop/product-card.tsx'
CSS='src/app/globals.css'

for f in "$HOME_PAGE" "$FILTERS" "$SECTIONS" "$CONTACT" "$CARD" "$CSS"; do backup "$f"; done

python3 - "$HOME_PAGE" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]); s=p.read_text()
old='''      {settings.homepage.announcement && (\n        <div className="bg-[hsl(var(--accent))] px-5 py-2 text-center text-xs text-[hsl(var(--accent-foreground))]">{settings.homepage.announcement}</div>\n      )}'''
new='''      {settings.homepage.announcement && (\n        <div\n          className="announcement-bar bg-[hsl(var(--accent))] text-xs text-[hsl(var(--accent-foreground))]"\n          role="status"\n          aria-label="LOZIA announcement"\n        >\n          <div className="announcement-track">\n            <span className="announcement-copy">{settings.homepage.announcement}</span>\n            <span className="announcement-copy" aria-hidden="true">{settings.homepage.announcement}</span>\n          </div>\n        </div>\n      )}'''
if old not in s:
    raise SystemExit('Could not find announcement markup in homepage.')
p.write_text(s.replace(old,new,1))
PY

python3 - "$FILTERS" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]); s=p.read_text()
s=s.replace("import { useEffect, useState, useTransition } from 'react';", "import { useEffect, useState, useTransition } from 'react';")
old='''  return (\n    <details className="group border-y border-[hsl(var(--border))] py-4 md:open:block" open>\n      <summary className="mono flex min-h-11 cursor-pointer items-center justify-between md:hidden">Filter &amp; sort <span aria-hidden="true">+</span></summary>\n      <div className="mt-4 grid gap-4 sm:grid-cols-2 md:mt-0 md:grid-cols-4 lg:grid-cols-8" aria-busy={pending}>'''
new='''  const [mobileOpen, setMobileOpen] = useState(true);\n\n  return (\n    <div className="border-y border-[hsl(var(--border))] py-4">\n      <button\n        type="button"\n        className="mono flex min-h-11 w-full items-center justify-between md:hidden"\n        aria-expanded={mobileOpen}\n        aria-controls="shop-filters-panel"\n        onClick={() => setMobileOpen((open) => !open)}\n      >\n        <span>Filter &amp; sort</span>\n        <span aria-hidden="true" className="text-sm leading-none">{mobileOpen ? '−' : '+'}</span>\n      </button>\n      <div id="shop-filters-panel" className={`${mobileOpen ? 'block' : 'hidden'} mt-4 grid gap-4 sm:grid-cols-2 md:mt-0 md:grid md:grid-cols-4 lg:grid-cols-8`} aria-busy={pending}>'''
if old not in s:
    raise SystemExit('Could not find mobile filter details markup.')
s=s.replace(old,new,1)
s=s.replace('''      {active && (\n        <button type="button" onClick={() => { setQuery(''); startTransition(() => router.replace(pathname, { scroll: false })); }} className="mono mt-4 underline-link min-h-11">\n          Clear all filters\n        </button>\n      )}\n    </details>\n  );''','''      {active && (\n        <button type="button" onClick={() => { setQuery(''); startTransition(() => router.replace(pathname, { scroll: false })); }} className="mono mt-4 min-h-11 underline-link">\n          Clear all filters\n        </button>\n      )}\n    </div>\n  );''',1)
p.write_text(s)
PY

python3 - "$SECTIONS" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]); s=p.read_text()
s=s.replace('className={`image-hover object-cover ${style.dim}`}', 'className={`image-hover object-cover object-center md:object-[center_22%] ${style.dim}`}')
p.write_text(s)
PY

python3 - "$CONTACT" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]); s=p.read_text()
s=s.replace('className="object-cover" />', 'className="object-cover object-center md:object-[center_18%]" />', 1)
p.write_text(s)
PY

python3 - "$CARD" <<'PY'
from pathlib import Path
import re, sys
p=Path(sys.argv[1]); s=p.read_text()
# Remove any existing card-level WishlistButton wrappers/buttons, then add exactly one.
s=re.sub(r'\s*<div[^>]*>\s*<WishlistButton\b[\s\S]*?/>\s*</div>', '', s)
s=re.sub(r'\s*<WishlistButton\b[\s\S]*?/>', '', s)
marker='        {soldOut &&'
if marker not in s:
    raise SystemExit('Could not find ProductCard sold-out marker.')
favorite='''        <div className="pointer-events-none absolute right-3 top-3 z-20 translate-y-1 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 motion-reduce:transition-none">\n          <WishlistButton\n            productId={product.id}\n            slug={product.slug}\n            className="h-10 w-10 bg-[hsl(var(--card))]/95 shadow-sm"\n          />\n        </div>\n'''
s=s.replace(marker,favorite+marker,1)
if len(re.findall(r'<WishlistButton\b',s)) != 1:
    raise SystemExit('ProductCard does not contain exactly one WishlistButton after patch.')
p.write_text(s)
PY

cat >> "$CSS" <<'EOF'

/* LOZIA announcement: one line, continuously moves right-to-left on narrow screens. */
.announcement-bar { overflow: hidden; white-space: nowrap; }
.announcement-track { display: flex; width: max-content; min-width: 100%; animation: lozia-announcement 18s linear infinite; }
.announcement-copy { flex: 0 0 auto; padding: .55rem 3rem; }
@keyframes lozia-announcement {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
@media (prefers-reduced-motion: reduce) {
  .announcement-track { animation: none; width: 100%; justify-content: center; }
  .announcement-copy + .announcement-copy { display: none; }
}
EOF

echo
echo 'Applied:'
echo '  - announcement bar is one line and marquee-style'
echo '  - homepage category images shift upward on desktop to preserve faces'
echo '  - contact hero shifts upward on desktop to preserve faces'
echo '  - mobile Filter & Sort starts OPEN and shows −; tapping hides it and shows +'
echo '  - ProductCard is normalized to exactly ONE favorite button, hidden until hover/focus'
echo
echo 'Run:'
echo '  pnpm typecheck'
echo '  pnpm test'
echo '  pnpm build'
