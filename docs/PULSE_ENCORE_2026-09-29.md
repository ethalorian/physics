# Pulse Volume 02

Adds four original procedural songs to Neon Current: Chrome Circuit (138 BPM, electro house), Midnight Drive (150 BPM, breakbeat), Solar Flare (168 BPM, trance), and Terminal Velocity (184 BPM, drum & bass). Five difficulties per song make 25 charts.

Master keeps D/F/J/K and adds sixteenth-note bursts, streams, and chords. Overdrive uses S/D/F/J/K/L, with six lanes and up to three-note chords. Note travel is 1.05 seconds on Master and 0.90 seconds on Overdrive versus 1.35 on Expert. The original three Neon Current charts are unchanged. Terminal Velocity has 760 Master notes and 1,029 Overdrive notes (1,034 judgements including hold tails). No fail state, pause/resume, touch input, settings, and free practice remain available.

The single catalog in `src/data/pulse-catalog.json` generates the browser catalog with `node scripts/build-pulse-catalog.cjs`. Run `--check` to verify it. Original local best keys remain compatible; new songs use separate local keys.

Ranked purchases use the server-only `purchase_pulse_play` RPC, which calls the existing atomic credit purchase and records the selected chart in the same transaction. The score endpoint preserves this metadata. The ranked board aggregates each student's best score in Postgres for the selected song/level, avoiding REST row-limit truncation. Existing untagged records belong to Neon Current / Arcade. The parent uses a stable bridge while changing board selection and rejects stale board responses. Paid play still costs 10 XP, respects existing free credits/staff rules, and never awards learning XP.

## Verification

- Engine: original judgement/hold/mash checks; all 25 charts deterministic, in bounds, physically playable, and achievable at exactly 1,000,000; increasing density; six-lane triple chords; nearest-note judgement with overlapping windows.
- Browser: a full Terminal Velocity Overdrive run scored 1,000,000, with 1,034 perfect judgements, zero misses or stray taps, and measurable audio throughout. Credit denial, delayed acceptance, save failure/retry, pause/resume, touch release, settings persistence, and responsive layouts pass.
- SQL: isolated local Postgres fixture checks atomic purchase/metadata rollback, chart allowlist, service-only grants, original board compatibility, weekly/all-time separation, staff exclusion, best-per-player, and 1,105-player rankings. All fixture data rolls back.
- API: validates charts before purchase, uses authenticated staff role, preserves chart metadata, keeps other game purchases unchanged, hides student IDs on returned boards, and surfaces temporary ranking failures.

Tests: `node scripts/test-pulse.cjs`, `node scripts/test-pulse-api.cjs`, `node scripts/test-pulse-charts-api.cjs`, `node scripts/test-pulse-browser.cjs`, `node scripts/test-pulse-cabinet-browser.cjs`, `node scripts/test-pulse-charts-db.cjs` (isolated local PostgreSQL on port 55439), and bridge regressions in `src/lib/*-bridge.test.ts`.

## Published

Published to https://www.antocciphysics.com/arcade/pulse on 2026-09-29 as `dpl_6PrLJYT7Sc1394e3mguG8w2sbof9`, built from the previous live deployment `dpl_Eubad2dFG7eRPTgn8fA3JMUVbbvQ`. All 2,568 unrelated baseline files were preserved byte-for-byte. The clean release contains 2,589 source files. Production compilation, TypeScript, style audit, and brand audit passed (the site's existing unrelated lint warnings remain).

The live game serves all six updated public assets exactly as tested. Live Chrome checks passed for five songs, five levels, six-key Overdrive and four-key Master controls, pause, results, protected APIs, and the existing Mic Check route. The complete React cabinet fixture also passed song/level board switching, stale-response rejection, save after board rerenders, and ranking error recovery. All five arrangements rendered distinct, audible, unclipped audio in Web Audio. Real student credits were not spent during testing.

The `pulse_song_charts` migration was applied through Supabase. Live permission checks confirmed that purchase and leaderboard functions are server-only; the original Hall of Fame retained five entries. Security and performance advisors reported no finding naming the new Pulse functions or index. The Midway cabinet blurb was updated to describe the five songs and levels; the cabinet remains enabled at 10 XP per ranked credit.

Release evidence: `/private/tmp/pulse-encore-work/release-manifest.json`, `live-verification.json`, `live-browser.json`. Browser fixtures and audio measurements: `/private/tmp/pulse-encore-verification/`.
