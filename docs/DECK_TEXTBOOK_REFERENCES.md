# Deck textbook reference audit — 2026-09-08

Audited all HTML decks under `public/decks` against the uploaded **Conceptual Physics, Prentice Hall high-school textbook**. The source chapter files are in `/Users/craigantocci/Desktop/Current/Conc. Text teachers copy/student-edition/cpNN.pdf`; printed page numbers, not PDF viewer offsets, are used in assignments. The older generic/college chapter numbering does not match these files.

49 decks corrected: classroom Units 1–2, legacy Unit 1, and English/Spanish/SEI Briefing variants. The two workshop decks have no edition-specific references and remain unchanged. The complete changed-deck inventory is `deck-textbook-audit.json`.

## Verified chapter mapping

| Topic | Uploaded chapter / section |
| --- | --- |
| Equilibrium, support force | Ch. 2 |
| Inertia, mass | Ch. 3 |
| Linear motion; velocity; graphs | Ch. 4; §4.3 p. 50; §4.7 pp. 57–58 |
| Vectors and components | §§5.1–5.3, pp. 69–72 |
| Projectile motion | §§5.4–5.6 |
| Newton's second law; friction | Ch. 6; §6.3 pp. 88–90; §6.4 pp. 90–91 |
| Newton's third law | Ch. 7 |
| Circular motion | Ch. 10 |
| Gravitation; weightlessness | Ch. 13 |
| Satellite motion | Ch. 14 |

The vector assignment no longer points to Appendix B. Free-body/inclined-plane assignments cite relevant force/component sections and explicitly use class notes for diagrams instead of inventing textbook sections. Numbered practice now names the actual assessment category: Ch. 4 Check Concepts 1–5 (p. 62), Ch. 4 Think and Solve 51–55 (pp. 66–67), Ch. 5 Think and Solve 38–39 (p. 84), and appropriate Ch. 6 Think and Solve items (pp. 103–104). These were checked directly in the PDFs. Existing Honors extensions remain in place.

## Editing and export

Classroom HTML and the unbundled Briefing variants are editable sources. The 18 legacy compiled decks now have recovered, editable HTML templates in `src/data/deck-sources/unit-1/`. Edit these sources, then run:

```
python scripts/export-deck-sources.py
python scripts/export-deck-sources.py --check
```

The exporter serializes the corrected source template into the existing bundle, retaining its compressed JS/font manifest and loader unchanged. This provides an explicit source/export path for the content change (C-3). Slide labels, count/order, and the presentation bridge stay intact (P-1); no lesson/evidence schemas change (A-1, M-1).

Validation: all 49 changed decks loaded in Chrome with their corrected references and no runtime errors. Representative classroom, legacy, and Spanish slides were visually reviewed. All legacy asset manifests/loaders and every changed deck's slide labels/order were compared with the prior versions; source/export parity and `git diff --check` passed.
