#!/usr/bin/env python3
"""
gen-projects-lesson-plans.py — TEACHER lesson plans for Project Physics
(program = 'projects', the MVP CPA section), for /admin/teacher/plans.

Two grains, per Craig 2026-09-04:
  * a WEEK OVERVIEW for every one of the twenty academic weeks (day = week*10),
    generated from the year map's own data in gen-projects-curriculum.py, so the
    plans page and the week-pages can never drift apart; and
  * DAY PLANS for the weeks that have them (day = week*10 + n), hand-authored in
    scripts/projects_day_plans.py — Weeks 1 and 2 today.

A day plan deliberately does NOT repeat the student prompts, frames, word bank
or Spanish: for MVP the app IS the packet (claude/Physics-Classroom-App-Decisions.md,
2026-09-03) and those live on the blocks. It carries the clock and the materials,
the Spanish the teacher says, and the formative checks with the misconception to
press.

  python3 scripts/gen-projects-lesson-plans.py
    → src/data/proj-1-lesson-plans.json … proj-4-lesson-plans.json
"""
import contextlib
import html
import importlib.util
import io
import json
import os
from datetime import date, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "..", "src", "data")


def _load(path, name):
    """Import a sibling script as a module. gen-projects-curriculum.py prints its
    SQL at module level, so swallow stdout while it loads — we want its data, not
    its migration."""
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, path))
    mod = importlib.util.module_from_spec(spec)
    with contextlib.redirect_stdout(io.StringIO()):
        spec.loader.exec_module(mod)
    return mod


CUR = _load("gen-projects-curriculum.py", "projects_curriculum")
DP = _load("projects_day_plans.py", "projects_day_plans")

WEEKS, UNITS, LANG, VOCAB, STANDARDS, MASTERY, MEET = (
    CUR.WEEKS, CUR.UNITS, CUR.LANG, CUR.VOCAB, CUR.STANDARDS, CUR.MASTERY, CUR.MEET)

PHASE_NAME = {u[0]: u[2].split(":", 1)[1].split("(")[0].strip() for u in UNITS}
PHASE_NUM = {u[0]: u[1] for u in UNITS}
MASTERY_BY_PHASE = {m[1]: m for m in MASTERY}
TYPE_LABEL = {"knowledge": "Knowledge", "reasoning": "Reasoning", "skill": "Skill", "product": "Product"}

# Stiggins/Chappuis: the target type decides what counts as evidence for it.
TYPE_NOTE = {
    "knowledge": "recall or recognition — a selected response or a labelled diagram is enough",
    "reasoning": "the graded evidence of this course — a claim with the evidence behind it",
    "skill": "watched while it is done, or read off the numbers it produced",
    "product": "the thing that was built, scored on its own and never folded into the reasoning score",
}


def e(s):
    return html.escape(str(s), quote=False)


def row(cells, header=False):
    tag = "th" if header else "td"
    return "<tr>" + "".join(f"<{tag}>{c}</{tag}>" for c in cells) + "</tr>"


def table(headers, rows):
    return ("<table><thead>" + row([f"<strong>{e(h)}</strong>" for h in headers], header=True)
            + "</thead><tbody>" + "".join(row(r) for r in rows) + "</tbody></table>")


def fmt_date(d, with_year=True):
    s = d.strftime("%A, %B %-d") if os.name != "nt" else d.strftime("%A, %B %d")
    return s + (f", {d.year}" if with_year else "")


def monday(w):
    y, m, d = (int(x) for x in w["mon"].split("-"))
    return date(y, m, d)


# ---------------------------------------------------------------- week overview

STANDING = """<h2>The rules that do not change</h2>
<ol>
<li><strong>Hands first, always.</strong> The block opens with the object doing the thing. The explanation arrives after there is a result to explain — never a mini-lecture the build is waiting behind.</li>
<li><strong>The prediction is locked before the test</strong>, and it is scored on the reasoning, never on being right.</li>
<li><strong>The reasoning artifact is the grade.</strong> Whether the bridge held is recorded on its own product target and is never folded into the reasoning score.</li>
<li><strong>Spanish evidence is full evidence.</strong> A labelled diagram, a frame from the word bank and a spoken explanation in Spanish earn a 3 on a physics target exactly as an English paragraph would. Say it out loud, in both languages, every week.</li>
<li><strong>Nothing is graded that a WIDA Level 1 student could not have reached.</strong> Walk the artifact as that student before you rate anyone.</li>
</ol>
<p><em>Full spec: the SEI access layer and the year map in the Claude project. The four-segment block — hands · record · talk · write, about 25 minutes each — is the shape of every meeting.</em></p>"""


def week_overview(w, idx):
    mon = monday(w)
    phase = w["unit"]
    dom, l1, l3, es_line = LANG[w["slug"]]
    meetings = MEET.get(w["days"], w["days"])
    core = "Core week" if w.get("core") else "Support week (no new core target)"

    parts = []
    parts.append(
        f"<p><strong>Academic week of {e(fmt_date(mon))}</strong> &middot; {w['days']} days &middot; "
        f"≈{meetings} B/C meetings &middot; Phase {PHASE_NUM[phase]}: {e(PHASE_NAME[phase])} "
        f"&middot; {e(w['strand'])} &middot; {core}</p>")
    parts.append(f"<p><em>{e(w['es'])}</em></p>")

    parts.append("<h2>The week in one paragraph</h2>")
    parts.append(f"<p>{e(w['opener'])}</p>")

    parts.append("<h2>Learning targets</h2>")
    parts.append(table(
        ["I can…", "Puedo…", "Type", "What counts as evidence"],
        [[e(t[1]), f"<em>{e(t[2])}</em>", f"<strong>{TYPE_LABEL.get(t[3], t[3])}</strong>", TYPE_NOTE.get(t[3], "")]
         for t in w["targets"]]))
    parts.append("<p><em>Scored 1–2–3 per target (Marzano) on the reasoning artifact, lowest-dimension rule across the four dimensions. "
                 "Targets carry Spanish in the app (<code>statement_es</code>), so the paper rating strip and the screen match.</em></p>")

    parts.append("<h2>Language objective (posted, tracked, never graded)</h2>")
    parts.append(table(
        ["WIDA domain", "Level 1 (Entering) will…", "Level 3+ will…", "Student line (ES)"],
        [[f"<strong>{e(dom)}</strong>", e(l1), e(l3), f"<em>{e(es_line)}</em>"]]))
    parts.append("<p><em>Read aloud at the start of every block with the content objective. Recorded met / not yet on the walk-around, by name, and reported to the ELL team — never in the physics grade.</em></p>")

    parts.append("<h2>The asteroid thread</h2>")
    parts.append(table(["What the shop knows", "How this week connects"], [[e(w["know"]), e(w["conn"])]]))

    parts.append("<h2>The arc of the week</h2>")
    day_rows = []
    for d, hands, page in w["plan"]:
        try:
            dt = mon + timedelta(days=int(d) - 1)
            when = dt.strftime("%a %-d %b") if os.name != "nt" else dt.strftime("%a %d %b")
        except (TypeError, ValueError):
            when = ""
        day_rows.append([f"<strong>{e(d)}</strong><br><span>{e(when)}</span>", e(hands), e(page)])
    parts.append(table(["Day", "Hands (first)", "Into the app"], day_rows))
    parts.append("<p><em>Every meeting: hands → record → talk (pairs, either language) → write (the tiered frame). "
                 "Each segment ends with something saved. For this section the app is the packet — there is no paper page to copy.</em></p>")

    parts.append("<h2>Reasoning artifact — the graded evidence</h2>")
    parts.append(f"<p>{e(w['art_en'])}</p><p><em>{e(w['art_es'])}</em></p>")

    parts.append("<h2>Off-week question</h2>")
    parts.append(f"<p>{e(w['off_en'])}</p><p><em>{e(w['off_es'])}</em></p>")
    parts.append("<p><em>Issued on the last day, nothing due, nothing late. It opens the next on-week.</em></p>")

    parts.append("<h2>Materials and tools</h2>")
    parts.append(f"<p>{e(w['tools'])}</p>")
    parts.append("<p><em>Order, borrow or build anything missing during the off-week before this one — the shop week is the only slack in the calendar. "
                 "Put the week's six to eight words on the bilingual word wall with icons before day 1.</em></p>")

    vocab = VOCAB.get(w["slug"], [])
    if vocab:
        parts.append("<h2>Vocabulary — the wall, the lesson, the glossary and the games all read this list</h2>")
        parts.append(table(
            ["Tier", "Word", "Español", "What it means", "In this week"],
            [[f"<strong>{t}</strong>", f"<strong>{e(word)}</strong> <em>({e(pos)})</em>", e(spanish), e(defn), f"<em>{e(ex)}</em>"]
             for t, word, pos, defn, spanish, ex in vocab]))
        parts.append("<p><em>Beck tiers: 3 is the physics word, 2 is the academic verb the frames are built from, 1 is the everyday word the demonstration needs. "
                     "≈ marks a cognate — say it as one out loud. ≠ marks a false friend — name the trap before it bites. Never introduce a word without the object in hand.</em></p>")

    std = STANDARDS.get(w["strand"], [])
    if std:
        parts.append("<h2>Standards</h2><p>" + ", ".join(e(s) for s in std) + "</p>")

    m = MASTERY_BY_PHASE.get(phase)
    if m:
        phase_weeks = [x for x in WEEKS if x["unit"] == phase]
        last = phase_weeks[-1]["slug"] == w["slug"]
        parts.append(f"<h2>Where this week lands — Phase {PHASE_NUM[phase]} mastery task</h2>")
        if last:
            prompt_en, prompt_es = (m[2].split(" / ", 1) + [""])[:2]
            parts.append(f"<p>{e(prompt_en)}</p><p><em>{e(prompt_es)}</em></p>")
            parts.append(table(["Dimension", "What a 3 looks like"],
                               [[f"<strong>{e(k.title())}</strong>", e(v)] for k, v in m[3].items()]))
            parts.append("<p><em>Walk this task as a Level 1 student before it ships: can the prompt be understood from the diagram and the Spanish alone, "
                         "and can every dimension be met with labels, a frame, numbers and a spoken defence in Spanish? If any answer is no, it is not ready.</em></p>")
        else:
            parts.append(f"<p>This week's artifact is evidence toward <strong>{e(m[0])}</strong>, the Phase {PHASE_NUM[phase]} mastery task. "
                         f"The full task is on the overview for the last week of this phase.</p>")

    parts.append(STANDING)

    days_here = DP.DAYS.get(w["slug"])
    if days_here:
        parts.append(f"<p><em>Day-by-day plans for this week are in the list to the left — {len(days_here)} of them.</em></p>")
    else:
        parts.append("<p><em>No day-by-day plans written for this week yet. Say the word and they get the same treatment as Weeks 1 and 2: "
                     "segment timings and materials, the Spanish for the day, the formative checks and the misconception to press.</em></p>")

    return {
        "day": idx * 10,
        "title": f"Week {idx} · Overview — {w['en']}",
        "bodyHtml": "".join(parts),
    }


# ---------------------------------------------------------------- day plan

def day_plan(w, idx, d):
    mon = monday(w)
    targets = {t[0]: t for t in w["targets"]}
    dom, l1, l3, es_line = LANG[w["slug"]]

    parts = []
    parts.append(f"<p><strong>{e(d['date'])}</strong> &middot; Week {idx}, day {d['n']} of {w['days']} &middot; "
                 f"B + C double, ~110 min &middot; Phase {PHASE_NUM[w['unit']]} &middot; {e(w['en'])}</p>")

    tr = []
    for slug in d["targets"]:
        t = targets.get(slug)
        if t:
            tr.append([f"<code>{e(slug)}</code>", e(t[1]), f"<em>{e(t[2])}</em>", TYPE_LABEL.get(t[3], t[3])])
    if tr:
        parts.append("<h2>Today's targets</h2>")
        parts.append(table(["Slug", "I can…", "Puedo…", "Type"], tr))
    parts.append(f"<p><strong>Language objective ({e(dom)}).</strong> Level 1: {e(l1)} Level 3+: {e(l3)} <em>{e(es_line)}</em> "
                 "Posted, read aloud, tracked met / not yet — never in the physics grade.</p>")

    parts.append("<h2>Before they walk in</h2>")
    parts.append(table(["Where", "What is there"], [[f"<strong>{e(k)}</strong>", v] for k, v in d["prep"]]))

    parts.append("<h2>The block — four segments, hands first</h2>")
    parts.append(table(
        ["Time", "Segment", "What happens", "In the app", "Bloom's", "Hattie"],
        [[f"<strong>{e(t)}</strong>", f"<strong>{e(s)}</strong>", what, app, e(bl), e(ha)]
         for t, s, what, app, bl, ha in d["segments"]]))

    parts.append("<h2>Say it in Spanish</h2>")
    parts.append(table(["Say", "Means", "When"],
                       [[f"<strong>{e(say)}</strong>", e(means), when] for say, means, when in d["spanish"]]))
    parts.append("<p><em>Read them off the card. Pronunciation does not matter; using them does. Never ask a Level 1 student a <em>why</em> question in the hands segment.</em></p>")

    parts.append("<h2>Formative checks — the walk-around</h2><ul>")
    for c in d["checks"]:
        parts.append(f"<li>{c}</li>")
    parts.append("</ul>")

    name, why, move = d["misconception"]
    parts.append("<h2>The misconception to press</h2>")
    parts.append(f"<p><strong>{e(name)}</strong></p><p>{why}</p>")
    parts.append(f"<p><strong>The move:</strong> {move}</p>")

    return {
        "day": idx * 10 + d["n"],
        "title": f"Week {idx} · Day {d['n']} — {d['title']}",
        "bodyHtml": "".join(parts),
    }


# ---------------------------------------------------------------- emit

def main():
    by_unit = {u[0]: [] for u in UNITS}
    for idx, w in enumerate(WEEKS):
        by_unit[w["unit"]].append(week_overview(w, idx))
        for d in DP.DAYS.get(w["slug"], []):
            by_unit[w["unit"]].append(day_plan(w, idx, d))

    for unit, plans in by_unit.items():
        plans.sort(key=lambda p: p["day"])
        path = os.path.abspath(os.path.join(OUT_DIR, f"{unit}-lesson-plans.json"))
        with open(path, "w", encoding="utf8") as f:
            json.dump(plans, f, ensure_ascii=False, indent=1)
            f.write("\n")
        print(f"{path}: {len(plans)} plans")


if __name__ == "__main__":
    main()
