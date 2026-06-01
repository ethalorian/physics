# XP & Rewards Economy — Review

Audited against the live PhysicsAPP database and `src/lib/points.ts` (the canonical economy). Bottom line: you're right — students earn far too fast, and the cause isn't the prices, it's that **raw game scores are spent like cash**.

---

## 1. How the economy actually works

There is **one shared pool**. The number a student sees as "XP" (home, leaderboard) is the *same* number they spend in the store. From `points.ts`:

```
lifetimeEarned = Σ game scores
               + Σ (lesson progress_percentage + 5 × video_questions_correct)
               + Σ graded submission scores
               + Σ math-literacy milestone grants
               + Σ economy_point_grants (escape room, etc.)
balance        = lifetimeEarned − committed redemptions
```

So **XP = leaderboard standing = purchasing power**, all one currency. That single fact is the root of the problem (see §4).

---

## 2. The numbers (live data, 26 students)

**Earn side — what's actually feeding the pool:**

| Source | avg per event | max | share of all points earned |
|---|---|---|---|
| **Vocabulary games** | **337** | **1,640** | **90%** |
| Math-literacy grants | 11 | 20 | ~3% |
| Lesson engagement | ~4 realized | 100 (by design) | ~1% |
| Graded submissions | — | — | 0% (unused) |

- Average student has earned **405 points**; top earner **5,050**.
- Game scores drive **90%** of the entire economy. Lessons contribute an average of **1 point** per student. The thing the app exists to do — learning — is economically invisible.
- Observed rate: **~729 points per player per day** from games alone.

**Cost side — what points buy:**

| | count | low | avg | high |
|---|---|---|---|---|
| Store rewards (Late Pass → 3D toy) | 6 | 40 | **101** | 300 |
| Avatar items (Mustache → Spider-Man suit) | 18 | 80 | **327** | 1,200 |

**The imbalance, in one line:** a *single* vocabulary game (avg 337) earns more than the average store reward (101) and nearly the average avatar item (327). At ~729 pts/day, a student earns **~7 store rewards or 2 avatar items every day** — from games, without learning anything.

---

## 3. The two specific leaks

1. **Game scores are currency, 1:1, uncapped.** Games are *designed* to hand out big scores (hundreds to 1,640) for engagement — that's fine for a game. It's not fine as money. There's no divisor, no per-play cap, no daily cap, so the store is effectively "play vocab games to buy anything."
2. **Learning underpays — and what it does pay rewards the wrong thing.** Lessons pay `progress_percentage` (0–100) — i.e., points for *scrolling through* a lesson, not for mastering it. Graded submissions pay nothing (0 records). Mastery milestones pay 5–20. So the economy rewards arcade grinding and time-on-page, and barely rewards actual learning.

This is the exact inversion of the "habit + mastery, not minutes" north star we set for the design work: the money supply is optimized for the one thing we agreed *not* to optimize for.

---

## 4. The strategic fork (decide this first)

Because XP and spendable balance are **one pool**, you have a choice, and it changes the whole fix:

**Option A — Rebalance the shared pool.** Keep one currency; down-weight games, up-weight learning, so the single number grows slower. Simplest. Downside: slowing the store also slows leaderboard movement — games stop feeling rewarding on the leaderboard.

**Option B — Split into two currencies (recommended).**
- **XP** = status only. Drives the leaderboard and level. Games can keep pumping it; it's never spent. Kids still feel the dopamine of a high score.
- **Coins** = the store currency. Scarce, earned mainly by *learning* (completing lessons, mastery milestones, graded work), with games contributing a small capped trickle.

Option B cleanly separates *status* from *purchasing power* — which is what almost every well-balanced game economy does, and it lets games stay fun without breaking the store. It's more work (a second balance + UI), but it's the right long-term design and it aligns the store with learning.

---

## 5. Recommended rebalance (concrete numbers)

Whichever option, the earn weights should become:

| Source | Now | Proposed | Why |
|---|---|---|---|
| Vocabulary game | `score` (avg 337) | `min(25, round(score/10))`, **daily cap 50** | A bonus, not a firehose. Great game → 25; a day of games → ≤50. |
| Lesson | `progress_%` (0–100) | flat **+25 on completion** (100%), +5 per video question | Pay for *finishing/mastering*, not scrolling. |
| Graded submission | raw `score` | `min(40, score)` or `score×0.5` | Reward graded work, capped so one big assignment isn't a jackpot. |
| Mastery milestone | 5–20 | keep, +**40** for reaching "Fluent" on a target | Make true mastery the best paycheck. |

**Resulting economy (engaged student ≈ a lesson + a couple games + some math ≈ 60–80 pts/day):**

| Reward | Cost | Time to earn |
|---|---|---|
| Late Pass | 40 | ~½ day |
| Average store reward | ~100 | ~1.5 days |
| Lab coat / Grad cap | 250 | ~4 days |
| Football helmet | 400 | ~1 week |
| Space helmet | 500 | ~1.5 weeks |
| Spider-Man suit | 1,200 | ~3 weeks |

That's the target feel: small rewards reachable in a day or two, hero cosmetics earned over a week or three. **Fix the earn side, not the prices** — inflating costs would just make everything grindy without stopping the games-firehose.

---

## 6. Implementation

Almost all of this lives in **one function**: `getLifetimeEarned()` in `src/lib/points.ts`. Option A is editing the four accumulation lines there. Option B adds a parallel `getCoinBalance()` (learning-weighted, capped games) and points the store at it while the leaderboard keeps using `getLifetimeEarned()`.

Either way it's a contained change, plus a one-time note that **existing balances will recompute** (they're derived, not stored — so a student sitting on 5,050 today drops to a rebalanced number the moment the weights change; worth a heads-up to students, or a one-time grandfather credit).

---

## Decisions I need from you

1. **One currency (A) or split XP/Coins (B)?** (I recommend B.)
2. **How grindy?** The table above targets "average reward in ~1.5 days." Want it tighter (rewards feel rarer) or looser?
3. **Grandfather existing balances**, or let them recompute down when the weights change?

---

## ✅ IMPLEMENTED (Option A — single pool rebalanced)

Per your go-ahead ("fix everything; ok if XP values change"), the earn weights in
`getLifetimeEarned()` (`src/lib/points.ts`) are rebalanced:

- **Games:** `min(25, score/10)` per play, **daily cap 50** (was: raw score, uncapped).
- **Lessons:** `round(progress%/4)` → 0–25 + 5·correct video questions (was: raw 0–100).
- **Graded submissions:** `min(40, score)` (was: raw score).
- **Mastery + escape-room grants:** unchanged (these are the good paychecks).

**Effect on the live economy (recomputed):**

| | Before | After |
|---|---|---|
| Avg earned / student | 425 | **53** |
| Top earner | 5,050 | **300** |

Games' share of the economy drops from 90% to a capped trickle; learning now leads.
Balances are **derived, not stored**, so this took effect the moment the code shipped —
every student's XP recomputed down automatically (no migration). Worth a heads-up to
students that XP numbers reset to the new, slower scale.

**Still on the table (not done):** Option B (split XP for status vs Coins for the
store). The over-earning is fixed without it, but if you want games to keep pumping a
generous *leaderboard* XP while the *store* stays scarce, that's the follow-up — a
larger change (second balance + store/leaderboard UI).
