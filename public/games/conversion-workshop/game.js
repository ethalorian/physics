"use strict";
const M = Conversions, $ = (id) => document.getElementById(id), f = (n) => Number(n.toPrecision(9)).toLocaleString("en-US", { maximumFractionDigits: 9 });
const frac = (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`;
let mode = "learn", step = 0, round = 0, chain = [], job = M.make(0), hintLevel = 0, solved = false, attempted = false;
const learned = /* @__PURE__ */ new Set(), records = [];
const lessons = [
  { title: "Change the unit, keep the amount", body: "A length of 1.5 m is also 150 cm. The length does not grow. Centimeters are smaller units, so it takes more of them to cover the same length. Try the two rulers.", example: "1.5 m = 150 cm", question: "When you convert 2 m to centimeters, what happens to the number?", choices: ["It increases because centimeters are smaller.", "It decreases because centimeters are smaller.", "It stays 2."], correct: 0, explain: "Right. 2 m = 200 cm. The number gets larger; the physical length stays the same." },
  { title: "Build a fraction equal to one", body: "A conversion factor compares equal quantities. Since 1 m = 100 cm, either fraction below equals 1. Multiplying by it changes how a quantity is written without changing its physical amount.", example: `${frac("1 m", "100 cm")} = 1 &nbsp; and &nbsp; ${frac("100 cm", "1 m")} = 1`, question: "Which fraction is a valid conversion factor?", choices: ["100 m / 1 cm", "1 m / 100 cm", "1 m / 10 cm"], correct: 1, explain: "Yes. The top and bottom are equal lengths. The numerical values alone do not need to be equal; their units matter." },
  { title: "Choose the direction that cancels", body: "Convert 250 cm to meters. The starting cm is above the fraction bar, so place cm below the bar in your factor. Units cancel only across the bar.", example: `250 <span class="cancel">cm</span> \xD7 ${frac("1 m", '100 <span class="cancel">cm</span>')} = 2.5 m`, question: "For 250 cm \u2192 m, which factor leaves meters?", choices: ["100 cm / 1 m", "1 m / 100 cm"], correct: 1, explain: "Exactly. cm cancels with cm, leaving m. Now calculate 250 \xD7 1 \xF7 100 = 2.5. Dividing by 100 also fits the prediction: larger units need a smaller number." },
  { title: "Use the same method for rates and areas", body: "A speed has two units to convert. An area has two factors of length. Carry every unit through the calculation.", example: `72 km/h \xD7 ${frac("1000 m", "1 km")} \xD7 ${frac("1 h", "3600 s")} = 20 m/s`, question: "To convert 1 m\xB2 to cm\xB2, how many times do you use 100 cm / 1 m?", choices: ["Once: 100 cm\xB2", "Twice: 10,000 cm\xB2"], correct: 1, explain: "Twice. m\xB2 means m \xD7 m, so convert both factors: 1 \xD7 100 \xD7 100 = 10,000 cm\xB2. For a rate, cancel the distance unit and the time unit separately." }
];
function tabs() {
  $("learnTab").setAttribute("aria-pressed", mode === "learn");
  $("practiceTab").setAttribute("aria-pressed", mode === "practice");
}
function feedback(text, good = false) {
  $("feedback").textContent = text;
  $("feedback").className = "feedback" + (good ? " success" : "");
}
function learn() {
  mode = "learn";
  tabs();
  const l = lessons[step];
  $("surface").innerHTML = `<div class="stepper">${lessons.map((_, i) => `<button data-step="${i}" aria-label="Lesson ${i + 1}" ${i === step ? 'aria-current="step"' : ""}>${i + 1}${learned.has(i) ? " \u2713" : ""}</button>`).join("")}</div><span class="badge">Lesson ${step + 1} of 4</span><h2 tabindex="-1" id="heading">${l.title}</h2><p>${l.body}</p><div class="big">${l.example}</div><h3>${l.question}</h3><div class="choices">${l.choices.map((c, i) => `<button data-choice="${i}">${c}</button>`).join("")}</div><div id="feedback" class="feedback" role="status"></div><div class="actions"><button id="advance" class="primary" ${learned.has(step) ? "" : "hidden"}>${step === 3 ? "Start practice \u2192" : "Next lesson \u2192"}</button></div>`;
  $("surface").querySelectorAll("[data-step]").forEach((b) => b.onclick = () => {
    step = +b.dataset.step;
    learn();
  });
  $("surface").querySelectorAll("[data-choice]").forEach((b) => b.onclick = () => {
    if (+b.dataset.choice === l.correct) {
      learned.add(step);
      feedback(l.explain, true);
      $("advance").hidden = false;
    } else feedback(step === 0 ? "Think about covering the same length with smaller pieces. You need more pieces." : step === 1 ? "Compare the actual lengths above and below the bar. They must be equal." : step === 2 ? "The starting cm is on top. The factor needs cm on the bottom." : "m\xB2 means m \xD7 m. Each m must be converted.");
  });
  $("advance").onclick = () => {
    if (step === 3) practice();
    else {
      step++;
      learn();
    }
  };
}
function factorText(id, forward) {
  const q = M.factors.find((x) => x.id === id);
  return forward ? frac(`${q.a} ${q.au}`, `${q.b} ${q.bu}`) : frac(`${q.b} ${q.bu}`, `${q.a} ${q.au}`);
}
function expression() {
  const parts = [{ n: f(job.value), d: "1", top: [], bottom: [] }];
  for (const [u, p] of Object.entries(job.from)) for (let i = 0; i < Math.abs(p); i++) (p > 0 ? parts[0].top : parts[0].bottom).push(u);
  for (const [id, forward] of chain) {
    const q = M.factors.find((x) => x.id === id);
    parts.push({ n: forward ? q.a : q.b, d: forward ? q.b : q.a, top: [forward ? q.au : q.bu], bottom: [forward ? q.bu : q.au] });
  }
  const totals = {};
  parts.forEach((p) => {
    p.top.forEach((u) => {
      totals[u] ?? (totals[u] = [0, 0]);
      totals[u][0]++;
    });
    p.bottom.forEach((u) => {
      totals[u] ?? (totals[u] = [0, 0]);
      totals[u][1]++;
    });
  });
  const budget = [{}, {}];
  for (const [u, counts] of Object.entries(totals)) budget[0][u] = budget[1][u] = Math.min(...counts);
  const tokens = (units, side) => units.map((u) => {
    const cancel = budget[side][u] > 0;
    if (cancel) budget[side][u]--;
    return `<span class="${cancel ? "cancel" : ""}">${u}</span>`;
  }).join("\xB7");
  $("chain").innerHTML = parts.map((p, i) => `${i ? "\xD7" : ""}<div class="tile">${frac(p.n + " " + tokens(p.top, 0), p.d + " " + tokens(p.bottom, 1))}${i ? `<button data-remove="${i - 1}" aria-label="Remove factor ${i}" ${solved ? "disabled" : ""}>\xD7</button>` : ""}</div>`).join("");
  $("unitLeft").textContent = M.label(M.evaluate(job.value, job.from, chain).units);
  $("chain").querySelectorAll("button").forEach((b) => b.onclick = () => {
    chain.splice(+b.dataset.remove, 1);
    expression();
    feedback("");
  });
}
function practice() {
  mode = "practice";
  tabs();
  if (round >= 12) {
    summary();
    return;
  }
  $("surface").innerHTML = `<span class="badge">Practice ${round + 1} / 12 \xB7 ${job.skill}</span><h2 id="heading" tabindex="-1">Convert ${f(job.value)} ${M.label(job.from)} to ${M.label(job.to)}</h2><p>Choose a factor with the old unit on the opposite side. For rates or squared units, add more than one factor.</p><h3>1. Choose your conversion factors</h3><div class="bank">${M.factors.filter((q) => job.solution.some(([id]) => id === q.id)).map((q) => [true, false].map((forward) => `<button data-id="${q.id}" data-forward="${forward}" ${solved ? "disabled" : ""} aria-label="Add ${forward ? q.a + " " + q.au + " over " + q.b + " " + q.bu : q.b + " " + q.bu + " over " + q.a + " " + q.au}">+ ${factorText(q.id, forward)}</button>`).join("")).join("")}</div><div id="chain" class="chain" aria-label="Calculation with matching units crossed out"></div><p>Remaining unit: <strong id="unitLeft"></strong></p><form id="answerForm"><h3>2. Calculate your result</h3><label for="answer">Numerical value in ${M.label(job.to)}</label><div class="answerRow"><input class="number" id="answer" type="number" step="any" inputmode="decimal" required ${solved ? "disabled" : ""}><button class="primary" ${solved ? "disabled" : ""}>Check conversion \u2192</button></div></form><div class="actions"><button id="hint" ${solved ? "disabled" : ""}>${hintLevel ? "Show worked solution" : "Get a hint"}</button><button id="clear" ${solved ? "disabled" : ""}>Clear factors</button></div><p id="hintText" class="notice" ${hintLevel ? "" : "hidden"}></p><div id="feedback" class="feedback" role="status"></div><button id="next" class="primary" ${solved ? "" : "hidden"} style="margin-top:18px">${round === 11 ? "See practice summary \u2192" : "Next conversion \u2192"}</button>`;
  expression();
  if (hintLevel) showHint();
  if (solved) {
    $("answer").value = job.answer;
    feedback("Conversion complete. Move on when you are ready.", true);
  }
  $("surface").querySelectorAll("[data-id]").forEach((b) => b.onclick = () => {
    if (chain.length >= 6) {
      feedback("Remove an extra factor before adding another. Six is the limit.");
      return;
    }
    chain.push([b.dataset.id, b.dataset.forward === "true"]);
    expression();
    feedback("");
  });
  $("clear").onclick = () => {
    chain = [];
    expression();
    feedback("");
  };
  $("hint").onclick = () => {
    hintLevel = Math.min(2, hintLevel + 1);
    showHint();
  };
  $("answerForm").onsubmit = (e) => {
    e.preventDefault();
    if (solved) return;
    const result = M.check(job, chain, $("answer").value);
    if (result === "correct") {
      solved = true;
      records.push({ skill: job.skill, supported: hintLevel > 0, revised: attempted });
      practice();
      feedback(`${f(job.value)} ${M.label(job.from)} = ${f(job.answer)} ${M.label(job.to)}. The units cancel correctly, and the amount is unchanged.`, true);
    } else {
      attempted = true;
      feedback(result === "units" ? `Your chain leaves ${M.label(M.evaluate(job.value, job.from, chain).units)}. Put matching units on opposite sides. ${job.skill === "Area" ? "Remember: each of the two length factors needs converting." : ""}` : result === "empty" ? "Enter a finite numerical value." : "Your units work. Multiply the numbers on top, then divide by the numbers below. Check whether the number should get larger or smaller.");
    }
  };
  $("next").onclick = () => {
    round++;
    chain = [];
    hintLevel = 0;
    solved = false;
    attempted = false;
    job = M.make(round);
    practice();
  };
}
function showHint() {
  const full = hintLevel === 2;
  $("hintText").hidden = false;
  $("hintText").innerHTML = full ? `Worked solution: ${f(job.value)} ${M.label(job.from)} \xD7 ${job.solution.map(([id, forward]) => factorText(id, forward)).join(" \xD7 ")} = <strong>${f(job.answer)} ${M.label(job.to)}</strong>. Rebuild this chain and enter the result to continue.` : `${job.skill === "Speed" ? "Convert the distance and time separately. The time unit begins below the bar, so put it on top in a factor." : job.skill === "Area" ? "Use the length conversion twice: area has two factors of length." : "Put the starting unit below the bar so it cancels. Use the reference to find equal quantities."} Target unit: ${M.label(job.to)}.`;
  $("hint").textContent = full ? "Worked solution shown" : "Show worked solution";
  if (full) $("hint").disabled = true;
}
function summary() {
  const independent = records.filter((r) => !r.supported && !r.revised).length;
  $("surface").innerHTML = `<span class="badge">Practice complete</span><h2>Twelve conversions. One method.</h2><p>You practiced length, mass, time, speed, and area.</p><div class="big">${independent} / 12</div><p>Completed on the first check without hints.</p><p>${records.filter((r) => r.supported).length} used a hint or worked example. ${records.filter((r) => r.revised).length} involved a revision. These counts can overlap. They help you choose what to practice next.</p><p class="notice">Explain to a partner: Why does multiplying by 1 m / 100 cm keep the amount unchanged?</p><div class="actions"><button id="again" class="primary">Practice a new set \u2192</button><button id="review">Review the lesson</button></div>`;
  $("again").onclick = () => {
    round = 0;
    records.length = 0;
    job = M.make(0);
    chain = [];
    hintLevel = 0;
    solved = false;
    attempted = false;
    practice();
  };
  $("review").onclick = () => {
    step = 0;
    learn();
  };
}
$("learnTab").onclick = learn;
$("practiceTab").onclick = practice;
$("length").oninput = () => {
  const n = Number($("length").value);
  $("meters").textContent = f(n) + " m";
  $("equivalent").textContent = `${f(n)} m = ${f(n * 100)} cm`;
  $("meterBar").style.width = $("cmBar").style.width = n / 3 * 100 + "%";
};
$("length").oninput();
learn();
