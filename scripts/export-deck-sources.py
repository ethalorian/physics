#!/usr/bin/env python3
"""Re-export recovered editable deck templates without rebuilding unchanged assets.

Usage: python scripts/export-deck-sources.py [--check]
Classroom decks are already unbundled sources; legacy bundles embed their HTML
as JSON alongside immutable compressed JS/font resources. Only that template
is re-exported. Source HTML lives in src/data/deck-sources/<public deck path>.
"""
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
PATTERN = re.compile(r'(<script type="__bundler/template">\s*)(.*?)(\s*</script>)', re.S)
check = '--check' in sys.argv
stale = []
count = 0
for source in sorted((ROOT / 'src/data/deck-sources').rglob('*.html')):
    target = ROOT / 'public/decks' / source.relative_to(ROOT / 'src/data/deck-sources')
    bundle = target.read_text()
    match = PATTERN.search(bundle)
    if not match:
        raise ValueError(f'Missing bundle template: {target}')
    html = source.read_text()
    if json.loads(match[2]) != html:
        stale.append(str(target.relative_to(ROOT)))
        if not check:
            encoded = json.dumps(html, ensure_ascii=False).replace('/', r'\u002F')
            target.write_text(bundle[:match.start(2)] + encoded + bundle[match.end(2):])
    count += 1
if check and stale:
    raise SystemExit('Stale deck exports:\n' + '\n'.join(stale))
print(f'{count} deck templates verified; {len(stale)} ' + ('stale' if check else 're-exported'))
